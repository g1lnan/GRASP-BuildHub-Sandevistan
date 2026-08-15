import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleProductScoreRepository } from '@/lib/repositories/drizzle-outcomes'
import {
  AuthenticationRoleError,
  InvalidOverrideError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from '@/lib/services/errors'
import { setSubmissionProductScore } from '@/lib/services/override-service'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params
  try {
    const actor = await requireRole(['lecturer'])
    const body = await request.json()
    const raw = body?.productScore
    const productScore = raw === null || raw === undefined ? null : Number(raw)
    if (productScore !== null && Number.isNaN(productScore)) {
      return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
    }
    await setSubmissionProductScore({
      submissions: drizzleProductScoreRepository,
      actor,
      submissionId,
      productScore,
    })
    return NextResponse.json({ ok: true, productScore })
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
