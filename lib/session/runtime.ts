import { audioDurationSeconds } from '@/lib/asr/audio-duration'
import { transcribeWithTimeout } from '@/lib/asr/transcribe'
import { type ASRProvider, ASR_MAX_DURATION_MS, ASR_MAX_FILE_BYTES } from '@/lib/asr/types'
import type { Actor } from '@/lib/auth/identity'
import {
  AsrNoSpeechError,
  AuthenticationRoleError,
  EmptyTurnTranscriptError,
  ResourceForbiddenError,
  ResourceNotFoundError,
  SessionNoProbesError,
  SubmissionNotReadyError,
  TurnConflictError,
  UnexpectedProbeError,
  UnsupportedAudioError,
} from '@/lib/services/errors'
import type { SubmissionStatus } from '@/lib/services/submission-service'
import { type UsageRepository, recordASRUsage } from '@/lib/usage/record'
import type { SessionView } from './schemas'

export type { SessionView } from './schemas'

export type SessionStatus = 'in_progress' | 'completed' | 'expired' | 'abandoned'
export type SessionMode = 'voice' | 'typed' | 'mixed'
export type TurnInputMode = 'voice' | 'typed'

export type SessionProbe = {
  readonly id: string
  readonly ordinal: number
  readonly textVi: string
  readonly claimText: string
}

export type SessionTurn = {
  readonly id: string
  readonly probeId: string
  readonly ordinal: number
  readonly inputMode: TurnInputMode
  readonly transcript: string
  readonly asrConfidence: number | null
  readonly latencyMs: number | null
  readonly durationMs: number
  readonly createdAt: Date
}

export type SessionStartContext = {
  readonly submissionId: string
  readonly studentId: string
  readonly institutionId: string
  readonly status: SubmissionStatus
  readonly claimGraphId: string | null
  readonly timeCapSeconds: number
  readonly subjectConcepts: readonly string[]
  readonly probes: readonly SessionProbe[]
}

export type SessionRecord = {
  readonly id: string
  readonly submissionId: string
  readonly studentId: string
  readonly institutionId: string
  readonly mode: SessionMode
  readonly status: SessionStatus
  readonly startedAt: Date
  readonly endedAt: Date | null
  readonly elapsedSeconds: number
  readonly timeCapSeconds: number
  readonly subjectConcepts: readonly string[]
  readonly probes: readonly SessionProbe[]
  readonly turns: readonly SessionTurn[]
}

export type NewSession = {
  readonly submissionId: string
  readonly claimGraphId: string
  readonly studentId: string
  readonly startedAt: Date
  readonly timeCapSeconds: number
}

export type NewTurn = {
  readonly sessionId: string
  readonly probeId: string
  readonly ordinal: number
  readonly inputMode: TurnInputMode
  readonly transcript: string
  readonly asrConfidence: number | null
  readonly latencyMs: number | null
  readonly durationMs: number
  readonly elapsedSeconds: number
  readonly createdAt: Date
}

export type SessionStateUpdate = {
  readonly sessionId: string
  readonly status: SessionStatus
  readonly elapsedSeconds: number
  readonly endedAt: Date | null
}

export type AppendTurnResult = 'inserted' | 'duplicate' | 'conflict'

export type SubmittedVoiceTurn = {
  readonly session: SessionView
  readonly transcript: string
  readonly asrConfidence: number
  readonly persisted: boolean
}

export interface SessionRepository {
  findStartContext(submissionId: string): Promise<SessionStartContext | null>
  findLatestBySubmission(submissionId: string, studentId: string): Promise<SessionRecord | null>
  create(input: NewSession): Promise<SessionRecord>
  findById(sessionId: string): Promise<SessionRecord | null>
  appendTurn(input: NewTurn): Promise<AppendTurnResult>
  updateState(input: SessionStateUpdate): Promise<void>
}

function elapsedSeconds(record: SessionRecord, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - record.startedAt.getTime()) / 1000))
}

function deadline(record: SessionRecord): Date {
  return new Date(record.startedAt.getTime() + record.timeCapSeconds * 1000)
}

function authoriseStudent(
  actor: Actor,
  record: { studentId: string; institutionId: string },
): void {
  if (actor.role !== 'student') throw new AuthenticationRoleError()
  if (actor.id !== record.studentId || actor.institutionId !== record.institutionId) {
    throw new ResourceForbiddenError()
  }
}

function viewOf(record: SessionRecord): SessionView {
  const done = record.status !== 'in_progress'
  return {
    id: record.id,
    status: record.status,
    done,
    deadlineAt: deadline(record).toISOString(),
    questionNumber: done ? record.turns.length : record.turns.length + 1,
    currentProbe: done ? null : (record.probes[record.turns.length] ?? null),
  }
}

