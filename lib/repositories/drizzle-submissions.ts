import 'server-only'

import { db } from '@/lib/db'
import { assignments, courses, enrollments, submissions, users } from '@/lib/db/schema'
import type {
  AnalysisSubmission,
  AnalysisSubmissionRepository,
} from '@/lib/services/analysis-service'
import { ResourceNotFoundError } from '@/lib/services/errors'
import type {
  NewSubmission,
  PublishableAssignment,
  SubmissionAssignmentRepository,
  SubmissionAuthRecord,
  SubmissionEnrollmentRepository,
  SubmissionRecord,
  SubmissionRepository,
  SubmissionStatus,
} from '@/lib/services/submission-service'
import { and, desc, eq } from 'drizzle-orm'

const submissionSelection = {
  id: submissions.id,
  assignmentId: submissions.assignmentId,
  studentId: submissions.studentId,
  status: submissions.status,
}

export const drizzleSubmissionRepository: SubmissionRepository = {
  async create(input: NewSubmission): Promise<SubmissionRecord> {
    const rows = await db
      .insert(submissions)
      .values({
        assignmentId: input.assignmentId,
        studentId: input.studentId,
        source: input.source,
        extractedText: input.text,
        wordCount: input.wordCount,
        status: 'pending',
      })
      .returning(submissionSelection)
    const row = rows[0]
    if (row === undefined) throw new ResourceNotFoundError()
    return { ...row, status: row.status as SubmissionStatus }
  },
  async findAuthById(id: string): Promise<SubmissionAuthRecord | null> {
    const rows = await db
      .select({
        id: submissions.id,
        assignmentId: submissions.assignmentId,
        studentId: submissions.studentId,
        status: submissions.status,
        error: submissions.error,
        wordCount: submissions.wordCount,
        createdAt: submissions.createdAt,
        courseId: courses.id,
        courseLecturerId: courses.lecturerId,
        institutionId: courses.institutionId,
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(submissions.id, id))
      .limit(1)
    const row = rows[0]
    if (row === undefined) return null
    return { ...row, status: row.status as SubmissionStatus }
  },
}

export const drizzleSubmissionAssignmentRepository: SubmissionAssignmentRepository = {
  async findPublishable(assignmentId: string): Promise<PublishableAssignment | null> {
    const rows = await db
      .select({
        id: assignments.id,
        courseId: assignments.courseId,
        institutionId: courses.institutionId,
        publishedAt: assignments.publishedAt,
      })
      .from(assignments)
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(assignments.id, assignmentId))
      .limit(1)
    return rows[0] ?? null
  },
}

export const drizzleSubmissionEnrollmentRepository: SubmissionEnrollmentRepository = {
  async isEnrolled(courseId: string, studentId: string): Promise<boolean> {
    const rows = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.courseId, courseId), eq(enrollments.studentId, studentId)))
      .limit(1)
    return rows[0] !== undefined
  },
}

export type AssignmentSubmissionRow = {
  readonly id: string
  readonly studentDisplayName: string
  readonly status: string
  readonly wordCount: number
  readonly createdAt: Date
}

/** Read-only view: submissions for one assignment (lecturer analysis navigation). */
export async function listSubmissionsByAssignment(
  assignmentId: string,
): Promise<readonly AssignmentSubmissionRow[]> {
  return db
    .select({
      id: submissions.id,
      studentDisplayName: users.displayName,
      status: submissions.status,
      wordCount: submissions.wordCount,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.studentId, users.id))
    .where(eq(submissions.assignmentId, assignmentId))
    .orderBy(desc(submissions.createdAt))
}

export const drizzleAnalysisSubmissionRepository: AnalysisSubmissionRepository = {
  async findForAnalysis(id: string): Promise<AnalysisSubmission | null> {
    const rows = await db
      .select({
        id: submissions.id,
        studentId: submissions.studentId,
        status: submissions.status,
        extractedText: submissions.extractedText,
        probeCount: assignments.probeCount,
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(eq(submissions.id, id))
      .limit(1)
    return rows[0] ?? null
  },
  async setStatus(id, status, error): Promise<void> {
    await db
      .update(submissions)
      .set({ status, error: error ?? null, updatedAt: new Date() })
      .where(eq(submissions.id, id))
  },
}
