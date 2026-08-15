import { randomUUID } from 'node:crypto'
import { audioDurationSeconds } from '@/lib/asr/audio-duration'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'

const STUDENT_EMAIL = 'student.a@grasp.demo'
const PASSWORD = 'GraspDemo2026!'
const STUDENT_ID = '20000000-0000-4000-8000-000000000002'
const ASSIGNMENT_ID = '50000000-0000-4000-8000-000000000001'

const probeTexts = [
  'Vì sao bạn chọn luận điểm đầu tiên?',
  'Bằng chứng nào quan trọng nhất?',
  'Điều gì thay đổi trong một trường hợp mới?',
  'Giới hạn của lập luận này là gì?',
  'Bạn còn chưa chắc chắn ở điểm nào?',
] as const

const claimNodes = probeTexts.map((_, index) => ({
  id: `c${index + 1}`,
  kind: index === 0 ? 'thesis' : 'claim',
  text: `Luận điểm ${index + 1} trong bài làm của tôi.`,
  quoteSpan: { start: index * 20, end: index * 20 + 18 },
  concepts: [`khái niệm ${index + 1}`],
  confidence: 0.9,
}))

const scoreResponse = {
  id: 'a0000000-0000-4000-8000-000000000001',
  sessionId: '80000000-0000-4000-8000-000000000001',
  dimensions: {
    d1Recall: {
      score: 4.2,
      rationaleVi: 'Bạn đã nhắc lại chính xác luận điểm trung tâm bằng lời của mình.',
      citations: [{ turnOrdinal: 1, quote: 'Câu trả lời đã lưu cho câu hỏi 1.' }],
    },
    d2Explanation: {
      score: 4,
      rationaleVi: 'Bạn đã giải thích được nguyên nhân chính và liên hệ với bài làm.',
      citations: [{ turnOrdinal: 2, quote: 'Câu trả lời đã lưu cho câu hỏi 2.' }],
    },
    d3Application: {
      score: 3.8,
      rationaleVi: 'Bạn đã vận dụng được luận điểm vào tình huống được đặt ra.',
      citations: [{ turnOrdinal: 3, quote: 'Câu trả lời đã lưu cho câu hỏi 3.' }],
    },
    d4Evaluation: {
      score: 3.6,
      rationaleVi: 'Bạn đã nêu được một giới hạn nhưng phương án khác còn ngắn.',
      citations: [{ turnOrdinal: 4, quote: 'Câu trả lời đã lưu cho câu hỏi 4.' }],
    },
    d5Metacognition: {
      score: 3.5,
      rationaleVi: 'Bạn đã xác định được một điểm trong lập luận cần xem lại.',
      citations: [{ turnOrdinal: 5, quote: 'Câu trả lời đã lưu cho câu hỏi 5.' }],
    },
  },
  composite: 3.9,
  confidence: { low: 3.5, high: 4.3, label: 'high', recommendationVi: null },
  feedback: {
    id: 'b0000000-0000-4000-8000-000000000001',
    sessionId: '80000000-0000-4000-8000-000000000001',
    strengths: [
      {
        concept: 'Giải thích luận điểm',
        explanationVi:
          'Bạn đã giải thích luận điểm chính bằng lời của mình và giữ được mạch lập luận.',
        citations: [{ turnOrdinal: 1, quote: 'Câu trả lời đã lưu cho câu hỏi 1.' }],
      },
      {
        concept: 'Sử dụng bằng chứng',
        explanationVi: 'Bạn đã lựa chọn bằng chứng phù hợp để hỗ trợ cho kết luận trong bài.',
        citations: [{ turnOrdinal: 2, quote: 'Câu trả lời đã lưu cho câu hỏi 2.' }],
      },
    ],
    gaps: [
      {
        concept: 'Đánh giá giới hạn',
        explanationVi:
          'Bạn đã nhận ra một giới hạn nhưng cần phân tích sâu hơn tác động của giới hạn đó.',
        citations: [{ turnOrdinal: 4, quote: 'Câu trả lời đã lưu cho câu hỏi 4.' }],
      },
    ],
    reviseConcepts: ['Giới hạn của lập luận'],
    bodyVi:
      'Bạn đã bảo vệ tốt luận điểm và cách dùng bằng chứng. Bước tiếp theo là xem lại giới hạn của lập luận và giải thích rõ giới hạn đó ảnh hưởng thế nào đến kết luận.',
  },
} as const

