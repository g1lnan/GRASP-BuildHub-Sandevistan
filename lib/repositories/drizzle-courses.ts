import 'server-only'

import { db } from '@/lib/db'
import { courses, enrollments } from '@/lib/db/schema'
import type {
  CourseDetailRecord,
  CourseRecord,
  CourseRepository,
  EnrollmentRepository,
  EnrollmentResult,
  NewCourseRecord,
} from '@/lib/services/course-service'
import { ResourceNotFoundError } from '@/lib/services/errors'
import { desc, eq } from 'drizzle-orm'

const courseSelection = {
  id: courses.id,
  institutionId: courses.institutionId,
  lecturerId: courses.lecturerId,
  archivedAt: courses.archivedAt,
  joinCodeRevokedAt: courses.joinCodeRevokedAt,
}

const courseDetailSelection = {
  ...courseSelection,
  name: courses.name,
  term: courses.term,
  joinCode: courses.joinCode,
  createdAt: courses.createdAt,
}

export const drizzleCourseRepository: CourseRepository = {
  async create(record: NewCourseRecord): Promise<CourseRecord> {
    const rows = await db.insert(courses).values(record).returning(courseSelection)
    const row = rows[0]
    if (row === undefined) throw new ResourceNotFoundError()
    return row
  },
  async findById(id: string): Promise<CourseRecord | null> {
    const rows = await db.select(courseSelection).from(courses).where(eq(courses.id, id)).limit(1)
    return rows[0] ?? null
  },
  async findDetailById(id: string): Promise<CourseDetailRecord | null> {
    const rows = await db
      .select(courseDetailSelection)
      .from(courses)
      .where(eq(courses.id, id))
      .limit(1)
    return rows[0] ?? null
  },
  async listByLecturer(lecturerId: string): Promise<readonly CourseDetailRecord[]> {
    return db
      .select(courseDetailSelection)
      .from(courses)
      .where(eq(courses.lecturerId, lecturerId))
      .orderBy(desc(courses.createdAt))
  },
  async update(id, values): Promise<void> {
    await db
      .update(courses)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(courses.id, id))
  },
  async archive(id, archivedAt): Promise<void> {
    await db.update(courses).set({ archivedAt, updatedAt: archivedAt }).where(eq(courses.id, id))
  },
  async setJoinCode(id, joinCode, revokedAt): Promise<void> {
    await db
      .update(courses)
      .set({ joinCode, joinCodeRevokedAt: revokedAt, updatedAt: new Date() })
      .where(eq(courses.id, id))
  },
}

export const drizzleEnrollmentRepository: EnrollmentRepository = {
  async enroll(request): Promise<EnrollmentResult> {
    return db.transaction(async (transaction): Promise<EnrollmentResult> => {
      const rows = await transaction
        .select(courseSelection)
        .from(courses)
        .where(eq(courses.joinCode, request.joinCode))
        .orderBy(desc(courses.createdAt))
        .limit(1)
        .for('update')
      const course = rows[0]
      if (course === undefined) return { kind: 'not_found' }
      if (course.institutionId !== request.institutionId) return { kind: 'forbidden' }
      if (course.archivedAt !== null) return { kind: 'archived' }
      if (course.joinCodeRevokedAt !== null) return { kind: 'revoked' }
      const inserted = await transaction
        .insert(enrollments)
        .values({ courseId: course.id, studentId: request.studentId })
        .onConflictDoNothing({ target: [enrollments.courseId, enrollments.studentId] })
        .returning({ id: enrollments.id })
      return inserted[0] === undefined ? { kind: 'already_enrolled' } : { kind: 'enrolled' }
    })
  },
  async listCoursesByStudent(studentId) {
    const rows = await db
      .select({
        courseId: enrollments.courseId,
        id: courses.id,
        institutionId: courses.institutionId,
        lecturerId: courses.lecturerId,
        archivedAt: courses.archivedAt,
        joinCodeRevokedAt: courses.joinCodeRevokedAt,
        name: courses.name,
        term: courses.term,
        joinCode: courses.joinCode,
        createdAt: courses.createdAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, studentId))
      .orderBy(desc(courses.createdAt))
    return rows.map((row) => ({
      courseId: row.courseId,
      course: {
        id: row.id,
        institutionId: row.institutionId,
        lecturerId: row.lecturerId,
        archivedAt: row.archivedAt,
        joinCodeRevokedAt: row.joinCodeRevokedAt,
        name: row.name,
        term: row.term,
        joinCode: row.joinCode,
        createdAt: row.createdAt,
      },
    }))
  },
  async countByCourse(courseId) {
    const rows = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId))
    return rows.length
  },
}
