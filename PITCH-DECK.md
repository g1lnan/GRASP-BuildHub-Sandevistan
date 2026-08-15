# GRASP — Pitch Deck Content (12 slides, English)

> Tagline: **Bring back vấn đáp — the Vietnamese oral exam — at the scale of 180 students.**
> One line: *We are not an AI detector. We verify understanding, and give a teacher evidence for a human decision.*

---

## Slide 1 — Title & Introduction *(0 pts)*
**GRASP**
*Verify understanding, not authorship.*

- Team name · Build@Hub Hackathon 2026
- Subtitle: **Scalable Vietnamese oral defense (vấn đáp) for the AI era.**
- One-sentence hook (say out loud): *"AI didn't make students cheat — it made written work stop proving they understood. We give that proof back."*

**Speaker note:** Open with the hook, not the team. 10 seconds, then move.

---

## Slide 2 — Problem & Opportunity *(5 pts)*
**Written work no longer proves understanding — and the tool sold to fix it punishes Vietnamese students.**

- **The signal broke.** A polished essay used to signal a student understood the material. With frontier AI, it no longer does — for any subject with a written deliverable.
- **AI detection is the wrong product.** Stanford HAI: 7 major detectors flagged **61% of non-native-English essays as AI-generated**. Turnitin's own data: **6–9% false positives for non-natives vs 1–4% for natives**. GPTZero: **~15% of human essays flagged**. *The tool the world sells Vietnam systematically punishes students for being Vietnamese.*
- **The real answer already exists here.** Vietnam has **vấn đáp**; universities still run **bảo vệ khóa luận**. Culturally legitimate, pedagogically superior, cheat-proof by construction. The problem isn't the solution — **it's that oral defense costs a teacher-hour per student** and collapses at 180 students : 1 teacher.
- **Why now.** Resolution 71-NQ/TW (Aug 2025) names AI a lever for education reform · Circular 02/2025 mandates a Digital Competency Framework · national high-school AI curriculum begins **2026–2027** · **~580 trillion VND (~USD 23.7B)** committed to education modernisation 2026–2035. *Policy says "teach students to use AI well." Nobody built the instrument that measures whether they did.*

**Key visual:** three students who look identical on paper → only an oral defense tells them apart.
**Speaker note:** Land the 61% stat hard — it reframes detection from "imperfect" to "harmful."

---

## Slide 3 — Value Proposition *(5 pts)*
**Two outputs from one 6–10 minute conversation: the student learns, the teacher finds out who understood.**

- **For the student — learning, not policing.** Explaining your own work from memory *is* retrieval practice, the most effective revision there is. **The intervention has value even when nobody is grading.**
- **For the lecturer — a 2×2 that separates the unsplittable.** Product quality on one axis, demonstrated understanding on the other. It distinguishes the three students a teacher currently cannot: *deep-understand + writes well*, *used AI and learned*, *copied and didn't* — including the deep-understanding student who writes badly, the one every detector wrongly flags.
- **No accusation, anywhere.** There is **no "cheating" label** in the product. Every output is **evidence for a human decision** — the teacher decides, GRASP never does.
- **Fair by construction.** Questions are generated from **the student's own claims**, in Vietnamese. The same rubric, the same probes, and the same time cap apply whether a student speaks or types — modality is a student's choice, never a scoring variable.

**Key line:** *"We market the learning outcome; the integrity benefit sells itself the first time a dean sees the 2×2."*
**Speaker note:** Emphasise "evidence, not verdict" — it's the ethical spine and the legal safety of the product.

---

## Slide 4 — Solution System Design *(5 pts)*
**Submission → Claim Graph → AI-fragile probes → adaptive oral defense → 5-D score → 2×2 + evidence.**

Pipeline:
1. **Ingest** — student submits coursework (docx / pdf / text; code & LMS later).
2. **Claim Graph** *(core IP)* — decompose the submission into a structured map of every claim, reasoning step, and cited evidence, mapped to **GDPT 2018** competency codes. Not a similarity score — a structure.
3. **Probe Generator** — 5–8 questions grounded in *that student's* claims, each scored for **AI-fragility**: a probe only ships if a frontier model **cannot** answer it without the essay (gate: <25% blind-answerable).
4. **Adaptive session** — 6–10 min Vietnamese oral defense, voice-first with a typed fallback under the identical rubric and time cap; drills down or advances per answer.
5. **5-dimension scoring** — **D1 Recall · D2 Explanation · D3 Application · D4 Evaluation · D5 Metacognition** (1–5 each), every score shown **with a confidence interval**, never a bare number.
6. **Lecturer console** — 2×2 cohort matrix → click a dot → **evidence bundle** (transcript, claim graph, per-dimension rationale, citations) → **one-click override** that writes the calibration dataset.

