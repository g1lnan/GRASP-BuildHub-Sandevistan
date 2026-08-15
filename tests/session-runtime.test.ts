import type { ASRProvider, ASRTranscriptionOptions } from '@/lib/asr/types'
import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import {
  type AppendTurnResult,
  type NewSession,
  type NewTurn,
  type SessionRecord,
  type SessionRepository,
  type SessionStartContext,
  startTypedSession,
  submitTypedTurn,
  submitVoiceTurn,
} from '@/lib/session/runtime'
import type { UsageEventRow, UsageRepository } from '@/lib/usage/record'
import { describe, expect, it } from 'vitest'

const institutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000001')
const otherInstitutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000002')
const studentAId = userIdSchema.parse('20000000-0000-4000-8000-000000000001')
const studentBId = userIdSchema.parse('20000000-0000-4000-8000-000000000002')
const lecturerId = userIdSchema.parse('20000000-0000-4000-8000-000000000003')

const studentA: Actor = { id: studentAId, institutionId, role: 'student' }
const studentB: Actor = { id: studentBId, institutionId, role: 'student' }
const lecturer: Actor = { id: lecturerId, institutionId, role: 'lecturer' }

const submissionId = '60000000-0000-4000-8000-000000000001'
const claimGraphId = '70000000-0000-4000-8000-000000000001'
const sessionId = '80000000-0000-4000-8000-000000000001'
const probeAId = '90000000-0000-4000-8000-000000000001'
const probeBId = '90000000-0000-4000-8000-000000000002'
const startedAt = new Date('2026-07-25T00:00:00.000Z')

const probes = [
  {
    id: probeAId,
    ordinal: 1,
    textVi: 'Vì sao bạn chọn lập luận này?',
    claimText: 'Luận điểm đầu tiên của tôi.',
  },
  {
    id: probeBId,
    ordinal: 2,
    textVi: 'Điều gì sẽ thay đổi trong trường hợp khác?',
    claimText: 'Luận điểm thứ hai của tôi.',
  },
] as const

const startContext: SessionStartContext = {
  submissionId,
  studentId: studentAId,
  institutionId,
  status: 'ready',
  claimGraphId,
  timeCapSeconds: 360,
  subjectConcepts: ['lập luận', 'bằng chứng'],
  probes,
}

function session(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: sessionId,
    submissionId,
    claimGraphId,
    studentId: studentAId,
    institutionId,
    mode: 'typed',
    status: 'in_progress',
    startedAt,
    endedAt: null,
    elapsedSeconds: 0,
    timeCapSeconds: 360,
    subjectConcepts: startContext.subjectConcepts,
    probes,
    turns: [],
    ...overrides,
  }
}

class SessionRepositoryFake implements SessionRepository {
  created: NewSession | null = null
  appended: NewTurn | null = null
  stateUpdates: Array<{
    sessionId: string
    status: SessionRecord['status']
    elapsedSeconds: number
    endedAt: Date | null
  }> = []

  constructor(
    private readonly context: SessionStartContext | null = startContext,
    private record: SessionRecord | null = null,
    private readonly conflictRecord: SessionRecord | null = null,
    private readonly appendConflict = false,
  ) {}

  async findStartContext(): Promise<SessionStartContext | null> {
    return this.context
  }

  async findLatestBySubmission(): Promise<SessionRecord | null> {
    return this.record
  }

  async create(input: NewSession): Promise<SessionRecord> {
    this.created = input
    this.record = session({
      submissionId: input.submissionId,
      studentId: input.studentId,
      mode: 'typed',
      startedAt: input.startedAt,
      timeCapSeconds: input.timeCapSeconds,
      subjectConcepts: this.context?.subjectConcepts ?? [],
      probes: this.context?.probes ?? [],
    })
    return this.record
  }

  async findById(): Promise<SessionRecord | null> {
    return this.record
  }

  async appendTurn(input: NewTurn): Promise<AppendTurnResult> {
    this.appended = input
    if (this.appendConflict) return 'conflict'
    if (this.conflictRecord !== null) {
      this.record = this.conflictRecord
      return 'duplicate'
    }
    if (this.record === null) return 'conflict'
    this.record = {
      ...this.record,
      elapsedSeconds: input.elapsedSeconds,
      turns: [
        ...this.record.turns,
        {
          id: 'a0000000-0000-4000-8000-000000000001',
          probeId: input.probeId,
          ordinal: input.ordinal,
          inputMode: input.inputMode,
          transcript: input.transcript,
          asrConfidence: input.asrConfidence,
          latencyMs: input.latencyMs,
          durationMs: input.durationMs,
          createdAt: input.createdAt,
        },
      ],
    }
    return 'inserted'
  }

