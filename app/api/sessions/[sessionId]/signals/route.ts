import {
  AuthenticationRequiredError,
  AuthorizationDeniedError,
  requireRole,
} from '@/lib/auth/guards'
import { integritySignalsSchema } from '@/lib/domain/integrity-signals'
import { vi } from '@/lib/i18n/vi'
import { mergeIntegritySignals } from '@/lib/repositories/drizzle-sessions'
import { AuthenticationRoleError, ResourceForbiddenError } from '@/lib/services/errors'
import { type NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const actor = await requireRole(['student'])
    const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(await params)
    const body = integritySignalsSchema.parse(await request.json())
    await mergeIntegritySignals(sessionId, actor.id, body as Record<string, unknown>)
    return NextResponse.json({ ok: true })
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
    if (error instanceof ZodError) {
      return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
    }
    return NextResponse.json({ ok: true }) // Silently accept malformed signals
  }
}
