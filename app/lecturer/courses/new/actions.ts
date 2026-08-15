'use server'

import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleCourseRepository } from '@/lib/repositories/drizzle-courses'
import { createCourse } from '@/lib/services/course-service'
import { AuthenticationRoleError } from '@/lib/services/errors'
import { redirect } from 'next/navigation'

export type NewCourseState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'error'; readonly message: string }

export async function createCourseAction(
  _prev: NewCourseState,
  formData: FormData,
): Promise<NewCourseState> {
  let courseId: string
  try {
    const actor = await requireRole(['lecturer'])
    const course = await createCourse({
      repository: drizzleCourseRepository,
      actor,
      input: {
        name: formData.get('name'),
        term: formData.get('term'),
      },
    })
    courseId = course.id
  } catch (error: unknown) {
    if (error instanceof AuthenticationRoleError) {
      return { kind: 'error', message: vi.errors.roleRequired }
    }
    return { kind: 'error', message: vi.errors.invalidInput }
  }
  redirect(`/lecturer/courses/${courseId}`)
}