- **Stack:** Next.js 15 · Postgres/Drizzle · Claude Sonnet-class for Claim Graph + scoring · Vietnamese ASR · per-call cost instrumentation on every model call.
- **Governance built in:** audio hard-deleted 24h after transcription; student data is never training data.

**Key visual:** the horizontal pipeline diagram; highlight Claim Graph + AI-fragility as the technical moat-in-progress.
**Speaker note:** If challenged that "a good prompt does 70% of this in 6 weeks" — agree openly, then pivot to calibration + curriculum mapping + the fact a lecturer won't maintain it.

---

## Slide 5 — Target Market *(5 pts)*
**Start where the format we're automating already exists and already has budget.**

- **Beachhead (Year 1): university coursework & thesis defense.** Every Vietnamese university already runs **bảo vệ khóa luận** — mandatory, respected, and *expensive*: a 3–4 lecturer committee, per student, 30 minutes. **They already believe in oral defense; they just can't afford it below final year.** Buyer = faculty; decision cycle 6–10 weeks; can run a paid pilot without central approval.
- **Year 2: private / international K-12** — fast decisions, good margins, willingness to pay for differentiation.
- **Year 3: public THPT (upper secondary)** — largest by headcount, but **entered deliberately late**: at ~39,000 VND/student/yr it's only viable once our cost/session drops below ~1,500 VND. **Universities fund the cost curve that makes public education viable.**
- **Serviceable population (Vietnam): ~9.2M unique students** across university, private K-12, and upper secondary — where assessment is genuinely written work. *Not the 25M headline — the segment where the product is true.*

**Key visual:** a 3-year expansion staircase (University → Private K-12 → Public THPT) annotated "gated by cost/session."
**Speaker note:** The sequencing IS the strategy — say "cost problem, not sales problem" for K-12.

---

## Slide 6 — Marketing / Go-to-Market *(5 pts)*
**Deans buy from deans. We sell a learning outcome and co-author the proof.**

- **Channel 1 — Faculty pilot → paid conversion.** One department, one semester, published numbers. In HE, a peer-reviewed result from a named Vietnamese university beats any advertising. *(~90M VND CAC · ~5-mo payback · 55% of Y1 mix · very sticky.)*
- **Channel 2 — Dean-to-dean referral.** The most boring slide that closes deals: what a thesis-defense committee costs per student vs. what GRASP costs. **We ask for no new budget.** *(~35M VND CAC · ~2-mo payback · compounds after 3–4 references.)*
- **Channel 3 — Co-authored calibration study.** We publish the accuracy study *with* pilot faculties. They become invested in the result; it buys **academic credibility no competitor can purchase.** In assessment, **credibility is the product.**
- **Message discipline.** We lead with *"your students will explain their work out loud — the most effective revision they'll ever do."* True, well-evidenced, and nobody objects. The integrity benefit reveals itself on first sight of the 2×2.
- **Adoption loop:** lecturer pilots → students report learning gain → department adopts → dean references peer dean.

**Key visual:** the flywheel (pilot → learning gain → adoption → referral).
**Speaker note:** Positioning as pedagogy (not surveillance) is what makes this sellable to educators.

---

## Slide 7 — Market Analysis *(5 pts)*
**A growing market, an empty quadrant, and an honest moat.**

- **Sizing.** TAM (global assessment integrity + learning verification) **~USD 2.4B by 2030** · SAM (SEA formal education at local pricing) **~USD 250M/yr** · SOM (Vietnam + early SEA, 5-yr) **~USD 6.2M ARR / 2.2M verified students**. Vietnam edtech **USD 1.08B (2024) → 3.70B (2034), 13.1% CAGR.**
- **Competitive map (2×2: English↔Vietnamese × Detect↔Verify-understanding):**
  - Turnitin / GPTZero — **bottom-left**: detection, English-first, wrong question.
  - Azota / SHub — **top-left**: Vietnamese-native, but they *deliver & grade* work, they don't *verify understanding*.
  - Turnitin Clarity — moving right, but English-first, HE-first, Western-priced.
  - **Top-right quadrant — verify understanding, Vietnamese-native — is empty.**
