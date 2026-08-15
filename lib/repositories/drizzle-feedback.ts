import 'server-only'

import { feedbackOutputSchema } from '@/lib/ai/feedback-schemas'
import { scoringOutputSchema } from '@/lib/ai/scoring-schemas'
import { db } from '@/lib/db'
import {
  assignments,
  courses,
  feedbackReports,
  probes,
  scores,
  sessions,
  submissions,
  turns,
} from '@/lib/db/schema'
import { ResourceNotFoundError } from '@/lib/services/errors'
import type {
  FeedbackContext,
  FeedbackReportRecord,
  FeedbackRepository,
  LockedFeedbackRepository,
  NewFeedbackReport,
} from '@/lib/services/feedback-service'
import { asc, eq, sql } from 'drizzle-orm'

function recordFromRow(row: typeof feedbackReports.$inferSelect): FeedbackReportRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    output: feedbackOutputSchema.parse({
      strengths: row.strengths,
      gaps: row.gaps,
      reviseConcepts: row.reviseConcepts,
      bodyVi: row.bodyVi,
    }),
    model: row.model,
    promptVersion: row.promptVersion,
  }
}

async function findBySessionId(sessionId: string): Promise<FeedbackReportRecord | null> {
  const rows = await db
    .select()
    .from(feedbackReports)
    .where(eq(feedbackReports.sessionId, sessionId))
    .limit(1)
  const row = rows[0]
  return row === undefined ? null : recordFromRow(row)
}

export const drizzleFeedbackRepository: FeedbackRepository = {
  async findContext(sessionId: string): Promise<FeedbackContext | null> {
    const rows = await db
      .select({
        sessionId: sessions.id,
        submissionId: submissions.id,
        studentId: sessions.studentId,
        institutionId: courses.institutionId,
        status: sessions.status,
        submissionText: submissions.extractedText,
        score: scores.rationale,
      })
      .from(sessions)
      .innerJoin(submissions, eq(sessions.submissionId, submissions.id))
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .innerJoin(scores, eq(scores.sessionId, sessions.id))
      .where(eq(sessions.id, sessionId))
      .limit(1)
    const row = rows[0]
    if (row === undefined) return null

    const turnRows = await db
      .select({
        ordinal: turns.ordinal,
        questionVi: probes.textVi,
        transcript: turns.transcript,
      })
      .from(turns)
      .innerJoin(probes, eq(turns.probeId, probes.id))
      .where(eq(turns.sessionId, sessionId))
      .orderBy(asc(turns.ordinal))
    return {
      sessionId: row.sessionId,
      submissionId: row.submissionId,
      studentId: row.studentId,
      institutionId: row.institutionId,
      status: row.status as FeedbackContext['status'],
      submissionText: row.submissionText,
      turns: turnRows,
      score: scoringOutputSchema.parse(row.score),
    }
  },

  findBySessionId,

  async runExclusive<T>(
    sessionId: string,
    operation: (reports: LockedFeedbackRepository) => Promise<T>,
  ): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${sessionId}, 0))`)
      const lockedRepository: LockedFeedbackRepository = {
        async findBySessionId(lockedSessionId) {
          const rows = await tx
            .select()
            .from(feedbackReports)
            .where(eq(feedbackReports.sessionId, lockedSessionId))
            .limit(1)
          const row = rows[0]
          return row === undefined ? null : recordFromRow(row)
        },

        async create(input) {
          await tx
            .insert(feedbackReports)
            .values({
              sessionId: input.sessionId,
              strengths: input.output.strengths,
              gaps: input.output.gaps,
              reviseConcepts: input.output.reviseConcepts,
              bodyVi: input.output.bodyVi,
              model: input.model,
              promptVersion: input.promptVersion,
            })
            .onConflictDoNothing({ target: feedbackReports.sessionId })
          const rows = await tx
            .select()
            .from(feedbackReports)
            .where(eq(feedbackReports.sessionId, input.sessionId))
            .limit(1)
          const row = rows[0]
          if (row === undefined) throw new ResourceNotFoundError()
          return recordFromRow(row)
        },
      }
      return operation(lockedRepository)
    })
  },

  async create(input: NewFeedbackReport): Promise<FeedbackReportRecord> {
    await db
      .insert(feedbackReports)
      .values({
        sessionId: input.sessionId,
        strengths: input.output.strengths,
        gaps: input.output.gaps,
        reviseConcepts: input.output.reviseConcepts,
        bodyVi: input.output.bodyVi,
        model: input.model,
        promptVersion: input.promptVersion,
      })
      .onConflictDoNothing({ target: feedbackReports.sessionId })
    const created = await findBySessionId(input.sessionId)
    if (created === null) throw new ResourceNotFoundError()
    return created
  },
}
