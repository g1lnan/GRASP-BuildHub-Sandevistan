import {
  AuthenticationRequiredError,
  AuthorizationDeniedError,
  requireRole,
} from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleSessionRepository } from '@/lib/repositories/drizzle-sessions'
import {
  AuthenticationRoleError,
  InvalidProbeClaimError,
  ResourceForbiddenError,
  ResourceNotFoundError,
  SessionNoProbesError,
  SubmissionNotReadyError,
} from '@/lib/services/errors'
import { startTypedSession } from '@/lib/session/runtime'
import { startSessionInputSchema } from '@/lib/validation/inputs'
import { type NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const actor = await requireRole(['student'])
    const input = startSessionInputSchema.parse(await request.json())
    const session = await startTypedSession({
      sessions: drizzleSessionRepository,
      actor,
      submissionId: input.submissionId,
      now: new Date(),
    })
    return NextResponse.json(session, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ error: vi.errors.authenticationRequired }, { status: 401 })
    }
    if (error instanceof AuthorizationDeniedError || error instanceof AuthenticationRoleError) {
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    }
    if (error instanceof ResourceNotFoundError) {
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    }
    if (error instanceof ResourceForbiddenError) {
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    }
    if (error instanceof SubmissionNotReadyError) {
      return NextResponse.json({ error: vi.errors.submissionNotReady }, { status: 409 })
    }
    if (error instanceof SessionNoProbesError) {
      return NextResponse.json({ error: vi.errors.sessionNoProbes }, { status: 409 })
    }
    if (error instanceof InvalidProbeClaimError) {
      return NextResponse.json({ error: vi.errors.sessionNoProbes }, { status: 409 })
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
    }
    return NextResponse.json({ error: vi.errors.serverError }, { status: 500 })
  }
}
