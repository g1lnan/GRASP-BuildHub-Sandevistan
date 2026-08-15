import 'server-only'

import { scoringOutputSchema } from '@/lib/ai/scoring-schemas'
import { db } from '@/lib/db'
import {
  assignments,
  claimGraphs,
  courses,
  probes,
  scores,
  sessions,
  submissions,
  turns,
} from '@/lib/db/schema'
import { ResourceNotFoundError } from '@/lib/services/errors'
import type {
  LockedScoreRepository,
  NewScore,
  ScoreRecord,
  ScoreRepository,
  ScoringContext,
} from '@/lib/services/scoring-service'
import { and, asc, eq, sql } from 'drizzle-orm'

function recordFromRow(row: typeof scores.$inferSelect): ScoreRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    dimensions: scoringOutputSchema.parse(row.rationale),
    composite: Number(row.composite),
    confidenceLow: Number(row.confidenceLow),
    confidenceHigh: Number(row.confidenceHigh),
    confidenceLabel: row.confidenceLabel as ScoreRecord['confidenceLabel'],
    model: row.model,
    promptVersion: row.promptVersion,
  }
}

async function findBySessionId(sessionId: string): Promise<ScoreRecord | null> {
  const rows = await db.select().from(scores).where(eq(scores.sessionId, sessionId)).limit(1)
  const row = rows[0]
  return row === undefined ? null : recordFromRow(row)
}

export const drizzleScoreRepository: ScoreRepository = {
  async findContext(sessionId: string): Promise<ScoringContext | null> {
    const rows = await db
      .select({
        sessionId: sessions.id,
        submissionId: submissions.id,
        studentId: sessions.studentId,
        institutionId: courses.institutionId,
        status: sessions.status,
        submissionText: submissions.extractedText,
        rubricWeights: assignments.rubricWeights,
        claimGraphId: sessions.claimGraphId,
        nodes: claimGraphs.nodes,
      })
      .from(sessions)
      .innerJoin(submissions, eq(sessions.submissionId, submissions.id))
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .innerJoin(claimGraphs, eq(sessions.claimGraphId, claimGraphs.id))
      .where(eq(sessions.id, sessionId))
      .limit(1)
    const row = rows[0]
    if (row === undefined) return null

    const [probeRows, turnRows] = await Promise.all([
      db
        .select({ id: probes.id, claimNodeId: probes.claimNodeId })
        .from(probes)
        .where(and(eq(probes.claimGraphId, row.claimGraphId), eq(probes.selected, true))),
      db
        .select({
          probeId: turns.probeId,
          ordinal: turns.ordinal,
          questionVi: probes.textVi,
          claimNodeId: probes.claimNodeId,
          transcript: turns.transcript,
          inputMode: turns.inputMode,
          asrConfidence: turns.asrConfidence,
        })
        .from(turns)
        .innerJoin(probes, eq(turns.probeId, probes.id))
        .where(eq(turns.sessionId, sessionId))
        .orderBy(asc(turns.ordinal)),
    ])
    const claimText = new Map(row.nodes.map((node) => [node.id, node.text]))
    return {
      sessionId: row.sessionId,
      submissionId: row.submissionId,
      studentId: row.studentId,
      institutionId: row.institutionId,
      status: row.status as ScoringContext['status'],
      submissionText: row.submissionText,
      rubricWeights: row.rubricWeights,
      expectedProbeCount: probeRows.length,
      turns: turnRows.map((turn) => ({
        probeId: turn.probeId,
        ordinal: turn.ordinal,
        questionVi: turn.questionVi,
        claimText: claimText.get(turn.claimNodeId) ?? '',
        transcript: turn.transcript,
        inputMode: turn.inputMode as 'voice' | 'typed',
        asrConfidence: turn.asrConfidence === null ? null : Number(turn.asrConfidence),
      })),
    }
  },

  findBySessionId,

  async runExclusive<T>(
    sessionId: string,
    operation: (scores: LockedScoreRepository) => Promise<T>,
  ): Promise<T> {
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${sessionId}, 0))`)

      const lockedRepository: LockedScoreRepository = {
        async findBySessionId(lockedSessionId) {
          const rows = await tx
            .select()
            .from(scores)
            .where(eq(scores.sessionId, lockedSessionId))
            .limit(1)
          const row = rows[0]
          return row === undefined ? null : recordFromRow(row)
        },

        async create(input) {
          await tx
            .insert(scores)
            .values({
              sessionId: input.sessionId,
              d1Recall: input.dimensions.d1Recall.score.toString(),
              d2Explanation: input.dimensions.d2Explanation.score.toString(),
              d3Application: input.dimensions.d3Application.score.toString(),
              d4Evaluation: input.dimensions.d4Evaluation.score.toString(),
              d5Metacognition: input.dimensions.d5Metacognition.score.toString(),
              composite: input.composite.toString(),
              confidenceLow: input.confidenceLow.toString(),
              confidenceHigh: input.confidenceHigh.toString(),
              confidenceLabel: input.confidenceLabel,
              rationale: input.dimensions,
              model: input.model,
              promptVersion: input.promptVersion,
            })
            .onConflictDoNothing({ target: scores.sessionId })
          const rows = await tx
            .select()
            .from(scores)
            .where(eq(scores.sessionId, input.sessionId))
            .limit(1)
          const row = rows[0]
          if (row === undefined) throw new ResourceNotFoundError()
          return recordFromRow(row)
        },
      }

      return operation(lockedRepository)
    })
  },

  async create(input: NewScore): Promise<ScoreRecord> {
    const inserted = await db
      .insert(scores)
      .values({
        sessionId: input.sessionId,
        d1Recall: input.dimensions.d1Recall.score.toString(),
        d2Explanation: input.dimensions.d2Explanation.score.toString(),
        d3Application: input.dimensions.d3Application.score.toString(),
        d4Evaluation: input.dimensions.d4Evaluation.score.toString(),
        d5Metacognition: input.dimensions.d5Metacognition.score.toString(),
        composite: input.composite.toString(),
        confidenceLow: input.confidenceLow.toString(),
        confidenceHigh: input.confidenceHigh.toString(),
        confidenceLabel: input.confidenceLabel,
        rationale: input.dimensions,
        model: input.model,
        promptVersion: input.promptVersion,
      })
      .onConflictDoNothing({ target: scores.sessionId })
      .returning({ id: scores.id })
    const created = await findBySessionId(input.sessionId)
    if (created === null || (inserted.length === 0 && created.sessionId !== input.sessionId)) {
      throw new ResourceNotFoundError()
    }
    return created
  },
}
