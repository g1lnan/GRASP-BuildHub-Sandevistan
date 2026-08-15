'use server'

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
import { redirect } from 'next/navigation'

export type JoinState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'error'; readonly message: string }

export async function joinCourseAction(_prev: JoinState, formData: FormData): Promise<JoinState> {
  try {
    const actor = await requireRole(['student'])
    await enrollWithJoinCode({
      enrollments: drizzleEnrollmentRepository,
      actor,
      input: { joinCode: formData.get('joinCode') },
    })
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError)
      return { kind: 'error', message: vi.errors.invalidJoinCode }
    if (error instanceof ResourceForbiddenError)
      return { kind: 'error', message: vi.errors.forbidden }
    if (error instanceof AuthenticationRoleError)
      return { kind: 'error', message: vi.errors.roleRequired }
    if (error instanceof CourseArchivedError) return { kind: 'error', message: vi.errors.archived }
    if (error instanceof JoinCodeRevokedError)
      return { kind: 'error', message: vi.errors.joinCodeRevoked }
    if (error instanceof AlreadyEnrolledError)
      return { kind: 'error', message: vi.errors.alreadyEnrolled }
    return { kind: 'error', message: vi.errors.serverError }
  }
  redirect('/student')
}
