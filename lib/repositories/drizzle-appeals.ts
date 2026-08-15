import 'server-only'

import { db } from '@/lib/db'
import { appeals, assignments, courses, sessions, submissions } from '@/lib/db/schema'
import type {
  AppealRecord,
  AppealRepository,
  AppealSessionAuth,
  SessionStatus,
} from '@/lib/services/appeal-service'
import { and, desc, eq } from 'drizzle-orm'

function recordFromRow(row: typeof appeals.$inferSelect): AppealRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    studentId: row.studentId,
    reason: row.reason,
    status: row.status as AppealRecord['status'],
    resolution: row.resolution,
    createdAt: row.createdAt,
  }
}

export const drizzleAppealRepository: AppealRepository = {
  async findSessionAuth(sessionId: string): Promise<AppealSessionAuth | null> {
    const rows = await db
      .select({
        studentId: sessions.studentId,
        institutionId: courses.institutionId,
        status: sessions.status,
      })
      .from(sessions)
      .innerJoin(submissions, eq(sessions.submissionId, submissions.id))
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(sessions.id, sessionId))
      .limit(1)
    const row = rows[0]
    if (row === undefined) return null
    return {
      studentId: row.studentId,
      institutionId: row.institutionId,
      status: row.status as SessionStatus,
    }
  },

  async upsertOpenAppeal(input): Promise<AppealRecord> {
    return db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(appeals)
        .where(
          and(
            eq(appeals.sessionId, input.sessionId),
            eq(appeals.studentId, input.studentId),
            eq(appeals.status, 'open'),
          ),
        )
        .limit(1)

      const current = existing[0]
      if (current !== undefined) {
        const updated = await tx
          .update(appeals)
          .set({ reason: input.reason, updatedAt: new Date() })
          .where(eq(appeals.id, current.id))
          .returning()
        return recordFromRow(updated[0] ?? current)
      }

      const inserted = await tx
        .insert(appeals)
        .values({
          sessionId: input.sessionId,
          studentId: input.studentId,
          reason: input.reason,
          status: 'open',
        })
        .returning()
      const row = inserted[0]
      if (row === undefined) throw new Error('failed to insert appeal')
      return recordFromRow(row)
    })
  },
}

/** Lecturer-facing: appeals attached to a session, newest first (FR-503). */
export async function listAppealsBySession(sessionId: string): Promise<readonly AppealRecord[]> {
  const rows = await db
    .select()
    .from(appeals)
    .where(eq(appeals.sessionId, sessionId))
    .orderBy(desc(appeals.createdAt))
  return rows.map(recordFromRow)
}
