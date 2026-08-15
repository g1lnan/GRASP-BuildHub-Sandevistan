import type { FeedbackOutput } from '@/lib/ai/feedback-schemas'
import type { FeedbackModel, FeedbackModelResult } from '@/lib/ai/feedback-types'
import { FeedbackModelError } from '@/lib/ai/feedback-types'
import type { ScoringOutput } from '@/lib/ai/scoring-schemas'
import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import {
  type FeedbackContext,
  type FeedbackReportRecord,
  type FeedbackRepository,
  type LockedFeedbackRepository,
  type NewFeedbackReport,
  finalizeSessionFeedback,
} from '@/lib/services/feedback-service'
import type { UsageEventRow, UsageRepository } from '@/lib/usage/record'
import { describe, expect, it } from 'vitest'

const institutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000001')
const studentId = userIdSchema.parse('20000000-0000-4000-8000-000000000001')
const otherStudentId = userIdSchema.parse('20000000-0000-4000-8000-000000000002')
const actor: Actor = { id: studentId, institutionId, role: 'student' }
const otherActor: Actor = { id: otherStudentId, institutionId, role: 'student' }
const sessionId = '80000000-0000-4000-8000-000000000001'
const submissionId = '60000000-0000-4000-8000-000000000001'

const transcript =
  'Tôi thấy nguyên nhân làm thay đổi kết quả, nhưng mẫu khảo sát còn khá nhỏ nên cần thận trọng.'
const score: ScoringOutput = Object.fromEntries(
  ['d1Recall', 'd2Explanation', 'd3Application', 'd4Evaluation', 'd5Metacognition'].map((key) => [
    key,
    {
      score: 3.5,
      rationaleVi: 'Câu trả lời cho thấy mức độ hiểu tương đối rõ ràng về khái niệm này.',
      citations: [{ turnOrdinal: 1, quote: 'nguyên nhân làm thay đổi kết quả' }],
    },
  ]),
) as ScoringOutput

const output: FeedbackOutput = {
  strengths: [
    {
      concept: 'Quan hệ nhân quả',
      explanationVi: 'Bạn đã giải thích được quan hệ giữa nguyên nhân và kết quả.',
      citations: [{ turnOrdinal: 1, quote: 'nguyên nhân làm thay đổi kết quả' }],
    },
    {
      concept: 'Bằng chứng định lượng',
      explanationVi: 'Bạn đã dựa vào số liệu cụ thể trong bài để hỗ trợ kết luận.',
      citations: [{ turnOrdinal: 0, quote: 'dữ liệu khảo sát cho thấy mức tăng 20%' }],
    },
  ],
  gaps: [
    {
      concept: 'Giới hạn của mẫu',
      explanationVi: 'Bạn nhận ra giới hạn nhưng cần phân tích ảnh hưởng đến kết luận.',
      citations: [{ turnOrdinal: 1, quote: 'mẫu khảo sát còn khá nhỏ' }],
    },
  ],
  reviseConcepts: ['Sai lệch chọn mẫu'],
  bodyVi:
    'Bạn đã giải thích tốt quan hệ nhân quả và cách dùng dữ liệu. Hãy xem lại sai lệch chọn mẫu để đánh giá giới hạn của kết luận chặt chẽ hơn.',
}
const firstGap = output.gaps[0]
if (firstGap === undefined) throw new Error('Feedback fixture requires a gap')

const context: FeedbackContext = {
  sessionId,
  submissionId,
  studentId,
  institutionId,
  status: 'completed',
  submissionText: 'Bài viết dùng dữ liệu khảo sát cho thấy mức tăng 20% trong một năm.',
  turns: [{ ordinal: 1, questionVi: 'Bạn đánh giá giới hạn nào?', transcript }],
  score,
}

class FeedbackRepositoryFake implements FeedbackRepository {
  created: NewFeedbackReport | null = null
  private lock: Promise<void> = Promise.resolve()

  constructor(
    private readonly contextValue: FeedbackContext | null = context,
    private record: FeedbackReportRecord | null = null,
  ) {}

  async findContext(): Promise<FeedbackContext | null> {
    return this.contextValue
  }

  async findBySessionId(): Promise<FeedbackReportRecord | null> {
    return this.record
  }

  async runExclusive<T>(
    _sessionId: string,
    operation: (reports: LockedFeedbackRepository) => Promise<T>,
  ): Promise<T> {
    const previous = this.lock
    let release: () => void = () => {}
    this.lock = new Promise<void>((resolve) => {
      release = resolve
    })
    await previous
    try {
      return await operation(this)
    } finally {
      release()
    }
  }

  async create(input: NewFeedbackReport): Promise<FeedbackReportRecord> {
    this.created = input
    this.record = { id: 'b0000000-0000-4000-8000-000000000001', ...input }
    return this.record
  }
}

class UsageRepositoryFake implements UsageRepository {
  readonly rows: UsageEventRow[] = []
  async record(row: UsageEventRow): Promise<void> {
    this.rows.push(row)
  }
}

