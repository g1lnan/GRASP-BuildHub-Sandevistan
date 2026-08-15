import 'server-only'

import { db } from '@/lib/db'
import {
  assignments,
  claimGraphs,
  courses,
  probes,
  sessions,
  submissions,
  turns,
} from '@/lib/db/schema'
import { audioRetentionCutoff } from '@/lib/domain/retention'
import { InvalidProbeClaimError, ResourceNotFoundError } from '@/lib/services/errors'
import type { SubmissionStatus } from '@/lib/services/submission-service'
import type {
  AppendTurnResult,
  NewSession,
  NewTurn,
  SessionProbe,
  SessionRecord,
  SessionRepository,
  SessionStartContext,
  SessionStateUpdate,
  SessionStatus,
  SessionTurn,
} from '@/lib/session/runtime'
import { and, asc, desc, eq, isNotNull, isNull, lte, or, sql } from 'drizzle-orm'

async function selectedProbes(
  claimGraphId: string,
  sessionId?: string,
): Promise<readonly SessionProbe[]> {
  const graphRows = await db
    .select({ nodes: claimGraphs.nodes })
    .from(claimGraphs)
    .where(eq(claimGraphs.id, claimGraphId))
    .limit(1)
  const graph = graphRows[0]
  if (graph === undefined) return []

  const claimText = new Map(graph.nodes.map((node) => [node.id, node.text]))
  const baseCondition = and(eq(probes.claimGraphId, claimGraphId), eq(probes.selected, true))
  const condition = sessionId
    ? or(baseCondition, and(eq(probes.sessionId, sessionId), isNotNull(probes.followUpOfProbeId)))
    : baseCondition

  const rows = await db
    .select({
      id: probes.id,
      ordinal: probes.ordinal,
      textVi: probes.textVi,
      claimNodeId: probes.claimNodeId,
    })
    .from(probes)
    .where(condition)
    .orderBy(
      asc(probes.ordinal),
      asc(sql`CASE WHEN ${probes.followUpOfProbeId} IS NULL THEN 0 ELSE 1 END`),
    )

  return rows.map((row) => {
    const referencedClaim = claimText.get(row.claimNodeId)
    if (referencedClaim === undefined) throw new InvalidProbeClaimError()
    return {
      id: row.id,
      ordinal: row.ordinal,
      textVi: row.textVi,
      claimText: referencedClaim,
    }
  })
}

async function sessionTurns(sessionId: string) {
  return db
    .select({
      id: turns.id,
      probeId: turns.probeId,
      ordinal: turns.ordinal,
      inputMode: turns.inputMode,
      transcript: turns.transcript,
      asrConfidence: turns.asrConfidence,
      latencyMs: turns.latencyMs,
      durationMs: turns.durationMs,
      createdAt: turns.createdAt,
    })
    .from(turns)
    .where(eq(turns.sessionId, sessionId))
    .orderBy(asc(turns.ordinal))
}

async function findById(sessionId: string): Promise<SessionRecord | null> {
  const rows = await db
    .select({
      id: sessions.id,
      submissionId: sessions.submissionId,
      claimGraphId: sessions.claimGraphId,
      studentId: sessions.studentId,
      institutionId: courses.institutionId,
      mode: sessions.mode,
      status: sessions.status,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      elapsedSeconds: sessions.elapsedSeconds,
      timeCapSeconds: sessions.timeCapSeconds,
      subjectConcepts: assignments.subjectConcepts,
    })
    .from(sessions)
    .innerJoin(submissions, eq(sessions.submissionId, submissions.id))
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)
  const row = rows[0]
  if (row === undefined) return null

  const [probeRows, turnRows] = await Promise.all([
    selectedProbes(row.claimGraphId, row.id),
    sessionTurns(row.id),
  ])
  return {
    id: row.id,
    submissionId: row.submissionId,
    claimGraphId: row.claimGraphId,
    studentId: row.studentId,
    institutionId: row.institutionId,
    mode: row.mode as SessionRecord['mode'],
    status: row.status as SessionStatus,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    elapsedSeconds: row.elapsedSeconds ?? 0,
    timeCapSeconds: row.timeCapSeconds,
    subjectConcepts: row.subjectConcepts,
    probes: probeRows,
    turns: turnRows.map((turn) => ({
      ...turn,
      inputMode: turn.inputMode as SessionRecord['turns'][number]['inputMode'],
      asrConfidence: turn.asrConfidence === null ? null : Number(turn.asrConfidence),
      durationMs: turn.durationMs ?? 0,
    })),
  }
}

