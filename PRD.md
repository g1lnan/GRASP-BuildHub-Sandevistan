# GRASP — Product Requirements Document

**Version 1.0 · 25 July 2026 · Status: approved for build**
Scope: **Pilot-ready MVP** · Stack: **Next.js + TypeScript (full-stack)** · Vertical: **University coursework essay**

> Companion documents: [DESIGN.md](DESIGN.md) (architecture, data model, API contracts) · [DOCUMENTATION.md](DOCUMENTATION.md) (setup, conventions, agent working agreements) · [GRASP-Business-Plan.md](GRASP-Business-Plan.md) (market, positioning, financials)

---

## 0. One-paragraph summary

GRASP brings back **vấn đáp** — the Vietnamese oral examination — at the scale of 180 students. A student submits coursework; GRASP reads it, generates 5–8 questions grounded in **that student's own claims**, and runs a 6–10 minute adaptive oral defense in Vietnamese. Two outputs: the student gets learning feedback (explaining your own work from memory is retrieval practice — the intervention has value even when nobody is grading), and the lecturer gets a 2×2 of *product quality* vs. *understanding* that separates the student who used AI and learned from the one who copied and didn't.

**We are not building an AI detector.** There is no "cheating" label anywhere in this product. Every output is evidence for a human decision.

---

## 1. What we are building in this phase

**Pilot-ready MVP** — enough to run the 90-day pilot with 3 university faculties, collect the teacher-labelled calibration dataset, and hit the gate in §7.

| Included | Excluded (and why) |
|---|---|
| Lecturer + student auth, courses, assignments, submissions | LMS connectors (Moodle/Classroom) — Y2; not needed to pilot |
| Claim Graph extraction from an essay | Code / math / lab-report verticals — one vertical, done properly |
| Probe generation with AI-fragility scoring | Multi-subject curriculum mapping — Ngữ văn/K-12 is Y3 |
| Voice-first Vietnamese session, adaptive, typed fallback | Live proctoring, camera, screen-share — opt-in high-stakes mode is post-pilot |
| 5-dimension scoring with confidence intervals | Billing, subscription management, admin console |
| Lecturer console: 2×2, evidence bundle, one-click override | Parent portal, mobile apps, offline mode |
| Student learning-feedback report | Compliance/accreditation export — Y2 |
| Appeal submission flow | Appeal *adjudication* workflow — email + manual for pilot |
| Per-call cost instrumentation | Cost dashboards — read the table, don't build a UI |

**Design rule for this phase:** if a feature does not either (a) produce a verification session or (b) produce a teacher-labelled data point, it is out of scope. The dataset is the company.

---

## 2. Users

| Role | Who | Primary job |
|---|---|---|
| **Lecturer** | University lecturer, 3 courses × ~90 students | Create assignment → review the 2×2 → override scores where wrong |
| **Student** | Undergraduate, submits coursework | Submit → complete the defense session → read learning feedback → appeal if wrong |
| **Researcher** *(internal)* | Us, during the pilot | Export sessions + overrides for calibration analysis |

**Not users in this phase:** department admins, parents, MoET/Sở officials.

### Explicit accessibility requirement
Every student must be able to complete a session **without speaking**. Typed input is a first-class path, not a degraded fallback: same probes, same adaptive branching, same scoring dimensions. Reasons: regional accents, noisy home environments, stammering, shared/low-end devices, and students who simply don't want to be recorded. A session completed by typing is not marked or flagged differently in any UI.

---

## 3. Core user flows

### 3.1 Lecturer creates an assignment
1. Create course → create assignment (title, prompt, due date, subject concepts)
2. Configure the defense: number of probes (5–8), session time cap (6–10 min), **defense weight** (0–30% of the assignment grade)
3. Publish → students see it

