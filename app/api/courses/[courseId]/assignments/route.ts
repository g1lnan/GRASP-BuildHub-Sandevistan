import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleAssignmentRepository } from '@/lib/repositories/drizzle-assignments'
import { drizzleCourseRepository } from '@/lib/repositories/drizzle-courses'
import { createAssignment } from '@/lib/services/assignment-service'
import {
  AuthenticationRoleError,
  CourseArchivedError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from '@/lib/services/errors'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params
  try {
    const actor = await requireRole(['lecturer'])
    const body = await request.json()
    const assignment = await createAssignment({
      assignments: drizzleAssignmentRepository,
      courses: drizzleCourseRepository,
      actor,
      input: { ...body, courseId },
    })
    return NextResponse.json(assignment, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError)
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    if (error instanceof ResourceForbiddenError)
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    if (error instanceof AuthenticationRoleError)
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    if (error instanceof CourseArchivedError)
      return NextResponse.json({ error: vi.errors.archived }, { status: 409 })
    return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
  }
}