async function synchroniseTerminalState(
  sessions: SessionRepository,
  record: SessionRecord,
  now: Date,
): Promise<SessionRecord> {
  if (record.status !== 'in_progress') return record

  const elapsed = elapsedSeconds(record, now)
  const reachedTimeCap = elapsed >= record.timeCapSeconds
  const answeredAllProbes = record.turns.length >= record.probes.length
  if (!reachedTimeCap && !answeredAllProbes) return record

  const status: SessionStatus = answeredAllProbes ? 'completed' : 'expired'
  const completedAt = record.turns.at(-1)?.createdAt ?? now
  const endedAt = status === 'expired' ? deadline(record) : completedAt
  const finalElapsed =
    status === 'expired'
      ? record.timeCapSeconds
      : Math.min(
          record.timeCapSeconds,
          Math.max(0, Math.floor((completedAt.getTime() - record.startedAt.getTime()) / 1000)),
        )
  await sessions.updateState({
    sessionId: record.id,
    status,
    elapsedSeconds: finalElapsed,
    endedAt,
  })
  return { ...record, status, elapsedSeconds: finalElapsed, endedAt }
}

export async function startTypedSession(request: {
  readonly sessions: SessionRepository
  readonly actor: Actor
  readonly submissionId: string
  readonly now: Date
}): Promise<SessionView> {
  if (request.actor.role !== 'student') throw new AuthenticationRoleError()

  const context = await request.sessions.findStartContext(request.submissionId)
  if (context === null) throw new ResourceNotFoundError()
  authoriseStudent(request.actor, context)
  if (context.status !== 'ready') throw new SubmissionNotReadyError()
  if (context.claimGraphId === null || context.probes.length === 0) {
    throw new SessionNoProbesError()
  }

  const existing = await request.sessions.findLatestBySubmission(
    request.submissionId,
    request.actor.id,
  )
  if (existing !== null) {
    const current = await synchroniseTerminalState(request.sessions, existing, request.now)
    return viewOf(current)
  }

  const created = await request.sessions.create({
    submissionId: context.submissionId,
    claimGraphId: context.claimGraphId,
    studentId: request.actor.id,
    startedAt: request.now,
    timeCapSeconds: context.timeCapSeconds,
  })
  return viewOf(created)
}

export async function getTypedSession(request: {
  readonly sessions: SessionRepository
  readonly actor: Actor
  readonly sessionId: string
  readonly now: Date
}): Promise<SessionView> {
  const record = await request.sessions.findById(request.sessionId)
  if (record === null) throw new ResourceNotFoundError()
  authoriseStudent(request.actor, record)
  const current = await synchroniseTerminalState(request.sessions, record, request.now)
  return viewOf(current)
}

export async function submitTypedTurn(request: {
  readonly sessions: SessionRepository
  readonly actor: Actor
  readonly sessionId: string
  readonly probeId: string
  readonly text: string
  readonly now: Date
}): Promise<SessionView> {
  const record = await request.sessions.findById(request.sessionId)
  if (record === null) throw new ResourceNotFoundError()
  authoriseStudent(request.actor, record)

  const current = await synchroniseTerminalState(request.sessions, record, request.now)
  if (current.status !== 'in_progress') return viewOf(current)

  const probe = current.probes[current.turns.length]
  if (probe === undefined || probe.id !== request.probeId) throw new UnexpectedProbeError()

  const transcript = request.text.trim()
  if (transcript.length === 0) throw new EmptyTurnTranscriptError()

  const previousTimestamp = current.turns.at(-1)?.createdAt.getTime() ?? current.startedAt.getTime()
  const elapsed = elapsedSeconds(current, request.now)
  const appendResult = await request.sessions.appendTurn({
    sessionId: current.id,
    probeId: probe.id,
    ordinal: current.turns.length + 1,
    inputMode: 'typed',
    transcript,
    asrConfidence: null,
    latencyMs: null,
    durationMs: Math.max(0, request.now.getTime() - previousTimestamp),
    elapsedSeconds: elapsed,
    createdAt: request.now,
  })
  if (appendResult === 'conflict') throw new TurnConflictError()
  if (appendResult === 'duplicate') {
    const latest = await request.sessions.findById(current.id)
    if (latest === null) throw new ResourceNotFoundError()
    authoriseStudent(request.actor, latest)
    return viewOf(await synchroniseTerminalState(request.sessions, latest, request.now))
  }

  const updated: SessionRecord = {
    ...current,
    elapsedSeconds: elapsed,
    turns: [
      ...current.turns,
      {
        id: '',
        probeId: probe.id,
        ordinal: current.turns.length + 1,
        inputMode: 'typed',
        transcript,
        asrConfidence: null,
        latencyMs: null,
        durationMs: Math.max(0, request.now.getTime() - previousTimestamp),
        createdAt: request.now,
      },
    ],
  }
  const finalState = await synchroniseTerminalState(request.sessions, updated, request.now)
  return viewOf(finalState)
}