### 3.2 Student submits and defends
1. Upload `.docx` / `.pdf` / paste text
2. GRASP analyses (async, ~30–90s) → student sees "Ready to defend"
3. Session: 5–8 probes, voice or typed, adaptive follow-ups, hard time cap
4. On completion: **learning feedback appears immediately** — what they explained well, what they couldn't, what to revisit
5. Understanding score is visible to the student. It is never framed as an accusation.

### 3.3 Lecturer reviews
1. Open assignment → 2×2 scatter of the cohort
2. Click any dot → evidence bundle: submission, probes, transcript, per-dimension score, model rationale, confidence
3. Agree / override in one click. **Override is required to be cheap** — it is the training signal.
4. Optionally request a re-defense for one student

### 3.4 Student appeals
Student opens a completed session → "I think this score is wrong" → free-text reason → lecturer sees it flagged in the console. Adjudication is manual for the pilot.

---

## 4. Functional requirements

Requirement IDs are stable. Reference them in branch names, commits, and PR titles (`FR-204: adaptive follow-up selection`).

### FR-1xx — Accounts, courses, assignments

| ID | Requirement | Acceptance criteria |
|---|---|---|
| **FR-101** | Email + password auth with `lecturer` / `student` / `researcher` roles | A student cannot load any lecturer route; server-side check, not just UI hiding |
| **FR-102** | Lecturer creates/edits/archives a course | Course has `institution`, `name`, `term`; archived courses are read-only |
| **FR-103** | Students enrol via a course join code | Join code is 8 chars, single-use-per-student, revocable |
| **FR-104** | Lecturer creates an assignment with defense config | Config persists: `probe_count` (5–8), `time_cap_seconds` (360–600), `defense_weight_pct` (0–30) |
| **FR-105** | Assignment publishes/unpublishes | Unpublished assignments are invisible to students |

### FR-2xx — Submission, analysis, probes

| ID | Requirement | Acceptance criteria |
|---|---|---|
| **FR-201** | Student uploads `.docx`, `.pdf`, or pastes text (≤ 20,000 words) | Text extracted correctly for all three; over-limit rejected with a clear message |
| **FR-202** | System builds a **Claim Graph** from the submission | Output validates against the schema in DESIGN §4.2; ≥ 5 claim nodes for a 1,000-word essay |
| **FR-203** | System generates probes from the Claim Graph | 5–8 probes; each carries `claim_node_id`, `probe_type`, `bloom_level`, `ai_fragility_score`, `expected_signals`; each quotes or references the student's own text |
| **FR-204** | Probes are ranked and the top N selected by fragility × coverage | Selected probes span ≥ 3 distinct claim nodes and ≥ 3 Bloom levels |
| **FR-205** | Analysis runs async with visible status | Student sees `pending → analysing → ready` or `failed`; failure is retryable |
| **FR-206** | A submission can be re-analysed | Creates a new Claim Graph version; prior sessions keep their original probes |

### FR-3xx — The vấn đáp session

| ID | Requirement | Acceptance criteria |
|---|---|---|
| **FR-301** | Session presents one probe at a time | Student cannot see upcoming probes |
| **FR-302** | Student answers by **voice or typing**, switchable per turn | Both paths produce a `transcript`; scoring is identical |
| **FR-303** | Vietnamese speech → text | Transcript returned within 5s for a 60s clip; `asr_confidence` recorded |
| **FR-304** | Adaptive follow-up: a shallow answer triggers a drill-down; a strong answer escalates Bloom level | Follow-ups are capped at 2 per probe and count toward the time cap |
| **FR-305** | Hard time cap enforced server-side | At cap, session finalises with the turns completed; partial sessions are scored with reduced confidence |
| **FR-306** | Session is resumable within 24h if the connection drops | Completed turns are preserved; the student resumes at the next probe |
| **FR-307** | Integrity signals recorded — window blur, paste, response latency, turn duration | Stored on the session as **evidence only**. **No UI in this product may present these as proof of cheating.** |

### FR-4xx — Scoring and outputs

