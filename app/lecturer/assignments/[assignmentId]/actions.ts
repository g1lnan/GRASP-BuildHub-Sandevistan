'use server'

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
import { revalidatePath } from 'next/cache'

export type AssignmentActionState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'success' }

function mapError(error: unknown): string {
  if (error instanceof ResourceNotFoundError) return vi.errors.notFound
  if (error instanceof ResourceForbiddenError) return vi.errors.forbidden
  if (error instanceof AuthenticationRoleError) return vi.errors.roleRequired
  if (error instanceof CourseArchivedError) return vi.errors.archived
  return vi.errors.serverError
}

export async function togglePublishAction(
  assignmentId: string,
  publishedAt: Date | null,
  _prev: AssignmentActionState,
  _formData: FormData,
): Promise<AssignmentActionState> {
  try {
    const actor = await requireRole(['lecturer'])
    await setAssignmentPublished({
      assignments: drizzleAssignmentRepository,
      courses: drizzleCourseRepository,
      actor,
      assignmentId,
      publishedAt,
    })
    revalidatePath(`/lecturer/assignments/${assignmentId}`)
    return { kind: 'success' }
  } catch (error: unknown) {
    return { kind: 'error', message: mapError(error) }
  }
}
