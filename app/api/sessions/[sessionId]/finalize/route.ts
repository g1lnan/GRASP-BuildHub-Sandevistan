import { AnthropicFeedbackModel } from '@/lib/ai/feedback'
import { AnthropicScoringModel } from '@/lib/ai/scoring'
import {
  AuthenticationRequiredError,
  AuthorizationDeniedError,
  requireRole,
} from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleFeedbackRepository } from '@/lib/repositories/drizzle-feedback'
import { drizzleScoreRepository } from '@/lib/repositories/drizzle-scores'
import { getIntegritySignals, mergeIntegritySignals } from '@/lib/repositories/drizzle-sessions'
import { drizzleUsageRepository } from '@/lib/repositories/drizzle-usage'
import {
  AuthenticationRoleError,
  FeedbackUnavailableError,
  InvalidFeedbackEvidenceError,
  InvalidScoreEvidenceError,
  ResourceForbiddenError,
  ResourceNotFoundError,
  ScoringUnavailableError,
  SessionHasNoTurnsError,
  SessionNotFinalizableError,
} from '@/lib/services/errors'
import { finalizeSessionFeedback } from '@/lib/services/feedback-service'
import { finalizeSessionScore } from '@/lib/services/scoring-service'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'nodejs'

const paramsSchema = z.object({ sessionId: z.string().uuid() })

export async function POST(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const actor = await requireRole(['student'])
    const { sessionId } = paramsSchema.parse(await context.params)
    const score = await finalizeSessionScore({
      scores: drizzleScoreRepository,
      usage: drizzleUsageRepository,
      model: new AnthropicScoringModel(),
      actor,
      sessionId,
      getIntegritySignals,
      mergeIntegritySignals: async (sid, _studentId, signals) => {
        await mergeIntegritySignals(sid, actor.id, signals as Record<string, unknown>)
      },
    })
    const feedback = await finalizeSessionFeedback({
      reports: drizzleFeedbackRepository,
      usage: drizzleUsageRepository,
      model: new AnthropicFeedbackModel(),
      actor,
      sessionId,
    })
    return NextResponse.json({ ...score, feedback })
  } catch (error: unknown) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ error: vi.errors.authenticationRequired }, { status: 401 })
    }
    if (error instanceof AuthorizationDeniedError || error instanceof AuthenticationRoleError) {
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    }
    if (error instanceof ResourceForbiddenError) {
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    }
    if (error instanceof ResourceNotFoundError) {
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    }
    if (error instanceof SessionNotFinalizableError) {
      return NextResponse.json({ error: vi.errors.sessionNotFinalizable }, { status: 409 })
    }
    if (error instanceof SessionHasNoTurnsError) {
      return NextResponse.json({ error: vi.errors.sessionHasNoAnswers }, { status: 422 })
    }
    if (error instanceof ScoringUnavailableError || error instanceof InvalidScoreEvidenceError) {
      return NextResponse.json({ error: vi.errors.scoreUnavailable }, { status: 503 })
    }
    if (
      error instanceof FeedbackUnavailableError ||
      error instanceof InvalidFeedbackEvidenceError
    ) {
      return NextResponse.json({ error: vi.errors.feedbackUnavailable }, { status: 503 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
    }
    return NextResponse.json({ error: vi.errors.serverError }, { status: 500 })
  }
}
