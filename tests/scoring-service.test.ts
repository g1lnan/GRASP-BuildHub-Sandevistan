import type { ScoringOutput } from '@/lib/ai/scoring-schemas'
import type { ScoringModel, ScoringModelResult } from '@/lib/ai/scoring-types'
import { ScoringModelError } from '@/lib/ai/scoring-types'
import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import {
  type LockedScoreRepository,
  type NewScore,
  type ScoreRecord,
  type ScoreRepository,
  type ScoringContext,
  finalizeSessionScore,
} from '@/lib/services/scoring-service'
import type { UsageEventRow, UsageRepository } from '@/lib/usage/record'
import { describe, expect, it } from 'vitest'

const institutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000001')
const studentId = userIdSchema.parse('20000000-0000-4000-8000-000000000001')
const otherStudentId = userIdSchema.parse('20000000-0000-4000-8000-000000000002')
const actor: Actor = { id: studentId, institutionId, role: 'student' }
const otherActor: Actor = { id: otherStudentId, institutionId, role: 'student' }
const sessionId = '80000000-0000-4000-8000-000000000001'
const submissionId = '60000000-0000-4000-8000-000000000001'

const transcript = 'Tôi chọn luận điểm này vì bằng chứng trong bài cho thấy tác động rõ ràng.'
const dimensions: ScoringOutput = {
  d1Recall: {
    score: 4.2,
    rationaleVi: 'Bạn đã nhắc lại đúng nội dung luận điểm chính trong bài làm.',
    citations: [{ turnOrdinal: 1, quote: 'Tôi chọn luận điểm này' }],
  },
  d2Explanation: {
    score: 4,
    rationaleVi: 'Bạn đã giải thích nguyên nhân bằng lời của mình khá rõ ràng.',
    citations: [{ turnOrdinal: 1, quote: 'vì bằng chứng trong bài' }],
  },
  d3Application: {
    score: 3.5,
    rationaleVi: 'Câu trả lời cho thấy khả năng vận dụng nhưng bằng chứng còn ngắn.',
    citations: [{ turnOrdinal: 1, quote: 'cho thấy tác động rõ ràng' }],
  },
  d4Evaluation: {
    score: 3,
    rationaleVi: 'Bạn đã đưa ra nhận định nhưng chưa phân tích đầy đủ phương án khác.',
    citations: [{ turnOrdinal: 1, quote: 'tác động rõ ràng' }],
  },
  d5Metacognition: {
    score: 2.8,
    rationaleVi: 'Câu trả lời chưa chỉ rõ phần nào trong lập luận còn chưa chắc chắn.',
    citations: [{ turnOrdinal: 1, quote: 'bằng chứng trong bài' }],
  },
}

const context: ScoringContext = {
  sessionId,
  submissionId,
  studentId,
  institutionId,
  status: 'completed',
  submissionText: 'Bài làm của sinh viên về tác động của chính sách.',
  rubricWeights: { d1: 0.15, d2: 0.3, d3: 0.25, d4: 0.2, d5: 0.1 },
  expectedProbeCount: 1,
  turns: [
    {
      probeId: '90000000-0000-4000-8000-000000000001',
      ordinal: 1,
      questionVi: 'Vì sao bạn chọn luận điểm này?',
      claimText: 'Luận điểm của tôi.',
      transcript,
      inputMode: 'typed',
      asrConfidence: null,
    },
  ],
}

class ScoreRepositoryFake implements ScoreRepository {
  created: NewScore | null = null
  private lock: Promise<void> = Promise.resolve()

  constructor(
    private readonly contextValue: ScoringContext | null = context,
    private record: ScoreRecord | null = null,
  ) {}

  async findContext(): Promise<ScoringContext | null> {
    return this.contextValue
  }

  async findBySessionId(): Promise<ScoreRecord | null> {
    return this.record
  }

  async runExclusive<T>(
    _sessionId: string,
    operation: (scores: LockedScoreRepository) => Promise<T>,
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

  async create(input: NewScore): Promise<ScoreRecord> {
    this.created = input
    this.record = { id: 'a0000000-0000-4000-8000-000000000001', ...input }
    return this.record
  }
}

class UsageRepositoryFake implements UsageRepository {
  readonly rows: UsageEventRow[] = []
  async record(row: UsageEventRow): Promise<void> {
    this.rows.push(row)
  }
}

class ScoringModelFake implements ScoringModel {
  readonly provider = 'groq'
  readonly model = 'openai/gpt-oss-120b'
  calls = 0

  constructor(private readonly implementation: () => Promise<ScoringModelResult>) {}

