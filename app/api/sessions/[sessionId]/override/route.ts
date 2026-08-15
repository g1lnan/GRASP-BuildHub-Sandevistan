import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleOverrideRepository } from '@/lib/repositories/drizzle-outcomes'
import {
  AuthenticationRoleError,
  InvalidOverrideError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from '@/lib/services/errors'
import { applyScoreOverride } from '@/lib/services/override-service'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  try {
    const actor = await requireRole(['lecturer'])
    const body = await request.json()
    const override = await applyScoreOverride({
      overrides: drizzleOverrideRepository,
      actor,
      sessionId,
      overridden: body?.overridden ?? {},
      note: body?.note ?? null,
    })
    return NextResponse.json({ ok: true, override })
  } catch (error: unknown) {
    if (error instanceof InvalidOverrideError)
      return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
    if (error instanceof ResourceNotFoundError)
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    if (error instanceof ResourceForbiddenError)
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    if (error instanceof AuthenticationRoleError)
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    return NextResponse.json({ error: vi.errors.serverError }, { status: 500 })
  }
}
