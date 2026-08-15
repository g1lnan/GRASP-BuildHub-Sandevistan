# GRASP — Front-End Design Specification

**Version 2.0 · 25 July 2026 · Presentation layer only — no logic**
Implements [PRD.md](PRD.md) §3 and [DESIGN.md](DESIGN.md) §10.
Materials: [`ui/tokens.css`](ui/tokens.css) · [`ui/mockups.html`](ui/mockups.html)

> **v2 replaces v1's restrained-academic direction with a bright, game-y system heavily
> inspired by Duolingo.** Rationale in §0.

---

## 0. Why game-y is on-thesis

Duolingo is the most successful consumer application of **retrieval practice** ever built — the exact learning mechanism GRASP's business plan is built on (Roediger & Karpicke 2006; Dunlosky et al. 2013). It made a drill loop something 100M+ people do voluntarily, daily, for years.

GRASP's v2 positioning says the product **teaches first and assesses second**. A calm examination-room aesthetic contradicts that. If the core loop really is retrieval practice, it should feel like practice.

This also attacks the biggest adoption risk in the plan: *will students resist a tool that scores them?* A tool that feels like an exam gets resisted. A tool that feels like Duolingo gets opened voluntarily. Vietnamese students are a young, mobile-first, Duolingo-fluent audience — Duolingo has deep penetration in Vietnam for English.

### The one asymmetry that governs every adaptation

**Duolingo is zero-stakes. A GRASP defense feeds a grade** (`defense_weight_pct`, 0–30%).

Mechanics that delight at zero stakes can become unfair or punitive at real stakes. Resolving this turns out to be easy, because **Duolingo's own mechanics are effort-based, not accuracy-based**:

