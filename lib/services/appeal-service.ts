import type { Actor } from '@/lib/auth/identity'
import { appealInputSchema } from '@/lib/validation/inputs'
import {
  AppealNotAllowedError,
  AuthenticationRoleError,
  InvalidAppealError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from './errors'

export type SessionStatus = 'in_progress' | 'completed' | 'expired' | 'abandoned'

export type AppealSessionAuth = {
  readonly studentId: string
  readonly institutionId: string
  readonly status: SessionStatus
}

export type AppealRecord = {
  readonly id: string
  readonly sessionId: string
  readonly studentId: string
  readonly reason: string
  readonly status: 'open' | 'resolved'
  readonly resolution: string | null
  readonly createdAt: Date
}

export interface AppealRepository {
  findSessionAuth(sessionId: string): Promise<AppealSessionAuth | null>
  /** One open appeal per session: updates the open one's reason, else inserts. */
  upsertOpenAppeal(input: {
    readonly sessionId: string
    readonly studentId: string
    readonly reason: string
  }): Promise<AppealRecord>
}

/** A student may appeal only a session that has finished. */
const APPEALABLE: ReadonlySet<SessionStatus> = new Set<SessionStatus>(['completed', 'expired'])

export type SubmitAppealRequest = {
  readonly appeals: AppealRepository
  readonly actor: Actor
  readonly sessionId: string
  readonly reason: string
}

/**
 * FR-503 — a student submits a free-text appeal on a completed session. The
 * appeal is stored `open` and becomes visible to the lecturer. Adjudication is
 * manual for the pilot (out of scope here).
 */
export async function submitAppeal(request: SubmitAppealRequest): Promise<AppealRecord> {
  const parsed = appealInputSchema.safeParse({ reason: request.reason })
  if (!parsed.success) throw new InvalidAppealError()

  const context = await request.appeals.findSessionAuth(request.sessionId)
  if (context === null) throw new ResourceNotFoundError()

  if (request.actor.role !== 'student') throw new AuthenticationRoleError()
  if (
    request.actor.id !== context.studentId ||
    request.actor.institutionId !== context.institutionId
  ) {
    throw new ResourceForbiddenError()
  }
  if (!APPEALABLE.has(context.status)) throw new AppealNotAllowedError()

  return request.appeals.upsertOpenAppeal({
    sessionId: request.sessionId,
    studentId: request.actor.id,
    reason: parsed.data.reason,
  })
}
