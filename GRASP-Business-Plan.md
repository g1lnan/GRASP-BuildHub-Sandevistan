# GRASP — Full Business Plan
### *"Don't detect AI. Verify learning."*

**Build@Hub Hackathon 2026 · Competition Submission Master Document**
**Version 2.0** · Revised 25 July 2026

---

## What changed in v2, and why

Version 1 was advocacy. Version 2 is the version that survives a hostile question. Four structural changes, each fixing a real weakness:

| # | Change | Weakness it fixes |
|---|---|---|
| **1** | GRASP restores **vấn đáp** — a Vietnamese assessment tradition that class sizes killed — rather than introducing a new surveillance technology | "This is foreign surveillance of children." Also fixes low conceptual novelty: we are not inventing, we are restoring |
| **2** | The verification session is repositioned as a **learning intervention**, with verification as the byproduct | "It's gameable." A student who games it still did retrieval practice. **The product works anyway.** Also removes student/parent resistance |
| **3** | Beachhead moves from THPT to **universities** (thesis/capstone + high-stakes courses) | User ≠ buyer. Universities already run oral defense, already have the budget line, and a dean can sign in six weeks |
| **4** | The GRASP score becomes a **formal graded component**, not an advisory dashboard | Information products don't get budget. Assessment components get renewed |

Plus honest corrections: cost per session revised from an optimistic 1,000 VND to a realistic **3,400 VND at launch**, financials rebuilt on that basis, and the free tier redesigned as typed-only to make it affordable.

---

## How to use this document

This is the **master source**. It is longer than your deck on purpose — the deck is the tip, this is the iceberg you draw from during Q&A.

Each section is mapped to a scoring slide and contains:
- **ON-SLIDE** — the ~40 words that actually go on the slide
- **SAY** — what you speak over it
- **BACKUP** — evidence, math and reasoning held in reserve for judges

⚠️ marks assumptions you must verify or fill before presenting. Checklist in §16.

---

# Table of Contents

| # | Section | Points |
|---|---|---|
| 0 | Executive Summary | — |
| 1 | Slide 1 — Title & Introduction | 0 |
| 2 | Slide 2 — Problem & Opportunity | 5 |
| 3 | Slide 3 — Value Delivered | 5 |
| 4 | Slide 4 — System Design | 5 |
| 5 | Slide 5 — Target Market | 5 |
| 6 | Slide 6 — Marketing Strategy | 5 |
| 7 | Slide 7 — Market Analysis | 5 |
| 8 | Slide 8 — Financial Model | 5 |
| 9 | Slide 9 — Team | 5 |
| 10 | Slide 10 — Status & Roadmap | 5 |
| 11 | Slide 11 — Technical Demo | 5 (bonus in prelims) |
| 12 | Slide 12 — Closing | 0 |
| 13 | Delivery & Q&A Preparation | 10 |
| 14 | Rubric Self-Audit | — |
| 15 | Risks, Ethics & Honest Weaknesses | — |
| 16 | Pre-Presentation Checklist ⚠️ | — |
| 17 | Sources | — |

---

# 0. Executive Summary

**GRASP brings back vấn đáp.**

Vietnamese education has always had an assessment format that makes cheating structurally impossible: **thi vấn đáp** — the oral examination. You sit across from your teacher and you explain your work. No detector required. It was never abandoned because it stopped working. It was abandoned because one teacher cannot sit with 180 students.

GRASP is that conversation, at scale.

A student submits work. GRASP reads it, generates 5–8 questions grounded in **that student's specific claims**, and runs a 6–10 minute adaptive oral defense in Vietnamese. The student explains their own reasoning out loud.

**Two things happen, and the order matters.**

**First, the student learns.** Explaining your own work from memory is retrieval practice plus elaborative interrogation — among the best-evidenced learning techniques in cognitive psychology. Roediger & Karpicke (2006) established that retrieval produces substantially better long-term retention than restudying; Dunlosky et al. (2013) rated practice testing as *high utility*, above rereading, highlighting and summarising. **GRASP's core loop is a learning intervention that happens to produce assessment data.**

**Second, the teacher finds out who understood.** Product quality on one axis, understanding on the other. That 2×2 separates the three students a teacher currently cannot tell apart — including the one every AI detector currently punishes: the student who understands deeply and writes badly.

**Why this framing wins the hardest objection.** Ask "what if a student cheats the oral defense with a second phone?" — and the answer is that to fake understanding of their own submission, in Vietnamese, in real time, under adaptive follow-ups, they must read and reason about their own work out loud. **That is the learning intervention. The product worked.** We are relatively comfortable losing that arms race.

**Why AI detection is the wrong product.** Stanford HAI found seven major detectors flagged **61% of non-native English essays as AI-generated**. Turnitin's own published data admits **6–9% false positives for non-native speakers vs 1–4% for natives**. The tool the world is selling Vietnam is a tool that systematically punishes students for being Vietnamese.

**Why now.** Resolution 71-NQ/TW (22 Aug 2025) names AI a lever for restructuring education. Circular 02/2025/TT-BGDĐT mandates a Digital Competency Framework for all learners. A national high-school AI curriculum begins in the **2026–2027 school year**. ~**580 trillion VND (~USD 23.7B)** is committed to education modernisation 2026–2035. Policy says *teach students to use AI well*. Nobody built the instrument that measures whether they did.

**Go to market.** Universities first — they already run bảo vệ khóa luận, they have faculty-level budget autonomy, and a dean signs in six weeks. Then private K-12, then public THPT via teacher-led growth, then Sở GD&ĐT scale.

**Positioning that gets it bought:** GRASP is not a dashboard. It is a **graded assessment component** — a defense grade worth 20–30% of an assignment, written into the syllabus. Advisory tools get cancelled. Assessment components get renewed.

**Financials.** 1.6 tỷ VND Y1 → 162 tỷ VND (~USD 6.2M) Y5. Gross margin 61% → 84%. Break-even Q2 Year 4. **Ask: 5 tỷ VND (~USD 190K)** pre-seed for 18 months.

**Status:** pre-build, fully specified, with a 90-day plan built around a single falsifiable gate.

---

# 1. SLIDE 1 — Title & Introduction *(0 points — but it sets the room)*

### ON-SLIDE

> # GRASP
> ### Don't detect AI. Verify learning.
>
> Bringing back **vấn đáp** — at the scale of 180 students.
>
> [Team name] · Build@Hub Hackathon 2026

**Design notes:** One line of copy. Massive type. Dark background, single accent colour. No robots. No brain-with-circuit-board — every AI pitch has one and judges are numb to it.

**On the name:** *to grasp* means to understand. In Vietnamese: **nắm vững**. If pressed for an acronym: **G**enerative-era **R**easoning **A**ssessment for **S**tudent **P**roficiency — but don't put it on the slide, it weakens the tagline.

### SAY *(20 seconds — do not waste this)*

Do **not** open with "Xin chào, hôm nay nhóm em sẽ trình bày…". Open cold:

> "Every teacher in this room has graded an essay they suspected was written by ChatGPT. And every one of you had to make a decision with no evidence.
>
> Vietnamese education already solved this problem. It's called vấn đáp. You sit with the student and they explain their work — and no AI on earth can help them. We didn't abandon it because it stopped working. We abandoned it because you cannot sit with a hundred and eighty students.
>
> We built the thing that can."

Then the title slide. Then names. Total: 25 seconds.

---

# 2. SLIDE 2 — Problem & Opportunity *(5 points)*

### ON-SLIDE

> ## Teachers can no longer tell three students apart.
>
> | | Used AI | Understood? | What happens today |
> |---|---|---|---|
> | Student A | Yes | **Yes** — learned | Suspected |
> | Student B | Yes | **No** — copied | Often undetected |
> | Student C | No | **Yes** — writes poorly | **Falsely accused** |
>
> AI detectors flag **61%** of non-native English essays as AI *(Stanford HAI)*.
> Turnitin's own data: **6–9% false positives for non-native speakers** vs 1–4% native.
>
> **And banning AI is now against national policy.** Resolution 71-NQ/TW · Circular 02/2025

### SAY *(90 seconds)*

> "Three students. Student A used ChatGPT to understand a hard concept, then wrote something genuinely their own. Student B pasted an answer they cannot explain. Student C wrote every word themselves, but their expression is weak.
>
> A teacher has exactly one tool to tell them apart, and it does not work. Stanford tested seven major AI detectors — they flagged sixty-one percent of non-native English speakers' essays as AI-written. Turnitin's *own* published research admits a false-positive rate of six to nine percent for non-native speakers. Two to six times the rate for natives.
>
> Read that as a Vietnamese teacher: **the tool the world is selling us systematically punishes our students for being Vietnamese.**
>
> So ban AI. Except Vietnam decided the opposite. Resolution 71 from the Politburo, August 2025, calls AI a lever for restructuring education. Circular 02/2025 requires a digital competency framework for every learner. The national AI curriculum starts in high schools this coming school year.
>
> The country has committed to teaching students to use AI. Nobody built the instrument that measures whether they learned anything while doing it. **That gap is the opportunity.**"

⚠️ **Insert one verbatim teacher quote here.** This single addition moves three slides from "Tốt" to "Xuất sắc." See §16.

### BACKUP — The problem in four layers

**Layer 1 — The detection layer is broken, and it is broken *against us*.**

| Finding | Source |
|---|---|
| 7 major detectors flagged 61% of non-native English essays as AI | Stanford HAI, 2023 |
| Turnitin's own data: 6–9% FPR non-native vs 1–4% native | Turnitin published research |
| GPTZero: ~15% of human essays flagged in university testing | Independent university testing |
| Turnitin claimed <1% FPR; Washington Post testing produced far higher | Washington Post |

This is not a tuning problem. Detectors measure text *predictability* — and second-language writers legitimately produce more predictable text, because that is what learning a language looks like. **The failure is structural. A better model does not fix it.**

**Layer 2 — Even a perfect detector answers the wrong question.**
"Was AI used?" stopped being meaningful in a country that has mandated AI literacy. The meaningful question is "did learning occur?" — and nothing on the market measures it.

**Layer 3 — The format that solved this already exists, and it doesn't scale.**
Vietnam has vấn đáp. Universities still run bảo vệ khóa luận. It is culturally legitimate, pedagogically superior, and cheat-proof by construction. It is also economically impossible at 180 students per teacher — which is the only reason it retreated to final-year theses. **The problem is not that we lack a solution. The problem is that our solution costs a teacher-hour per student.**

**Layer 4 — The trust layer.**
When grades stop being credible, the signal degrades everywhere: admissions, scholarships, employers. Resolution 71 targets five Vietnamese universities in the global top 100 by 2045. That requires assessment the world trusts.