test.describe('typed defense session', () => {
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl === undefined) throw new Error('DATABASE_URL is required for defense E2E')
  const sql = postgres(databaseUrl, { max: 1, prepare: false })

  let submissionId = ''
  let claimGraphId = ''

  test.beforeEach(async () => {
    submissionId = randomUUID()
    claimGraphId = randomUUID()

    await sql`
      insert into submissions
        (id, assignment_id, student_id, source, extracted_text, word_count, status)
      values
        (
          ${submissionId},
          ${ASSIGNMENT_ID},
          ${STUDENT_ID},
          'text',
          'Bài làm kiểm thử vấn đáp với năm luận điểm riêng.',
          10,
          'ready'
        )
    `
    await sql`
      insert into claim_graphs
        (id, submission_id, version, model, prompt_version, nodes, edges, concepts)
      values
        (
          ${claimGraphId},
          ${submissionId},
          1,
          'e2e-seed',
          'e2e-v1',
          ${sql.json(claimNodes)},
          ${sql.json([])},
          ${sql.json(['khái niệm'])}
        )
    `
    for (const [index, textVi] of probeTexts.entries()) {
      await sql`
        insert into probes
          (
            id,
            claim_graph_id,
            claim_node_id,
            ordinal,
            probe_type,
            bloom_level,
            text_vi,
            expected_signals,
            ai_fragility_score,
            selected
          )
        values
          (
            ${randomUUID()},
            ${claimGraphId},
            ${`c${index + 1}`},
            ${index + 1},
            'self_critique',
            'analyse',
            ${textVi},
            ${sql.json(['giải thích bằng lời của mình'])},
            0.8,
            true
          )
      `
    }
  })

  test.afterEach(async () => {
    await sql`delete from sessions where submission_id = ${submissionId}`
    await sql`delete from probes where claim_graph_id = ${claimGraphId}`
    await sql`delete from claim_graphs where id = ${claimGraphId}`
    await sql`delete from submissions where id = ${submissionId}`
  })

  test.afterAll(async () => {
    await sql.end()
  })

  test('shows and persists exactly one typed probe at a time', async ({ page }) => {
    await page.route('**/api/sessions/*/finalize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(scoreResponse),
      })
    })
    await page.goto('/login')
    await page.fill('input[name="email"]', STUDENT_EMAIL)
    await page.fill('input[name="password"]', PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL('/student')

    await page.goto(`/student/submissions/${submissionId}`)
    await page.getByRole('button', { name: 'Bắt đầu vấn đáp' }).click()
    await expect(page).toHaveURL(/\/student\/defend\/[0-9a-f-]+$/, { timeout: 15_000 })
    await expect(page.getByText('Câu hỏi 1', { exact: true })).toBeVisible()
    await expect(page.getByText(probeTexts[0], { exact: true })).toBeVisible()
    await expect(page.getByText(probeTexts[1], { exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Trả lời bằng giọng nói' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Nhập câu trả lời' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    for (const [index, probeText] of probeTexts.entries()) {
      await expect(page.getByText(probeText, { exact: true })).toBeVisible()
      const answer = `Câu trả lời đã lưu cho câu hỏi ${index + 1}.`
      await page.getByLabel('Câu trả lời của bạn').fill(answer)
      await page.getByRole('button', { name: 'Gửi câu trả lời' }).click()
      if (index < probeTexts.length - 1) {
        await expect(page.getByText(`Câu hỏi ${index + 2}`, { exact: true })).toBeVisible()
      }
    }

    await expect(
      page.getByRole('heading', { name: 'Bạn đã hoàn thành phần vấn đáp' }),
    ).toBeVisible()
    await expect(page.getByText('Mức độ hiểu bài của bạn')).toBeVisible()
    await expect(page.getByText('3.9 / 5.0', { exact: true })).toBeVisible()
    await expect(page.getByText('Khoảng tin cậy: 3.5–4.3 · Độ tin cậy cao')).toBeVisible()
    await expect(page.getByText(scoreResponse.dimensions.d1Recall.rationaleVi)).toBeVisible()
    await expect(page.getByText('Phản hồi học tập dành cho bạn')).toBeVisible()
    await expect(page.getByText(scoreResponse.feedback.bodyVi)).toBeVisible()
    await expect(page.getByText('Giải thích luận điểm', { exact: true })).toBeVisible()
    await expect(page.getByText('Giới hạn của lập luận', { exact: true })).toBeVisible()
    await expect(
      page.getByText(`“${scoreResponse.dimensions.d1Recall.citations[0].quote}”`, { exact: true }),
    ).toBeVisible()

    const persisted = await sql<
      {
        session_id: string
        session_status: string
        session_mode: string
        turn_count: number
        typed_turn_count: number
        claim_graph_id: string
        time_cap_seconds: number
      }[]
    >`
      select
        sessions.id as session_id,
        sessions.status as session_status,
        sessions.mode as session_mode,
        count(turns.id)::int as turn_count,
        count(turns.id) filter (where turns.input_mode = 'typed')::int as typed_turn_count,
        sessions.claim_graph_id,
        sessions.time_cap_seconds
      from sessions
      inner join turns on turns.session_id = sessions.id
      where sessions.submission_id = ${submissionId}
      group by sessions.id
    `
    expect(persisted[0]).toMatchObject({
      session_status: 'completed',
      session_mode: 'typed',
      turn_count: 5,
      typed_turn_count: 5,
      claim_graph_id: claimGraphId,
      time_cap_seconds: 480,
    })

    const persistedSessionId = persisted[0]?.session_id
    expect(persistedSessionId).toBeTruthy()
    if (persistedSessionId === undefined) throw new Error('Expected persisted session')
    await sql`
      insert into scores
        (
          session_id,
          d1_recall,
          d2_explanation,
          d3_application,
          d4_evaluation,
          d5_metacognition,
          composite,
          confidence_low,
          confidence_high,
          confidence_label,
          rationale,
          model,
          prompt_version
        )
      values
        (
          ${persistedSessionId},
          4.2,
          4.0,
          3.8,
          3.6,
          3.5,
          3.9,
          3.5,
          4.3,
          'high',
          ${sql.json(scoreResponse.dimensions)},
          'openai/gpt-oss-120b',
          'score-v1'
        )
    `
    await sql`
      insert into feedback_reports
        (session_id, strengths, gaps, revise_concepts, body_vi, model, prompt_version)
      values
        (
          ${persistedSessionId},
          ${sql.json(scoreResponse.feedback.strengths)},
          ${sql.json(scoreResponse.feedback.gaps)},
          ${sql.json(scoreResponse.feedback.reviseConcepts)},
          ${scoreResponse.feedback.bodyVi},
          'openai/gpt-oss-20b',
          'feedback-v1'
        )
    `
    const finalizeResponse = await page.request.post(`/api/sessions/${persistedSessionId}/finalize`)
    expect(finalizeResponse.status()).toBe(200)
    await expect(finalizeResponse.json()).resolves.toMatchObject({
      sessionId: persistedSessionId,
      composite: 3.9,
      confidence: { low: 3.5, high: 4.3, label: 'high' },
      feedback: {
        sessionId: persistedSessionId,
        strengths: scoreResponse.feedback.strengths,
        gaps: scoreResponse.feedback.gaps,
      },
    })
  })

  test('measures a real browser MediaRecorder clip on the server', async ({ page }) => {
    await page.goto('/login')
    const recording = await page.evaluate(async () => {
      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const destination = audioContext.createMediaStreamDestination()
      oscillator.connect(destination)
      const candidateTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg']
      const mimeType = candidateTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate))
      const recorder =
        mimeType === undefined
          ? new MediaRecorder(destination.stream)
          : new MediaRecorder(destination.stream, { mimeType })
      const chunks: Blob[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
      })

      oscillator.start()
      recorder.start(100)
      await new Promise((resolve) => window.setTimeout(resolve, 1_500))
      recorder.stop()
      oscillator.stop()
      await stopped
      await audioContext.close()

      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
      return {
        mimeType: blob.type,
        bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
      }
    })

    const measured = audioDurationSeconds(Buffer.from(recording.bytes), recording.mimeType)
    expect(measured).toBeGreaterThan(0.9)
    expect(measured).toBeLessThanOrEqual(2.2)
  })
})
