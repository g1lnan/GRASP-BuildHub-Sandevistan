'use server'

import { requireRole } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { type SubmissionSource, extractSubmission } from '@/lib/ingest/extract'
import { enqueueJob } from '@/lib/jobs/queue'
import { drizzleJobRepository } from '@/lib/repositories/drizzle-jobs'
import {
  drizzleSubmissionAssignmentRepository,
  drizzleSubmissionEnrollmentRepository,
  drizzleSubmissionRepository,
} from '@/lib/repositories/drizzle-submissions'
import {
  AssignmentNotPublishedError,
  AuthenticationRoleError,
  EmptySubmissionError,
  NotEnrolledError,
  ResourceForbiddenError,
  ResourceNotFoundError,
  WordLimitExceededError,
} from '@/lib/services/errors'
import { createSubmission } from '@/lib/services/submission-service'
import { redirect } from 'next/navigation'

export type SubmitState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'error'; readonly message: string }

function sourceFromFile(file: File): SubmissionSource | null {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return 'docx'
  }
  return null
}

export async function submitAction(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  let submissionId: string | null = null
  try {
    const actor = await requireRole(['student'])
    const assignmentId = formData.get('assignmentId')
    if (typeof assignmentId !== 'string') return { kind: 'error', message: vi.errors.invalidInput }

    const file = formData.get('file')
    const pasted = formData.get('text')

    let extractInput: { source: SubmissionSource; text?: string; buffer?: Buffer }
    if (file instanceof File && file.size > 0) {
      const source = sourceFromFile(file)
      if (source === null) return { kind: 'error', message: vi.errors.emptySubmission }
      extractInput = { source, buffer: Buffer.from(await file.arrayBuffer()) }
    } else if (typeof pasted === 'string' && pasted.trim().length > 0) {
      extractInput = { source: 'text', text: pasted }
    } else {
      return { kind: 'error', message: vi.errors.emptySubmission }
    }

    const extracted = await extractSubmission(extractInput)
    const submission = await createSubmission({
      submissions: drizzleSubmissionRepository,
      assignments: drizzleSubmissionAssignmentRepository,
      enrollments: drizzleSubmissionEnrollmentRepository,
      actor,
      assignmentId,
      extracted,
      now: new Date(),
    })
    await enqueueJob({
      jobs: drizzleJobRepository,
      type: 'analyze_submission',
      payload: { submissionId: submission.id },
    })
    submissionId = submission.id
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError)
      return { kind: 'error', message: vi.errors.notFound }
    if (error instanceof ResourceForbiddenError)
      return { kind: 'error', message: vi.errors.forbidden }
    if (error instanceof AuthenticationRoleError)
      return { kind: 'error', message: vi.errors.roleRequired }
    if (error instanceof AssignmentNotPublishedError)
      return { kind: 'error', message: vi.errors.notPublished }
    if (error instanceof NotEnrolledError) return { kind: 'error', message: vi.errors.notEnrolled }
    if (error instanceof WordLimitExceededError)
      return { kind: 'error', message: vi.errors.wordLimit }
    if (error instanceof EmptySubmissionError)
      return { kind: 'error', message: vi.errors.emptySubmission }
    return { kind: 'error', message: vi.errors.serverError }
  }

  if (submissionId !== null) redirect(`/student/submissions/${submissionId}`)
  return { kind: 'idle' }
}