  async updateState(input: {
    sessionId: string
    status: SessionRecord['status']
    elapsedSeconds: number
    endedAt: Date | null
  }): Promise<void> {
    this.stateUpdates.push(input)
    if (this.record !== null) this.record = { ...this.record, ...input }
  }

  async insertFollowUpProbe(): Promise<{
    readonly id: string
    readonly ordinal: number
    readonly textVi: string
    readonly claimText: string
  }> {
    return { id: 'follow-up-probe-id', ordinal: 99, textVi: 'Follow-up question', claimText: '' }
  }

  async isProbeFollowUpEligible(): Promise<boolean> {
    return false
  }

  async countSessionFollowUps(): Promise<number> {
    return 0
  }
}

class UsageRepositoryFake implements UsageRepository {
  readonly rows: UsageEventRow[] = []

  async record(row: UsageEventRow): Promise<void> {
    this.rows.push(row)
  }
}

class ASRProviderFake implements ASRProvider {
  readonly name = 'test-asr'
  readonly model = 'test-whisper'
  readonly costPerMinuteVnd = 60
  readonly minimumBillableSeconds = 10
  readonly calls: Array<{ audio: Buffer; options: ASRTranscriptionOptions }> = []

  constructor(
    private readonly result: () => Promise<{
      transcript: string
      confidence: number
      durationSeconds: number
    }>,
  ) {}

  async transcribe(audio: Buffer, options: ASRTranscriptionOptions) {
    this.calls.push({ audio, options })
    return this.result()
  }
}

describe('startTypedSession', () => {
  it('creates a typed session pinned to the current Claim Graph and time cap', async () => {
    const repository = new SessionRepositoryFake()

    const view = await startTypedSession({
      sessions: repository,
      actor: studentA,
      submissionId,
      now: startedAt,
    })

    expect(repository.created).toMatchObject({
      submissionId,
      studentId: studentAId,
      claimGraphId,
      timeCapSeconds: 360,
      startedAt,
    })
    expect(view.currentProbe).toEqual(probes[0])
    expect(view.questionNumber).toBe(1)
    expect(view).not.toHaveProperty('upcomingProbes')
  })

  it('rejects a lecturer starting a student session', async () => {
    const operation = startTypedSession({
      sessions: new SessionRepositoryFake(),
      actor: lecturer,
      submissionId,
      now: startedAt,
    })
    await expect(operation).rejects.toMatchObject({ name: 'AuthenticationRoleError' })
  })

  it("denies student B starting student A's submission", async () => {
    const operation = startTypedSession({
      sessions: new SessionRepositoryFake(),
      actor: studentB,
      submissionId,
      now: startedAt,
    })
    await expect(operation).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
  })

  it('denies a student from another institution', async () => {
    const outsider: Actor = { id: studentAId, institutionId: otherInstitutionId, role: 'student' }
    const operation = startTypedSession({
      sessions: new SessionRepositoryFake(),
      actor: outsider,
      submissionId,
      now: startedAt,
    })
    await expect(operation).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
  })

  it('rejects a submission that is not ready', async () => {
    const operation = startTypedSession({
      sessions: new SessionRepositoryFake({ ...startContext, status: 'analysing' }),
      actor: studentA,
      submissionId,
      now: startedAt,
    })
    await expect(operation).rejects.toMatchObject({ name: 'SubmissionNotReadyError' })
  })

  it('does not create a new attempt after the existing session reaches its hard cap', async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const deadline = new Date('2026-07-25T00:06:00.000Z')

    const view = await startTypedSession({
      sessions: repository,
      actor: studentA,
      submissionId,
      now: deadline,
    })

    expect(repository.created).toBeNull()
    expect(view).toMatchObject({ status: 'expired', done: true })
  })
})

