import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleAppealRepository } from '@/lib/repositories/drizzle-appeals'
import { submitAppeal } from '@/lib/services/appeal-service'
import {
  AppealNotAllowedError,
  AuthenticationRoleError,
  InvalidAppealError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from '@/lib/services/errors'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  try {
    const actor = await requireRole(['student'])
    const body = await request.json()
    const appeal = await submitAppeal({
      appeals: drizzleAppealRepository,
      actor,
      sessionId,
      reason: typeof body?.reason === 'string' ? body.reason : '',
    })
    return NextResponse.json({ ok: true, appeal })
  } catch (error: unknown) {
    if (error instanceof InvalidAppealError)
      return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
    if (error instanceof AppealNotAllowedError)
      return NextResponse.json({ error: vi.errors.appealNotAllowed }, { status: 409 })
    if (error instanceof ResourceNotFoundError)
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    if (error instanceof ResourceForbiddenError)
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    if (error instanceof AuthenticationRoleError)
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    return NextResponse.json({ error: vi.errors.serverError }, { status: 500 })
  }
}