class FeedbackModelFake implements FeedbackModel {
  readonly provider = 'groq'
  readonly model = 'openai/gpt-oss-20b'
  calls = 0

  constructor(private readonly implementation: () => Promise<FeedbackModelResult>) {}

  async generate(): Promise<FeedbackModelResult> {
    this.calls += 1
    return this.implementation()
  }
}

const result: FeedbackModelResult = {
  output,
  provider: 'groq',
  model: 'openai/gpt-oss-20b',
  promptVersion: 'feedback-v1',
  tokens: { inputTokens: 1_000, outputTokens: 500, cacheReadTokens: 0, cacheCreationTokens: 0 },
}

describe('finalizeSessionFeedback', () => {
  it('persists an evidence-grounded report and records model cost', async () => {
    const reports = new FeedbackRepositoryFake()
    const usage = new UsageRepositoryFake()
    const model = new FeedbackModelFake(async () => result)

    const view = await finalizeSessionFeedback({ reports, usage, model, actor, sessionId })

    expect(view).toMatchObject({ sessionId, strengths: output.strengths, gaps: output.gaps })
    expect(reports.created).toMatchObject({
      output,
      model: 'openai/gpt-oss-20b',
      promptVersion: 'feedback-v1',
    })
    expect(model.calls).toBe(1)
    expect(usage.rows).toHaveLength(1)
    expect(usage.rows[0]).toMatchObject({ stage: 'feedback', sessionId, submissionId })
  })

  it('returns an existing report without model spend', async () => {
    const existing: FeedbackReportRecord = {
      id: 'b0000000-0000-4000-8000-000000000001',
      sessionId,
      output,
      model: 'openai/gpt-oss-20b',
      promptVersion: 'feedback-v1',
    }
    const usage = new UsageRepositoryFake()
    const model = new FeedbackModelFake(async () => result)
    const view = await finalizeSessionFeedback({
      reports: new FeedbackRepositoryFake(context, existing),
      usage,
      model,
      actor,
      sessionId,
    })

    expect(view.id).toBe(existing.id)
    expect(model.calls).toBe(0)
    expect(usage.rows).toHaveLength(0)
  })

  it('authorizes and validates terminal session state before model spend', async () => {
    const usage = new UsageRepositoryFake()
    const model = new FeedbackModelFake(async () => result)
    await expect(
      finalizeSessionFeedback({
        reports: new FeedbackRepositoryFake(),
        usage,
        model,
        actor: otherActor,
        sessionId,
      }),
    ).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
    await expect(
      finalizeSessionFeedback({
        reports: new FeedbackRepositoryFake({ ...context, status: 'in_progress' }),
        usage,
        model,
        actor,
        sessionId,
      }),
    ).rejects.toMatchObject({ name: 'SessionNotFinalizableError' })
    expect(model.calls).toBe(0)
  })

  it('retries failures and records every attempted call', async () => {
    const usage = new UsageRepositoryFake()
    const model = new FeedbackModelFake(async () => {
      throw new FeedbackModelError('provider failed', {
        inputTokens: 100,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      })
    })
    await expect(
      finalizeSessionFeedback({
        reports: new FeedbackRepositoryFake(),
        usage,
        model,
        actor,
        sessionId,
        retryDelay: async () => undefined,
      }),
    ).rejects.toMatchObject({ name: 'FeedbackUnavailableError' })
    expect(model.calls).toBe(3)
    expect(usage.rows.map((row) => row.stage)).toEqual([
      'feedback_failed',
      'feedback_failed',
      'feedback_failed',
    ])
  })

  it('rejects invented evidence and never persists it', async () => {
    const reports = new FeedbackRepositoryFake()
    const model = new FeedbackModelFake(async () => ({
      ...result,
      output: {
        ...output,
        gaps: [
          {
            ...firstGap,
            citations: [{ turnOrdinal: 1, quote: 'nội dung không có trong câu trả lời' }],
          },
        ],
      },
    }))
    await expect(
      finalizeSessionFeedback({
        reports,
        usage: new UsageRepositoryFake(),
        model,
        actor,
        sessionId,
        retryDelay: async () => undefined,
      }),
    ).rejects.toMatchObject({ name: 'InvalidFeedbackEvidenceError' })
    expect(reports.created).toBeNull()
    expect(model.calls).toBe(3)
  })

  it('serializes concurrent generation so only one call is billed', async () => {
    const reports = new FeedbackRepositoryFake()
    const usage = new UsageRepositoryFake()
    const model = new FeedbackModelFake(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return result
    })
    const [first, second] = await Promise.all([
      finalizeSessionFeedback({ reports, usage, model, actor, sessionId }),
      finalizeSessionFeedback({ reports, usage, model, actor, sessionId }),
    ])

    expect(first.id).toBe(second.id)
    expect(model.calls).toBe(1)
    expect(usage.rows.map((row) => row.stage)).toEqual(['feedback'])
  })
})