  async score(): Promise<ScoringModelResult> {
    this.calls += 1
    return this.implementation()
  }
}

const result: ScoringModelResult = {
  output: dimensions,
  provider: 'groq',
  model: 'openai/gpt-oss-120b',
  promptVersion: 'score-v1',
  tokens: { inputTokens: 2_000, outputTokens: 900, cacheReadTokens: 0, cacheCreationTokens: 0 },
}

describe('finalizeSessionScore', () => {
  it('persists five dimensions, deterministic confidence, and model cost', async () => {
    const scores = new ScoreRepositoryFake()
    const usage = new UsageRepositoryFake()
    const model = new ScoringModelFake(async () => result)

    const view = await finalizeSessionScore({ scores, usage, model, actor, sessionId })

    expect(model.calls).toBe(1)
    expect(scores.created).toMatchObject({
      sessionId,
      dimensions,
      confidenceLabel: 'high',
      model: 'openai/gpt-oss-120b',
      promptVersion: 'score-v1',
    })
    expect(view.composite).toBe(3.6)
    expect(view.confidence).toMatchObject({ low: 3.2, high: 4, label: 'high' })
    expect(usage.rows).toHaveLength(1)
    expect(usage.rows[0]).toMatchObject({
      stage: 'final_score',
      sessionId,
      submissionId,
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      inputTokens: 2_000,
      outputTokens: 900,
    })
  })

  it('is idempotent and does not spend on an already-scored session', async () => {
    const existing: ScoreRecord = {
      id: 'a0000000-0000-4000-8000-000000000001',
      sessionId,
      dimensions,
      composite: 3.7,
      confidenceLow: 3.3,
      confidenceHigh: 4.1,
      confidenceLabel: 'high',
      model: 'openai/gpt-oss-120b',
      promptVersion: 'score-v1',
    }
    const model = new ScoringModelFake(async () => result)
    const usage = new UsageRepositoryFake()

    const view = await finalizeSessionScore({
      scores: new ScoreRepositoryFake(context, existing),
      usage,
      model,
      actor,
      sessionId,
    })

    expect(view.id).toBe(existing.id)
    expect(model.calls).toBe(0)
    expect(usage.rows).toHaveLength(0)
  })

  it('serializes concurrent finalization so only one model call is billed', async () => {
    const scores = new ScoreRepositoryFake()
    const usage = new UsageRepositoryFake()
    const model = new ScoringModelFake(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return result
    })

    const [first, second] = await Promise.all([
      finalizeSessionScore({ scores, usage, model, actor, sessionId }),
      finalizeSessionScore({ scores, usage, model, actor, sessionId }),
    ])

    expect(first.id).toBe(second.id)
    expect(model.calls).toBe(1)
    expect(usage.rows.map((row) => row.stage)).toEqual(['final_score'])
  })

  it('authorises before model spend', async () => {
    const model = new ScoringModelFake(async () => result)
    const usage = new UsageRepositoryFake()
    const operation = finalizeSessionScore({
      scores: new ScoreRepositoryFake(),
      usage,
      model,
      actor: otherActor,
      sessionId,
    })

    await expect(operation).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
    expect(model.calls).toBe(0)
    expect(usage.rows).toHaveLength(0)
  })

  it('rejects an unfinished or empty session before model spend', async () => {
    const model = new ScoringModelFake(async () => result)
    const usage = new UsageRepositoryFake()
    await expect(
      finalizeSessionScore({
        scores: new ScoreRepositoryFake({ ...context, status: 'in_progress' }),
        usage,
        model,
        actor,
        sessionId,
      }),
    ).rejects.toMatchObject({ name: 'SessionNotFinalizableError' })
    await expect(
      finalizeSessionScore({
        scores: new ScoreRepositoryFake({ ...context, turns: [] }),
        usage,
        model,
        actor,
        sessionId,
      }),
    ).rejects.toMatchObject({ name: 'SessionHasNoTurnsError' })
    expect(model.calls).toBe(0)
  })

  it('retries failed calls, logs every attempt, and returns a typed failure', async () => {
    const model = new ScoringModelFake(async () => {
      throw new ScoringModelError('provider failed', {
        inputTokens: 100,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheCreationTokens: 0,
      })
    })
    const usage = new UsageRepositoryFake()

    const operation = finalizeSessionScore({
      scores: new ScoreRepositoryFake(),
      usage,
      model,
      actor,
      sessionId,
      retryDelay: async () => undefined,
    })

    await expect(operation).rejects.toMatchObject({ name: 'ScoringUnavailableError' })
    expect(model.calls).toBe(3)
    expect(usage.rows.map((row) => row.stage)).toEqual([
      'final_score_failed',
      'final_score_failed',
      'final_score_failed',
    ])
    expect(usage.rows.every((row) => row.inputTokens === 100)).toBe(true)
  })

  it('never persists a score whose citation is absent from the transcript', async () => {
    const model = new ScoringModelFake(async () => ({
      ...result,
      output: {
        ...dimensions,
        d1Recall: {
          ...dimensions.d1Recall,
          citations: [{ turnOrdinal: 1, quote: 'Câu này không có trong bản ghi' }],
        },
      },
    }))
    const usage = new UsageRepositoryFake()
    const scores = new ScoreRepositoryFake()

    await expect(
      finalizeSessionScore({
        scores,
        usage,
        model,
        actor,
        sessionId,
        retryDelay: async () => undefined,
      }),
    ).rejects.toMatchObject({ name: 'InvalidScoreEvidenceError' })
    expect(scores.created).toBeNull()
    expect(model.calls).toBe(3)
    expect(usage.rows).toHaveLength(3)
  })
})
