import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { getEvidenceBundle } from '@/lib/repositories/drizzle-outcomes'
import { AuthenticationRoleError } from '@/lib/services/errors'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** FR-407 — evidence bundle exportable as JSON. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  try {
    const actor = await requireRole(['lecturer'])
    const bundle = await getEvidenceBundle(sessionId)
    if (bundle === null) return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    if (
      bundle.auth.courseLecturerId !== actor.id ||
      bundle.auth.institutionId !== actor.institutionId
    ) {
      // Do not leak existence to a non-owning lecturer.
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    }
    const { auth: _auth, ...exportable } = bundle
    return NextResponse.json(exportable, {
      headers: {
        'Content-Disposition': `attachment; filename="grasp-evidence-${sessionId}.json"`,
      },
    })
  } catch (error: unknown) {
    if (error instanceof AuthenticationRoleError)
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    return NextResponse.json({ error: vi.errors.serverError }, { status: 500 })
  }
}