| Duolingo mechanic | Rewards | GRASP verdict |
|---|---|---|
| XP | Completing lessons | ✅ Adopt — XP for completing a defense, never for scoring well |
| Leagues | Weekly XP total | ✅ Adopt — ranked on practice consistency, never on understanding scores |
| Streaks | Showing up | ✅ Adopt as-is |
| Progress bar | — | ✅ Adopt (reverses v1's ban — motivational value beats the mild framing concern) |
| Celebration screen | Finishing | ✅ Adopt — celebratory regardless of score, exactly as Duolingo is |
| Skill path | Progress | ✅ Adopt as the **Concept Map** — the Understanding Portfolio, made visible |
| Mascot | — | ✅ Adopt — **Nghé**, see §5 |
| Red "wrong" state | Errors | ⚠️ Adapt → amber "chưa vững" (not yet solid). See §2 |
| ❤️ Hearts / lives | — | ❌ **Drop.** The only real departure. See below |

**Why hearts are out:** running out of hearts in Duolingo ends a free practice session — reload tomorrow, nothing lost. Running out mid-defense would end a *graded assessment*. There is no version of "you failed out of your coursework because you used five hearts" that is defensible. Every other Duolingo mechanic survives intact.

**Gamify the student, not the lecturer.** Duolingo for Schools is a clean, professional dashboard — no XP, no streaks for teachers. GRASP does the same: the lecturer console adopts the new palette for visual coherence but stays an analytical instrument. A lecturer grading 90 students does not want confetti.

---

## 1. Typography

### The Vietnamese constraint is unchanged and non-negotiable

Vietnamese stacks a diacritic *and* a tone mark on one vowel (`ế`, `ộ`, `ữ`) and uses `đ`. Most chunky display faces — including the obvious rounded-friendly ones — omit or collide these. A cute font with broken tone marks is worse than a plain one.

| Role | Face | Weights | Why |
|---|---|---|---|
| **Display / headings** | **Baloo 2** | 600, 700, 800 | Chunky, rounded, high-energy — the Duolingo silhouette. Full Vietnamese subset |
| **UI / body / data** | **Be Vietnam Pro** | 400, 500, 600, 700 | Best-in-class Vietnamese tone-mark placement. Carries every score, timer, and transcript |
| **Numerals** | Be Vietnam Pro, `tabular-nums` | 700 | XP, streaks, scores must not jitter |

**Never:** Inter, Roboto, Arial, Open Sans, system stacks, or any display face without a verified Vietnamese subset.

### Scale — bigger and heavier than v1

| Token | Size / LH / Weight | Use |
|---|---|---|
| `--t-hero` | 44 / 1.1 / 800 | Celebration screens, XP totals |
| `--t-h1` | 32 / 1.2 / 800 | Page titles |
| `--t-h2` | 24 / 1.3 / 700 | Section headings |
| `--t-probe` | 26 / 1.45 / 600 | **The probe question** — still the most important text in the product |
| `--t-h3` | 18 / 1.4 / 700 | Card titles |
| `--t-body` | 16 / 1.6 / 400 | Body. **1.6 line-height floor stays** — Vietnamese diacritics collide below it |
| `--t-small` | 14 / 1.55 / 500 | Secondary |
| `--t-micro` | 12 / 1.35 / 700 | Labels, uppercase, tracked |

---

## 2. Colour

### Base — bright, clean, high-energy

```
--bg          #FFFFFF   page
--bg-soft     #F7F9FC   wells, secondary surfaces
--ink         #2B2B3A   primary text (blue-black, not pure black)
--ink-soft    #6A6A82
--ink-faint   #9A9AB0
--line        #E4E8F0   borders — 2px, not hairline
```

### Core hues

```
--jade        #14C79B   primary — GRASP's identity colour. Bright jade
--jade-dark   #0FA07C   the 3D shadow beneath jade buttons
--gold        #FFB020   XP, celebration, streak
--gold-dark   #D98E0C
--sky         #2BB3F0   info, secondary actions
--sky-dark    #1892CC
--violet      #A162F7   mastery, rare unlocks
--violet-dark #8341D9
--amber       #FF8A3D   "chưa vững" — not yet solid
--amber-dark  #E06A1F
```

Jade rather than Duolingo's yellow-green: it keeps GRASP's identity, carries a Vietnamese jade/bamboo association, and avoids reading as a clone.

### The red question — resolved by being Duolingo-faithful

**There is still no red in GRASP.** Not as a v1 holdover, but because Duolingo's own results screens are *celebratory regardless of accuracy* — it shows XP earned and streak extended, never a shaming red summary. GRASP has no "wrong answer" moment either: a shallow answer triggers a follow-up question, not a rejection.

Where v1 would have said "low score," v2 says **`--amber` + "chưa vững"** (not yet solid) — warm, energetic, forward-looking. Amber carries the game energy without asserting failure.

### Quadrant hues — brighter, still matched

```
--q-mastery         #14C79B   jade
--q-hollow          #FF8A3D   amber
--q-expression-gap  #2BB3F0   sky
--q-needs-support   #A162F7   violet
```

Saturated to match the new system, but the v1 rule holds: **matched chroma, no red, no traffic light.** Squint at the 2×2 and no quadrant jumps out. An alarm-red "Rỗng" dot would turn the matrix into the artefact GRASP exists to replace. This is enforceable — if a change makes one quadrant visually louder, it has broken FR-501 in spirit even if the copy audit passes.

---

## 3. The 3D push button — the signature component

Duolingo's most recognisable element. A solid fill with a solid darker slab beneath; on press the button drops into its own shadow.

```css
.btn3d {
  background: var(--jade);
  box-shadow: 0 4px 0 var(--jade-dark);
  border-radius: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: transform 60ms, box-shadow 60ms;
}
.btn3d:active { transform: translateY(4px); box-shadow: 0 0 0 var(--jade-dark); }
```

Rules: never a gradient fill. Never a blur shadow — the slab is solid colour. Press travel equals shadow depth exactly. Every variant (jade / gold / sky / violet / neutral) uses its own `-dark` token. Minimum height 52px on primary actions.

---

## 4. Shape and motion

**Chunky geometry.** Radii: `12px` small, `16px` buttons, `20px` cards, `28px` panels, `999px` pills. Borders are **2px solid**, never hairline. Cards sit on `--bg-soft` with a 2px `--line` border and a `0 2px 0` solid bottom edge — flat and physical, not glassy.

**Motion is bouncy, not smooth.**

```
--ease-bounce  cubic-bezier(0.34, 1.56, 0.64, 1)   /* overshoots — the game feel */
--ease-out     cubic-bezier(0.22, 1, 0.36, 1)
--dur-press    60ms
--dur-pop      280ms
--dur-cel      600ms
```

Celebration: XP counts up, badges pop in with overshoot and stagger, confetti bursts once. Transform and opacity only. `prefers-reduced-motion` disables all of it and shows final states immediately.

**The defense screen stays calm.** It gets the bright palette and chunky buttons, but no confetti, no mascot animation mid-question, no bouncing timer. The celebration comes *after*. A student mid-thought under a running clock does not need a dancing buffalo.

---

## 5. Nghé — the mascot

A stylised **baby water buffalo** (`nghé`). Duolingo has Duo the owl; a generic owl would read as a clone.

Why a buffalo: the trâu is a Vietnamese cultural icon of diligence — *"chăm chỉ như trâu"* (hard-working as a buffalo). Culturally specific, instantly legible to the audience, and nobody else has it.

**States:** `idle` · `thinking` (during analysis) · `cheer` (completion) · `encourage` (a shallow answer — supportive, never disappointed) · `sleep` (streak at risk).

**Rules.** Nghé never appears during a probe. Nghé is never disappointed, sad, or disapproving — an accusing mascot is still an accusation (FR-501). Nghé never appears in the lecturer console. Ship as SVG; a flat 3-colour build is enough for the pilot.

---

## 6. Game systems

| System | Vietnamese | Earned by | Never |
|---|---|---|---|
| **XP** | Điểm KN | Completing a defense (+50), a follow-up (+10), same-day submission (+20) | Scoring well. Effort only |
| **Streak** | Chuỗi ngày | Any defense on a given day | Broken by a low score |
| **Concept Map** | Bản đồ kiến thức | A concept unlocks when explained at D2 ≥ 3.5 | Locked or removed once earned |
| **Badges** | Huy hiệu | Milestones: first defense, 7-day streak, 10 concepts, first D4 ≥ 4.0 | Awarded for outscoring a peer |
| **League** | Giải đấu | Weekly XP among ~20 anonymised students | Ranked on understanding scores |

> **The single hard rule:** every visible reward is earned by **showing up and trying**, never by scoring highly. This is what makes gamification safe on a graded assessment — and it is exactly how Duolingo works.

**The Concept Map is the strategic one.** It is the business plan's *Understanding Portfolio* made visible: a growing constellation of concepts the student can demonstrably explain. Better for a scholarship application than a transcript of grades, and it makes the learning-first thesis something a student can *see accumulating*.

---

## 7. Screens

### 7.1 `/` — Home *(new in v2)*

Duolingo's home screen, adapted. Top bar: streak 🔥 · XP · league badge. Centre: the **Concept Map** — a vertical winding path of concept nodes (locked grey / unlocked jade / mastered gold), scrolling upward as it grows. Nghé sits beside the next node. Below: assignments due, each a chunky card with a jade 3D CTA.

### 7.2 `/defend/[sessionId]` — the defense *(hero)*

```
┌──────────────────────────────────────────┐
│  ✕   ▓▓▓▓▓▓▓▓░░░░░░░░           06:12    │  progress + timer
│                                          │
│   ┃ "Chính sách Đổi Mới năm 1986…"       │  their own words
│                                          │
│   Nếu dòng vốn FDI đầu thập niên 1990     │  probe, 26px/600
│   không xuất hiện, lập luận của bạn có    │
│   còn đứng vững không?                    │
│                                          │
│   ↳ Hãy chỉ ra một cơ chế cụ thể.        │  follow-up
│                                          │
│  ┌────────────────┐ ┌──────────────────┐ │
│  │  ◎ GIỮ ĐỂ NÓI  │ │  ▭ GÕ TRẢ LỜI   │ │  3D, EQUAL weight
│  └────────────────┘ └──────────────────┘ │
└──────────────────────────────────────────┘
```

- **Progress bar replaces v1's turn dots** — a filling jade bar, Duolingo-style.
- No app chrome beyond a close `✕`. Max width 680px, mobile-first.
- The quote span is still the emotional core — it makes the question read as *about my work* rather than *a test*.
- Timer stays monotone. **Never red, never pulsing.** Game energy lives in the buttons and the celebration, not in time pressure.
- Voice and typed are two identical 3D buttons — same size, same weight, side by side.

### 7.3 `/defend/[sessionId]/complete` — celebration *(new, hero)*

The Duolingo lesson-complete screen. Nghé cheering, confetti burst, **+80 XP** counting up, streak incremented, concepts unlocked popping in with stagger. Understanding score appears **below the fold** — celebrated for *finishing*, informed of the score second. One big jade CTA: **XEM PHẢN HỒI**.

### 7.4 `/feedback/[sessionId]`

Three chunky cards: **Bạn giải thích tốt** (jade) · **Chưa vững** (amber) · **Nên xem lại** (sky), each quoting their own words back. Nghé in the corner. Score with confidence at the bottom. **No quadrant label is ever shown to the student.**

### 7.5 `/assignments/[id]/matrix` — lecturer 2×2 *(hero, NOT gamified)*

Clean, dense, analytical. New palette, 2px borders, chunky radii — visually coherent with the student side, zero game mechanics. No XP, no streaks, no Nghé, no confetti. A lecturer needs 45 students on one screen.

Quadrant fills at 8% tint. Dots 10px with 2px white stroke. Legend gives the **teaching action**, not a definition: *"Rỗng — nên trao đổi trực tiếp"*, never *"likely cheated"*.

### 7.6 `/sessions/[id]` — evidence bundle *(hero, NOT gamified)*

Transcript left, scores right. D1–D5 as chunky rounded bars. **`OverrideControl` is the easiest action on the page** — big 3D `−`/`+` steppers, live, no modal, no save button. It writes the calibration dataset; friction here is a strategic cost.

### 7.7 Supporting

`/submit` — drop zone, Nghé `thinking` during analysis, honest status copy, one jade CTA on ready. `/login` — Nghé + one card. `/courses`, `/assignments/[id]` (lecturer) — clean roster tables.

---

## 8. Responsive

| Breakpoint | Behaviour |
|---|---|
| `< 768px` | Single column, `px-16`. **Defense and Home are designed mobile-first** — this is a phone product for students |
| `768–1023px` | Two-column where natural |
| `≥ 1024px` | Full layouts; lecturer sidebar fixed 240px |

`min-h-[100dvh]`, never `h-screen` — iOS Safari's collapsing toolbar otherwise clips the answer buttons mid-session.

---

## 9. Accessibility

- **Typed input is visually and functionally equal to voice.** Same 3D button, same size, same scoring. A student who never speaks must not be able to tell.
- Tap targets ≥ 52px on primary actions (3D buttons are naturally large).
- Text ≥ AA against its fill. **White on `--gold` fails** — gold buttons use `--ink` text.
- Defense screen fully keyboard-operable: `Tab`, `Cmd/Ctrl+Enter` to submit, `Space` to hold-to-record.
- `prefers-reduced-motion` kills every animation and shows final states.
- Colour never sole carrier: quadrants labelled, confidence worded, badges captioned.

---

## 10. Copy

Vietnamese UI, English code. All strings in `lib/i18n/vi.ts` — never inline, or the FR-501 audit can't see them.

**Tone shifts to warm and encouraging** for students: *"Tuyệt vời!"*, *"Bạn đang tiến bộ!"*, *"Chưa vững — cùng xem lại nhé"*. Lecturer surfaces stay precise and unhedged.

| Never | Instead |
|---|---|
| gian lận · đạo văn · cheat · plagiarism · AI-generated | **No equivalent exists. Do not paraphrase around it** |
| "Sai" / "Wrong" | "Chưa vững" — not yet solid |
| "Điểm thấp" | "Chưa giải thích được" |
| "Nghi ngờ" | "Nên trao đổi thêm" |
| A bare score | A score **with** its confidence |

---

## 11. What is deliberately absent

Revised from v1 — three bans lifted, four kept, one added.

**Lifted in v2:** ~~no gamification~~ · ~~no progress bar~~ · ~~no peer comparison~~ (leagues are XP/effort-based, which is safe).

**Still absent, and these are load-bearing:**
- **No hearts or lives.** A graded assessment must never be failable by a mechanic.
- **No red anywhere.** Amber for "chưa vững". Duolingo's results screens are celebratory too.
- **No integrity-signal UI.** Paste events and latency are stored and exportable, never rendered (FR-307, FR-501).
- **No ranking by understanding score.** Leagues rank XP — effort — only.
- **No gamification in the lecturer console.** Exactly as Duolingo for Schools does it.

**New in v2:** no confetti, mascot, or celebration *during* a probe. The reward comes after the thinking.