### BACKUP — The opportunity, stated as a wedge

The market has spent three years and hundreds of millions trying to answer **"Was this written by AI?"**

We answer **"Can this student explain their own work?"** — a question that is:
- **Permanently valuable.** Worth answering before ChatGPT and after AGI.
- **Culturally native.** Not a new idea imposed on Vietnamese education. An old Vietnamese idea we can finally afford again.
- **Adversarially robust.** You cannot fake an explanation of your own submission under adaptive questioning without acquiring the understanding — and acquiring it *is the goal*.
- **Policy-aligned.** Detection fights Vietnamese policy. Verification implements it.

**One-sentence problem statement:**
> *Vietnam mandated that students learn to use AI, but gave teachers no way to tell whether they learned anything — and the only tools available systematically penalise Vietnamese students for writing like Vietnamese students. The format that would solve it, vấn đáp, has been economically impossible since class sizes passed thirty.*

---

# 3. SLIDE 3 — Value Delivered *(5 points)*

**This is your money slide. Give it the whole screen. And lead with learning, not with catching.**

### ON-SLIDE

> ## First it teaches. Then it tells you who learned.
>
> **Explaining your own work from memory is retrieval practice + elaborative interrogation —
> among the best-evidenced learning techniques in cognitive psychology.**
> *Roediger & Karpicke 2006 · Dunlosky et al. 2013 (practice testing: high utility)*
>
> ```
>                   UNDERSTANDING (GRASP score)
>                         HIGH
>         ┌─────────────────┼─────────────────┐
>         │  EXPRESSION GAP │    MASTERY      │
>         │  Knows it.      │  Used AI well.  │
>    LOW  │  Can't write it.│  Genuinely      │  HIGH
> PRODUCT │  → Teach writing│  learned.       │ PRODUCT
> QUALITY │    Don't punish │  → Reward       │ QUALITY
>         ├─────────────────┼─────────────────┤
>         │ NEEDS SUPPORT   │    HOLLOW       │
>         │ Genuine struggle│  Perfect essay. │
>         │ → Intervene     │  No understanding│
>         │   early         │  → Intervene    │
>         └─────────────────┴─────────────────┘
>                         LOW
> ```
> **Grade the work. Know the student. Two axes, for the first time.**

### SAY *(90 seconds)*

> "I want to be careful about the order here, because it's the most important thing I'll say.
>
> **GRASP is a learning tool first.** When a student explains their own work out loud from memory, that is retrieval practice combined with elaborative interrogation — two of the most strongly evidenced techniques in all of cognitive psychology. Roediger and Karpicke showed retrieval beats restudying for long-term retention. Dunlosky's review rated practice testing as high utility, above rereading, highlighting, and summarising — the three things students actually do.
>
> So before GRASP tells a teacher anything, it has already made the student learn more. Six minutes of explaining your own essay is worth more than an hour of rereading it.
>
> **The assessment is the byproduct.** And it's this picture.
>
> Bottom right — a beautiful essay from someone who understands nothing. Invisible today. Visible in six minutes.
>
> Top left is the one I care about more. This student understands deeply and expresses badly. Every AI detector on the market flags them as a cheat, and they are the *most Vietnamese student on this chart*. GRASP is the only tool that clears their name.
>
> Top right — used AI, learned anyway. Under Resolution 71, that student did exactly what the country asked. Today they get suspicion. GRASP gets them credit.
>
> Same class, same assignment, four completely different teaching actions. **That is the value.**"

### BACKUP — Why learning-first is a strategic position, not a softer pitch

This reframe does four jobs at once. Understand all four before you present it:

1. **It disarms the gameability objection permanently.** If a student games the session with a second device, they still had to read their own submission, reason about it, and articulate it under time pressure. That is the intervention. **The product succeeded even when the verification failed.** No detection product can say this.
2. **It removes student and parent resistance.** "A tool that catches my child" gets fought. "A tool that makes my child explain their work, which is how learning consolidates" gets welcomed. Same product.
3. **It gives the principal a non-conflict reason to buy.** Administrators avoid tools that generate parent disputes. Learning outcomes are safe to champion.
4. **It makes the product valuable even at imperfect accuracy.** If our score correlates at 0.7 rather than 0.9 with teacher judgment, a pure verification product is compromised. A learning product is not.

**The line to repeat until judges remember it:**
> **AI detection asks "did you cheat?" GRASP asks "can you explain this?" One creates conflict. The other creates learning — and answers the first question as a side effect.**

### BACKUP — Value quantified, per stakeholder