| ID | Requirement | Acceptance criteria |
|---|---|---|
| **FR-401** | Score each session on the 5 dimensions in §5 | Each dimension gets 1.0–5.0 with one decimal, plus a written rationale |
| **FR-402** | Emit a **confidence interval**, not a point verdict | `confidence_low` / `confidence_high` and a `confidence_label` of `high` / `medium` / `low` |
| **FR-403** | Low confidence produces an explicit recommendation | e.g. "3.8 ± 0.9 — low confidence, recommend a follow-up conversation" |
| **FR-404** | Generate a **student learning-feedback report** on every session | Names ≥ 2 concepts explained well and ≥ 1 to revisit, in Vietnamese, referencing their own text. Produced even when `defense_weight_pct = 0` |
| **FR-405** | Compute the 2×2 quadrant from product score × understanding score | Quadrant is derived, never stored as a label on the student |
| **FR-406** | Lecturer overrides any dimension in one click | Override persists with `original`, `overridden`, `lecturer_id`, optional note — **this is the calibration dataset** |
| **FR-407** | Evidence bundle exportable as JSON | Contains submission text, claim graph, probes, transcript, scores, rationale, overrides |

### FR-5xx — Trust, governance, cost

| ID | Requirement | Acceptance criteria |
|---|---|---|
| **FR-501** | The strings "cheat", "gian lận", "plagiarism", "đạo văn", "AI-generated" appear in **no** user-facing surface | Enforced by an automated test over UI copy — see DOCUMENTATION §7 |
| **FR-502** | Student sees everything about themselves | Their probes, transcript, per-dimension scores, rationale, and confidence |
| **FR-503** | Student can submit an appeal on any completed session | Appeal has `reason`, `status` (`open`/`resolved`), and is visible to the lecturer |
| **FR-504** | Voice recordings deleted after transcription unless retention is enabled | Default retention = off; a scheduled job hard-deletes audio ≥ 24h old |
| **FR-505** | Every model + ASR call logs a `usage_event` with tokens, audio seconds, and cost in VND | `SELECT SUM(cost_vnd) ... GROUP BY session_id` returns cost per session |
| **FR-506** | Full audit trail on every session | Immutable record of what was asked, answered, scored, and overridden |

---

## 5. The 5-dimension understanding rubric

This is the product's core spec. The scorer prompt, the lecturer UI, and the calibration study all read from it. Anchors are deliberately behavioural — a human marker must be able to apply them without training.

| # | Dimension | Question it answers | 1 | 3 | 5 |
|---|---|---|---|---|---|
| **D1** | **Recall** | Can they state what they claimed? | Cannot restate their own claim | Restates it roughly, with prompting | Restates it precisely and unprompted |
| **D2** | **Explanation** | Can they say *why*, in their own words? | Repeats the text verbatim or goes silent | Gives a partial mechanism with gaps | Explains the causal chain in fresh words |
| **D3** | **Application / transfer** | Can they use it on a case they've not seen? | Cannot engage with a novel case | Applies it with errors or heavy hedging | Applies it correctly and notes what changes |
| **D4** | **Critical evaluation** | Can they judge limits and alternatives? | Cannot name a weakness or alternative | Names one weakness, shallowly | Names weaknesses, alternatives, and why they were rejected |
| **D5** | **Metacognition** | Do they know what they don't know? | Claims full confidence throughout | Vague uncertainty, unlocated | Precisely locates their own gaps |

**Composite** = weighted mean, default `D1 0.15 · D2 0.30 · D3 0.25 · D4 0.20 · D5 0.10`. Weights are configurable per assignment; the default is what gets calibrated.

**Rule:** the scorer must cite specific transcript spans for every dimension score. A score with no citation is a bug (FR-401).

---

## 6. Non-functional requirements

