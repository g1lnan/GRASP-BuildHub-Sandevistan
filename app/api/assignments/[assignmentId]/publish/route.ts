import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleAssignmentRepository } from '@/lib/repositories/drizzle-assignments'
import { drizzleCourseRepository } from '@/lib/repositories/drizzle-courses'
import { setAssignmentPublished } from '@/lib/services/assignment-service'
import {
  AuthenticationRoleError,
  CourseArchivedError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from '@/lib/services/errors'
import { type NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> },
) {
  const { assignmentId } = await params
  try {
    const actor = await requireRole(['lecturer'])
    const body = await request.json()
    const publishedAt =
      body.publishedAt === null ? null : body.publishedAt ? new Date(body.publishedAt) : new Date()
    await setAssignmentPublished({
      assignments: drizzleAssignmentRepository,
      courses: drizzleCourseRepository,
      actor,
      assignmentId,
      publishedAt,
    })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError)
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    if (error instanceof ResourceForbiddenError)
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    if (error instanceof AuthenticationRoleError)
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    if (error instanceof CourseArchivedError)
      return NextResponse.json({ error: vi.errors.archived }, { status: 409 })
    return NextResponse.json({ error: vi.errors.serverError }, { status: 500 })
  }
}
