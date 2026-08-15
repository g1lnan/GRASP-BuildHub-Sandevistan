import type { Actor } from '@/lib/auth/identity'
import type { SubmissionSource } from '@/lib/ingest/extract'
import { MAX_SUBMISSION_WORDS } from '@/lib/ingest/word-count'
import {
  AssignmentNotPublishedError,
  AuthenticationRoleError,
  EmptySubmissionError,
  NotEnrolledError,
  ResourceForbiddenError,
  ResourceNotFoundError,
  WordLimitExceededError,
} from './errors'

export type SubmissionStatus = 'pending' | 'analysing' | 'ready' | 'failed'

export type SubmissionRecord = {
  readonly id: string
  readonly assignmentId: string
  readonly studentId: string
  readonly status: SubmissionStatus
}

export type SubmissionStatusRecord = {
  readonly id: string
  readonly assignmentId: string
  readonly studentId: string
  readonly status: SubmissionStatus
  readonly error: string | null
  readonly wordCount: number
  readonly createdAt: Date
}

/** Ownership context resolved in one joined read so authorisation is server-side. */
export type SubmissionAuthRecord = SubmissionStatusRecord & {
  readonly courseId: string
  readonly courseLecturerId: string
  readonly institutionId: string
}

export type NewSubmission = {
  readonly assignmentId: string
  readonly studentId: string
  readonly source: SubmissionSource
  readonly text: string
  readonly wordCount: number
}

export type PublishableAssignment = {
  readonly id: string
  readonly courseId: string
  readonly institutionId: string
  readonly publishedAt: Date | null
}

export interface SubmissionRepository {
  create(input: NewSubmission): Promise<SubmissionRecord>
  findAuthById(id: string): Promise<SubmissionAuthRecord | null>
}

export interface SubmissionAssignmentRepository {
  findPublishable(assignmentId: string): Promise<PublishableAssignment | null>
}

export interface SubmissionEnrollmentRepository {
  isEnrolled(courseId: string, studentId: string): Promise<boolean>
}

/** A student may read only their own submission; the course lecturer may read
 * submissions in their course; a researcher within the institution may read for
 * aggregate analysis. Never rendered as a verdict (FR-501). */
function canReadSubmission(actor: Actor, record: SubmissionAuthRecord): boolean {
  if (actor.institutionId !== record.institutionId) return false
  switch (actor.role) {
    case 'student':
      return actor.id === record.studentId
    case 'lecturer':
      return actor.id === record.courseLecturerId
    case 'researcher':
      return true
    default:
      return false
  }
}

export async function createSubmission(request: {
  readonly submissions: SubmissionRepository
  readonly assignments: SubmissionAssignmentRepository
  readonly enrollments: SubmissionEnrollmentRepository
  readonly actor: Actor
  readonly assignmentId: string
  readonly extracted: {
    readonly source: SubmissionSource
    readonly text: string
    readonly wordCount: number
  }
  readonly now: Date
}): Promise<SubmissionRecord> {
  if (request.actor.role !== 'student') throw new AuthenticationRoleError()

  const assignment = await request.assignments.findPublishable(request.assignmentId)
  if (assignment === null) throw new ResourceNotFoundError()
  if (assignment.institutionId !== request.actor.institutionId) throw new ResourceForbiddenError()
  if (assignment.publishedAt === null || assignment.publishedAt > request.now) {
    throw new AssignmentNotPublishedError()
  }

  const enrolled = await request.enrollments.isEnrolled(assignment.courseId, request.actor.id)
  if (!enrolled) throw new NotEnrolledError()

  if (request.extracted.text.trim().length === 0) throw new EmptySubmissionError()
  if (request.extracted.wordCount > MAX_SUBMISSION_WORDS) throw new WordLimitExceededError()

  return request.submissions.create({
    assignmentId: assignment.id,
    studentId: request.actor.id,
    source: request.extracted.source,
    text: request.extracted.text,
    wordCount: request.extracted.wordCount,
  })
}

export async function getSubmissionStatus(request: {
  readonly submissions: SubmissionRepository
  readonly actor: Actor
  readonly submissionId: string
}): Promise<SubmissionStatusRecord> {
  const record = await request.submissions.findAuthById(request.submissionId)
  if (record === null) throw new ResourceNotFoundError()
  if (!canReadSubmission(request.actor, record)) throw new ResourceForbiddenError()
  return {
    id: record.id,
    assignmentId: record.assignmentId,
    studentId: record.studentId,
    status: record.status,
    error: record.error,
    wordCount: record.wordCount,
    createdAt: record.createdAt,
  }
}
