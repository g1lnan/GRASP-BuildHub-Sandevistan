import type { FeedbackOutput } from '@/lib/ai/feedback-schemas'
import type { FeedbackModel, FeedbackTurnInput } from '@/lib/ai/feedback-types'
import { FeedbackModelError } from '@/lib/ai/feedback-types'
import type { ScoringOutput } from '@/lib/ai/scoring-schemas'
import type { Actor } from '@/lib/auth/identity'
import { feedbackCitationsMatchSources } from '@/lib/domain/feedback'
import type { FeedbackReportView } from '@/lib/feedback/schemas'
import type { TokenUsage } from '@/lib/usage/pricing'
import type { UsageRepository } from '@/lib/usage/record'
import { recordModelUsage } from '@/lib/usage/record'
import {
  AuthenticationRoleError,
  FeedbackUnavailableError,
  InvalidFeedbackEvidenceError,
  ResourceForbiddenError,
  ResourceNotFoundError,
  SessionHasNoTurnsError,
  SessionNotFinalizableError,
} from './errors'

export type FeedbackContext = {
  readonly sessionId: string
  readonly submissionId: string
  readonly studentId: string
  readonly institutionId: string
  readonly status: 'in_progress' | 'completed' | 'expired' | 'abandoned'
  readonly submissionText: string
  readonly turns: readonly FeedbackTurnInput[]
  readonly score: ScoringOutput
}

export type NewFeedbackReport = {
  readonly sessionId: string
  readonly output: FeedbackOutput
  readonly model: string
  readonly promptVersion: string
}

export type FeedbackReportRecord = NewFeedbackReport & {
  readonly id: string
}

export interface LockedFeedbackRepository {
  findBySessionId(sessionId: string): Promise<FeedbackReportRecord | null>
  create(input: NewFeedbackReport): Promise<FeedbackReportRecord>
}

export interface FeedbackRepository extends LockedFeedbackRepository {
  findContext(sessionId: string): Promise<FeedbackContext | null>
  runExclusive<T>(
    sessionId: string,
    operation: (reports: LockedFeedbackRepository) => Promise<T>,
  ): Promise<T>
}

const emptyTokens: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
}

function viewOf(record: FeedbackReportRecord): FeedbackReportView {
  return {
    id: record.id,
    sessionId: record.sessionId,
    ...record.output,
  }
}

function authorizeStudent(actor: Actor, context: FeedbackContext): void {
  if (actor.role !== 'student') throw new AuthenticationRoleError()
  if (actor.id !== context.studentId || actor.institutionId !== context.institutionId) {
    throw new ResourceForbiddenError()
  }
}

type FinalizeFeedbackRequest = {
  readonly reports: FeedbackRepository
  readonly usage: UsageRepository
  readonly model: FeedbackModel
  readonly actor: Actor
  readonly sessionId: string
  readonly retryDelay?: (milliseconds: number) => Promise<void>
}

async function generateAuthorizedFeedback(
  request: FinalizeFeedbackRequest,
  reports: LockedFeedbackRepository,
  context: FeedbackContext,
): Promise<FeedbackReportView> {
  const existing = await reports.findBySessionId(context.sessionId)
  if (existing !== null) return viewOf(existing)
  if (context.status !== 'completed' && context.status !== 'expired') {
    throw new SessionNotFinalizableError()
  }
  if (context.turns.length === 0) throw new SessionHasNoTurnsError()

  const retryDelay =
    request.retryDelay ??
    ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)))
  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt > 0) await retryDelay(attempt === 1 ? 100 : 300)

    let result: Awaited<ReturnType<FeedbackModel['generate']>>
    try {
      result = await request.model.generate({
        submissionText: context.submissionText,
        turns: context.turns,
        score: context.score,
      })
    } catch (error: unknown) {
      lastError = error
      await recordModelUsage({
        usage: request.usage,
        stage: 'feedback_failed',
        provider: request.model.provider,
        model: request.model.model,
        tokens: error instanceof FeedbackModelError ? error.tokens : emptyTokens,
        submissionId: context.submissionId,
        sessionId: context.sessionId,
      })
      continue
    }

    await recordModelUsage({
      usage: request.usage,
      stage: 'feedback',
      provider: result.provider,
      model: result.model,
      tokens: result.tokens,
      submissionId: context.submissionId,
      sessionId: context.sessionId,
    })
    if (!feedbackCitationsMatchSources(result.output, context)) {
      lastError = new InvalidFeedbackEvidenceError()
      continue
    }

    const created = await reports.create({
      sessionId: context.sessionId,
      output: result.output,
      model: result.model,
      promptVersion: result.promptVersion,
    })
    return viewOf(created)
  }

  if (lastError instanceof InvalidFeedbackEvidenceError) throw lastError
  throw new FeedbackUnavailableError()
}

export async function finalizeSessionFeedback(
  request: FinalizeFeedbackRequest,
): Promise<FeedbackReportView> {
  const context = await request.reports.findContext(request.sessionId)
  if (context === null) throw new ResourceNotFoundError()
  authorizeStudent(request.actor, context)

  return request.reports.runExclusive(context.sessionId, (reports) =>
    generateAuthorizedFeedback(request, reports, context),
  )
}