describe('submitTypedTurn', () => {
  it('stores the typed answer as the transcript and returns only the next probe', async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const now = new Date('2026-07-25T00:00:30.000Z')

    const view = await submitTypedTurn({
      sessions: repository,
      actor: studentA,
      sessionId,
      probeId: probeAId,
      text: '  Đây là câu trả lời của tôi.  ',
      now,
    })

    expect(repository.appended).toMatchObject({
      sessionId,
      probeId: probeAId,
      ordinal: 1,
      transcript: 'Đây là câu trả lời của tôi.',
      elapsedSeconds: 30,
    })
    expect(view.currentProbe).toEqual(probes[1])
    expect(view.questionNumber).toBe(2)
    expect(view.done).toBe(false)
  })

  it('rejects an answer for an upcoming probe', async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const operation = submitTypedTurn({
      sessions: repository,
      actor: studentA,
      sessionId,
      probeId: probeBId,
      text: 'Câu trả lời.',
      now: new Date('2026-07-25T00:00:30.000Z'),
    })
    await expect(operation).rejects.toMatchObject({ name: 'UnexpectedProbeError' })
    expect(repository.appended).toBeNull()
  })

  it('completes after the last selected probe', async () => {
    const repository = new SessionRepositoryFake(
      startContext,
      session({
        turns: [
          {
            id: 'a0000000-0000-4000-8000-000000000001',
            probeId: probeAId,
            ordinal: 1,
            inputMode: 'typed',
            transcript: 'Câu trả lời đầu tiên.',
            asrConfidence: null,
            latencyMs: null,
            durationMs: 30_000,
            createdAt: new Date('2026-07-25T00:00:30.000Z'),
          },
        ],
      }),
    )
    const now = new Date('2026-07-25T00:01:00.000Z')

    const view = await submitTypedTurn({
      sessions: repository,
      actor: studentA,
      sessionId,
      probeId: probeBId,
      text: 'Câu trả lời thứ hai.',
      now,
    })

    expect(view).toMatchObject({ status: 'completed', done: true, currentProbe: null })
    expect(repository.stateUpdates.at(-1)).toMatchObject({
      status: 'completed',
      elapsedSeconds: 60,
      endedAt: now,
    })
  })

  it('expires server-side at the hard cap without storing a late answer', async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const deadline = new Date('2026-07-25T00:06:00.000Z')

    const view = await submitTypedTurn({
      sessions: repository,
      actor: studentA,
      sessionId,
      probeId: probeAId,
      text: 'Câu trả lời đến muộn.',
      now: deadline,
    })

    expect(repository.appended).toBeNull()
    expect(repository.stateUpdates.at(-1)).toEqual({
      sessionId,
      status: 'expired',
      elapsedSeconds: 360,
      endedAt: deadline,
    })
    expect(view).toMatchObject({ status: 'expired', done: true, currentProbe: null })
  })

  it("denies student B answering student A's session", async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const operation = submitTypedTurn({
      sessions: repository,
      actor: studentB,
      sessionId,
      probeId: probeAId,
      text: 'Không được phép.',
      now: new Date('2026-07-25T00:00:30.000Z'),
    })
    await expect(operation).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
  })

  it('treats a concurrent duplicate submission as idempotent', async () => {
    const firstTurn = {
      id: 'a0000000-0000-4000-8000-000000000001',
      probeId: probeAId,
      ordinal: 1,
      inputMode: 'typed' as const,
      transcript: 'Câu trả lời đã được lưu.',
      asrConfidence: null,
      latencyMs: null,
      durationMs: 30_000,
      createdAt: new Date('2026-07-25T00:00:30.000Z'),
    }
    const repository = new SessionRepositoryFake(
      startContext,
      session(),
      session({ elapsedSeconds: 30, turns: [firstTurn] }),
    )

    const view = await submitTypedTurn({
      sessions: repository,
      actor: studentA,
      sessionId,
      probeId: probeAId,
      text: 'Câu trả lời đã được lưu.',
      now: new Date('2026-07-25T00:00:31.000Z'),
    })

    expect(view).toMatchObject({
      status: 'in_progress',
      questionNumber: 2,
      currentProbe: probes[1],
    })
  })

  it('rejects a different concurrent answer for the same turn ordinal', async () => {
    const repository = new SessionRepositoryFake(startContext, session(), null, true)

    const operation = submitTypedTurn({
      sessions: repository,
      actor: studentA,
      sessionId,
      probeId: probeAId,
      text: 'Câu trả lời khác.',
      now: new Date('2026-07-25T00:00:31.000Z'),
    })

    await expect(operation).rejects.toMatchObject({ name: 'TurnConflictError' })
  })
})

