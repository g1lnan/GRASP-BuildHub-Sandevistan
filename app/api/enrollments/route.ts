import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleEnrollmentRepository } from '@/lib/repositories/drizzle-courses'
import { enrollWithJoinCode } from '@/lib/services/course-service'
import {
  AlreadyEnrolledError,
  AuthenticationRoleError,
  CourseArchivedError,
  JoinCodeRevokedError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from '@/lib/services/errors'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const actor = await requireRole(['student'])
    const body = await request.json()
    await enrollWithJoinCode({
      enrollments: drizzleEnrollmentRepository,
      actor,
      input: body,
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError)
      return NextResponse.json({ error: vi.errors.invalidJoinCode }, { status: 404 })
    if (error instanceof ResourceForbiddenError)
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    if (error instanceof AuthenticationRoleError)
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    if (error instanceof CourseArchivedError)
      return NextResponse.json({ error: vi.errors.archived }, { status: 409 })
    if (error instanceof JoinCodeRevokedError)
      return NextResponse.json({ error: vi.errors.joinCodeRevoked }, { status: 410 })
    if (error instanceof AlreadyEnrolledError)
      return NextResponse.json({ error: vi.errors.alreadyEnrolled }, { status: 409 })
    return NextResponse.json({ error: vi.errors.serverError }, { status: 500 })
  }
}
