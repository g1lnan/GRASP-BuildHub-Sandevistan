'use server'

import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleCourseRepository } from '@/lib/repositories/drizzle-courses'
import { archiveCourse, rotateJoinCode } from '@/lib/services/course-service'
import {
  AuthenticationRoleError,
  CourseArchivedError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from '@/lib/services/errors'
import { revalidatePath } from 'next/cache'

export type CourseActionState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'success'; readonly message: string }

function mapError(error: unknown): string {
  if (error instanceof ResourceNotFoundError) return vi.errors.notFound
  if (error instanceof ResourceForbiddenError) return vi.errors.forbidden
  if (error instanceof AuthenticationRoleError) return vi.errors.roleRequired
  if (error instanceof CourseArchivedError) return vi.errors.archived
  return vi.errors.serverError
}

export async function archiveCourseAction(
  courseId: string,
  _prev: CourseActionState,
  _formData: FormData,
): Promise<CourseActionState> {
  try {
    const actor = await requireRole(['lecturer'])
    await archiveCourse({
      repository: drizzleCourseRepository,
      actor,
      courseId,
      now: new Date(),
    })
    revalidatePath(`/lecturer/courses/${courseId}`)
    revalidatePath('/lecturer/courses')
    return { kind: 'success', message: vi.actions.success }
  } catch (error: unknown) {
    return { kind: 'error', message: mapError(error) }
  }
}

export async function rotateJoinCodeAction(
  courseId: string,
  _prev: CourseActionState,
  _formData: FormData,
): Promise<CourseActionState> {
  try {
    const actor = await requireRole(['lecturer'])
    await rotateJoinCode({
      repository: drizzleCourseRepository,
      actor,
      courseId,
    })
    revalidatePath(`/lecturer/courses/${courseId}`)
    return { kind: 'success', message: vi.actions.success }
  } catch (error: unknown) {
    return { kind: 'error', message: mapError(error) }
  }
}
