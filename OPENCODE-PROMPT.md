# Handoff prompt for opencode

Paste the block below as your first message. Everything after it is supporting notes for you, not for the agent.

---

## THE PROMPT

```
Build GRASP — a Vietnamese assessment platform that runs an AI-driven oral defense
(vấn đáp) of a student's own coursework and reports whether they actually understood it.

This repo already contains a complete specification. Read all five files before writing
any code, in this order:

  1. PRD.md          — 40 numbered requirements (FR-###) with acceptance criteria, the
                       5-dimension rubric, and the two gates that define success
  2. DESIGN.md       — architecture, DB schema, API contracts, Claude integration,
                       cost model, and the build order in §12
  3. FRONTEND.md     — design system, screen-by-screen layout, copy rules
  4. DOCUMENTATION.md— conventions, working agreements, definition of done
  5. GRASP-Business-Plan.md — context for WHY. Skim §3, §4 and §8; you don't need the rest

Front-end materials are already made. Do not redesign them:
  - ui/tokens.css    — production design tokens. Import into app/globals.css as-is
  - ui/mockups.html  — static reference for all six screens. Match these layouts

The visual system is game-y, heavily Duolingo-inspired: 3D push buttons, bright
palette, XP / streaks / concept map, and a mascot (Nghé, a baby water buffalo).
Fonts are Baloo 2 (display) + Be Vietnam Pro (UI) — both have verified Vietnamese
tone-mark coverage. Do not substitute either.

Gamify the STUDENT, not the lecturer. The lecturer console shares the palette but
has zero game mechanics — no XP, no streaks, no mascot, no confetti. This mirrors
Duolingo for Schools.

STACK (already decided — do not re-litigate):
  Next.js 15 App Router · React 19 · TypeScript strict · Postgres + Drizzle ORM ·
  Auth.js credentials · Tailwind + shadcn/ui · Zod · Vitest + Playwright ·
  @anthropic-ai/sdk · pnpm

BUILD ORDER — follow DESIGN.md §12 exactly, in sequence. Each step must be
independently runnable and demoable before you start the next:

  1. Schema + auth + CRUD                    (FR-101..105)
  2. Ingest + Claim Graph                    (FR-201, FR-202)
  3. Probes + AI-fragility eval              (FR-203, FR-204)  ← idea becomes falsifiable
  4. Session runtime, TYPED ONLY             (FR-301, 302, 305)
  5. ASR + voice                             (FR-303)
  6. Scoring + confidence + cost instrument  (FR-401..403, FR-505)
  7. Student feedback report                 (FR-404)
  8. 2×2 + evidence bundle + override        (FR-405..407)
  9. Appeals + retention job + copy audit    (FR-501, 503, 504)
 10. Calibration eval harness                (gate G1)

CLAUDE API — four patterns you probably remember are now HTTP 400 on Opus 4.8.
DESIGN.md §6.1 has the full table. The short version:
  - thinking: { type: 'adaptive' }        NOT budget_tokens
  - omit temperature / top_p / top_k      they 400
  - output_config: { format: zodOutputFormat(Schema) }   NOT assistant prefill, NOT output_format
  - model IDs exactly: claude-opus-4-8, claude-sonnet-5, claude-haiku-4-5 — no date suffixes
Use client.messages.parse() with zodOutputFormat. Check parsed_output for null.
Catch typed SDK errors (Anthropic.RateLimitError), never string-match messages.

NON-NEGOTIABLES — violating any of these is a failed build, not a style nit:
  1. No accusation, anywhere. The strings cheat / gian lận / đạo văn / plagiarism /
     AI-generated must never reach a user-facing surface. Ship the failing test for
     this (pnpm audit:copy) in step 1, not step 9 — it is easier to never write the
     word than to remove it later.
  2. Typed input is fully equal to voice: same probes, same scoring, no flag, no
     visual difference. Steps 1–4 must work with zero audio.
  3. The 2×2 quadrant is DERIVED at read time. Never store a quadrant label on a
     student row.
  4. Every model and ASR call writes a usage_event row with token counts and cost_vnd.
     An uninstrumented call is an invisible cost.
  5. Lecturer override is one click — no modal, no confirm, no save button. It writes
     the calibration dataset, which is the entire point of the pilot.
  6. Every score renders with its confidence interval. Never a bare number.
  7. Student data is never training data. Audio is hard-deleted 24h after transcription.
  8. GAME MECHANICS REWARD EFFORT, NEVER SCORE. XP for completing a defense, streaks
     for showing up, leagues ranked on XP. Never XP for scoring well, never a league
     ranked on understanding scores. This is what makes gamification safe on a graded
     assessment — and it is exactly how Duolingo works.
  9. No hearts, no lives, no fail-out mechanic. A graded assessment must never be
     failable by a game rule.
 10. There is NO RED TOKEN in the design system. "Not yet solid" is --amber
     ("chưa vững"). Do not add red for errors, low scores, or the Hollow quadrant.

WORKING RULES:
  - Every branch, commit and PR references its FR-###. If work has no FR, stop and ask.
  - Bump the *_PROMPT_VERSION constant on any prompt edit, or calibration analysis
    can't attribute score changes.
  - Mock the model in unit and integration tests. Real Claude calls only in evals/.
  - Always test the authorisation negative case: student A cannot read student B's
    session. Write that test, don't assume it.
  - UI copy is Vietnamese and lives in lib/i18n/vi.ts. Never inline a Vietnamese
    string in a component — the copy audit can't see it there.
  - Code, comments, commits: English.

ESCALATE TO ME, don't decide alone:
  - Model routing changes with a cost consequence (see PRD.md Q1 — this is open)
  - Anything touching data retention, deletion, or residency
  - Changes to the D1–D5 rubric or its weights (invalidates prior calibration data)
  - Anything that could read as an accusation of cheating

Start with step 1. Scaffold the project, set up Drizzle with the full schema from
DESIGN.md §4, wire Auth.js with the three roles, and build lecturer course +
assignment CRUD. Show me a running app with seeded demo data before moving to step 2.
```

