# GRASP — Click-by-Click Demo Recording Script

Verified live against the running app on 2026-07-26. Every URL and account below returns 200 right now. Follow it exactly, in order — do not skip ahead or click things not listed.

## ⚠️ Before you press record

1. **Start the server yourself:** `pnpm dev` in the project root, wait for "Ready" in the terminal, then open `http://localhost:3000/login` once in a normal tab to force the first (slow) compile — this warm-up load can take 30–90s and you don't want it happening on camera.
2. **Use your own browser** (Chrome/Edge), not a dev tool automation pane. Full-screen it, or resize to exactly **1280×800** if you want clean margins. Zoom = 100%.
3. **Close other tabs, mute notifications.**
4. **Only click what this script tells you to.** Two buttons look tempting but will break the recording because they call the AI provider (Groq), which is geo-blocked on this network right now:
   - ❌ Do **not** click "Nộp và phân tích" (submit a new essay) on any submit page.
   - ❌ Do **not** start a brand-new defense session ("Bắt đầu vấn đáp") on an unstarted assignment.
   Everything in this script below either **views already-completed data** (safe, instant, no AI) or **saves a plain database write** (override, product score — also safe, no AI). Stick to the script and nothing will spin or error on camera.
5. Database is currently clean — no stray overrides, no appeals. What you see is a first-time state.

## Accounts

| Role | Email | Password |
|---|---|---|
| Lecturer | `lecturer@grasp.demo` | `GraspDemo2026!` |
| Student (Nguyễn Minh Anh) | `student.a@grasp.demo` | `GraspDemo2026!` |

## Exact URLs used in this script (bookmark or type these — don't rely on nav clicks to get the exact ones)