| ID | Requirement | Target |
|---|---|---|
| **NFR-1** | Analysis latency (submission → ready) | p50 ≤ 45s, p95 ≤ 120s |
| **NFR-2** | Turn latency (answer submitted → next probe shown) | p50 ≤ 4s, p95 ≤ 9s |
| **NFR-3** | Session completion rate | ≥ 85% of started sessions finish |
| **NFR-4** | **Cost per completed session** | Measured and reported. See DESIGN §8 — the modelled figure is ~4,100 VND on Sonnet-tier reasoning, ~7,600 VND on Opus-tier. ⚠️ Both are estimates until instrumented |
| **NFR-5** | Vietnamese ASR word error rate | ≤ 15% on pilot audio; scoring must tolerate this |
| **NFR-6** | Data residency | All student data stored in Vietnam. Compliance with Decree 13/2023/NĐ-CP ⚠️ verify current PDP Law status |
| **NFR-7** | Concurrency | 200 concurrent sessions without degradation (a mid-size faculty's exam week) |
| **NFR-8** | Accessibility | Typed path is fully equivalent; keyboard-navigable; WCAG AA contrast |
| **NFR-9** | UI language | Vietnamese throughout. Code and comments in English. See DOCUMENTATION §5 |

---

## 7. Success metrics and gates

### The gate that decides everything

> **G1 — Calibration.** Composite understanding score correlates with blind lecturer scoring at **Pearson r > 0.7** across **300 real sessions** spanning ≥ 3 courses.

Hit it and the plan proceeds. Miss it and we know which of D1–D5 failed and iterate on that dimension. Everything else in the roadmap is downstream of this one number.

### The gate people forget

> **G2 — Learning value.** Student-reported "this helped me understand my own work better" ≥ **4.0 / 5.0**, single question, asked at the end of every session.

If G2 fails, the learning-first positioning collapses — and with it the parent story, the principal story, and our answer to "students will just game it." **Measure from session one.**

### Supporting metrics

| Metric | Target | Why |
|---|---|---|
| Inter-rater reliability between lecturers | Cohen's κ > 0.6 | If humans don't agree with each other, r > 0.7 against them is meaningless |
| AI-fragility | < 25% of probes answerable by a frontier model *without* the source submission | The probes must actually be fragile, not just hard |
| Override rate | Tracked, not targeted | Falling over the pilot = we're learning. Rising = something regressed |
| Session completion | ≥ 85% | Below this, the UX is wrong |
| Student fairness perception | ≥ 4.0 / 5.0 | If students experience it as surveillance, we built it wrong |
| Cost per session | Measured | Gates which market segments exist for us (see the business plan, §8) |

---

## 8. Open questions ⚠️

These need a decision before or during the pilot. They are **not** blockers for starting the build.

| # | Question | Owner | Needed by |
|---|---|---|---|
| Q1 | Do we default the reasoning path to Opus-tier (quality) or Sonnet-tier (cost)? See DESIGN §8 — the answer roughly doubles or halves cost per session | Product + ML | Before pilot billing starts |
| Q2 | Is the defense grade weight set by the lecturer, the department, or fixed by us? Affects whether it lands in the syllabus | Product + first pilot faculty | Week 4 |
| Q3 | Who adjudicates appeals at scale — lecturer, department, or us? | Product | Post-pilot |
| Q4 | Does Vietnam's Personal Data Protection Law change our voice-retention default? | Legal ⚠️ | Before any real student data |
| Q5 | Do we need parental consent for students under 18 in the university cohort? | Legal ⚠️ | Before pilot |
| Q6 | Which Vietnamese ASR provider — hosted Whisper-class, or self-hosted PhoWhisper-class? Cost and WER both matter | ML | Week 6 |

---

## 9. Traceability

| Business-plan claim | Requirement that proves it | Gate |
|---|---|---|
| "Six minutes tells you who learned" | FR-301…FR-305 | NFR-2, NFR-3 |
| "It teaches first" | FR-404 | G2 |
| "Evidence, not verdict" | FR-402, FR-501, FR-502, FR-503 | — |
| "The dataset is the company" | FR-406 | G1 |
| "The Expression Gap student is cleared" | FR-405 | G1 |
| "Cost per session gates our market" | FR-505 | NFR-4 |