---

## Notes for you (not for the agent)

### Before you paste

Make sure all five docs are in the repo root and `ui/` is present:

```bash
ls PRD.md DESIGN.md FRONTEND.md DOCUMENTATION.md GRASP-Business-Plan.md ui/tokens.css ui/mockups.html
```

Have ready: `ANTHROPIC_API_KEY`, a Postgres URL, and an ASR provider key. The agent will ask.

### Why the build order matters

**Step 3 is the moment the whole idea becomes falsifiable.** The AI-fragility eval asks: can a frontier model answer our probes *without* the student's essay? If more than 25% are answerable blind, the probes aren't fragile and GRASP doesn't work — and you'd know that in week 8 for the cost of two modules instead of after building a platform.

Do not let the agent reorder this. If it proposes "let me build the UI first so you can see progress," say no — the UI is already designed and sitting in `ui/mockups.html`.

**Steps 1–4 need no audio at all.** That's deliberate. If ASR procurement drags (PRD Q6 is still open), a typed-only pilot still produces the calibration dataset. Voice is the product; the dataset is the company.

### Where agents usually go wrong on this build

| Failure mode | What to say |
|---|---|
| Reaches for `temperature: 0` for "deterministic" scoring | It 400s on Opus 4.8. Determinism comes from the prompt + schema |
| Builds a slick "cheating risk" badge because it seems useful | This is the one thing that fails the whole build. Point at FR-501 |
| Stores `quadrant: 'hollow'` as a column because it's simpler | A stored label is an accusation of record. DESIGN §4.5 |
| Puts override behind a modal with a confirm step | Friction here is a strategic cost. DOCUMENTATION §10 |
| Adds a per-turn frontier-model call for "better" adaptivity | Doubles cost and latency. Turn triage is Haiku by design |
| Skips `usage_event` on "just one small call" | That's how cost models drift. FR-505 has no exceptions |
| Awards bonus XP for a high understanding score | Breaks the one rule that makes gamification safe here. FRONTEND §6 |
| Adds hearts/lives because "Duolingo has them" | It would make a graded assessment failable by a game rule |
| Reaches for red on the Hollow quadrant or a low bar | No red token exists. Use `--amber`. FRONTEND §2 |
| Puts XP or a streak in the lecturer console | Gamify the student, not the lecturer |

### Cost watch

Run `pnpm cost:report` after step 6 and put the number in front of yourself. DESIGN §8 models ~7,600 ₫/session on Opus-tier and ~4,060 ₫ on Sonnet-tier — your business plan assumed 3,400 ₫. **PRD Q1 is the open decision**, and it should be resolved with measured data across both tiers on the same 50 sessions, comparing cost *and* correlation-with-lecturer. Not cost alone.

### Two legal items still open ⚠️

PRD Q4 and Q5 — Vietnam's Personal Data Protection Law status (affects the voice-retention default) and whether under-18s in a university cohort need parental consent. Neither blocks the build. **Both block real student data.** Resolve before the pilot, not before step 1.

### What to demo at each checkpoint

| After step | You should be able to show |
|---|---|
| 1 | A lecturer logs in, creates a course, creates an assignment |
| 3 | Upload a real essay → see the generated probes → see the fragility score |
| 4 | Complete a full typed defense session end to end |
| 6 | The same session, scored across D1–D5 with a confidence interval, and its cost |
| 8 | **The demo you present.** A cohort 2×2, click a dot, see the evidence, override a score |

Step 8 is the hackathon demo. Everything before it is scaffolding for that moment.
