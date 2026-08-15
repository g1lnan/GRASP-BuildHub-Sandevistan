# GRASP — Contributor & Agent Handbook

**Version 1.0 · 25 July 2026**
Read this before your first commit. Requirements: [PRD.md](PRD.md) · Architecture: [DESIGN.md](DESIGN.md) · Context: [GRASP-Business-Plan.md](GRASP-Business-Plan.md)

---

## 1. Orientation — 60 seconds

GRASP runs an oral defense (**vấn đáp**) of a student's own coursework, in Vietnamese, in 6–10 minutes, and produces two things: **learning feedback for the student** and **an understanding score for the lecturer**.

Three sentences that will keep you from building the wrong thing:

1. **This is not an AI detector.** We never claim a student cheated. We produce evidence; a human decides. If a feature you're building implies an accusation, it's wrong.
2. **The teaching happens first.** Explaining your own work from memory is retrieval practice. Even a student who games the session had to engage with their own submission — so the product still worked. Never sacrifice the student's learning output to make the scoring cleaner.
3. **The dataset is the company.** Every lecturer override is a labelled Vietnamese understanding judgment that nobody else has. If a change makes overrides harder or lossier, it's a regression regardless of what else it improves.

---

## 2. Glossary

Vietnamese terms appear in code comments, UI copy, and the business plan. Know them.

| Term | Meaning |
|---|---|
| **vấn đáp** | Oral examination. The format GRASP automates. Not a new idea — a Vietnamese tradition class sizes made unaffordable |
| **bảo vệ khóa luận** | Thesis defense. Every Vietnamese university runs one; our beachhead |
| **nắm vững** | To grasp / master something. The product name in Vietnamese |
| **Ngữ văn** | Literature (school subject). K-12 vertical, Year 3 — **not** this phase |
| **Sở GD&ĐT** | Provincial Department of Education. Year 4 buyer |
| **Chương trình GDPT 2018** | The 2018 national general-education curriculum. Competency codes we map to (K-12 phase) |
| **Thông tư 02/2025** | Circular 02/2025/TT-BGDĐT — the Digital Competency Framework for learners |
| **Claim Graph** | Our structured decomposition of a submission. See DESIGN §4.2 |
| **Probe** | One question generated from one claim node |
| **AI-fragile** | A probe that a model can't answer *without* the source submission. Gate: < 25% |
| **The 2×2** | Product quality × understanding. Quadrants: Mastery, Hollow, Expression Gap, Needs Support |
| **G1 / G2** | The two gates in PRD §7. G1 = calibration r > 0.7. G2 = student learning value ≥ 4.0 |

---

## 3. Getting started

### Prerequisites
Node 22+, pnpm 9+, Postgres 16+, an Anthropic API key, an ASR provider key.

