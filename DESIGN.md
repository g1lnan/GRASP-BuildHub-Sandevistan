# GRASP — Technical Design

**Version 1.0 · 25 July 2026**
Implements [PRD.md](PRD.md). Working conventions in [DOCUMENTATION.md](DOCUMENTATION.md).

---

## 1. Architecture

```
┌──────────────────────────── Next.js 15 (App Router) ────────────────────────────┐
│                                                                                   │
│  /(student)          /(lecturer)                 /api/*                           │
│  submit · defend     console · 2×2 · override    route handlers                   │
│                                                                                   │
├───────────────────────────────── lib/ (server) ──────────────────────────────────┤
│                                                                                   │
│  ingest/      extract text from docx · pdf · plaintext                            │
│  claimgraph/  submission → structured claims        [Claude, structured output]   │
│  probes/      claim graph → ranked probes           [Claude, structured output]   │
│  session/     turn runtime · adaptive selection · time cap                        │
│  asr/         ASRProvider interface + adapters      [swappable]                   │
│  scoring/     5-dimension scorer + confidence       [Claude, structured output]   │
│  feedback/    student learning report               [Claude, structured output]    │
│  usage/       per-call cost instrumentation                                       │
│  jobs/        DB-backed queue + worker                                            │
│                                                                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Postgres (Drizzle ORM)          Object storage (audio, uploads)                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**Two loops, and both matter.**

```
Submission ─▶ Claim Graph ─▶ Probes ─▶ Session ─▶ Score ─┬─▶ Lecturer 2×2 ─▶ Override ─┐
                                                          │                             │
                                                          └─▶ Student feedback           │
                                                                                         ▼
                                                            calibration dataset ◀────────┘
```

The override loop is not a nice-to-have. It is the only asset that compounds (business plan §4). Make overrides cheap in the UI and lossless in the DB.

---

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15**, App Router, React 19, TypeScript strict | One codebase, server actions + route handlers, fast to ship |
| DB | **Postgres** via **Drizzle ORM** | Typed schema, cheap migrations, no runtime codegen step |
| Auth | **Auth.js** (credentials provider) | Roles in the session token; no third-party identity dependency for a pilot |
| Storage | S3-compatible object storage, VN region | Audio + uploads; NFR-6 data residency |
| Styling | **Tailwind CSS** + **shadcn/ui** | The 2×2 is the only bespoke component; everything else is stock |
| LLM | **`@anthropic-ai/sdk`** | See §6 |
| Validation | **Zod** | Shared between API boundaries and LLM structured outputs |
| Jobs | DB-backed queue + a worker route | Avoids a queue service for the pilot. Upgrade path noted in §7.3 |
| Tests | **Vitest** (unit) + **Playwright** (E2E) | |

**Deliberately not used:** tRPC (route handlers are enough), Redis (Postgres advisory locks suffice at pilot scale), a separate Python service (the ASR provider is a network call, not a local model).

---

## 3. Repo layout

```
grasp/
├─ app/
│  ├─ (auth)/login/                     sign in
│  ├─ (student)/
│  │  ├─ courses/[courseId]/
│  │  ├─ submit/[assignmentId]/         FR-201
│  │  ├─ defend/[sessionId]/            FR-301..307  ← the core screen
│  │  └─ feedback/[sessionId]/          FR-404
│  ├─ (lecturer)/
│  │  ├─ courses/                       FR-102, FR-103
│  │  ├─ assignments/[id]/              FR-104, FR-105
│  │  ├─ assignments/[id]/matrix/       FR-405  ← the 2×2
│  │  └─ sessions/[id]/                 FR-407 evidence bundle + FR-406 override
│  └─ api/
│     ├─ submissions/                   POST, GET :id/status
│     ├─ submissions/[id]/analyze/      POST → enqueues job
│     ├─ sessions/                      POST create
│     ├─ sessions/[id]/turns/           POST answer → next probe
│     ├─ sessions/[id]/finalize/        POST → score + feedback
│     ├─ scores/[id]/override/          POST  ← calibration signal
│     ├─ sessions/[id]/appeal/          POST
│     └─ jobs/tick/                     POST worker (cron-triggered)
├─ lib/
│  ├─ ai/
│  │  ├─ client.ts                      Anthropic client + model routing
│  │  ├─ claimgraph.ts                  FR-202
│  │  ├─ probes.ts                      FR-203, FR-204
│  │  ├─ scoring.ts                     FR-401..403
│  │  ├─ feedback.ts                    FR-404
│  │  └─ prompts/                       versioned prompt modules
│  ├─ asr/
│  │  ├─ types.ts                       ASRProvider interface
│  │  └─ providers/                     one file per adapter
│  ├─ session/
│  │  ├─ runtime.ts                     turn loop, time cap
│  │  └─ adaptive.ts                    FR-304 follow-up selection
│  ├─ usage/record.ts                   FR-505
│  ├─ jobs/                             queue + handlers
│  ├─ db/  schema.ts · index.ts · migrations/
│  └─ auth.ts
├─ evals/
│  ├─ fragility/                        AI-fragility harness (G-metric)
│  └─ calibration/                      r-vs-lecturer analysis (G1)
└─ tests/
```

---

## 4. Data model

Drizzle schema. Every table has `id uuid pk`, `created_at`, `updated_at`.

### 4.1 Core tables

```ts
institutions   { name, country, data_region }
users          { institution_id, email, password_hash,
                 role: 'lecturer' | 'student' | 'researcher', display_name }