| # | Screen | URL |
|---|---|---|
| A | Login | `http://localhost:3000/login` |
| B | Lecturer → course | `http://localhost:3000/lecturer/courses/30000000-0000-4000-8000-000000000001` |
| C | Assignment detail | `http://localhost:3000/lecturer/assignments/50000000-0000-4000-8000-000000000001` |
| D | Analysis (Nguyễn Minh Anh's submission) | `http://localhost:3000/lecturer/submissions/60000000-0000-4000-8000-000000000001` |
| E | Cohort 2×2 matrix | `http://localhost:3000/lecturer/assignments/50000000-0000-4000-8000-000000000001/matrix` |
| F | Evidence bundle (Đặng Văn Khoa — Hollow quadrant) | `http://localhost:3000/lecturer/sessions/90000000-0000-4000-8000-000000000006` |
| G | Student result screen (Nguyễn Minh Anh) | `http://localhost:3000/student/defend/90000000-0000-4000-8000-000000000001` |

---

## TAKE 1 — Lecturer side (~45–55s of footage)

**1. Log in as lecturer.**
Go to **[A]**. Type `lecturer@grasp.demo` / `GraspDemo2026!`. Click **"Đăng nhập."**
→ Lands on the courses list, shows "Tư duy phản biện · Học kỳ 1 — 2026."

**2. Open the course.**
Navigate to **[B]** (or click the course card "Tư duy phản biện").
→ Shows the published assignment "Phân tích lập luận chính sách" and 14 enrolled students.

**3. Open the assignment.**
Click **"Phân tích lập luận chính sách"** (or navigate to **[C]**).
→ Shows the prompt, subject concepts, probe count (6), time cap, and the submissions list (13 ready + 1 pending).

**4. Show the AI analysis of one essay.**
Click on **"Nguyễn Minh Anh"** in the submissions list (or navigate to **[D]**).
→ This is the "what GRASP extracted" moment. Point out, top to bottom:
   - **"Năng lực (GDPT 2018)"** card with the 4 competency chips (GQVĐ 3.1, GQVĐ 2.3, NLNN 4.2, TDPB 1.3) — *this is the GDPT-2018 competency classification.*
   - **"Câu hỏi vấn đáp đã chọn"** — the 3 AI-fragile probes, each with its fragility score/hint.
   - Scroll to show the Claim Graph coverage line.

**5. Click "Xem ma trận 2×2" (top-right button on the assignment page), or navigate to [E].**
→ **The hero shot.** Full class scatter, 13 dots across all four quadrants, legend below with plain-language teaching actions per quadrant, "1 sinh viên chưa đủ dữ liệu" card at the bottom (Đỗ Gia Hân).
   - Hold this shot for 3–4 seconds before moving — this is your money visual, don't rush it.

**6. Click the dot for Đặng Văn Khoa** (Hollow quadrant — high product score 7.5, low understanding 3.0), or navigate straight to **[F]**.
→ **Evidence bundle.** Scroll to show, in order:
   - Header pill: **"Vị trí trên ma trận: Rỗng"**
   - Left column: the 3 transcript turns with the actual question + the student's typed answer.
   - Right column: **"Điểm bài viết (/10)"** stepper (currently 7.5), composite **3.0/5** with its confidence range, then all 5 dimension cards with rationale.

**7. Demonstrate the one-click override (live, on camera).**
Scroll to the gold **"Điều chỉnh điểm"** card at the bottom of the right column.
Click the **+** button next to any one dimension **once** (e.g. "Vận dụng vào trường hợp mới").
→ Watch the number change instantly and **"✓ Đã lưu"** appear within ~1 second — no save button, no confirm dialog. Say out loud: *"That just wrote to the calibration dataset — no modal, no confirm."*

*(Optional: also nudge the "Điểm bài viết (/10)" stepper once to show that control saves live too.)*

---

## TAKE 2 — Student side (~15–20s of footage)

**8. Log out, log back in as the student.**
Click **"Đăng xuất"** (top-right of the lecturer console), then log in at **[A]** with `student.a@grasp.demo` / `GraspDemo2026!`.

**9. Go straight to the results screen.**
Navigate to **[G]**.
→ Shows: **"Bạn đã hoàn thành phần vấn đáp"** → composite score **4.4/5** with confidence range and label → all 5 dimension cards with citations quoted from the student's own answers → the green **"Phản hồi học tập dành cho bạn"** card (strengths, one gap, concepts to revise).
   - Scroll slowly through this once — it's the "the student gets something too" beat.

---

## TAKE 3 — Terminal, live gate (~10s of footage)

**10. Switch to a terminal window** (pre-positioned, font size large enough to read on camera) already `cd`'d into the project folder.

**11. Type and run:**
```bash
pnpm eval:calibration
```
→ Let it print fully. It ends on:
```
composite Pearson r: 0.999  (gate > 0.7)

GATE G1: PASS ✅
```
Hold on this line for 2–3 seconds before cutting.

---

## Recap — shot list in filming order

1. Login (lecturer) — 3s
2. Course → assignment — 5s
3. Analysis page, competency chips + probes — 10s
4. 2×2 matrix, full class — 6s
5. Click into evidence bundle (Đặng Văn Khoa) — 10s
6. Live override click + "Đã lưu" — 8s
7. Logout → login (student) — 5s
8. Student result screen scroll — 12s
9. Terminal `pnpm eval:calibration` → GATE G1: PASS — 8s

**Total: ~65–70s** — matches the demo slot in the 5-minute video script. If you're recording a longer standalone finals demo instead, you have room to slow down steps 4–6 and narrate more.

## If something looks wrong when you get there

- **A page 500s or the matrix looks empty:** the dev server likely died or `.next` cache got corrupted from a prior crash. Stop it, delete the `.next` folder, run `pnpm dev` again, and re-warm `/login` before recording.
- **"Đã điều chỉnh" (overridden) tag already showing on a student before you click anything:** someone (or a prior test) left an override in the DB. Clear it with `DELETE FROM overrides;` in psql, or just pick a different quadrant dot for step 6.
- **Login redirects back to /login in a loop:** stale session cookie — clear cookies for localhost:3000 or use an incognito window.