### Setup

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed        # demo lecturer, student, course, and one submission
pnpm dev
```

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `ANTHROPIC_API_KEY` | Claude API |
| `ASR_PROVIDER` | Provider key from `lib/asr/providers/`; Step 5 ships with `groq` |
| `ASR_API_KEY` | ASR credentials; for `groq`, a Groq API key |
| `S3_*` | Object storage — **must be a Vietnam region** (NFR-6) |
| `AUTH_SECRET` | Auth.js session signing |
| `FX_VND_PER_USD` | Cost conversion. Default `26000` — update when it moves |
| `AUDIO_RETENTION_HOURS` | Default `24`. See FR-504 |

Never commit `.env.local`. Never paste a key into a prompt, an issue, or a test fixture.

Voice turns are uploaded directly to the ASR provider from server memory. The
current default-retention path does not persist the raw recording; the turn
stores only its transcript, ASR confidence, latency, duration, and an immediate
`audio_deleted_at` marker. Typing remains available on every turn.

### Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright |
| `pnpm lint` / `pnpm typecheck` | ESLint / `tsc --noEmit` |
| `pnpm db:migrate` / `pnpm db:generate` | Apply / generate Drizzle migrations |
| `pnpm eval:fragility` | AI-fragility harness — **required after any `lib/ai/probes.ts` change** |
| `pnpm eval:calibration` | G1 analysis over labelled sessions |
| `pnpm eval:golden` | 20-session regression set |
| `pnpm audit:copy` | FR-501 forbidden-language check |
| `pnpm cost:report` | Cost per session from `usage_events` |

---

## 4. Conventions

### TypeScript
- `strict: true`. No `any`. Use `unknown` + a Zod parse at boundaries.
- Zod schemas live next to what they validate and are **shared** between the API boundary and LLM structured output. One schema, two uses.
- Server-only code imports `server-only`. Anything touching `ANTHROPIC_API_KEY` or the DB must never reach the client bundle.
- Prefer route handlers over server actions for anything an external client might call.

### Naming
- Files `kebab-case.ts`; React components `PascalCase.tsx`; DB columns `snake_case`; TS fields `camelCase` (Drizzle maps them).
- Requirement IDs (`FR-204`) appear in branch names, commit bodies, and PR titles. This is how the PRD stays traceable.

### Language (i18n)
- **All user-facing copy is Vietnamese.** All code, comments, commit messages, and docs are English.
- Copy lives in `lib/i18n/vi.ts` — never inline a Vietnamese string in a component. The FR-501 audit only scans the locale file plus JSX text nodes; inline strings evade it.

### Errors
- Typed errors at boundaries; never `catch {}` silently.
- User-facing error text is plain Vietnamese with a next action. Never surface a stack trace, a model name, or a token count to a student.

---

## 5. Claude API — read this before writing a model call

**Full contract: DESIGN §6.** These are the four that will bite you, because your training prior is probably stale:

| ❌ Don't | ✅ Do |
|---|---|
| `thinking: { type: 'enabled', budget_tokens: N }` | `thinking: { type: 'adaptive' }` — `budget_tokens` **400s on Opus 4.8** |
| `temperature`, `top_p`, `top_k` | Omit them entirely — they **400 on Opus 4.8**. Steer with the system prompt |
| Assistant-turn prefill to force JSON | `output_config: { format: zodOutputFormat(Schema) }` — prefill **400s** |
| Top-level `output_format` | `output_config: { format: ... }` |

Also: model IDs are exactly `claude-opus-4-8` / `claude-sonnet-5` / `claude-haiku-4-5` — never append a date suffix. Stream when `max_tokens > 16000`. Catch typed SDK errors (`Anthropic.RateLimitError`), never string-match messages.

**Prompt changes:**
1. Bump the `*_PROMPT_VERSION` constant in the module. Without it, the calibration study can't attribute a score change to your edit.
2. Run `pnpm eval:golden`. Run `pnpm eval:fragility` too if you touched probes.
3. Check `response.usage.cache_read_input_tokens` is still non-zero — an edit to a `system` block can silently break caching, and Opus 4.8 needs a ≥ 4096-token prefix to cache at all.

### Final scoring (FR-401..403)

- `POST /api/sessions/:id/finalize` is idempotent. Finalization is serialized per session, so repeated or concurrent requests return the persisted score without another model call or usage charge.
- The model produces the five D1–D5 judgments, a Vietnamese rationale, and exact transcript citations. A citation that is not a substring of the referenced turn is rejected and never persisted.
- The server computes the assignment-weighted composite. Do not ask the model to calculate it and do not silently change the PRD §5 weights.
- The server computes the confidence interval from session completeness, probe coverage, input mode, and ASR confidence. Partial sessions therefore widen the interval deterministically.
- The active prototype adapter is Groq `openai/gpt-oss-120b`; the prompt version is stored with the score. Every attempt, including a failed attempt, writes a `usage_event`.
- A low-confidence result always carries the Vietnamese recommendation for a short lecturer follow-up. It is evidence for a human decision, never a verdict.

### Learning feedback (FR-404)

- Finalization also returns one persisted learning-feedback report, even when the assignment's defense weight is zero.
- The report names at least two distinct concepts the student demonstrated and at least one concept to revisit, followed by a concrete revision list and Vietnamese synthesis.
- Every strength and gap cites an exact span from the submission (`turnOrdinal: 0`) or a transcript turn. Invented or mismatched citations are rejected before persistence.
- Feedback is a separately idempotent stage using Groq `openai/gpt-oss-20b`. A retry after feedback failure reuses the persisted score, and concurrent requests produce one report and one billable feedback call.
- Every successful or failed feedback call writes a `usage_event`; the stored model and prompt version keep later G2 experiments attributable.

---

## 6. Working agreements for agents

### Before you start
- Find the `FR-###` you're implementing. If there isn't one, **stop and ask** — unscoped work is how the MVP becomes the full platform.
- Read the acceptance criteria. They are the definition of done, not a suggestion.