courses        { institution_id, lecturer_id, name, term, join_code, archived_at }
enrollments    { course_id, student_id }                          // unique(course_id, student_id)

assignments    { course_id, title, prompt, due_at, published_at,
                 subject_concepts: jsonb,          // string[]
                 probe_count: int,                 // 5..8      FR-104
                 time_cap_seconds: int,            // 360..600
                 defense_weight_pct: int,          // 0..30
                 rubric_weights: jsonb }           // D1..D5, defaults in PRD §5

submissions    { assignment_id, student_id, source: 'docx'|'pdf'|'text',
                 file_url, extracted_text, word_count,
                 product_score: numeric,           // lecturer's grade — the 2×2 x-axis
                 status: 'pending'|'analysing'|'ready'|'failed', error }
```

### 4.2 Claim Graph — the core IP

```ts
claim_graphs   { submission_id, version: int, model: text, prompt_version: text,
                 nodes: jsonb, edges: jsonb, concepts: jsonb }
```

`nodes` and `edges` validate against these Zod schemas. **This is the contract** — probes, scoring, and the evals all read it.

```ts
export const ClaimNode = z.object({
  id: z.string(),                     // "c1", "c2", ...
  kind: z.enum(['thesis', 'claim', 'evidence', 'assumption', 'definition']),
  text: z.string(),                   // the student's OWN words, verbatim
  quote_span: z.object({ start: z.number(), end: z.number() }),
  concepts: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const ClaimEdge = z.object({
  from: z.string(),
  to: z.string(),
  relation: z.enum(['supports', 'contradicts', 'depends_on', 'exemplifies']),
});

export const ClaimGraph = z.object({
  nodes: z.array(ClaimNode).min(3),
  edges: z.array(ClaimEdge),
  concepts: z.array(z.string()),
});
```

`quote_span` is load-bearing: it is what lets a probe quote the student's own sentence back at them (FR-203), which is what makes probes AI-fragile.

### 4.3 Probes and sessions

```ts
probes         { claim_graph_id, claim_node_id, ordinal,
                 probe_type: 'counterfactual'|'road_not_taken'|'novel_transfer'
                           | 'self_critique'|'metacognitive'|'trace_own_step',
                 bloom_level: 'understand'|'apply'|'analyse'|'evaluate'|'reflect',
                 text_vi, expected_signals: jsonb, ai_fragility_score: numeric,
                 selected: boolean }                                  // FR-204

sessions       { submission_id, student_id, mode: 'voice'|'typed'|'mixed',
                 status: 'in_progress'|'completed'|'expired'|'abandoned',
                 started_at, ended_at, elapsed_seconds,
                 integrity_signals: jsonb }        // FR-307 — evidence only, never a verdict

turns          { session_id, probe_id, ordinal, follow_up_of: uuid|null,
                 input_mode: 'voice'|'typed', audio_url, audio_deleted_at,
                 transcript, asr_confidence, latency_ms, duration_ms }
```

### 4.4 Scores, overrides, outputs

```ts
scores         { session_id,
                 d1_recall, d2_explanation, d3_application,
                 d4_evaluation, d5_metacognition,          // numeric 1.0..5.0
                 composite: numeric,
                 confidence_low, confidence_high,
                 confidence_label: 'high'|'medium'|'low',  // FR-402
                 rationale: jsonb,                         // per-dimension + transcript citations
                 model, prompt_version }

overrides      { score_id, lecturer_id,
                 original: jsonb, overridden: jsonb, note }   // ← FR-406 THE DATASET

feedback_reports { session_id, strengths: jsonb, gaps: jsonb,
                   revise_concepts: jsonb, body_vi: text }    // FR-404

appeals        { session_id, student_id, reason,
                 status: 'open'|'resolved', resolution }      // FR-503

usage_events   { session_id, submission_id, stage, provider, model,
                 input_tokens, cache_read_tokens, cache_creation_tokens,
                 output_tokens, audio_seconds, cost_vnd: numeric }   // FR-505
```

### 4.5 The 2×2 is derived, never stored

```ts
// FR-405. Compute at read time. Never persist a quadrant label against a student.
export function quadrant(productScore: number, understanding: number) {
  const p = productScore >= 6.5;   // /10 scale
  const u = understanding >= 3.5;  // /5 scale
  if (p && u) return 'mastery';
  if (p && !u) return 'hollow';
  if (!p && u) return 'expression_gap';
  return 'needs_support';
}
```

Storing "hollow" on a student record would make it an accusation of record. Derive it.

---

## 5. Pipelines

### 5.1 Ingest → Claim Graph → Probes (async)

```
POST /api/submissions            → status: pending
POST /api/submissions/:id/analyze → enqueue job
  worker:
    1. extract text  (mammoth for .docx, pdf-parse for .pdf)
    2. build Claim Graph            [Claude, structured output, cached prefix]
    3. generate candidate probes    [Claude, structured output, reads cached graph]
    4. score AI-fragility, rank, select N
    5. status: ready
```

### 5.2 Session turn loop

```
POST /api/sessions                       → session + first probe
POST /api/sessions/:id/turns             { probeId, mode, audio|text }
  1. if voice → ASRProvider.transcribe()
  2. persist turn (transcript, latency, asr_confidence)
  3. adaptive: score this turn shallowly → drill down | escalate | advance
  4. check time cap → next probe, or finalize
POST /api/sessions/:id/finalize          → scores + feedback report
```

**Adaptive rule (FR-304)** — keep it simple and explainable:

```ts
// lib/session/adaptive.ts
if (turnDepth < 2 && turnScore < 2.5) return followUp('drill_down');
if (turnDepth < 2 && turnScore >= 4.0) return followUp('escalate');
return nextProbe();
```

Deep-scoring every turn with a frontier model would double cost and latency. Turn-level triage runs on Haiku; the authoritative 5-dimension score runs once at finalize over the whole transcript.

### 5.3 Failure behaviour

| Failure | Behaviour |
|---|---|
| Analysis fails | `status: 'failed'`, retryable, student sees a plain message |
| ASR fails on a turn | Auto-offer typed input for that turn. **Never lose the student's time** |
| Model call fails at finalize | Retry ×2 with backoff, then mark session `completed` with `confidence_label: 'low'` and flag for the lecturer |
| Session expires mid-way | Score the completed turns with reduced confidence; never discard student work |

---

## 6. Claude integration

> ⚠️ **API surface verified against the `claude-api` skill on 2026-07-25.** Several patterns you may recall are stale and now return 400. Read this section before writing any model call.

### 6.1 Non-negotiables

| Do | Don't |
|---|---|
| `thinking: { type: 'adaptive' }` | ❌ `budget_tokens` — **400 on Opus 4.8** |
| `output_config: { effort, format }` | ❌ top-level `output_format` — deprecated |
| Omit sampling params entirely | ❌ `temperature` / `top_p` / `top_k` — **400 on Opus 4.8** |
| System-prompt instructions for style | ❌ assistant-turn prefill — **400** |
| `.stream()` when `max_tokens > 16000` | ❌ non-streaming large outputs — HTTP timeout |
| Typed SDK errors (`Anthropic.RateLimitError`) | ❌ string-matching error messages |
| Model IDs exactly: `claude-opus-4-8`, `claude-sonnet-5`, `claude-haiku-4-5` | ❌ appending date suffixes |

### 6.2 Model routing

```ts
// lib/ai/client.ts
import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY

/**
 * Routing is a product decision with a cost consequence — see §8 and PRD Q1.
 * Default to Opus-tier for reasoning-critical paths during the pilot: we cannot
 * calibrate against a model we intend to swap out. The step-down to Sonnet-tier
 * is an explicit, measured decision at gate G1 — not a silent cost optimisation.
 */
export const MODELS = {
  claimGraph: 'claude-opus-4-8',   // quality determines whether a lecturer trusts us
  probeGen:   'claude-opus-4-8',   // AI-fragility is the whole product
  finalScore: 'claude-opus-4-8',   // the number a grade depends on
  turnTriage: 'claude-haiku-4-5',  // high volume, low stakes, discarded after routing
  feedback:   'claude-haiku-4-5',  // helpful ≠ hard
} as const;
```

### 6.3 Structured outputs — the standard call shape

Use `messages.parse()` with `zodOutputFormat`. It validates the response against the schema, so downstream code never hand-parses JSON.

```ts
// lib/ai/claimgraph.ts
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { anthropic, MODELS } from './client';
import { ClaimGraph } from './schemas';
import { CLAIM_GRAPH_SYSTEM, CLAIM_GRAPH_PROMPT_VERSION } from './prompts/claimgraph';
import { recordUsage } from '../usage/record';

export async function buildClaimGraph(submissionId: string, text: string) {
  const response = await anthropic.messages.parse({
    model: MODELS.claimGraph,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'high',
      format: zodOutputFormat(ClaimGraph),
    },
    system: [
      {
        type: 'text',
        text: CLAIM_GRAPH_SYSTEM,          // stable → cacheable prefix
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: text }],  // volatile → after the breakpoint
  });

  await recordUsage({
    submissionId,
    stage: 'claim_graph',
    model: MODELS.claimGraph,
    usage: response.usage,
  });

  // parsed_output is null if parsing failed — never assume
  if (!response.parsed_output) throw new Error('Claim graph parse failed');
  return { graph: response.parsed_output, promptVersion: CLAIM_GRAPH_PROMPT_VERSION };
}
```

### 6.4 Prompt caching

Caching is a **prefix match**: `tools` → `system` → `messages`. Any byte change invalidates everything after it.

- **Keep system prompts frozen.** Never interpolate the date, a student ID, or a course name into a system prompt — it sits at the front of the prefix and destroys the cache for every request.
- Put stable instructions + rubric in `system` with a `cache_control` breakpoint; put the submission and transcript in `messages`.
- **Minimum cacheable prefix on Opus 4.8 is 4096 tokens.** A shorter system prompt silently won't cache — no error, just `cache_creation_input_tokens: 0`. Our rubric + instructions clear this; verify after any prompt edit.
- Verify with `response.usage.cache_read_input_tokens`. Zero across repeated calls means a silent invalidator.

### 6.5 Error handling

```ts
import Anthropic from '@anthropic-ai/sdk';

try {
  return await anthropic.messages.parse({ ... });
} catch (error) {
  if (error instanceof Anthropic.RateLimitError)   return retryWithBackoff();
  if (error instanceof Anthropic.BadRequestError)  throw new NonRetryable(error.message);
  if (error instanceof Anthropic.APIConnectionError) return retryWithBackoff();
  if (error instanceof Anthropic.APIError)         throw error;
  throw error;
}
```

Catch most-specific first. The SDK already retries 429/5xx twice by default (`maxRetries`); don't rebuild that.

### 6.6 Prompt versioning

Every prompt module exports a version string, stored on the row it produced:

```ts
export const CLAIM_GRAPH_PROMPT_VERSION = 'cg-v3';
```

Without this, the calibration study cannot attribute a score change to a prompt change. **Bump it on every semantic edit.**

---

## 7. Other subsystems

### 7.1 ASR abstraction (PRD Q6 is still open — so make it swappable)

```ts
// lib/asr/types.ts
export interface ASRResult {
  transcript: string;
  confidence: number;       // 0..1
  durationSeconds: number;
}

export interface ASRProvider {
  readonly name: string;
  readonly costPerMinuteVnd: number;
  transcribe(audio: Buffer, opts: { languageCode: 'vi'; hints?: string[] }): Promise<ASRResult>;
}
```

`hints` carries the assignment's `subject_concepts` — domain vocabulary measurably reduces WER on technical terms. Swapping providers must be a one-line change in a factory, because §8 shows ASR is ~20% of session cost.

### 7.2 Cost instrumentation (FR-505)

```ts
// lib/usage/record.ts — prices in USD per 1M tokens, converted at FX_VND_PER_USD
const PRICING = {
  'claude-opus-4-8':  { input: 5.00, output: 25.00 },
  'claude-sonnet-5':  { input: 2.00, output: 10.00 },  // intro pricing to 2026-08-31; then 3.00/15.00
  'claude-haiku-4-5': { input: 1.00, output:  5.00 },
} as const;
```

Cache reads bill at ~0.1× input; cache writes at ~1.25× (5-min TTL). Record `cache_read_input_tokens` and `cache_creation_input_tokens` separately or the cost model will be wrong.

### 7.3 Jobs

DB-backed queue: `jobs { type, payload, status, attempts, run_after, locked_by, locked_at }`. A cron-triggered `POST /api/jobs/tick` claims work with `SELECT ... FOR UPDATE SKIP LOCKED`. Adequate to ~200 concurrent sessions (NFR-7). **Upgrade trigger:** if p95 analysis latency (NFR-1) breaches 120s under load, move to a real queue — don't tune this one.

### 7.4 Security & privacy

- Every route handler authorises server-side. A student may read only their own submissions, sessions, scores, and feedback (FR-101, FR-502).
- Audio: presigned URLs, VN-region bucket, hard-deleted ≥ 24h after transcription unless the institution opts into retention (FR-504). A scheduled job enforces this — deletion is not best-effort.
- Passwords: `argon2id`. Never log transcripts, tokens, or audio URLs.
- Student text is never used to train models. No exceptions in this codebase.
- Integrity signals (FR-307) are stored and exportable but **must never be rendered as an accusation**. See FR-501.

---

## 8. Cost model ⚠️ modelled, not measured

Assumptions: 1,200-word essay · 6 probes · 2 follow-ups · ~4.5 min of audio · FX 26,000 VND/USD · Sonnet 5 at intro pricing.

| Stage | Tokens (in → out) | Opus-tier | Sonnet-tier |
|---|---|---|---|
| Claim Graph | 6,000 → 2,500 | 2,405 ₫ | 962 ₫ |
| Probe generation *(cached graph)* | 2,500c → 1,800 | 1,199 ₫ | 481 ₫ |
| Turn triage ×6 *(Haiku both)* | 2,000 → 500 | 702 ₫ | 702 ₫ |
| Vietnamese ASR (4.5 min) | — | ~700 ₫ | ~700 ₫ |
| Final score + feedback | 2,000 + 6,000c → 3,000 | 2,288 ₫ | 915 ₫ |
| Infra, storage, retries | — | ~300 ₫ | ~300 ₫ |
| **Total / session** | | **≈ 7,600 ₫** | **≈ 4,060 ₫** |

**This is the single most important number in the company** (business plan §8): it decides which market segments are reachable. At 4,060 ₫ a university student (89,000 ₫/yr, 8 sessions) is ~63% gross margin; at 7,600 ₫ they are ~32%. Public K-12 at 39,000 ₫/yr is unreachable at either figure until the cost curve drops below ~1,500 ₫.

**Therefore:** instrument first, decide second. Ship FR-505 in week 6, run both tiers over the same 50 sessions, and resolve PRD Q1 with data — comparing cost *and* correlation-with-lecturer, not cost alone. Levers in order of expected effect: (1) prompt caching hit rate, (2) Sonnet-tier for Claim Graph, (3) self-hosted ASR, (4) fewer/shorter turns.

---

## 9. API surface

All under `/api`. JSON in, JSON out. Zod-validated at the boundary. Auth enforced in every handler.

| Method | Path | Requirement | Notes |
|---|---|---|---|
| `POST` | `/submissions` | FR-201 | multipart or `{ text }` |
| `POST` | `/submissions/:id/analyze` | FR-205 | enqueues; 202 |
| `GET` | `/submissions/:id/status` | FR-205 | poll target |
| `POST` | `/sessions` | FR-301 | returns session + first probe |
| `POST` | `/sessions/:id/turns` | FR-302..304 | returns next probe or `{ done: true }` |
| `POST` | `/sessions/:id/finalize` | FR-401..404 | scores + feedback |
| `GET` | `/sessions/:id` | FR-407 | evidence bundle |
| `POST` | `/scores/:id/override` | FR-406 | **the calibration write path** |
| `POST` | `/sessions/:id/appeal` | FR-503 | |
| `GET` | `/assignments/:id/matrix` | FR-405 | cohort 2×2 data |
| `POST` | `/jobs/tick` | — | worker; internal auth only |

---

## 10. Frontend

Three screens carry the product. Everything else is CRUD.

**`/defend/[sessionId]`** — one probe at a time, large type, a visible but non-anxious timer, and a mic button with an obvious "type instead" toggle of equal visual weight (NFR-8). No progress bar showing upcoming probes (FR-301). Show the quoted span from the student's own essay above each probe — it is what makes the question feel fair rather than arbitrary.

**`/assignments/[id]/matrix`** — the 2×2. Product quality on x, understanding on y, one dot per student, quadrants labelled with the PRD §3 language (*Mastery · Hollow · Expression Gap · Needs Support*). Click a dot → evidence bundle. This is the screenshot that sells the product (business plan §6) — it must look good at 1200px and in a phone screenshot.

**`/sessions/[id]`** — evidence bundle: submission, probes, transcript with the cited spans highlighted, per-dimension scores with rationale and confidence, and a one-click override per dimension. **Override must be the easiest action on the page.**

**Copy rules.** UI is Vietnamese. Confidence is always shown next to a score, never a bare number. And FR-501 is absolute: no "cheat", "gian lận", "đạo văn", "plagiarism", or "AI-generated" anywhere a user can see.

---

## 11. Evals

### `evals/fragility` — are the probes actually AI-fragile?
Feed each generated probe to a frontier model **without** the source submission. Gate: **< 25% answerable**. Run on every prompt change to `probes.ts`. A probe that a model can answer blind is a bad probe, however clever it reads.

### `evals/calibration` — gate G1
Input: sessions with ≥ 2 independent blind lecturer scores. Output: Pearson r per dimension and composite, Cohen's κ between lecturers, and a per-dimension error breakdown. **Report κ alongside r** — if lecturers don't agree with each other, r against them is meaningless.

### Golden set
20 hand-scored sessions in `evals/golden/`, spanning all four quadrants. Run before every release. It catches regressions that aggregate correlation hides.

### Known validity limitation — response-modality asymmetry

Speaking tests immediate recall under working-memory and time pressure. Typing allows outlining, revising, and re-reading before submitting. Two things follow from that, and they are not the same bug:

1. **The confidence interval.** `confidenceInterval()` (`lib/domain/scoring.ts`) has a `reliability` term that is `1.0` for every typed turn and the real ASR confidence for voice. That term measures **transcription fidelity only** — how much we trust the transcript matches what was said/typed — and it is correctly `1.0` for typed, since there is no transcription step. It does **not** model whether the two response conditions are comparable. Left unlabelled, this reads as "typed is more reliable," which is a different and unproven claim.
2. **The rubric score itself.** The scoring model (`lib/ai/scoring.ts`) receives each turn's `inputMode` verbatim in its JSON input. As of `score-v2`, `SCORING_SYSTEM` explicitly instructs the model to ignore `inputMode` as a quality signal — closing the channel through which a well-organized typed answer could be scored higher for organization rather than understanding. This is a mitigation, not proof the model never implicitly favors one modality; that can only be settled with data.

**What we don't know yet:** whether typed and spoken answers of equal true understanding produce different D1–D5 scores in practice. There is no pilot data to check this against. `evals/calibration/run.ts` now tracks per-session modality mix (`CalibrationSession.modalityMix`) and reports composite r separately for typed-majority vs. voice-majority sessions once each bucket has ≥ 2 real sessions — the golden set intentionally does not carry this field (fabricating a modality effect would be worse than not measuring one). This is a first-class check to run once the pilot produces mixed-modality sessions, not a claim already settled.

---

## 12. Build order

Ship in this sequence — each step is independently demoable, and the earliest steps de-risk the gate.

1. **Schema + auth + CRUD** (FR-101..105) — the boring foundation
2. **Ingest + Claim Graph** (FR-201, FR-202) — first real Claude call
3. **Probes + fragility eval** (FR-203, FR-204) — *the first point at which the idea is falsifiable*
4. **Session runtime, typed-only** (FR-301, FR-302, FR-305) — prove the loop without ASR
5. **ASR + voice** (FR-303) — swap in the provider
6. **Scoring + confidence** (FR-401..403) + **cost instrumentation** (FR-505)
7. **Feedback report** (FR-404) — G2 becomes measurable
8. **2×2 + evidence bundle + override** (FR-405..407) — the calibration write path opens
9. **Appeals, retention job, copy audit** (FR-503, FR-504, FR-501)
10. **Calibration eval** (G1) — run continuously from step 8 onward

Steps 1–4 are typed-only and need no audio. If the schedule slips, a typed-only pilot still produces the calibration dataset — **voice is the product, but the dataset is the company.**