- **Intellectual honesty (this scores points).** The *idea* of AI-assisted oral defense **is not novel** — it's been the most-discussed answer since 2023. **We don't win on the idea; we win on execution**: Vietnamese-native, curriculum-mapped, priced for Vietnamese budgets, embedded as a **graded component** — and shipped here first.
- **"Why won't Turnitin build it?"** They might — but (1) their revenue is anchored to detection, (2) the calibration data is Vietnamese and unpurchasable, (3) GDPT 2018 mapping has no global reuse, (4) they'd enter at Western prices. **Execute and we're an acquisition target, not a casualty.**

**Key visual:** the competitive 2×2 with the empty top-right highlighted.
**Speaker note:** Naming "a well-prompted frontier model" and "manual vấn đáp (our biggest competitor by share)" openly is what makes judges trust the rest.

---

## Slide 8 — Financial Model *(5 pts)*
**Real unit economics on the beachhead; cost/session is the strategic lever.**

| Metric | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---|---|---|---|---|
| **Revenue (tỷ VND)** | 1.58 | 10.0 | 35.5 | 82.0 | **162.0** |
| ≈ USD | 61K | 385K | 1.37M | 3.15M | **6.23M** |
| **Cost / session (VND)** | 3,400 | 2,800 | 1,900 | 1,500 | **1,250** |
| **Gross margin** | 61% | → | → | → | **84%** |

- **Beachhead unit economics:** a 3,500-student faculty ≈ **311M VND/yr**; fully-loaded CAC ≈ **90M VND** → **payback < 5 months · LTV/CAC ≈ 9.2×** (universities rarely switch).
- **Break-even: Q2 Year 4.** Gross margin climbs 61% → 84% as cost/session falls.
- **Pricing:** per-student ASP by segment (University 89K · Private K-12 145K · Public THPT 39K VND/yr) + **Lecturer Pro 149,000 VND/mo** (unlimited voice, custom rubrics, LMS sync).
- **Why cost/session is sacred:** it gates *which markets exist for us at all*. Below ~1,500 VND unlocks public K-12 — which is why **an ML hire comes before a sales hire.** We reach it in Y3 by distilling our own Vietnamese models on our own data.
- **The Ask: 5 tỷ VND (~USD 190K) pre-seed → 18 months → 96K students, ~10 tỷ ARR, and a published calibration study.**

**Key visual:** revenue bars + a *descending* cost/session line on the same chart — the two together are the story.
**Speaker note:** Present cost/session as an *engineering* metric with financial consequences, not an afterthought.

---

## Slide 9 — Team *(5 pts)*  ⚠️ *fill in real names/proof*
**A team built around the one metric that decides the company: cost-per-session & calibration.**

| Member | Role | Proof point (fill in) |
|---|---|---|
| **[Name]** | Product / CEO | Domain proof — education / assessment / GTM |
| **[Name]** | AI / ML — *owns cost/session & calibration* | Model / eval / Vietnamese-NLP proof |
| **[Name]** | Full-stack engineering | Shipped product proof (this MVP) |
| **[Name(s)]** | Lecturer advisory group | Named pilot faculty / academic credibility |

- **Why this shape:** in an assessment company, **credibility and cost curve are the product** — so ML + academic advisors are first-class, not support functions.
- **Hiring order (deliberate):** ML/eval before sales, because cost/session gates the addressable market.

**Speaker note:** Tie each person to a risk they retire (calibration, cost, distribution, credibility).

---

## Slide 10 — Current Status & Future Plan *(5 pts)*
**The pilot-ready MVP is built and verified end-to-end. Next: real data and a published number.**

- **Built (working software, not slides):** lecturer/student auth & roles → assignment config → **Claim Graph extraction** → **probe generation with AI-fragility scoring** → **adaptive Vietnamese session (voice + typed)** → **5-dimension scoring with confidence intervals** → **student learning-feedback report** → **lecturer 2×2 + evidence bundle + one-click override** → **appeal flow** → **24h audio-retention job** → **G1 calibration-eval harness**.
- **Engineering health:** the full 10-step build plan complete · **172 automated tests passing** · a "no-accusatory-language" copy audit enforced in CI · per-call cost instrumentation on every model call.
- **Known limitations, tracked not hidden:** e.g. whether typed and spoken answers are truly comparable given different response conditions (time pressure vs. revision). We closed the scoring model's exposure to modality as a signal and instrumented the calibration harness to split results by input mode the moment pilot data has both — measured, not assumed.
- **The gate we're built to hit — G1:** model understanding score correlates with blind lecturer scoring at **Pearson r > 0.7** across 300 real sessions, ≥3 courses. *The harness that measures it already runs.*
- **Roadmap (18 months):** secure **3 faculty pilot LOIs** → first **300 real sessions** → **publish the co-authored calibration study** → convert pilots to paid → begin own-model distillation to bend the cost curve.
- **The strategic truth:** *"The dataset is the company"* — every pilot session is a teacher-labelled data point no competitor can buy.