### Branches and commits
```
feat/FR-204-adaptive-probe-selection
fix/FR-303-asr-timeout-fallback
chore/upgrade-drizzle
```
```
FR-204: rank probes by fragility × claim coverage

Selects N probes spanning ≥3 claim nodes and ≥3 Bloom levels.
Fragility eval: 18% blind-answerable (gate <25%).
```

### Definition of done
- [ ] Acceptance criteria in the PRD are met — all of them
- [ ] `pnpm typecheck` and `pnpm lint` pass
- [ ] Unit tests for new logic; E2E for anything on a core flow (PRD §3)
- [ ] `pnpm audit:copy` passes
- [ ] If you touched a prompt: version bumped, `eval:golden` run, results in the PR
- [ ] If you touched probes: `eval:fragility` run, number in the PR
- [ ] If you added a model or ASR call: it writes a `usage_event` (FR-505)
- [ ] No secrets, transcripts, audio URLs, or student text in logs

### Escalate to a human — do not decide these yourself
- Anything that changes what a student **sees about themselves** (FR-502)
- Anything touching data retention, deletion, or residency (FR-504, NFR-6)
- Model routing changes with a cost consequence (PRD Q1, DESIGN §8)
- Changing the rubric in PRD §5, or the D1–D5 weights — it invalidates prior calibration data
- Anything that could read as an accusation of cheating (FR-501)

### Parallel work
Independent by design: `lib/ai/*` (schemas are the contract) · `lib/asr/*` (interface is the contract) · `app/(lecturer)/*` vs `app/(student)/*` · `evals/*`.
Serialise on: `lib/db/schema.ts` (one migration at a time) and `lib/i18n/vi.ts` (merge conflicts are painful).

---

## 7. The copy audit (FR-501)

`pnpm audit:copy` fails the build if any user-facing string matches:

```
cheat · cheating · gian lận · plagiari{sm,se,zed} · đạo văn
AI-generated · AI-written · fraud · gian dối · sao chép bài
```

**This is not a style rule.** The moment the product accuses a student, we become the tool we exist to replace — the one that flags 61% of non-native English essays and calls it evidence. If you need to express a concern, the vocabulary is: *"chưa giải thích được"* (could not yet explain), *"cần trao đổi thêm"* (recommend a follow-up conversation), *"độ tin cậy thấp"* (low confidence).

If you genuinely need a new term, add it to `lib/i18n/vi.ts` and get it reviewed. Don't work around the audit.

---

## 8. Testing

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Pure logic: `quadrant()`, adaptive rules, cost math, Zod schemas |
| Integration | Vitest + test DB | Route handlers with auth; **authorisation tests are mandatory** |
| E2E | Playwright | The three flows in PRD §3, both voice and typed paths |
| Eval | custom | Fragility, calibration, golden set |

**Mock the model in unit and integration tests.** Real Claude calls belong only in `evals/`. Fixtures live in `tests/fixtures/` — use realistic Vietnamese essays, never lorem ipsum; the Claim Graph behaves differently on real prose.

**Always test the authorisation negative case.** "Student A cannot read Student B's session" is a test, not an assumption.