**For the student (lead with this — it's the strongest and least expected)**
- **Learning gain.** Retrieval practice on their own work, on every major assignment, all year.
- Due process: no student is accused by an algorithm. Every output is evidence for a human decision, with an appeal path.
- The Expression Gap student finally gets a fair reading.
- A longitudinal **Understanding Portfolio** — what they can actually explain. A far better artifact for university and scholarship applications than a transcript of grades.
- The incentive flips *before* submission: "I will have to explain this."

**For the teacher**
| Today | With GRASP |
|---|---|
| 4–6 hrs grading 45 essays, still guessing | Same grading, plus a triaged 2×2 |
| Must read every paper for signs of AI | Read closely only the ~15% in Hollow |
| Accusation with no evidence → parent conflict | Evidence bundle: transcript, probes, rationale |
| No visibility into *why* a student struggles | Concept-level understanding map |

⚠️ **Do not present a time-saving percentage as fact.** Say: "our pilot hypothesis is a meaningful reduction in integrity-investigation time; we will publish the measured number."

**For the university / school**
- A **graded assessment component** that is defensible under accreditation review.
- Auditable compliance evidence for **Circular 02/2025**.
- Cohort analytics: which concepts are hollow across the whole cohort.
- For universities specifically: **defense-quality assessment in every course**, not just final-year theses.

**For Vietnam**
- The measurement layer that makes Resolution 71's AI-literacy ambition verifiable rather than aspirational.
- A homegrown assessment standard, with Vietnamese data staying in Vietnam.

---

# 4. SLIDE 4 — System Design *(5 points)*

### ON-SLIDE

```
 ┌───────────┐   ┌────────────────┐   ┌────────────────┐   ┌──────────────┐
 │  INGEST   │──▶│  CLAIM GRAPH   │──▶│     PROBE      │──▶│  VẤN ĐÁP     │
 │ LMS/file/ │   │ Decompose into │   │   GENERATOR    │   │   SESSION    │
 │ GRASP Docs│   │ claims + steps │   │ AI-fragile,    │   │ Voice, VN,   │
 │           │   │ → GDPT 2018    │   │ Bloom-tagged   │   │ adaptive,    │
 └───────────┘   └────────────────┘   └────────────────┘   │ 6–10 min     │
                                                            └──────┬───────┘
                                            ┌───────────────────────┤
                                            ▼                       ▼
 ┌────────────────┐   ┌──────────────────┐ ┌──────────────┐  ┌─────────────┐
 │ TEACHER CONSOLE│◀──│ UNDERSTANDING    │◀│ 5-DIMENSION  │  │  LEARNING   │
 │ 2×2 · evidence │   │ GRAPH (longitud- │ │   SCORER     │  │  FEEDBACK   │
 │ override→label │   │ inal concepts)   │ │ + confidence │  │ to student  │
 └───────┬────────┘   └──────────────────┘ └──────────────┘  └─────────────┘
         └──── human labels ──────▶ MODEL FLYWHEEL ──▶ back to Scorer
```

> **Every score is evidence, not a verdict. The teacher always decides.**
> **Every session returns learning feedback to the student — even when nobody is grading.**

### SAY *(90 seconds — where technical judges decide if you're serious)*

> "Four stages.
>
> **One — we decompose the submission into a Claim Graph.** Not a similarity score: a structured map of every claim the student made, every reasoning step, every piece of evidence they cited, mapped to Chương trình GDPT 2018 competency codes. For code, every function and design decision. For maths, every step.
>
> **Two — the Probe Generator.** For each node we generate questions that are *AI-fragile*: counterfactuals, 'why not the alternative', 'apply this to a case you've never seen', 'defend this against this objection'. You cannot answer these from a copied artifact, but anyone who genuinely understood answers them easily. Each probe is Bloom-tagged.
>
> **Three — the vấn đáp session.** Six to ten minutes, voice-first, in Vietnamese, adaptive: shallow answer, drill down; strong answer, escalate. The questions quote the student's own text back at them — *'in your third paragraph you wrote X; what happens if we change Y?'*
>
> **Four — two outputs, not one.** The teacher gets a score across five dimensions with a confidence interval. **And the student gets learning feedback** — what they explained well, what they couldn't, what to revisit. That second output is why this runs even in courses where nobody is grading it.
>
> And the loop: **every time a teacher overrides our score, that's a labelled Vietnamese teacher judgment.** Nobody else is collecting that dataset."

### BACKUP — Component detail

**1. Ingest**
- Connectors: Moodle, Google Classroom, Microsoft Teams for Education, K12Online; file upload (docx/pdf/ipynb/code repos)
- **GRASP Docs** (optional): a lightweight writing surface capturing *process telemetry* — revision history, paste events, time-on-task. **Optional by design**: process evidence is a bonus signal, never a requirement, because requiring it excludes students on shared or low-end devices.
- Integration-first. We never ask an institution to abandon Moodle or Azota. We sit on top.

**2. Claim Graph — the core technical work**
Converts an unstructured artifact into `{claims, reasoning_edges, evidence_links, assumptions, subject_concepts}`, each node mapped to **Chương trình GDPT 2018** competency codes and Circular 02/2025 digital competency areas. Deep, unglamorous, local work.

**3. Probe Generator — designed around AI-fragility**

| Probe type | Why an artifact-copier fails it | Bloom level |
|---|---|---|
| Counterfactual | Requires a causal model, not text | Analyse |
| Road-not-taken ("why not X?") | Requires knowing what you rejected | Evaluate |
| Novel transfer | New case, unseen by the source AI | Apply |
| Self-critique ("what's weakest here?") | Requires ownership of the argument | Evaluate |
| Metacognitive ("what confused you?") | Copiers have no confusion to report | Reflect |
| Trace-your-own-step | Quotes their exact text back at them | Understand |

The last is the quiet killer: probes are grounded in the student's *own sentences*, so an external AI has no context unless the student pastes the whole submission back in — which costs time we measure.

**Our internal gate:** fewer than 25% of generated probes should be answerable by a frontier model that has *not* seen the source submission. We test this every release.

**4. Vấn đáp Session Runtime**
- Voice-first (Vietnamese ASR); **typed fallback always available** — accessibility, noisy homes, students who stammer, low-bandwidth.
- Adaptive branching, ~8-second expected-response window; latency profiles recorded as *signal*, never as accusation.
- Hard-capped 6–10 minutes. This is formative, not an exam.
- Integrity layer deliberately **light**: window-focus, paste events, latency distribution, voice consistency. High-stakes mode (institution device, in-room, optional camera) is opt-in per assignment.

**5. Five-Dimension Understanding Scorer**

| Dimension | Question it answers |
|---|---|
| Recall | Can they state what they claimed? |
| Explanation | Can they explain *why* in their own words? |
| Application / Transfer | Can they use it on a novel case? |
| Critical Evaluation | Can they judge limits, alternatives, weaknesses? |
| Metacognition | Do they know what they don't know? |

Calibrated against teacher-labelled ground truth per subject and level. **We report confidence intervals, not verdicts.** "4.1 ± 0.6, low confidence — recommend follow-up" is an honest output and far more defensible than a number.

**6. Learning Feedback Engine — the output that makes it run without a grader**
After every session the student receives: which claims they explained fluently, which they could not defend, the specific concepts to revisit, and a suggested re-attempt. This is why GRASP has value in a course where nobody is checking for AI — and it is what makes the free tier worth using.

**7. Model strategy (cost is a design constraint)**
- **Claude Sonnet 5** — Claim Graph construction and final scoring, where reasoning quality determines whether a teacher trusts us.
- **Claude Haiku 4.5** — high-volume paths: probe ranking, follow-up selection, transcript cleanup, and the entire typed-only free tier.
- **Self-hosted distilled Vietnamese model** — from Year 2, trained on flywheel data, for the highest-volume paths.
- **Vietnamese ASR** — fine-tuned Whisper/PhoWhisper-class, adapted per subject vocabulary and regional accent. We tolerate 8–12% WER by design because scoring operates on semantic content.

**8. Trust & Governance — put this ON the slide**
- Every output is **evidence, not verdict**. There is no "cheating" label anywhere in the UI. Ever.
- Full audit trail: submission + probes + transcript + score + rationale, exportable.
- Student appeal flow in v1.
- One-click teacher override — and the override is the training signal.
- Data residency in Vietnam. Compliance with **Decree 13/2023/NĐ-CP** and Vietnam's Personal Data Protection Law. ⚠️ *Verify current PDP Law status before presenting — §16.*
- Voice recordings deleted after transcription unless the institution opts to retain for appeals. Training on student data requires institution-level opt-in and de-identification.

### BACKUP — Honest defensibility *(read this before Q&A — v1 overclaimed here)*

**What is NOT a moat:**
- The core loop. A competent team ships a 70%-as-good version in about six weeks with a good prompt and a frontier model. Say this out loud if challenged — pretending otherwise is how you lose credibility.
- "We use AI." Everyone uses AI.

**What actually compounds, in order of strength:**

1. **Calibration data.** Teacher-labelled judgments of Vietnamese student understanding, by subject and level. Not purchasable. Slow to build — which is why the 90-day plan is built around collecting it rather than around building features.
2. **Curriculum mapping.** GDPT 2018 competency codes and Circular 02/2025 alignment. No global reuse, so no global competitor will do it well.
3. **Institutional embedding.** Once a GRASP defense grade is written into a course syllabus and an accreditation file, switching cost is a curriculum revision cycle. **This is the strongest one, and it is the entire reason for change #4.**
4. **Cost curve.** Our per-session cost determines which market segments we can serve profitably (see §8). Getting to 1,300 VND/session buys access to public K-12 — a segment nobody serving it at Western cost structures can enter.

**Be honest about the timeline:** none of these are moats in Year 1. In Year 1 our only advantage is speed and focus. Say that.

---

# 5. SLIDE 5 — Target Market *(5 points)*

### ON-SLIDE

> ## We start where vấn đáp already exists — and already costs too much.
>
> **Beachhead: Vietnamese universities.** They already run bảo vệ khóa luận. The norm exists,
> the budget line exists, and a faculty dean signs in six weeks.
>
> | Phase | Segment | Students | Why them | ASP (VND/yr) |
> |---|---|---|---|---|
> | **Y1** | University — thesis/capstone | ~0.5M | Oral defense is already mandatory & expensive | 180,000 |
> | **Y1–2** | University — coursework | 2.3M | Faculty budget autonomy, 6-week cycles | 89,000 |
> | **Y2** | Private / international K-12 | 0.4M | Willingness to pay, decisions in weeks | 145,000 |
> | **Y3** | Public THPT | 3.0M | Volume — but needs our cost curve first | 39,000 |
> | **Y4** | Public THCS (grades 8–9) via Sở GD&ĐT | 3.5M | Scale | 30,000 |
>
> **Vietnam: ~25.6M students · 1.25M teachers · ~53,000 schools · ~400 universities**

⚠️ *Segment counts are estimates derived from national totals (~25.6M students, 2023–24). Verify against GSO / MoET.*

### SAY *(75 seconds)*

> "We are not going after twenty-five million students on day one. We start where the format we're automating **already exists**.
>
> Every Vietnamese university already runs bảo vệ khóa luận — thesis defense. It is mandatory, it is respected, and it is enormously expensive: a committee of three or four lecturers, per student, for thirty minutes. Universities are not sceptical about oral defense. **They already believe in it. They just can't afford it below final year.**
>
> That makes them the easiest sale in Vietnamese education for this specific product. There is a budget line. There is an academic committee that already approves defense formats. And a faculty dean can sign a purchase order this quarter without waiting for a ministry decision.
>
> So Year One is universities: thesis mode first, then coursework. Year Two adds private and international schools — small volume, high willingness to pay, decisions in weeks.
>
> Public high schools come in Year Three, and I want to be explicit about why not sooner. It is not a sales problem. **It is a cost problem.** At thirty-nine thousand đồng per student per year, public K-12 is barely gross-margin-positive until our cost per session drops below about fifteen hundred đồng. Universities fund the cost curve that makes public education viable. That sequencing is deliberate — I'll show you the numbers on slide eight."

### BACKUP — Ideal Customer Profile, precisely

**Primary economic buyer — Faculty Dean / Vice-Dean for Academic Affairs, university in HCMC or Hanoi**
- Cares about: accreditation, thesis integrity, graduate employability, lecturer workload
- Budget: faculty-level; decision cycle 6–10 weeks; can run a paid pilot without central approval
- Pain, in their words: "We cannot defend the integrity of coursework grades any more, and our thesis committees are exhausted."
- Killer argument: **"Defense-quality assessment in every course, not just the final year — at a fraction of a committee's cost."**

**Primary user — "Thầy Minh", university lecturer, 41, teaching 3 courses × 90 students**
- Assigns 4 major written pieces per course per semester
- Already suspects a meaningful share are AI-generated; has stopped assigning some formats entirely
- Adoption trigger: a colleague shows him a GRASP session transcript from his own subject

**Secondary user — "Cô Hương", THPT Literature teacher, 34, Hanoi (Year 3 motion)**
- 185 students across 4 classes; 6 major written pieces/year
- Already uses Azota or SHub; active in 3–5 Facebook teacher groups and a school Zalo group
- Zero budget authority — but she is who makes the principal buy

**Why we deliberately do NOT start elsewhere:**
- **Primary school** — short assignments, low AI pressure, oral defense developmentally inappropriate under 11.
- **Public THPT in Year 1** — the pain is real but the buyer has no budget and our cost per session doesn't clear the price point yet. Entering early would produce unprofitable revenue and a bad reference class.
- **Rural low-connectivity schools** — the UNESCO Readiness Assessment specifically flags urban/rural infrastructure gaps. We would fail them at launch. Low-bandwidth/offline mode is a committed **Year 3** deliverable, with typed-input parity from day one. **Say this out loud — judges reward honest exclusion.**
- **Corporate L&D** — real market, different sale, different product surface. Year 4+.

### BACKUP — Geographic sequencing

| Phase | Geography | Rationale |
|---|---|---|
| Y1 | HCMC, Hanoi universities | Device penetration, faculty budgets, decision speed |
| Y2 | + Đà Nẵng, Huế, Cần Thơ; national private K-12 | Tier-1.5 university clusters |
| Y3 | Public THPT in tier-1/1.5 cities | Cost curve now supports the price point |
| Y4 | Sở GD&ĐT tenders, national | Case studies + Resolution 71 alignment |
| Y4–5 | Indonesia, Philippines, Thailand | Same problem, same non-native-English penalty, larger cohorts |

---

# 6. SLIDE 6 — Marketing Strategy *(5 points)*

### ON-SLIDE

> ## Sell the learning outcome. The integrity outcome sells itself.
>
> **1. Faculty pilot motion** — one department, one semester, published results. Deans buy from deans.
> **2. The Defense Committee ROI case** — what a thesis committee costs vs. what GRASP costs.
> **3. Academic publication** — co-author the calibration study *with* pilot faculties. Credibility is the product.
> **4. Teacher-training universities** — every graduate we train is a future K-12 account.
> **5. Zalo + Facebook teacher communities** *(Y3, K-12 motion)* — Azota reached 300,000+ teachers this way.
> **6. "Điểm 10 có thật không?"** — public campaign: submit your best A+ essay, hear it defended.
>
> **Loop:** lecturer pilots → students report learning gain → department adopts → dean references peer dean.

### SAY *(90 seconds)*

> "Our marketing has to do one thing above all: **not trigger the immune response.** A product marketed as 'catch cheating students' gets fought by students, by parents, and quietly by administrators who don't want the conflict. So we don't market that.
>
> We market the learning outcome. *Your students will explain their work out loud, which is the most effective revision they will ever do.* That is true, it's well evidenced, and nobody objects to it. The integrity benefit sells itself the first time a dean sees the 2×2.
>
> Channel one is the faculty pilot. One department, one semester, real numbers, published. In higher education, deans buy from deans — a peer-reviewed result from a named Vietnamese university is worth more than any advertising we could buy.
>
> Channel two is a spreadsheet, and it's the most boring slide we own and the one that closes deals: what a thesis defense committee actually costs per student, against what GRASP costs. Universities already spend this money. We are not asking for new budget.
>
> Channel three is the one I'd defend hardest: **we co-author the calibration study with our pilot faculties.** They become invested in the result. It gives us academic credibility no competitor can buy. And in assessment, credibility *is* the product.
>
> Then in Year Three, when the cost curve opens up public schools, we run the Azota playbook — Vietnamese edtech is not sold through advertising, it's sold in Zalo groups — with a campaign called *Điểm 10 có thật không?* Is that A+ real? Submit your best work and hear it defended."

### BACKUP — Channel economics, ranked

| Channel | Est. CAC | Payback | Y1 mix | Notes |
|---|---|---|---|---|
| Faculty pilot → paid conversion | ~90M VND | ~5 mo | 55% | Long cycle, high ACV, very sticky |
| Dean-to-dean referral | ~35M VND | ~2 mo | 20% | Compounds after 3–4 references |
| Academic publication / conference | ~60M VND | 8 mo+ | 10% | Slow, but builds the category |
| Private K-12 direct | ~25M VND | ~3 mo | 15% | Fast decisions, good margins |
| Teacher community (K-12) | ~4M VND | <2 mo | 0% Y1 | Y3 motion, near-zero marginal cost |
| Sở GD&ĐT tender | very high | 12mo+ | 0% Y1 | Y4; needs case studies first |

### BACKUP — Message architecture by audience

| Audience | Lead with | Never lead with | Proof point |
|---|---|---|---|
| Dean | "Defense-quality assessment in every course" | "Catch cheating" | Committee-cost ROI model |
| Lecturer | "Your students will actually revise" | "Surveillance" | Session transcript in their subject |
| Student | "Prove you did the work — and remember it" | "Verification" | Expression Gap story |
| Parent | "Your child explains their work out loud" | "AI detection" | Learning-science citations |
| Principal (K-12) | "Documented Circular 02/2025 compliance" | "Parent disputes" | Compliance export |
| MoET / Sở | "The measurement layer for Resolution 71" | — | Policy mapping doc |
| Investor | "Category creation, institutional embedding" | "Data moat" | §4 honest defensibility |

### BACKUP — Launch calendar, first 12 months

| Month | Action |
|---|---|
| 1–2 | Secure 3 faculty pilot LOIs; recruit lecturer advisory group |
| 3–4 | Grade-appropriate vertical live; first 300 real sessions with pilot faculties |
| 5 | Calibration results in hand; convert first 2 faculties to paid |
| 6 | Publish calibration study (co-authored); present at first academic conference |
| 7–8 | Thesis-defense mode live for the graduation cycle; private K-12 outbound begins |
| 9–10 | Dean referral programme; 2nd-tier city universities |
| 11–12 | Free typed-only tier public (seeds the Y3 K-12 motion); Sở GD&ĐT conversations open |

### BACKUP — Metrics we are judged on internally

- **Pilot → paid conversion:** % of faculty pilots that convert within one semester. Target 40%.
- **Session completion:** % of started sessions finished. Target >85% (below this, the UX is wrong).
- **Student-reported learning value:** target >4.0/5. *This is our leading indicator — if students don't feel it teaches them, changes #2 and #4 both collapse.*
- **Score–teacher agreement:** correlation with blind teacher scoring. Gate: r > 0.7.
- **Teacher NPS** target >50 · **Student fairness-perception** target >4.0/5.
- **Net revenue retention** target >110% by Y3 (expansion within institutions).

---

# 7. SLIDE 7 — Market Analysis *(5 points)*

### ON-SLIDE

> ## A category nobody owns — because everyone is still building detectors.
>
> **TAM** — global assessment integrity & learning verification: **~USD 2.4B by 2030**
> **SAM** — SEA formal education at local pricing: **~USD 250M/yr**
> **SOM** — Vietnam + early SEA, 5-year: **~USD 6.2M ARR** (2.2M verified students)
>
> Vietnam edtech: **USD 1.08B (2024) → USD 3.70B (2034), 13.1% CAGR.**
>
> ```
>            VIETNAMESE-NATIVE
>                   ▲
>      Azota │      │  ★ GRASP
>      SHub  │      │
>   K12Online│      │
>   ─────────┼──────┼─────────▶ VERIFY UNDERSTANDING
>   DETECT   │      │
>   Turnitin │      │  Turnitin Clarity
>   GPTZero  │      │  Brisk · MagicSchool
>                   ▼
>            ENGLISH / GLOBAL
> ```
> **The top-right quadrant is empty.**

### SAY *(90 seconds)*

> "Three numbers, built bottom-up, not scraped from a report.
>
> Vietnam's edtech market was 1.08 billion dollars in 2024, heading to 3.7 billion by 2034 at thirteen percent compound growth.
>
> Our serviceable market is not twenty-five million students. It's the nine million in university, private schools, and upper secondary — where assessment is genuinely written work. At our pricing that's about twenty-two million dollars a year in Vietnam, and about two hundred fifty million across Southeast Asia at local pricing.
>
> I'll be straight with you about two things.
>
> **First: Vietnam alone is not big enough to build a category-defining company in.** That is *why* Southeast Asia is in the Year Four plan as a requirement, not a nice-to-have. Indonesia, the Philippines and Thailand have the identical problem and the identical non-native-English penalty. Vietnam is where we win the product. The region is where we win the business.
>
> **Second: the idea of AI-assisted oral defense is not novel, and I'm not going to pretend it is.** It has been the most-discussed proposed answer to AI in education since 2023. Turnitin is walking toward it. What is unclaimed is the execution: Vietnamese-native, curriculum-mapped, priced for Vietnamese budgets, and embedded as a graded component rather than sold as a dashboard. **We cannot win on the idea. We intend to win on being the ones who actually shipped it here first.**
>
> That's the competitive map. Turnitin and GPTZero, bottom-left — detection, English-first. Azota and SHub, top-left — Vietnamese-native, but they distribute and grade work, they don't verify understanding. Turnitin Clarity is moving right but it's English-first, higher-education-first, and priced for Western institutions. **The top-right quadrant is empty.**"

### BACKUP — Bottom-up SAM math

| Segment | Students | ASP (VND/yr) | Segment value |
|---|---|---|---|
| University — coursework | 2.3M | 89,000 | 205 tỷ VND |
| University — thesis/capstone *(subset of above)* | 0.5M | +180,000 | 90 tỷ VND |
| Private / international K-12 | 0.4M | 145,000 | 58 tỷ VND |
| Public THPT | 3.0M | 39,000 | 117 tỷ VND |
| Public THCS grades 8–9 | 3.5M | 30,000 | 105 tỷ VND |
| **Vietnam SAM** | **~9.2M unique** | | **~575 tỷ VND ≈ USD 22.1M/yr** |

*Thesis mode overlaps with coursework students — it is an uplift on the same head, not an additional head.*

Applying Vietnam-adjusted pricing across SEA (Indonesia 60M+ students, Philippines 27M+, Thailand 13M+, Malaysia 5M+) → **SAM ≈ USD 250M/yr**.

### BACKUP — Competitive analysis, honest

| Competitor | What they do | Their strength | Why we win — and where we don't |
|---|---|---|---|
| **Turnitin (+ Clarity)** | Similarity, AI detection, AI-use transparency | Global brand, institutional lock-in, real distribution | Revenue anchored to detection; English/HE-first; pricing 20–50× Vietnamese willingness-to-pay. **But they could enter. Our answer is speed and local embedding, not a technical moat** |
| **GPTZero / Copyleaks** | Standalone AI detection | Cheap, instant adoption | Documented ~7.7–15% false-positive rates; answering the wrong question |
| **Azota** | Exam/homework digitisation, 300,000+ teachers | Enormous Vietnamese teacher distribution | Delivery layer, not verification. **Integration partner, not competitor** — we make their grading meaningful |
| **SHub Classroom** | LMS, quizzes, question bank | Strong Vietnamese K-12 presence | Same: distribution layer. Partner or coexist |
| **K12Online (Viettel)** | State-adjacent LMS | Government channel | Infrastructure, not pedagogy. Potential channel partner |
| **Brisk / MagicSchool / Packback** | Teacher AI assistants, process visibility | Fast-moving, well-funded | US/English-first; no Vietnamese curriculum mapping; teacher-productivity positioning |
| **A well-prompted frontier model** | A lecturer building it themselves | Free, available today | **This is a real competitor and we should say so.** Our answer: calibration, curriculum mapping, and the fact that a lecturer will not maintain it. But a determined department could |
| **Doing nothing / manual vấn đáp** | Oral exams by hand | Free, trusted, culturally established | Does not scale past ~30 students. **This is our largest competitor by market share** |

**"Why won't Turnitin just build this?"** — They might. Honest answer: (1) their revenue is anchored to detection and cannibalising it is slow; (2) the calibration data is Vietnamese and unpurchasable; (3) GDPT 2018 curriculum mapping has no global reuse; (4) they enter at Western prices into Vietnamese budgets. If we execute, we are more likely an acquisition target than a casualty. **If we're slow, we're neither.**

### BACKUP — Why now (the timing stack)

| Date | Event | What it unlocks |
|---|---|---|
| Jan 2025 | **Circular 02/2025/TT-BGDĐT** — Digital Competency Framework | A compliance requirement we are the evidence for |
| Aug 2025 | **Resolution 71-NQ/TW** — AI as lever for education restructuring | Political cover; banning AI is off the table |
| Oct 2025 | **UNESCO Vietnam AI Readiness Assessment** | Independent validation of teacher-preparation and infrastructure gaps |
| 2026–2027 | National **AI curriculum for high schools** begins | A wave of AI use arriving *now* that needs measuring |
| 2026–2035 | ~**580 trillion VND** education modernisation | Budget exists |

> "Two years ago this product was against the spirit of school policy — AI was being banned. Two years from now it will be table stakes. The window is now."

---

# 8. SLIDE 8 — Financial Model *(5 points)*

### ON-SLIDE

> ## Universities fund the cost curve that opens public education.
>
> | | Y1 | Y2 | Y3 | Y4 | Y5 |
> |---|---|---|---|---|---|
> | Verified students (paid) | 18K | 96K | 368K | 985K | 2.20M |
> | **Revenue (tỷ VND)** | **1.58** | **10.0** | **35.5** | **82.0** | **162.0** |
> | ≈ USD | 61K | 385K | 1.37M | 3.15M | 6.23M |
> | Cost / session (VND) | 3,400 | 2,800 | 1,900 | 1,500 | 1,250 |
> | Gross margin | 61% | 76% | 82% | 83% | 84% |
> | EBITDA margin | −154% | −31% | −10% | **+11%** | **+26%** |
>
> **University LTV/CAC 9.2× · payback 4.6 mo · break-even Q2 Year 4**
> **Ask: 5 tỷ VND (~USD 190K) pre-seed → 18 months → 96K students**

### SAY *(90 seconds)*

> "Start with the number that drives every decision in this plan: **a verification session costs us about thirty-four hundred đồng today.** Voice, adaptive turns, Vietnamese speech, scoring. That is the honest number — an earlier version of this model said a thousand, and it was wrong.
>
> That single number determines our entire sequencing. A university student at eighty-nine thousand đồng a year runs eight sessions — twenty-seven thousand of cost, sixty-nine percent gross margin. Good business today.
>
> **A public high school student at thirty-nine thousand runs ten sessions — thirty-four thousand of cost. Thirteen percent gross margin. That is not a business.** Not until our cost per session drops below about fifteen hundred đồng, which happens in Year Three when we distil our own Vietnamese models on our own data.
>
> So this is not a plan where we chase the biggest market first. **Universities fund the cost curve that makes public education viable.** By Year Four the same student costs us fifteen hundred đồng instead of thirty-four hundred, and thirty-nine thousand đồng becomes a sixty-four percent margin. That's when we go to the Sở.
>
> Unit economics on our beachhead: a university faculty of thirty-five hundred students is about three hundred eleven million đồng a year. Fully-loaded acquisition — six-month cycle, pilot support, integration — about ninety million. Payback under five months, LTV to CAC of nine times, because universities almost never switch.
>
> We break even in the second quarter of Year Four. We're asking for five billion đồng, about a hundred ninety thousand dollars, for eighteen months — which takes us to ninety-six thousand verified students and ten billion in ARR."

### BACKUP — Pricing

| Tier | Price | Includes |
|---|---|---|
| **Teacher Free** | 0 VND | 10 **typed-only** verifications/month, Haiku-class, basic feedback |
| **Lecturer Pro** | 149,000 VND/mo | Unlimited voice sessions, custom rubrics, LMS sync |
| **University — coursework** | 89,000 VND/student/yr | All lecturers, LMS/SSO integration, cohort analytics |
| **University — thesis/defense mode** | +180,000 VND/final-year student | Extended sessions, committee report pack, accreditation export |
| **Private / international K-12** | 145,000 VND/student/yr | Full platform, parent portal |
| **Public THPT** *(from Y3)* | 39,000 VND/student/yr | Min 500 students; compliance export |
| **Sở GD&ĐT / District** *(from Y4)* | ~25,000 VND/student/yr | 50,000+ students, on-prem option, data residency |

**Why the free tier is typed-only:** at 3,400 VND per voice session, an unlimited free tier is financially fatal. Typed-only on a Haiku-class model costs ~900 VND. This is a deliberate product decision that makes voice the natural upsell — and it keeps the free tier honest rather than a bait we withdraw later.

### BACKUP — Unit economics, per session *(the number to know cold)*

| Cost line | Y1 (launch) | Y3 (at scale) |
|---|---|---|
| Claim Graph construction (Sonnet-class) | ~600 VND | ~250 VND |
| Probe generation + ranking | ~400 VND | ~150 VND |
| Vietnamese ASR (6–8 min audio) | ~700 VND | ~380 VND |
| Adaptive turn management (3–5 LLM turns) | ~900 VND | ~600 VND |
| Scoring pass + rationale | ~500 VND | ~320 VND |
| Infra, storage, bandwidth, retries | ~300 VND | ~200 VND |
| **Total / voice session** | **~3,400 VND** | **~1,900 VND** |
| Typed-only session (free tier) | ~900 VND | ~450 VND |

**Segment margin at each cost point — this is the slide-8 argument in one table:**

| Segment | ASP | Sessions/yr | COGS @3,400 | GM | COGS @1,500 | GM |
|---|---|---|---|---|---|---|
| University coursework | 89,000 | 8 | 27,200 | **69%** | 12,000 | 87% |
| Thesis mode | 269,000 | 4 (extended ×2) | 27,200 | **90%** | 12,000 | 96% |
| Private K-12 | 145,000 | 10 | 34,000 | **77%** | 15,000 | 90% |
| **Public THPT** | **39,000** | **10** | **34,000** | **13%** ❌ | **15,000** | **62%** ✅ |

> **The public-education market is not blocked by willingness to pay. It is blocked by our cost per session. That is an engineering problem with a known solution, and solving it is what Years 1–3 are for.**

### BACKUP — Full 5-year P&L (tỷ VND)

| Line | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---|---|---|---|---|
| Institution subscriptions | 1.26 | 8.26 | 28.7 | 61.1 | 114.4 |
| Lecturer Pro | 0.32 | 1.30 | 4.20 | 11.5 | 24.0 |
| Analytics / API / PD | 0.00 | 0.44 | 2.60 | 9.40 | 23.6 |
| **Total revenue** | **1.58** | **10.00** | **35.50** | **82.00** | **162.00** |
| COGS | 0.61 | 2.44 | 6.29 | 13.66 | 26.35 |
| **Gross profit** | **0.97** | **7.56** | **29.21** | **68.34** | **135.65** |
| Gross margin | 61% | 76% | 82% | 83% | 84% |
| R&D / engineering | 1.70 | 5.20 | 13.50 | 25.00 | 40.00 |
| Sales & marketing | 1.05 | 3.90 | 14.00 | 26.00 | 42.00 |
| G&A | 0.65 | 1.60 | 5.20 | 8.00 | 12.00 |
| **Total opex** | **3.40** | **10.70** | **32.70** | **59.00** | **94.00** |
| **EBITDA** | **−2.43** | **−3.14** | **−3.49** | **+9.34** | **+41.65** |
| EBITDA margin | −154% | −31% | −10% | +11% | +26% |
| Headcount (EOY) | 6 | 15 | 36 | 70 | 108 |

*Every column reconciles: revenue − COGS = gross profit; gross profit − opex = EBITDA; subscriptions = students × blended ASP (70K / 86K / 78K / 62K / 52K VND — declining as public K-12 enters the mix). Recompute the moment you change an assumption; a judge who finds a broken sum discounts the whole slide.*

### BACKUP — Unit economics, per account

| | University faculty | Private K-12 school |
|---|---|---|
| Students | 3,500 | 800 |
| ACV | 311.5M VND | 116.0M VND |
| Fully-loaded CAC | 90M VND | 25M VND |
| Gross margin | 76% | 77% |
| CAC payback | **4.6 months** | **3.4 months** |
| Avg account life (assumed) | 3.5 yrs | 4 yrs |
| LTV | 828M VND | 357M VND |
| **LTV / CAC** | **9.2×** | **14.3×** |

⚠️ *Account life is assumed, not observed. Universities are structurally sticky — a defense grade written into a syllabus survives a procurement review — but we have no retention data yet. Present these as modelled, not measured.*

### BACKUP — Funding plan

| Round | Amount | When | Use | Milestone it buys |
|---|---|---|---|---|
| **Pre-seed** | 5 tỷ VND (~$190K) | Now | 6 people, 18 months, 5 faculty pilots | 96K students, 10 tỷ ARR, published calibration study |
| **Seed** | 30 tỷ VND (~$1.15M) | Month 18 | Sales team, own model training, K-12 cost curve | 368K students, 35.5 tỷ ARR |
| **Series A** | ~150 tỷ VND (~$5.8M) | Month 36 | SEA expansion (ID/PH/TH) | 2.2M students, USD 6.2M ARR |

**If we win this hackathon,** the prize goes to three things in this order: (1) three months of engineering to ship one university vertical end to end; (2) three paid faculty pilots producing a real teacher-labelled dataset; (3) the calibration study that lets us publish accuracy numbers we can defend. **In that order, because the dataset is the company.**

### BACKUP — Sensitivity

| Scenario | Y3 revenue | Trigger |
|---|---|---|
| **Bear** | 16 tỷ VND | Faculty pilot→paid conversion 20% not 40%; cost/session stalls at 2,600 |
| **Base** | 35.5 tỷ VND | Plan as written |
| **Bull** | 68 tỷ VND | Cost/session hits 1,400 a year early → public THPT opens in Y3 |

**Two swing factors, and neither is "can we build it":**
1. **Faculty pilot → paid conversion.** At 20% instead of 40%, Y3 revenue halves.
2. **Cost per session.** It gates which markets exist for us at all. This is the most strategically important engineering metric in the company, and it is why an ML hire comes before a sales hire.

---

# 9. SLIDE 9 — Team *(5 points)* ⚠️ FILL THIS IN

### ON-SLIDE — structure to fill

> ## Four roles. Because this problem needs all four.
>
> | | Role | Why this problem needs them |
> |---|---|---|
> | **[NAME]** | Product / CEO | [Domain proof] |
> | **[NAME]** | AI / ML — *cost per session & calibration* | [Model, eval, or NLP proof] |
> | **[NAME]** | Full-stack / Platform | [Shipped product proof] |
> | **[NAME]** | Pedagogy & GTM | [Teaching or edtech proof] |
>
> **Advisors:** [University lecturer] · [Vietnamese NLP researcher] · [EdTech operator]
>
> *We interviewed [N] teachers and lecturers across [M] institutions. [Strongest quote here.]*

### How to make this slide score a 5 instead of a 3

Judges do not score credentials. They score **founder-problem fit**. Three rules:

**1. Every bio is one sentence connecting the person to *this* problem.**
- ✗ "Third-year Computer Science student at [University]."
- ✓ "Shipped a Vietnamese text-classification model to 40K users; owns Claim Graph and the cost-per-session curve."
- ✗ "Passionate about education."
- ✓ "Taught 120 students at a Hanoi centre for two years; brings the lecturer's grading workflow into the product spec."

**2. One "why us" line no other team can copy.** Pick the truest one you have:
- "One of us is a teacher. We have graded the essays we are talking about."
- "We interviewed 34 lecturers before writing a line of code. Slide 2 is their words, not our theory."
- "We built [X] together and shipped it to [N] users. This is our third project as a team, not our first."

**3. If you have a genuine gap, name it and name the fix.**
> "We do not have a Vietnamese speech specialist. That is our first hire — and since cost per session gates our entire market sequencing, it is the most important hire in the plan. We have identified three candidates from [university NLP lab]."

Naming a gap scores **higher** than pretending to have none. It is the easiest available move from "Tốt" to "Xuất sắc."

### Role architecture — what each role must be able to answer

| Role | Owns | Must be able to answer |
|---|---|---|
| **Product / CEO** | Vision, market, fundraising, the pitch | "Why this, why you, why now" |
| **AI / ML** | Claim Graph, probes, calibration, **cost per session** | "How do you know the score is right, and what does a session cost?" |
| **Platform** | Architecture, LMS integrations, scale, security, data residency | "What happens at 100,000 concurrent sessions?" |
| **Pedagogy / GTM** | Curriculum mapping, faculty research, sales motion | "Would a real lecturer actually use this?" |

⚠️ **If your team is smaller than four,** do not invent people. Show the four roles, show who covers which, and show which is your next hire. That reads as strategic. Fake org charts read as inexperienced.

### Evidence worth real points if you have it

- Number of lecturers/teachers interviewed, institutions named
- One verbatim quote (with permission) on Slide 2
- **A letter of intent from any faculty or school — this alone can decide the competition**
- Prior projects shipped together, with user numbers
- An advisor who is a working lecturer or academic administrator

---

# 10. SLIDE 10 — Status & Future Plan *(5 points)*

### ON-SLIDE

> ## Pre-build, fully specified. Here is exactly what happens next.
>
> **✅ Done** — Problem validated against national policy & published research · System architecture
> designed · 5-dimension rubric defined · Unit economics modelled to cost-per-session ·
> GTM sequenced on the cost curve · [N] lecturer interviews ⚠️
>
> | Horizon | Milestone | Proof it worked |
> |---|---|---|
> | **90 days** | One university vertical, end to end | 3 faculties, 300 real sessions |
> | **6 months** | Calibration study published | **r > 0.7 vs. blind teacher scoring** |
> | **12 months** | 5 paying faculties + thesis mode | 1.58 tỷ VND ARR |
> | **18 months** | Cost/session < 2,800 VND | Seed round |
> | **36 months** | Cost/session < 1,900 → public THPT opens | 368K students, near break-even |
> | **60 months** | SEA: Indonesia, Philippines, Thailand | USD 6.2M ARR |

### SAY *(75 seconds — say this with a straight back, do not apologise)*

> "Completely straight with you: we have not built this yet.
>
> What we have done is the work that determines whether it *can* be built. We validated the problem against national policy and published research rather than our own assumption. We designed the system. We defined the scoring rubric. We modelled the economics down to the cost of a single session — and that number changed our entire go-to-market, because it told us public schools are unreachable until we cut it in half. And we talked to [N] lecturers.
>
> Here is the next ninety days. We do not build a platform. We build **one vertical, end to end**, and run it with three real faculties and three hundred real sessions.
>
> Because one question decides everything: **does our Understanding score agree with what an experienced lecturer would say?** If it does, everything in this deck follows. If it doesn't, we would rather find out in November with three hundred sessions than in two years with a product.
>
> Our gate is a correlation above zero point seven against blind teacher scoring. That is the number that would make us raise — or make us stop and fix one dimension.
>
> We are not asking you to believe we've built something. We're asking whether this is the plan a serious team would run."

### BACKUP — The 90-day plan, week by week

| Weeks | Workstream | Deliverable | Gate |
|---|---|---|---|
| 1–2 | Research | 20 lecturer interviews; 100 real submissions collected with consent | Problem quantified in *our* data |
| 1–3 | Rubric | 5-dimension rubric v1; 3 lecturers independently score 40 submissions | Inter-rater reliability κ > 0.6 |
| 3–6 | Claim Graph | Submission → structured claims, mapped to curriculum codes | Lecturer agrees the graph reflects the work, 80%+ |
| 5–8 | Probe Generator | Probe library + AI-fragility test | **<25% answerable by a frontier model without the source** |
| 6–9 | Cost curve | Instrument every call; first optimisation pass | Measured cost/session ≤ 3,400 VND |
| 7–10 | Session runtime | Voice-first VN session, adaptive, 8-min cap | 50 students complete unassisted |
| 9–12 | Scorer + calibration | Score vs. blind teacher ground truth, 300 sessions | **r > 0.7** |
| 11–13 | Lecturer console | 2×2, evidence bundle, override | 3 lecturers use it unassisted for a full assignment |

**The gate that matters:** *r > 0.7 against experienced lecturer judgment on 300 real sessions.* Hit it and we raise. Miss it and we know which of five dimensions failed. Everything else is downstream.

**A second gate people forget:** *student-reported learning value > 4.0/5.* If students don't experience the session as teaching them something, the learning-first positioning collapses and with it the parent story, the principal story, and the answer to the gameability objection. **Measure it from session one.**

### BACKUP — Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Score doesn't correlate with lecturer judgment | Medium | Fatal | The 90-day gate exists to find this out cheaply |
| Cost/session stalls above 2,500 VND | Medium | High | Public K-12 stays closed; company caps at university+private (~USD 2M ARR ceiling). ML hire is priority one |
| Students game the session with a second device | High | **Low** | Grounded probes, latency profiling, in-room high-stakes mode — **and gaming still requires retrieval practice on their own work** |
| Lecturers see it as extra work | Medium | High | Async by default; lecturer reviews only the triaged Hollow quadrant |
| Turnitin / Azota ship a competing feature | Medium | Medium | Speed, local calibration, syllabus embedding; integrate-don't-fight with Azota |
| Institutional privacy/legal objection | Medium | High | VN data residency, Decree 13/2023 compliance, opt-in training data, appeal flow in v1 |
| Rural infrastructure gaps (flagged by UNESCO RAM) | High | Medium | Explicitly out of scope Y1–2; low-bandwidth mode committed Y3; typed parity from day one |
| Team is students; bandwidth | High | High | Named on Slide 9 with first hire and advisor plan |

---

# 11. SLIDE 11 — Technical Demo *(5 points — bonus in prelims, mandatory in finals)*

**You are pre-build. Build ONE thing and build it flawlessly. A 90-second demo that works beats a 5-minute demo that stutters.**

### What to build — the minimum winning slice

**Scope: one subject, one assignment type, end to end.** Four screens only:
1. **Upload** — drop a submission in
2. **Probe generation** — 5 questions appear, each visibly quoting the student's own text
3. **Live session** — voice answer in Vietnamese, 60 seconds, one adaptive follow-up
4. **Dual output** — the 2×2 dot lands, **and the student's learning feedback panel appears beside it**

Screen 4 matters more in v2 than v1: showing *both* outputs is what proves the learning-first claim isn't just rhetoric.

Do **not** build: login, admin console, billing, LMS integration, mobile app, settings. None of it scores.

### The demo script — 3 minutes, rehearsed 20 times

| Time | Action | Line |
|---|---|---|
| 0:00 | Two submissions side by side, both excellent | "Two essays. Both would get a 9. One student wrote it and understood it. One pasted it. You cannot tell. Neither can any detector on earth." |
| 0:20 | Upload A. Probes appear | "GRASP reads it and generates five questions from *this* essay. Question three quotes her own third paragraph back at her." |
| 0:45 | **Teammate answers live, in Vietnamese** | *(Say nothing. Silence is powerful here.)* |
| 1:20 | Adaptive follow-up fires | "Strong answer, so GRASP escalated. It's now asking her to apply the idea to a text she's never seen." |
| 1:45 | Dual output appears | "Two things. The lecturer sees Mastery. **And she gets this** — the two concepts she explained weakly, to revise. That panel appears whether or not anyone is grading her." |
| 2:05 | Upload B (AI-written). Same probes | "Same essay quality. Same five questions." |
| 2:20 | **Second teammate answers from the AI text only** | *(Let them flounder on the counterfactual. Do not rescue them.)* |
| 2:45 | Dot lands in Hollow | "Nine out of ten on the essay. Two out of ten on understanding. Six minutes." |
| 2:55 | Cut to a full cohort of 45 dots | "One lecturer's Monday morning. Seven students to talk to instead of forty-five essays to doubt." |

### The move that wins the room

At 2:05, **invite a judge to pick which submission is the AI one before you run it.** Let the room commit. Then run GRASP. Right or wrong, you've made the point physically instead of rhetorically.

If your system is genuinely stable: **take a live prompt from the audience**, generate an essay on the spot, run GRASP on it. Highest risk, highest reward. Only if it has worked 10 times consecutively in rehearsal — and have the recorded video one keystroke away.

### Non-negotiable demo rules

1. **Record a perfect video backup and keep it open in a tab.** Every hackathon has a Wi-Fi failure. The teams that lose are the ones without a backup.
2. **Pre-warm every model call.** Cold-start latency has killed more demos than bugs.
3. **Never say "normally this works."** If it breaks, cut to video mid-sentence without commentary.
4. **Use a real submission, not lorem ipsum.** Judges smell fake data instantly.
5. **The audio must be genuinely Vietnamese.** Do not demo in English — the entire thesis is that this works for Vietnamese students.
6. **Show one failure honestly if asked** — "here's a case where our score was wrong, and here's the lecturer override." This scores *higher* than flawlessness, because it proves the human-in-the-loop is real.

---

# 12. SLIDE 12 — Closing *(0 points — the last thing they remember)*

### ON-SLIDE

> # Don't detect AI. Verify learning.
>
> ### GRASP
>
> [team email] · [one QR code to a live demo or landing page]

Nothing else. No "Thank you for listening." No summary bullets.

### SAY *(20 seconds — memorise word for word)*

> "Vietnam has already decided its students will learn to use AI. That decision is made — it's in Resolution 71, it's in Circular 02, it's in the curriculum that starts this school year.
>
> The only question left is whether we can tell if they learned anything.
>
> We didn't invent an answer to that. Vietnamese education already had one, and it's called vấn đáp. We just made it cost six minutes instead of a teacher's afternoon.
>
> Every tool on the market is built to catch students. **We built the one that makes them explain.**
>
> Don't detect AI. Verify learning. Thank you."

Then stop. Do not fill the silence. Let them ask the first question.

---

# 13. Delivery & Q&A Preparation *(10 points — the most under-prepared 10 points in any competition)*

## 13.1 Delivery — "Phong thái thuyết trình" (5 pts)

**Time structure for a 10-minute pitch:**

| Slides | Time | Energy |
|---|---|---|
| 1–2 Problem | 2:00 | **Highest.** Cold open, no pleasantries |
| 3 Value (learning + 2×2) | 1:30 | Slow down. This is the idea. Let it sit |
| 4 System | 1:30 | Precise, confident, technical |
| 5–7 Market | 1:45 | Brisk. Numbers, not adjectives |
| 8 Financials | 1:15 | Calm. Never apologise for a projection |
| 9–10 Team & status | 1:00 | Warm, honest |
| 11 Demo | 2:00 | *(if included — cut market to 1:00)* |
| 12 Close | 0:20 | Slow, quiet, stop |

**The seven delivery rules**

1. **One speaker owns the narrative arc.** Hand-offs kill momentum. If you must split, split at Slide 4 and Slide 8 — never mid-argument.
2. **Never read the slide.** If it's on the slide, say something *else* about it.
3. **Say numbers slowly and once.** "Sixty-one percent gross margin." Pause. Move on. Repeating a number signals you don't trust it.
4. **Say "we decided," not "we think."** *"We decided not to enter public schools until our cost per session halves"* is a founder. *"We think maybe we could…"* is a student.
5. **Silence after your strongest line.** After "the top-right quadrant is empty," stop for two full seconds. It feels like an eternity to you and like confidence to them.
6. **Handle the pre-build status once, early, and never again.** Apologise for it three times and they'll believe it's a problem three times.
7. **Rehearse the first 30 seconds until you could do it woken from sleep.**

**What kills teams:** opening with "Xin chào, hôm nay nhóm em sẽ trình bày…"; reading slides; a demo with no backup; not knowing your own numbers; defensiveness in Q&A.

## 13.2 Q&A — "Trả lời câu hỏi" (5 pts, finals)

**Universal answer structure, every time:**
> **(1) Name the real question. (2) Direct answer in one sentence. (3) One piece of evidence. (4) Stop talking.**

Rambling is the only way to lose these points. If you don't know: *"We don't know yet. Here's how we'd find out."* That answer scores.

---

### The 18 questions you will be asked

**Q1. "How is this different from an AI detector?"**
> "A detector asks 'was AI used?' — unanswerable, and under Resolution 71 no longer the right question. We ask 'can you explain your own work?' We never produce a cheating verdict. We produce evidence a lecturer acts on — and a learning session the student benefits from either way."

**Q2. "What stops a student using ChatGPT during the session?"** ← *the most likely question*
> "Three mechanisms, and then the thing that actually matters. Probes quote the student's own text, so an external AI has no context unless they paste the whole submission back — which costs time we measure. Answers are voice-first with an eight-second window and adaptive follow-ups. High-stakes assignments run in-room on institution devices.
>
> But here is the real answer: **to fake understanding of their own submission, in Vietnamese, in real time, they have to read it, reason about it, and articulate it out loud.** That is retrieval practice. That is the learning intervention. **The product worked even though the verification didn't.** We designed it so that the cheating path and the learning path converge. No detection product can say that."

**Q3. "This isn't a novel idea. People have proposed AI oral defense since 2023."** ← *have this ready, it's coming*
> "You're right, and I won't pretend otherwise. It's been the most-discussed proposed answer to AI in education for three years. It's also mostly unbuilt, and entirely unbuilt in Vietnamese.
>
> We're not claiming to have invented the idea. We're claiming something narrower and more defensible: **vấn đáp is not a new idea in Vietnam at all — it's a format we abandoned for economic reasons, and we're the ones making it affordable again.** The work that isn't done is curriculum mapping to GDPT 2018, calibration against Vietnamese lecturer judgment, and getting cost per session low enough that public education can afford it. That's execution, not insight. We're comfortable competing on execution."

**Q4. "Isn't this just a wrapper around an LLM?"**
> "The demo is. The company isn't — and I'd rather say that plainly than oversell a moat. A competent team ships a seventy-percent version in six weeks.
>
> What compounds is four things: calibration data — teacher-labelled Vietnamese understanding judgments, which nobody can buy; GDPT 2018 curriculum mapping, which has no global reuse so no global competitor does it well; **institutional embedding** — once a GRASP defense grade is in a syllabus and an accreditation file, switching means a curriculum revision cycle; and the cost curve, which determines which markets we can even serve. None of those are moats in Year One. In Year One our only advantage is speed and focus."

**Q5. "Why would a university pay for this? What decision changes?"** ← *the sharpest question*
> "That's the right question, and it's why we don't sell a dashboard. **We sell a graded assessment component** — a defense grade worth twenty to thirty percent of the assignment, written into the syllabus. Once it's in the syllabus it's in the accreditation file and in next year's budget. Advisory dashboards get cancelled in the first cost review. Assessment components get renewed.
>
> And the economic case is a comparison they already understand: a thesis committee is three or four lecturers for thirty minutes per student. We're a fraction of that, available in every course, not just final year."

**Q6. "How accurate is it?"**
> "We don't know yet, and I'm not going to invent a number. The ninety-day plan exists to answer exactly this: three hundred real sessions, blind-scored independently by experienced lecturers, gate at correlation above zero point seven. Miss it and we know which of five dimensions failed. That's a falsifiable plan, which I'd argue is worth more right now than a confident claim."

**Q7. "Why start with universities and not high schools, where the problem is bigger?"**
> "Two reasons, and the second is the honest one. First, universities already run bảo vệ khóa luận — the format is culturally established and there's a budget line, so a dean signs in six weeks. Second: **at thirty-nine thousand đồng per student per year and thirty-four hundred đồng per session, public high schools are a thirteen percent gross margin business.** That's not a business. It becomes a sixty-four percent business when our cost per session hits fifteen hundred, which is Year Three. Universities fund the cost curve that opens public education. We sequenced on unit economics, not on where the pain is loudest."

**Q8. "Doesn't this add work for already-overloaded lecturers?"**
> "It removes work. Students run the session themselves, asynchronously, on their own devices. The lecturer opens one screen and sees a triaged 2×2 — they look closely at roughly fifteen percent. Today they read all ninety closely and still don't know. We'll publish the measured time saving from the pilot; I'm not going to claim a number we haven't measured."

**Q9. "What if your score is wrong and a student is unfairly judged?"**
> "A lecturer overrides it in one click, and the override becomes our training data. Three things are structural, not features: we never output a verdict, we report a confidence interval, and there's a student appeal flow in version one. Our entire thesis is that algorithmic verdicts about students are wrong. We'd be hypocrites to build one."

**Q10. "Won't students hate this? It's surveillance."**
> "That's the risk I take most seriously, and it's why the product has no 'cheating' label anywhere in it and why we lead with learning rather than integrity.
>
> But consider the alternative. Today's regime is a detector producing a secret probability score the student never sees and cannot contest, with a documented bias against non-native speakers. **GRASP is more transparent than the status quo, not less.** And the student who benefits most is the one who understands and writes badly — the student every detector currently punishes.
>
> We measure it: student-reported learning value and fairness perception are tracked KPIs from session one. If students experience it as surveillance, we built it wrong and we'll know within a semester."

**Q11. "Why won't Turnitin or Azota just build this?"**
> "Turnitin might. Their revenue is anchored to detection, they're English- and higher-ed-first, and their pricing is twenty to fifty times Vietnamese willingness-to-pay — but none of that is a technical barrier. Azota is more interesting: three hundred thousand teachers, and they're a *delivery* layer. We'd rather integrate than fight; we make their grading meaningful. Realistically, if we execute we're an acquisition target. If we're slow, we're neither."

**Q12. "Vietnamese speech recognition is hard. Regional accents?"**
> "It is, and we designed around it. We don't need perfect transcription — scoring operates on semantic content and tolerates eight to twelve percent word error rate. We fine-tune on subject vocabulary. And typed input is always available: for accents, for noisy homes, for low bandwidth, and for students who don't want to speak."

**Q13. "Your market is small. Vietnam can't support this."**
> "You're right, and I said so on slide seven. Vietnam's serviceable market is about twenty-two million dollars a year. That's why Southeast Asia is in the Year Four plan as a requirement, not an option — Indonesia, the Philippines and Thailand have the identical problem and the identical non-native-English penalty. Vietnam is where we win the product. The region is where we win the business."

**Q14. "What's your biggest risk?"**
> "Two, and neither is 'can we build it.' First, faculty pilot-to-paid conversion — we model forty percent; at twenty, Year Three revenue halves. Second, **cost per session**, because it gates which markets exist for us at all. If it stalls above twenty-five hundred đồng we're capped at universities and private schools, roughly a two-million-dollar ARR ceiling. That's why our first hire is ML, not sales."

**Q15. "You haven't built anything. Why should we believe you can?"**
> "You shouldn't believe it on faith. Look at what the ninety-day plan does: it doesn't build a platform, it builds one vertical and answers one question — does our score agree with a lecturer. That's the plan of a team that knows where the actual risk is. We'd rather be wrong in November with three hundred sessions than in two years with a product."

**Q16. "What about student privacy? You're recording voices."**
> "Data stays in Vietnam. We comply with Decree 13/2023 on personal data protection. Voice recordings are deleted after transcription unless the institution opts to retain them for appeals. Training on student data requires institution-level opt-in and de-identification. Students see everything about themselves — their probes, transcript, score, and our reasoning."

**Q17. "What's your unfair advantage?"**
> ⚠️ *Fill with your team's actual truth.* Candidates: a founder who has taught; lecturer interviews nobody else did; a faculty willing to pilot; Vietnamese NLP background. **Pick one, make it concrete, don't claim four.**

**Q18. "What would you do with the prize money?"**
> "Three things in order. Three months of engineering to ship one university vertical end to end. Three paid faculty pilots to build the teacher-labelled dataset. And the calibration study that lets us publish accuracy numbers we can defend. In that order, because the dataset is the company."

---

### If you genuinely don't know

Say exactly this:
> "I don't know. Here's how we'd find out: [one concrete method]. I'd rather tell you that than guess."

Every experienced judge scores this higher than a confident wrong answer.

---

# 14. Rubric Self-Audit

Official scale: **1 Không đạt · 2 Sơ sài · 3 Đạt chuẩn · 4 Tốt · 5 Xuất sắc**
A "4" has depth and clear evidence. A "5" is *nổi bật* — standout, near-professional, or breakthrough.

| Slide | A 3 looks like | What this document gives you (4) | **What pushes you to 5** |
|---|---|---|---|
| **2 Problem** | "Students use AI, teachers can't tell" | Three-student framing + Stanford 61% + Turnitin's own FPR + the vấn đáp economics argument | **Your own lecturer quote.** Primary data beats cited data every time ⚠️ |
| **3 Value** | A list of benefits | Learning-science foundation *then* the 2×2 | Deliver the 2×2 in silence. And lead with learning — most teams lead with catching, which is why they sound like everyone else |
| **4 System** | Boxes and arrows | Claim Graph → AI-fragile probes → 5-dim scorer → dual output → flywheel, with cost per session | **The AI-fragility gate**: "<25% of our probes are answerable without the source." And the honest-defensibility answer |
| **5 Market** | "25 million students" | University beachhead justified on *unit economics*, with explicit exclusions | Name a specific faculty you have spoken to ⚠️ |
| **6 Marketing** | "Social media and partnerships" | Learning-led messaging, ranked CAC, co-authored calibration study | The "never lead with" column — showing you know what *not* to say is rare |
| **7 Market analysis** | A number from a report | Bottom-up SAM, 2×2 map, 8 competitors incl. "a well-prompted frontier model" and "doing nothing" | **Volunteering that the idea isn't novel** before a judge raises it. Disarms the single biggest attack |
| **8 Financials** | Revenue hockey stick | Full P&L, honest 3,400 VND/session, segment-margin table, LTV/CAC, sensitivity | **The cost-curve argument**: your GTM sequencing derived from unit economics. Almost no student team does this |
| **9 Team** | Names and majors | Four-role architecture with founder-problem fit | **Naming your gap and your next hire** ⚠️ |
| **10 Status** | "We plan to build…" | 90-day week-by-week with two falsifiable gates | Stating the gate that would make you *stop*. Almost no team does this |
| **11 Demo** | Slides describing a demo | Rehearsed 3-min script with judge participation and dual output | Live audience-generated essay + honest failure case shown on request |
| **Delivery** | Reading slides | Timed structure, cold open, silence after key lines | One speaker owning the arc, and stopping after the close |
| **Q&A** | Answering what was asked | 18 pre-drafted answers | "I don't know — here's how we'd find out," used once, confidently |

**Three highest-leverage actions before you present** (all ⚠️, all cheap):
1. **Interview 15–30 lecturers and teachers this week.** One verbatim quote on Slide 2. This moves three slides from 4 to 5. Ask them directly: *"would you actually add this step?"* — you need that answer before a judge asks it.
2. **Get one faculty to sign a non-binding letter of intent.** Nothing in this document is worth as much as that piece of paper.
3. **Build the thin demo slice** even for the prelim round. Bonus there, mandatory in the final — build once, use twice.

---

# 15. Risks, Ethics & Honest Weaknesses

## 15.1 The ethical position — state it explicitly, it differentiates you

1. **No algorithm ever accuses a student.** GRASP produces evidence. Humans produce judgments. There is no "cheating" label in the product.
2. **The tool protects the wrongly accused as much as it finds the hollow.** The Expression Gap quadrant is the moral centre of the product, not a feature.
3. **Confidence is reported, not hidden.** A low-confidence score says so.
4. **Students see everything about themselves** — probes, transcript, score, reasoning — and can appeal.
5. **The learning benefit is unconditional.** Every session returns feedback to the student whether or not anyone is grading it.

## 15.2 The weaknesses I would raise if I were judging *(know these cold)*

**"The concept isn't novel."** True. Answer: Q3. Volunteer it before they do.

**"Defensibility is thin in year one."** True. Answer: Q4 — name what compounds, admit none of it is a moat yet, compete on speed and local execution.

**"The user isn't the buyer."** This is why the beachhead moved to universities, where the dean who signs is also the person accountable for thesis integrity and accreditation. In K-12 the gap remains real, which is one more reason K-12 is Year 3.

**"You're adding a step to an overloaded system."** Partly true, and the learning-first framing is the answer — but only if students actually experience it as valuable. **That is why student-reported learning value is a tracked gate, not a nice-to-have.** If it comes back below 4.0, the positioning is wrong and you need to know in month three.

**"Rural and low-income students will be disadvantaged."** The real one. The UNESCO Readiness Assessment specifically flags urban/rural infrastructure gaps. Honest position: we don't serve low-bandwidth institutions well in Years 1–2, we say so, typed-input parity exists from day one, and low-bandwidth mode is a committed Year 3 deliverable. Do not pretend otherwise — judges will find it.

**"AI will eventually fake real-time understanding."** Perhaps. But probes are grounded in the student's own artifact and delivered adaptively under time pressure — the student must operate an AI in real time on their own content, fast enough to be indistinguishable from someone who knows it. At the point where that's effortless, they've become a skilled AI operator working with their own material, which is what Circular 02/2025 and Resolution 71 actually ask students to become. **We're relatively comfortable losing that particular arms race.**

**"Assessment reform will make this obsolete."** Partly true, and it favours us. Every serious proposal for AI-era assessment — process portfolios, oral defence, authentic assessment — converges on verifying the person rather than the artifact. That is precisely what GRASP automates. Faster reform grows our market.

---

# 16. ⚠️ Pre-Presentation Checklist

**Facts to verify.** Every number here came from public sources or bottom-up modelling — but you are the one standing in front of the judges.

- [ ] **Circular 02/2025/TT-BGDĐT** — confirm date (24 Jan 2025), scope, exact title
- [ ] **Resolution 71-NQ/TW** — confirm date (22 Aug 2025) and the AI language you quote
- [ ] **AI curriculum start date** — confirm "2026–2027 school year" against a MoET source
- [ ] **Vietnam Personal Data Protection Law** — confirm status and effective date; confirm Decree 13/2023/NĐ-CP is still operative
- [ ] **Student/teacher/school counts** — verify against GSO or MoET; sources vary (22M vs 25.6M students)
- [ ] **Edtech market size** — sources disagree badly (USD 1.08B vs USD 3.64B for 2024). Pick one, cite it on the slide, be ready to say why
- [ ] **Stanford HAI 61% figure** — read the original study, know the sample size
- [ ] **Turnitin 6–9% non-native FPR** — find Turnitin's own publication and cite it directly. A competitor's own admission is your strongest citation
- [ ] **Dunlosky et al. 2013 utility ratings** — confirm practice testing is rated *high* utility and elaborative interrogation / self-explanation *moderate*. Do not overstate: say "practice testing: high utility" and stop
- [ ] **Roediger & Karpicke 2006** — confirm the retention findings you quote
- [ ] **Azota's 300,000+ teachers** — from Azota's own site; the 700,000 figure is 2022 reporting
- [ ] **Cost per session** — 3,400 VND is a modelled estimate at current API and ASP pricing. **Instrument it for real in week 6.** Say "modelled" until you've measured it
- [ ] **All §8 arithmetic** — internally consistent as written; recompute the moment you change an assumption
- [ ] **FX rate** — assumes ~26,000 VND/USD; update and re-derive every USD figure

**Content to produce:**
- [ ] 15–30 lecturer/teacher interviews, one verbatim quote for Slide 2
- [ ] The direct question asked in every interview: *"would you actually add this step?"*
- [ ] Team bios written as founder-problem fit (§9)
- [ ] Your genuine "unfair advantage" line (Q17)
- [ ] The thin demo slice + recorded video backup (§11)
- [ ] One faculty letter of intent, if at all possible
- [ ] Full timed run-through, rehearsed 5+ times, with the demo live

---

# 17. Sources

**Learning science**
- [Roediger & Karpicke (2006), Test-Enhanced Learning: Taking Memory Tests Improves Long-Term Retention](https://profiles.wustl.edu/en/publications/test-enhanced-learning-taking-memory-tests-improves-long-term-ret/)
- [Roediger & Karpicke, The Power of Testing Memory (PDF)](http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf)
- [Dunlosky, Rawson, Marsh, Nathan & Willingham (2013), Improving Students' Learning With Effective Learning Techniques, *Psychological Science in the Public Interest* 14(1)](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266)
- [PSPI summary — Improving Students' Learning With Effective Learning Techniques](https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html)
- [Test-Enhanced Learning in Undergraduate Science Courses, *CBE—Life Sciences Education*](https://www.lifescied.org/doi/10.1187/cbe.14-11-0208)

**AI detection reliability**
- [Stanford HAI / detector bias against non-native English writers — via USD Legal Research Center](https://lawlibguides.sandiego.edu/c.php?g=1443311&p=10721367)
- [Contra generative AI detection in higher education assessments (arXiv)](https://arxiv.org/pdf/2312.05241)
- [AI Detector False Positive Rates: 2026 Data Compared](https://gradpilot.com/news/ai-detector-false-positive-rates-compared)
- [Turnitin AI Detection Accuracy 2026: Scores, False Positives](https://www.tryleap.ai/turnitin/accuracy)

**Vietnamese policy**
- [Thông tư 02/2025/TT-BGDĐT — Khung năng lực số cho người học](https://thuvienphapluat.vn/van-ban/Giao-duc/Thong-tu-02-2025-TT-BGDDT-quy-dinh-Khung-nang-luc-so-cho-nguoi-hoc-625668.aspx)
- [Nghị quyết số 71-NQ/TW (22/8/2025) — đột phá phát triển giáo dục và đào tạo](https://ajc.edu.vn/tu-lieu--van-kien-dang/nghi-quyet-so-71nqtw-ngay-2282025-cua-bo-chinh-tri-ve-dot-pha-phat-trien-giao-duc-va-dao-tao-14109.htm)
- [Resolution 71-NQ/TW: AI as a lever for comprehensive restructuring of education](https://www.vietnam.vn/en/nghi-quyet-71-nq-tw-tri-tue-nhan-tao-don-bay-tai-cau-truc-toan-dien-giao-duc-va-dao-tao)
- [Politburo sets breakthrough objectives for education, training development](https://vietnamlawmagazine.vn/politburo-sets-breakthrough-objectives-for-education-training-development-75397.html)
- [UNESCO — Viet Nam: Artificial Intelligence Readiness Assessment Report (PDF)](https://articles.unesco.org/sites/default/files/medias/fichiers/2025/10/Viet%20Nam%20Artificial%20Intelligence%20Readiness%20Assessment%20Report.pdf)
- [UNESCO — Viet Nam launches first national report on AI ethics](https://www.unesco.org/en/articles/viet-nam-launches-first-comprehensive-national-report-ai-ethics-under-unesco-framework)

**Market**
- [Vietnam Education Technology Market Size (Expert Market Research)](https://www.expertmarketresearch.com/reports/vietnam-education-technology-market)
- [Vietnam Edtech Market Size, Share and Growth Trends (IMARC)](https://www.imarcgroup.com/vietnam-edtech-market)
- [Education technology, a lucrative market in Vietnam (VOV)](https://vovworld.vn/en-US/digital-life/education-technology-a-lucrative-market-in-vietnam-1319244.vov)
- [Vietnam plans $23 billion education reform to modernize system](https://vietnamnet.vn/en/vietnam-plans-23-billion-education-reform-to-modernize-system-2466543.html)
- [Viet Nam to increase State's expenditure on education to at least 20%](https://en.baochinhphu.vn/viet-nam-to-increase-states-expenditure-on-education-to-at-least-20-111250827221440821.htm)

**Competitors**
- [Azota — assessment platform trusted by 300,000+ teachers](https://azota.vn/privacy/en/)
- [Azota is solving exam headaches for Vietnam's teachers (TechCrunch)](https://techcrunch.com/2022/07/05/azota-is-solving-exam-headaches-for-vietnams-teachers)
- [SHub Classroom](https://shub.edu.vn/)
- [Turnitin Clarity — responsible AI use tool](https://www.turnitin.com/press/responsible-ai-use-tool-turnitin-clarity-earns-iste-seal-for-meeting-highest-educational-technology-standards)

**Vietnamese academic integrity research**
- [Exploring Vietnamese students' plagiarism awareness and practices using ChatGPT (*Int. J. Educational Integrity*)](https://link.springer.com/article/10.1007/s40979-025-00207-5)
- [Unmasking academic cheating behavior in the AI era: Evidence from Vietnamese undergraduates](https://link.springer.com/article/10.1007/s10639-024-12495-4)

---

*Version 2.0 · Prepared for Build@Hub Hackathon 2026. All ⚠️ items require your verification or input before presentation.*