export async function submitVoiceTurn(request: {
  readonly sessions: SessionRepository
  readonly usage: UsageRepository
  readonly asr: ASRProvider
  readonly actor: Actor
  readonly sessionId: string
  readonly probeId: string
  readonly audio: Buffer
  readonly mimeType: string
  readonly durationMs: number
  readonly now?: () => Date
  readonly measureAudioDuration?: (audio: Buffer, mimeType: string) => number
}): Promise<SubmittedVoiceTurn> {
  if (
    request.audio.length === 0 ||
    request.audio.length > ASR_MAX_FILE_BYTES ||
    request.durationMs <= 0
  ) {
    throw new UnsupportedAudioError()
  }

  const now = request.now ?? (() => new Date())
  const startedAt = now()
  const initial = await request.sessions.findById(request.sessionId)
  if (initial === null) throw new ResourceNotFoundError()
  authoriseStudent(request.actor, initial)

  const current = await synchroniseTerminalState(request.sessions, initial, startedAt)
  if (current.status !== 'in_progress') {
    return { session: viewOf(current), transcript: '', asrConfidence: 0, persisted: false }
  }
  const currentProbe = current.probes[current.turns.length]
  if (currentProbe === undefined || currentProbe.id !== request.probeId) {
    throw new UnexpectedProbeError()
  }

  const measuredDurationSeconds = (request.measureAudioDuration ?? audioDurationSeconds)(
    request.audio,
    request.mimeType,
  )
  if (measuredDurationSeconds * 1000 > ASR_MAX_DURATION_MS) throw new UnsupportedAudioError()

  const asrStartedAt = performance.now()
  let result: Awaited<ReturnType<ASRProvider['transcribe']>>
  try {
    result = await transcribeWithTimeout({
      provider: request.asr,
      audio: request.audio,
      options: {
        languageCode: 'vi',
        hints: current.subjectConcepts,
        mimeType: request.mimeType,
      },
    })
  } catch (error: unknown) {
    await recordASRUsage({
      usage: request.usage,
      provider: request.asr.name,
      model: request.asr.model,
      audioSeconds: measuredDurationSeconds,
      costPerMinuteVnd: request.asr.costPerMinuteVnd,
      minimumBillableSeconds: request.asr.minimumBillableSeconds,
      submissionId: current.submissionId,
      sessionId: current.id,
    })
    throw error
  }
  const latencyMs = Math.max(0, Math.round(performance.now() - asrStartedAt))
  const completedAt = now()
  const audioSeconds = result.durationSeconds > 0 ? result.durationSeconds : measuredDurationSeconds
  await recordASRUsage({
    usage: request.usage,
    provider: request.asr.name,
    model: request.asr.model,
    audioSeconds,
    costPerMinuteVnd: request.asr.costPerMinuteVnd,
    minimumBillableSeconds: request.asr.minimumBillableSeconds,
    submissionId: current.submissionId,
    sessionId: current.id,
  })
  if (audioSeconds * 1000 > ASR_MAX_DURATION_MS) throw new UnsupportedAudioError()
  if (result.transcript.trim().length === 0) throw new AsrNoSpeechError()

  const latestRecord = await request.sessions.findById(request.sessionId)
  if (latestRecord === null) throw new ResourceNotFoundError()
  authoriseStudent(request.actor, latestRecord)
  const latest = await synchroniseTerminalState(request.sessions, latestRecord, completedAt)
  if (latest.status !== 'in_progress') {
    return {
      session: viewOf(latest),
      transcript: result.transcript,
      asrConfidence: result.confidence,
      persisted: false,
    }
  }

  const probe = latest.probes[latest.turns.length]
  if (probe === undefined || probe.id !== request.probeId) throw new UnexpectedProbeError()

  const elapsed = elapsedSeconds(latest, completedAt)
  const appendResult = await request.sessions.appendTurn({
    sessionId: latest.id,
    probeId: probe.id,
    ordinal: latest.turns.length + 1,
    inputMode: 'voice',
    transcript: result.transcript,
    asrConfidence: result.confidence,
    latencyMs,
    durationMs: Math.max(1, Math.round(audioSeconds * 1000)),
    elapsedSeconds: elapsed,
    createdAt: completedAt,
  })
  if (appendResult === 'conflict') throw new TurnConflictError()
  if (appendResult === 'duplicate') {
    const duplicate = await request.sessions.findById(latest.id)
    if (duplicate === null) throw new ResourceNotFoundError()
    authoriseStudent(request.actor, duplicate)
    return {
      session: viewOf(await synchroniseTerminalState(request.sessions, duplicate, completedAt)),
      transcript: result.transcript,
      asrConfidence: result.confidence,
      persisted: true,
    }
  }

  const updated: SessionRecord = {
    ...latest,
    elapsedSeconds: elapsed,
    turns: [
      ...latest.turns,
      {
        id: '',
        probeId: probe.id,
        ordinal: latest.turns.length + 1,
        inputMode: 'voice',
        transcript: result.transcript,
        asrConfidence: result.confidence,
        latencyMs,
        durationMs: Math.max(1, Math.round(audioSeconds * 1000)),
        createdAt: completedAt,
      },
    ],
  }
  return {
    session: viewOf(await synchroniseTerminalState(request.sessions, updated, completedAt)),
    transcript: result.transcript,
    asrConfidence: result.confidence,
    persisted: true,
  }
}