**Key visual:** a done/next timeline — MVP (done) → pilots → calibration study → paid conversion.
**Speaker note:** Lead with "it works," show the test count and the G1 harness — proof beats promises.

---

## Slide 11 — Technical Demo *(5 pts — bonus in prelims, required in finals)*
**Live end-to-end, in ~90 seconds.**

Demo script:
1. **Lecturer** creates an assignment (probe count, time cap, defense weight) and publishes it.
2. **Student** submits an essay → GRASP builds the Claim Graph and selects AI-fragile probes (show the fragility % per probe).
3. **Student** runs the oral defense — answer one probe **by voice**, one **by typing** — same rubric, same probes, same time cap; the evidence bundle tags each turn's input mode so the lecturer can always see which was which.
4. On finalize: **5-dimension score with its confidence interval** + the **learning-feedback report** citing the student's own words.
5. **Lecturer console:** the **cohort 2×2** → click a dot → **evidence bundle** → **one-click override** (watch the calibration dataset get written).
6. Run **`pnpm eval:calibration`** live → **GATE G1: PASS** (Pearson r, Cohen's κ, per-dimension error).

- **Fallbacks ready:** seeded demo cohort spanning all four quadrants; typed path if the mic/network fails — same rubric and time cap, no penalty for the switch.

**Speaker note:** The override click + the live G1 report are the two "wow" beats — end on the passing gate.

---

## Slide 12 — Closing *(0 pts)*
**GRASP: verify understanding, not authorship.**

- *"AI didn't break education. It broke the essay as a proxy for understanding. We're rebuilding the proxy — the way Vietnam already trusts: out loud."*
- **The empty top-right quadrant is ours to take — Vietnamese-native, curriculum-mapped, shipped first.**
- **Ask: 5 tỷ VND pre-seed → 18 months → 96K students + a published calibration study.**
- Thank you · [contact] · [QR to live demo]

---

## Overview criteria (score these too)

### Presentation style *(5 pts)*
- One idea per slide; lead every slide with its headline claim, then evidence.
- Rehearse to **≤ the time limit** with 15% buffer; assign owners per slide.
- Use the real product for the demo, not screenshots. Confidence + eye contact + one memorable line per slide.

### Q&A prep *(5 pts — finals)* — anticipated questions & crisp answers
- **"Isn't this just AI detection?"** → No — no "cheating" label exists; we output evidence for a human decision and separate *learned-with-AI* from *copied*.
- **"Can't a lecturer build this with a good prompt?"** → ~70% in 6 weeks, yes — but not calibrated, not curriculum-mapped, and they won't maintain it. Our moat is the Vietnamese teacher-labelled dataset.
- **"Why won't Turnitin crush you?"** → Detection revenue inertia, unpurchasable Vietnamese data, GDPT-2018 mapping with no global reuse, Western pricing. Execute → acquisition target, not casualty.
- **"How accurate is it?"** → We publish it: gate G1 is Pearson r > 0.7 vs blind lecturers; the harness runs today; the study is co-authored with pilot faculties.
- **"Voice recognition for Vietnamese?"** → Typed and spoken answers use the same probes, rubric, and time cap; ASR errors are tolerated by design, not silently corrected.
- **"Speaking under time pressure and typing with room to revise aren't the same condition — how are those scores comparable?"** → They're not the same production condition, and we don't claim they are — we hold the *rubric* constant, not the *psychology*. Two things are already true: the confidence interval treats voice differently (it discounts for real ASR uncertainty), and the scoring prompt explicitly instructs the model to ignore input mode as a quality signal, closing the channel where typed polish could pass as understanding. What we're honest we don't know yet is whether a residual gap remains in practice — so we built the calibration harness to split results by typed- vs. voice-majority sessions the moment pilot data has both. We'd rather measure it than assume it away.
- **"Privacy / data?"** → Audio hard-deleted 24h post-transcription; student data is never training data; PDPL alignment is a pre-pilot gate.
