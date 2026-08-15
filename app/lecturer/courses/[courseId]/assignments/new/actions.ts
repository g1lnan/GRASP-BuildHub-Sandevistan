'use server'

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
import { redirect } from 'next/navigation'

export type NewAssignmentState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'error'; readonly message: string }

export async function createAssignmentAction(
  courseId: string,
  _prev: NewAssignmentState,
  formData: FormData,
): Promise<NewAssignmentState> {
  let assignmentId: string
  try {
    const actor = await requireRole(['lecturer'])
    const conceptsRaw = formData.get('subjectConcepts')
    const subjectConcepts =
      typeof conceptsRaw === 'string'
        ? conceptsRaw
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : []

    // datetime-local returns "YYYY-MM-DDTHH:mm" without timezone offset.
    // Zod's datetime({ offset: true }) requires an offset. Append +00:00 so the
    // value is treated as UTC; the server normalises to Date anyway.
    const dueAtRaw = formData.get('dueAt')
    const dueAt =
      typeof dueAtRaw === 'string' && dueAtRaw && !dueAtRaw.includes('+') && !dueAtRaw.endsWith('Z')
        ? `${dueAtRaw}:00+00:00`
        : dueAtRaw

    const assignment = await createAssignment({
      assignments: drizzleAssignmentRepository,
      courses: drizzleCourseRepository,
      actor,
      input: {
        courseId,
        title: formData.get('title'),
        prompt: formData.get('prompt'),
        dueAt,
        subjectConcepts,
        probeCount: Number(formData.get('probeCount')),
        timeCapSeconds: Number(formData.get('timeCapSeconds')),
        defenseWeightPct: Number(formData.get('defenseWeightPct')),
      },
    })
    assignmentId = assignment.id
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError)
      return { kind: 'error', message: vi.errors.notFound }
    if (error instanceof ResourceForbiddenError)
      return { kind: 'error', message: vi.errors.forbidden }
    if (error instanceof AuthenticationRoleError)
      return { kind: 'error', message: vi.errors.roleRequired }
    if (error instanceof CourseArchivedError) return { kind: 'error', message: vi.errors.archived }
    return { kind: 'error', message: vi.errors.invalidInput }
  }
  redirect(`/lecturer/assignments/${assignmentId}`)
}
