import 'server-only'

import { db } from '@/lib/db'
import { assignments, enrollments } from '@/lib/db/schema'
import type {
  AssignmentDetailRecord,
  AssignmentRecord,
  AssignmentRepository,
} from '@/lib/services/assignment-service'
import { ResourceNotFoundError } from '@/lib/services/errors'
import { and, desc, eq, isNotNull, lte } from 'drizzle-orm'

const assignmentSelection = {
  id: assignments.id,
  courseId: assignments.courseId,
  publishedAt: assignments.publishedAt,
}

const assignmentDetailSelection = {
  ...assignmentSelection,
  title: assignments.title,
  prompt: assignments.prompt,
  dueAt: assignments.dueAt,
  subjectConcepts: assignments.subjectConcepts,
  probeCount: assignments.probeCount,
  timeCapSeconds: assignments.timeCapSeconds,
  defenseWeightPct: assignments.defenseWeightPct,
  createdAt: assignments.createdAt,
}

export const drizzleAssignmentRepository: AssignmentRepository = {
  async create(input): Promise<AssignmentRecord> {
    const rows = await db.insert(assignments).values(input).returning(assignmentSelection)
    const row = rows[0]
    if (row === undefined) throw new ResourceNotFoundError()
    return row
  },
  async findById(id): Promise<AssignmentRecord | null> {
    const rows = await db
      .select(assignmentSelection)
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1)
    return rows[0] ?? null
  },
  async findDetailById(id): Promise<AssignmentDetailRecord | null> {
    const rows = await db
      .select(assignmentDetailSelection)
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1)
    return rows[0] ?? null
  },
  async listByCourse(courseId): Promise<readonly AssignmentDetailRecord[]> {
    return db
      .select(assignmentDetailSelection)
      .from(assignments)
      .where(eq(assignments.courseId, courseId))
      .orderBy(desc(assignments.createdAt))
  },
  async setPublishedAt(id, publishedAt): Promise<void> {
    await db
      .update(assignments)
      .set({ publishedAt, updatedAt: new Date() })
      .where(eq(assignments.id, id))
  },
  async listPublishedForStudent(studentId, now): Promise<readonly AssignmentDetailRecord[]> {
    return db
      .select(assignmentDetailSelection)
      .from(assignments)
      .innerJoin(enrollments, eq(assignments.courseId, enrollments.courseId))
      .where(
        and(
          eq(enrollments.studentId, studentId),
          isNotNull(assignments.publishedAt),
          lte(assignments.publishedAt, now),
        ),
      )
      .orderBy(desc(assignments.dueAt))
  },
}