export const drizzleSessionRepository: SessionRepository = {
  async findStartContext(submissionId: string): Promise<SessionStartContext | null> {
    const rows = await db
      .select({
        submissionId: submissions.id,
        studentId: submissions.studentId,
        institutionId: courses.institutionId,
        status: submissions.status,
        timeCapSeconds: assignments.timeCapSeconds,
        subjectConcepts: assignments.subjectConcepts,
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(submissions.id, submissionId))
      .limit(1)
    const row = rows[0]
    if (row === undefined) return null

    const graphRows = await db
      .select({ id: claimGraphs.id })
      .from(claimGraphs)
      .where(eq(claimGraphs.submissionId, submissionId))
      .orderBy(desc(claimGraphs.version))
      .limit(1)
    const claimGraphId = graphRows[0]?.id ?? null
    return {
      submissionId: row.submissionId,
      studentId: row.studentId,
      institutionId: row.institutionId,
      status: row.status as SubmissionStatus,
      claimGraphId,
      timeCapSeconds: row.timeCapSeconds,
      subjectConcepts: row.subjectConcepts,
      probes: claimGraphId === null ? [] : await selectedProbes(claimGraphId),
    }
  },

  async findLatestBySubmission(
    submissionId: string,
    studentId: string,
  ): Promise<SessionRecord | null> {
    const rows = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(and(eq(sessions.submissionId, submissionId), eq(sessions.studentId, studentId)))
      .orderBy(desc(sessions.startedAt))
      .limit(1)
    const row = rows[0]
    return row === undefined ? null : findById(row.id)
  },

  async create(input: NewSession): Promise<SessionRecord> {
    const rows = await db
      .insert(sessions)
      .values({
        submissionId: input.submissionId,
        claimGraphId: input.claimGraphId,
        studentId: input.studentId,
        mode: 'typed',
        status: 'in_progress',
        startedAt: input.startedAt,
        elapsedSeconds: 0,
        timeCapSeconds: input.timeCapSeconds,
      })
      .onConflictDoNothing()
      .returning({ id: sessions.id })
    const row = rows[0]
    if (row === undefined) {
      const existing = await this.findLatestBySubmission(input.submissionId, input.studentId)
      if (existing === null) throw new ResourceNotFoundError()
      return existing
    }
    const created = await findById(row.id)
    if (created === null) throw new ResourceNotFoundError()
    return created
  },

  findById,

  async appendTurn(input: NewTurn): Promise<AppendTurnResult> {
    return db.transaction(async (transaction) => {
      const inserted = await transaction
        .insert(turns)
        .values({
          sessionId: input.sessionId,
          probeId: input.probeId,
          ordinal: input.ordinal,
          inputMode: input.inputMode,
          transcript: input.transcript,
          asrConfidence: input.asrConfidence === null ? null : input.asrConfidence.toString(),
          latencyMs: input.latencyMs,
          durationMs: input.durationMs,
          audioDeletedAt: input.inputMode === 'voice' ? input.createdAt : null,
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
        })
        .onConflictDoNothing({ target: [turns.sessionId, turns.ordinal] })
        .returning({ id: turns.id })
      if (inserted.length === 0) {
        const existingRows = await transaction
          .select({
            probeId: turns.probeId,
            inputMode: turns.inputMode,
            transcript: turns.transcript,
          })
          .from(turns)
          .where(and(eq(turns.sessionId, input.sessionId), eq(turns.ordinal, input.ordinal)))
          .limit(1)
        const existing = existingRows[0]
        return existing?.probeId === input.probeId &&
          existing.inputMode === input.inputMode &&
          existing.transcript === input.transcript
          ? 'duplicate'
          : 'conflict'
      }

      const turnModes = await transaction
        .select({ inputMode: turns.inputMode })
        .from(turns)
        .where(eq(turns.sessionId, input.sessionId))
      const distinctModes = new Set(turnModes.map((turn) => turn.inputMode))
      const mode = distinctModes.size === 1 ? input.inputMode : 'mixed'
      await transaction
        .update(sessions)
        .set({ mode, elapsedSeconds: input.elapsedSeconds, updatedAt: input.createdAt })
        .where(eq(sessions.id, input.sessionId))
      return 'inserted'
    })
  },

  async updateState(input: SessionStateUpdate): Promise<void> {
    await db
      .update(sessions)
      .set({
        status: input.status,
        elapsedSeconds: input.elapsedSeconds,
        endedAt: input.endedAt,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, input.sessionId))
  },

  insertFollowUpProbe,
  isProbeFollowUpEligible,
  countSessionFollowUps,
}

/** Cron-owned FR-305 enforcement for sessions whose clients disconnect at the cap. */
export async function expireOverdueSessions(now: Date): Promise<number> {
  const deadline = sql`${sessions.startedAt} + (${sessions.timeCapSeconds} * interval '1 second')`
  // Compare the SQL deadline against `now` as an explicitly-cast timestamptz.
  // A bare Date cannot bind against a raw SQL expression via drizzle's `lte`.
  const expired = await db
    .update(sessions)
    .set({
      status: 'expired',
      endedAt: deadline,
      elapsedSeconds: sessions.timeCapSeconds,
      updatedAt: now,
    })
    .where(
      and(
        eq(sessions.status, 'in_progress'),
        sql`${deadline} <= ${now.toISOString()}::timestamptz`,
      ),
    )
    .returning({ id: sessions.id })
  return expired.length
}

/**
 * FR-504 — cron-owned audio retention. Hard-deletes voice recordings that are at
 * least `retentionHours` old: clears the stored URL and stamps `audioDeletedAt`.
 * Transcripts are kept; only the raw audio is removed.
 */
export async function deleteExpiredAudio(now: Date, retentionHours: number): Promise<number> {
  const cutoff = audioRetentionCutoff(now, retentionHours)
  const deleted = await db
    .update(turns)
    .set({ audioUrl: null, audioDeletedAt: now, updatedAt: now })
    .where(
      and(isNotNull(turns.audioUrl), isNull(turns.audioDeletedAt), lte(turns.createdAt, cutoff)),
    )
    .returning({ id: turns.id })
  return deleted.length
}

export async function mergeIntegritySignals(
  sessionId: string,
  studentId: string,
  incoming: Record<string, unknown>,
): Promise<void> {
  const row = await db
    .select({ studentId: sessions.studentId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1)
  const session = row[0]
  if (session === undefined || session.studentId !== studentId) return

  await db
    .update(sessions)
    .set({
      integritySignals: sql`COALESCE(${sessions.integritySignals}, '{}'::jsonb) || ${JSON.stringify(incoming)}::jsonb`,
    })
    .where(eq(sessions.id, sessionId))
}

export async function getIntegritySignals(sessionId: string): Promise<Record<string, unknown>> {
  const row = await db
    .select({ integritySignals: sessions.integritySignals })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1)
  return (row[0]?.integritySignals ?? {}) as Record<string, unknown>
}

export async function insertFollowUpProbe(input: {
  readonly claimGraphId: string
  readonly sessionId: string
  readonly followUpOfProbeId: string
  readonly claimNodeId: string
  readonly textVi: string
}): Promise<{
  readonly id: string
  readonly ordinal: number
  readonly textVi: string
  readonly claimText: string
}> {
  const parentRow = await db
    .select({ ordinal: probes.ordinal, claimNodeId: probes.claimNodeId })
    .from(probes)
    .where(eq(probes.id, input.followUpOfProbeId))
    .limit(1)
  const parent = parentRow[0]
  if (parent === undefined) throw new Error('Parent probe not found')

  const graphRow = await db
    .select({ nodes: claimGraphs.nodes })
    .from(claimGraphs)
    .where(eq(claimGraphs.id, input.claimGraphId))
    .limit(1)
  const nodes = graphRow[0]?.nodes as Array<{ id: string; text: string }> | undefined
  const claimText = nodes?.find((n) => n.id === input.claimNodeId)?.text ?? ''

  const [inserted] = await db
    .insert(probes)
    .values({
      claimGraphId: input.claimGraphId,
      claimNodeId: input.claimNodeId,
      ordinal: parent.ordinal,
      probeType: 'trace_own_step',
      bloomLevel: 'reflect',
      textVi: input.textVi,
      expectedSignals: [],
      aiFragilityScore: null,
      aiFragilityWithEssayScore: null,
      selected: false,
      followUpEligible: false,
      followUpOfProbeId: input.followUpOfProbeId,
      sessionId: input.sessionId,
    })
    .returning({ id: probes.id })

  if (inserted === undefined) throw new Error('Failed to insert follow-up probe')

  return {
    id: inserted.id,
    ordinal: parent.ordinal,
    textVi: input.textVi,
    claimText,
  }
}

export async function isProbeFollowUpEligible(probeId: string): Promise<boolean> {
  const row = await db
    .select({ followUpEligible: probes.followUpEligible })
    .from(probes)
    .where(eq(probes.id, probeId))
    .limit(1)
  return row[0]?.followUpEligible ?? false
}

export async function countSessionFollowUps(sessionId: string): Promise<number> {
  const row = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(probes)
    .where(and(eq(probes.sessionId, sessionId), isNotNull(probes.followUpOfProbeId)))
  return row[0]?.count ?? 0
}