---

## 9. Cost discipline

Cost per session decides which markets exist for us (DESIGN §8, business plan §8). It is an engineering metric with a strategic consequence.

- Every model and ASR call writes a `usage_event`. **No exceptions** — an uninstrumented call is an invisible cost.
- Before adding a model call, ask: can an existing call return this? Can it run on Haiku? Can it reuse a cached prefix?
- Never add a per-turn frontier-model call. Turn triage is Haiku by design; the authoritative score runs once at finalize.
- Run `pnpm cost:report` after any change to `lib/ai/*` and put the delta in the PR.

---

## 10. Non-negotiables

1. **No accusation.** Ever. Anywhere. (FR-501)
2. **Student data is never training data.** Not without institution-level opt-in and de-identification — neither of which exists in this codebase yet, so the answer is no.
3. **Audio is deleted.** Default 24h post-transcription. The retention job is not best-effort. (FR-504)
4. **Data stays in Vietnam.** Every bucket, every replica. (NFR-6)
5. **The typed path is equal.** Same probes, same scoring, no flag, no visual difference. (FR-302, NFR-8)
6. **Confidence travels with every score.** A bare number invites a decision the data doesn't support. (FR-402)
7. **Override stays cheap.** One click. If a refactor adds friction, it's a regression. (FR-406)

---

## 11. Extending the system

**New probe type** → add to the `probe_type` enum, document what makes it AI-fragile in `lib/ai/prompts/probes.ts`, add ≥ 3 golden examples, run `pnpm eval:fragility`. If it scores > 25% blind-answerable, it isn't a probe type — it's a quiz question.

**New ASR provider** → implement `ASRProvider` (DESIGN §7.1), register in the factory, add `costPerMinuteVnd`, benchmark WER on the pilot audio set. Ship behind `ASR_PROVIDER` so it's a one-env-var rollback.

**New subject vertical (code, math, lab reports)** → this is **not** a config change. It needs new `ClaimNode.kind` values, new probe types, a new golden set, and its own calibration run. Treat it as a project, and read business plan §5 first — we deliberately do one vertical properly before adding a second.

---

## 12. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `400 invalid_request_error` on a model call | `temperature` / `top_p` / `budget_tokens` / prefill left in the request. See §5 |
| `cache_read_input_tokens` is 0 | A silent invalidator in the system prompt (date, ID, non-deterministic JSON), or the prefix is under 4096 tokens on Opus 4.8 |
| `parsed_output` is `null` | The model didn't satisfy the Zod schema. Log the raw text, tighten the schema, don't hand-parse |
| Claim Graph has < 3 nodes | Submission too short or extraction failed. Check `extracted_text` before blaming the prompt |
| Session stuck in `analysing` | The job worker isn't ticking. Check the cron hitting `/api/jobs/tick` |
| Calibration r is low but κ is also low | The lecturers disagree with each other — fix the ground truth before touching the scorer |
| Cost per session spikes | Cache miss (see above) or a stray frontier-model call in the turn loop |

---

## 13. Decision log

Append here when you make a decision a future contributor would otherwise re-litigate. One line each.

| Date | Decision | Why |
|---|---|---|
| 2026-07-25 | Pilot-ready MVP, not a demo slice | The calibration dataset requires real multi-user sessions |
| 2026-07-25 | University coursework essay as the only vertical | Matches the beachhead; one vertical done properly beats four half-built |
| 2026-07-25 | Next.js full-stack; no separate Python service | ASR is a network call, not a local model — a second service buys nothing at pilot scale |
| 2026-07-25 | Opus-tier default for reasoning paths during the pilot | Cannot calibrate against a model we intend to swap. Step-down is a measured decision at G1 (PRD Q1) |
| 2026-07-25 | Quadrant derived at read time, never stored | A stored "hollow" label is an accusation of record |
| 2026-07-25 | Typed input is a first-class path, not a fallback | Accessibility, and it de-risks the schedule — steps 1–4 ship without ASR |
