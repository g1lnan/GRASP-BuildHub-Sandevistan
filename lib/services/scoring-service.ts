import type { ScoringOutput } from '@/lib/ai/scoring-schemas'
import type { ScoringModel, ScoringTurnInput } from '@/lib/ai/scoring-types'
import { ScoringModelError } from '@/lib/ai/scoring-types'
import type { Actor } from '@/lib/auth/identity'
import type { IntegritySignals } from '@/lib/domain/integrity-signals'
import {
  citationsMatchTranscripts,
  compositeScore,
  confidenceInterval,
  normalizeRubricWeights,
} from '@/lib/domain/scoring'
import { analyzeResponseTiming } from '@/lib/domain/timing-analysis'
import { vi } from '@/lib/i18n/vi'
import type { ScoreView } from '@/lib/scoring/schemas'
import type { TokenUsage } from '@/lib/usage/pricing'
import type { UsageRepository } from '@/lib/usage/record'
import { recordModelUsage } from '@/lib/usage/record'
import {
  AuthenticationRoleError,
  InvalidScoreEvidenceError,
  ResourceForbiddenError,
  ResourceNotFoundError,
  ScoringUnavailableError,
  SessionHasNoTurnsError,
  SessionNotFinalizableError,
} from './errors'

export type ScoringContextTurn = ScoringTurnInput & {
  readonly probeId: string
}

export type ScoringContext = {
  readonly sessionId: string
  readonly submissionId: string
  readonly studentId: string
  readonly institutionId: string
  readonly status: 'in_progress' | 'completed' | 'expired' | 'abandoned'
  readonly submissionText: string
  readonly rubricWeights: Record<string, number>
  readonly expectedProbeCount: number
  readonly turns: readonly ScoringContextTurn[]
}

export type NewScore = {
  readonly sessionId: string
  readonly dimensions: ScoringOutput
  readonly composite: number
  readonly confidenceLow: number
  readonly confidenceHigh: number
  readonly confidenceLabel: 'high' | 'medium' | 'low'
  readonly model: string
  readonly promptVersion: string
}

export type ScoreRecord = NewScore & {
  readonly id: string
}

export interface LockedScoreRepository {
  findBySessionId(sessionId: string): Promise<ScoreRecord | null>
  create(input: NewScore): Promise<ScoreRecord>
}

export interface ScoreRepository extends LockedScoreRepository {
  findContext(sessionId: string): Promise<ScoringContext | null>
  runExclusive<T>(
    sessionId: string,
    operation: (scores: LockedScoreRepository) => Promise<T>,
  ): Promise<T>
}

const emptyTokens: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
}

function viewOf(record: ScoreRecord): ScoreView {
  return {
    id: record.id,
    sessionId: record.sessionId,
    dimensions: record.dimensions,
    composite: record.composite,
    confidence: {
      low: record.confidenceLow,
      high: record.confidenceHigh,
      label: record.confidenceLabel,
      recommendationVi:
        record.confidenceLabel === 'low' ? vi.scoring.lowConfidenceRecommendation : null,
    },
  }
}

function authoriseStudent(actor: Actor, context: ScoringContext): void {
  if (actor.role !== 'student') throw new AuthenticationRoleError()
  if (actor.id !== context.studentId || actor.institutionId !== context.institutionId) {
    throw new ResourceForbiddenError()
  }
}

type FinalizeScoreRequest = {
  readonly scores: ScoreRepository
  readonly usage: UsageRepository
  readonly model: ScoringModel
  readonly actor: Actor
  readonly sessionId: string
  readonly retryDelay?: (milliseconds: number) => Promise<void>
  readonly getIntegritySignals?: (sessionId: string) => Promise<Record<string, unknown>>
  readonly mergeIntegritySignals?: (
    sessionId: string,
    studentId: string,
    signals: Record<string, unknown>,
  ) => Promise<void>
}

async function finalizeAuthorizedSession(
  request: FinalizeScoreRequest,
  scores: LockedScoreRepository,
  context: ScoringContext,
): Promise<ScoreView> {
  const existing = await scores.findBySessionId(context.sessionId)
  if (existing !== null) return viewOf(existing)
  if (context.status !== 'completed' && context.status !== 'expired') {
    throw new SessionNotFinalizableError()
  }
  if (context.turns.length === 0) throw new SessionHasNoTurnsError()

  const retryDelay =
    request.retryDelay ??
    ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)))

  // Run timing analysis before scoring (Layer 4)
  let _behavioralContext:
    | { suspicionLevel: string; signals: readonly { type: string; detail: string }[] }
    | undefined
  if (request.getIntegritySignals !== undefined) {
    try {
      const clientSignals = (await request.getIntegritySignals(context.sessionId)) as
        | IntegritySignals
        | undefined
      const timingResult = analyzeResponseTiming(
        context.turns.map((t) => ({
          ordinal: t.ordinal,
          inputMode: t.inputMode,
          transcript: t.transcript,
          latencyMs: null,
          durationMs: 0,
        })),
        clientSignals ?? undefined,
      )
      if (timingResult.signals.length > 0 && request.mergeIntegritySignals !== undefined) {
        await request.mergeIntegritySignals(context.sessionId, context.studentId, {
          timingAnalysis: timingResult,
        })
      }
      if (timingResult.overallSuspicionLevel !== 'none') {
        _behavioralContext = {
          suspicionLevel: timingResult.overallSuspicionLevel,
          signals: timingResult.signals.map((s) => ({ type: s.type, detail: s.detail })),
        }
      }
    } catch {
      // Timing analysis failure is non-fatal
    }
  }

  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await retryDelay(attempt === 1 ? 100 : 300)

    let result: Awaited<ReturnType<ScoringModel['score']>>
    try {
      result = await request.model.score({
        submissionText: context.submissionText,
        turns: context.turns,
      })
    } catch (error: unknown) {
      lastError = error
      await recordModelUsage({
        usage: request.usage,
        stage: 'final_score_failed',
        provider: request.model.provider,
        model: request.model.model,
        tokens: error instanceof ScoringModelError ? error.tokens : emptyTokens,
        submissionId: context.submissionId,
        sessionId: context.sessionId,
      })
      continue
    }

    await recordModelUsage({
      usage: request.usage,
      stage: 'final_score',
      provider: result.provider,
      model: result.model,
      tokens: result.tokens,
      submissionId: context.submissionId,
      sessionId: context.sessionId,
    })
    if (!citationsMatchTranscripts(result.output, context.turns)) {
      lastError = new InvalidScoreEvidenceError()
      continue
    }

    const composite = compositeScore(result.output, normalizeRubricWeights(context.rubricWeights))
    const confidence = confidenceInterval({
      composite,
      expectedProbeCount: context.expectedProbeCount,
      turns: context.turns,
    })
    const created = await scores.create({
      sessionId: context.sessionId,
      dimensions: result.output,
      composite,
      confidenceLow: confidence.low,
      confidenceHigh: confidence.high,
      confidenceLabel: confidence.label,
      model: result.model,
      promptVersion: result.promptVersion,
    })
    return viewOf(created)
  }

  if (lastError instanceof InvalidScoreEvidenceError) throw lastError
  throw new ScoringUnavailableError()
}

export async function finalizeSessionScore(request: FinalizeScoreRequest): Promise<ScoreView> {
  const context = await request.scores.findContext(request.sessionId)
  if (context === null) throw new ResourceNotFoundError()
  authoriseStudent(request.actor, context)

  return request.scores.runExclusive(context.sessionId, (scores) =>
    finalizeAuthorizedSession(request, scores, context),
  )
}