describe('submitVoiceTurn', () => {
  it('transcribes Vietnamese audio, records usage, and persists the same turn contract', async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const usage = new UsageRepositoryFake()
    const asr = new ASRProviderFake(async () => ({
      transcript: 'Tôi chọn lập luận này vì bằng chứng trong bài.',
      confidence: 0.87,
      durationSeconds: 42,
    }))
    const timestamps = [new Date('2026-07-25T00:00:20.000Z'), new Date('2026-07-25T00:00:21.000Z')]

    const result = await submitVoiceTurn({
      sessions: repository,
      usage,
      asr,
      actor: studentA,
      sessionId,
      probeId: probeAId,
      audio: Buffer.from('webm audio'),
      mimeType: 'audio/webm;codecs=opus',
      durationMs: 42_000,
      measureAudioDuration: () => 42,
      now: () => timestamps.shift() ?? new Date('2026-07-25T00:00:21.000Z'),
    })

    expect(asr.calls).toHaveLength(1)
    expect(asr.calls[0]?.options).toMatchObject({
      languageCode: 'vi',
      hints: startContext.subjectConcepts,
      mimeType: 'audio/webm;codecs=opus',
    })
    expect(repository.appended).toMatchObject({
      inputMode: 'voice',
      transcript: 'Tôi chọn lập luận này vì bằng chứng trong bài.',
      asrConfidence: 0.87,
      durationMs: 42_000,
      elapsedSeconds: 21,
    })
    expect(usage.rows).toHaveLength(1)
    expect(usage.rows[0]).toMatchObject({
      sessionId,
      submissionId,
      stage: 'asr',
      provider: 'test-asr',
      model: 'test-whisper',
      audioSeconds: 42,
      costVnd: 42,
    })
    expect(result).toMatchObject({
      transcript: 'Tôi chọn lập luận này vì bằng chứng trong bài.',
      asrConfidence: 0.87,
      persisted: true,
      session: { questionNumber: 2, currentProbe: probes[1] },
    })
  })

  it('authorises the session before sending audio to the provider', async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const usage = new UsageRepositoryFake()
    const asr = new ASRProviderFake(async () => ({
      transcript: 'Không được gửi.',
      confidence: 0.9,
      durationSeconds: 10,
    }))

    const operation = submitVoiceTurn({
      sessions: repository,
      usage,
      asr,
      actor: studentB,
      sessionId,
      probeId: probeAId,
      audio: Buffer.from('webm audio'),
      mimeType: 'audio/webm',
      durationMs: 10_000,
      measureAudioDuration: () => 10,
    })

    await expect(operation).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
    expect(asr.calls).toHaveLength(0)
    expect(usage.rows).toHaveLength(0)
  })

  it('records the ASR call but keeps the probe open when no speech is detected', async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const usage = new UsageRepositoryFake()
    const asr = new ASRProviderFake(async () => ({
      transcript: '   ',
      confidence: 0.2,
      durationSeconds: 8,
    }))

    const operation = submitVoiceTurn({
      sessions: repository,
      usage,
      asr,
      actor: studentA,
      sessionId,
      probeId: probeAId,
      audio: Buffer.from('silence'),
      mimeType: 'audio/webm',
      durationMs: 8_000,
      measureAudioDuration: () => 8,
      now: () => new Date('2026-07-25T00:00:20.000Z'),
    })

    await expect(operation).rejects.toMatchObject({ name: 'AsrNoSpeechError' })
    expect(usage.rows).toHaveLength(1)
    expect(repository.appended).toBeNull()
  })

  it('records failed ASR attempts and preserves the typed fallback', async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const usage = new UsageRepositoryFake()
    const asr = new ASRProviderFake(async () => {
      throw new Error('provider unavailable')
    })

    const operation = submitVoiceTurn({
      sessions: repository,
      usage,
      asr,
      actor: studentA,
      sessionId,
      probeId: probeAId,
      audio: Buffer.from('webm audio'),
      mimeType: 'audio/webm',
      durationMs: 12_000,
      measureAudioDuration: () => 12,
      now: () => new Date('2026-07-25T00:00:20.000Z'),
    })

    await expect(operation).rejects.toMatchObject({ name: 'AsrTranscriptionError' })
    expect(usage.rows).toHaveLength(1)
    expect(repository.appended).toBeNull()
    expect(repository.stateUpdates).toHaveLength(0)
  })

  it('rejects server-measured audio over 60 seconds before ASR spend', async () => {
    const repository = new SessionRepositoryFake(startContext, session())
    const usage = new UsageRepositoryFake()
    const asr = new ASRProviderFake(async () => ({
      transcript: 'Không được gọi.',
      confidence: 0.9,
      durationSeconds: 61,
    }))

    const operation = submitVoiceTurn({
      sessions: repository,
      usage,
      asr,
      actor: studentA,
      sessionId,
      probeId: probeAId,
      audio: Buffer.from('crafted long audio'),
      mimeType: 'audio/webm',
      durationMs: 1_000,
      measureAudioDuration: () => 61,
      now: () => new Date('2026-07-25T00:00:20.000Z'),
    })

    await expect(operation).rejects.toMatchObject({ name: 'UnsupportedAudioError' })
    expect(asr.calls).toHaveLength(0)
    expect(usage.rows).toHaveLength(0)
  })
})
