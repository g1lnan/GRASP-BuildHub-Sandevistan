import 'server-only'

import type { ScoringOutput } from '@/lib/ai/scoring-schemas'
import { scoringOutputSchema } from '@/lib/ai/scoring-schemas'
import { db } from '@/lib/db'
import {
  type ClaimEdge,
  type ClaimNode,
  appeals,
  assignments,
  claimGraphs,
  courses,
  overrides,
  probes,
  scores,
  sessions,
  submissions,
  turns,
  users,
} from '@/lib/db/schema'
import type { ConfidenceLabel } from '@/lib/domain/scoring'
import type { AppealRecord } from '@/lib/services/appeal-service'
import type {
  OverrideAuthContext,
  OverrideDimensions,
  OverrideRecord,
  OverrideRepository,
  ProductScoreRepository,
  SubmissionProductAuth,
} from '@/lib/services/override-service'
import { asc, desc, eq } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Cohort matrix (FR-405) — one plottable point per submission.
// ---------------------------------------------------------------------------

export type CohortPoint = {
  readonly submissionId: string
  readonly studentName: string
  readonly productScore: number | null
  readonly understanding: number | null
  readonly confidenceLabel: ConfidenceLabel | null
  readonly sessionId: string | null
  readonly scoreId: string | null
  readonly overridden: boolean
}

export async function getCohortMatrix(assignmentId: string): Promise<readonly CohortPoint[]> {
  const rows = await db
    .select({
      submissionId: submissions.id,
      studentName: users.displayName,
      productScore: submissions.productScore,
      sessionId: sessions.id,
      scoreId: scores.id,
      composite: scores.composite,
      confidenceLabel: scores.confidenceLabel,
      overrideId: overrides.id,
    })
    .from(submissions)
    .innerJoin(users, eq(submissions.studentId, users.id))
    .leftJoin(sessions, eq(sessions.submissionId, submissions.id))
    .leftJoin(scores, eq(scores.sessionId, sessions.id))
    .leftJoin(overrides, eq(overrides.scoreId, scores.id))
    .where(eq(submissions.assignmentId, assignmentId))

  // A submission may join several sessions; keep the scored one when present.
  const best = new Map<string, (typeof rows)[number]>()
  for (const row of rows) {
    const existing = best.get(row.submissionId)
    if (existing === undefined || (existing.scoreId === null && row.scoreId !== null)) {
      best.set(row.submissionId, row)
    }
  }

  return [...best.values()]
    .map((row) => ({
      submissionId: row.submissionId,
      studentName: row.studentName,
      productScore: row.productScore === null ? null : Number(row.productScore),
      understanding: row.composite === null ? null : Number(row.composite),
      confidenceLabel:
        row.confidenceLabel === null ? null : (row.confidenceLabel as ConfidenceLabel),
      sessionId: row.sessionId,
      scoreId: row.scoreId,
      overridden: row.overrideId !== null,
    }))
    .sort((a, b) => a.studentName.localeCompare(b.studentName, 'vi'))
}

// ---------------------------------------------------------------------------
// Evidence bundle (FR-407) — everything behind one dot on the matrix.
// ---------------------------------------------------------------------------

export type EvidenceTurn = {
  readonly ordinal: number
  readonly questionVi: string
  readonly claimText: string
  readonly transcript: string
  readonly inputMode: 'voice' | 'typed'
  readonly asrConfidence: number | null
}

export type EvidenceScore = {
  readonly dimensions: ScoringOutput
  readonly composite: number
  readonly confidenceLow: number
  readonly confidenceHigh: number
  readonly confidenceLabel: ConfidenceLabel
  readonly model: string
  readonly promptVersion: string
}

export type EvidenceBundle = {
  readonly session: { readonly id: string; readonly mode: string; readonly status: string }
  readonly student: { readonly name: string }
  readonly submission: {
    readonly id: string
    readonly text: string
    readonly productScore: number | null
    readonly wordCount: number
  }
  readonly assignment: { readonly id: string; readonly title: string }
  readonly auth: { readonly courseLecturerId: string; readonly institutionId: string }
  readonly claimGraph: {
    readonly nodes: readonly ClaimNode[]
    readonly edges: readonly ClaimEdge[]
    readonly concepts: readonly string[]
  }
  readonly turns: readonly EvidenceTurn[]
  readonly score: EvidenceScore | null
  readonly override: OverrideRecord | null
  readonly appeals: readonly AppealRecord[]
}

function dimensionsFromColumns(row: {
  d1Recall: string
  d2Explanation: string
  d3Application: string
  d4Evaluation: string
  d5Metacognition: string
}): OverrideDimensions {
  return {
    d1Recall: Number(row.d1Recall),
    d2Explanation: Number(row.d2Explanation),
    d3Application: Number(row.d3Application),
    d4Evaluation: Number(row.d4Evaluation),
    d5Metacognition: Number(row.d5Metacognition),
  }
}

export async function getEvidenceBundle(sessionId: string): Promise<EvidenceBundle | null> {
  const headRows = await db
    .select({
      sessionId: sessions.id,
      mode: sessions.mode,
      status: sessions.status,
      studentName: users.displayName,
      submissionId: submissions.id,
      submissionText: submissions.extractedText,
      productScore: submissions.productScore,
      wordCount: submissions.wordCount,
      assignmentId: assignments.id,
      assignmentTitle: assignments.title,
      courseLecturerId: courses.lecturerId,
      institutionId: courses.institutionId,
      claimGraphId: sessions.claimGraphId,
      nodes: claimGraphs.nodes,
      edges: claimGraphs.edges,
      concepts: claimGraphs.concepts,
    })
    .from(sessions)
    .innerJoin(submissions, eq(sessions.submissionId, submissions.id))
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .innerJoin(courses, eq(assignments.courseId, courses.id))
    .innerJoin(users, eq(sessions.studentId, users.id))
    .innerJoin(claimGraphs, eq(sessions.claimGraphId, claimGraphs.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  const head = headRows[0]
  if (head === undefined) return null

  const [turnRows, scoreRows, overrideRows, appealRows] = await Promise.all([
    db
      .select({
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
    db.select().from(scores).where(eq(scores.sessionId, sessionId)).limit(1),
    db
      .select()
      .from(overrides)
      .innerJoin(scores, eq(overrides.scoreId, scores.id))
      .where(eq(scores.sessionId, sessionId))
      .limit(1),
    db
      .select()
      .from(appeals)
      .where(eq(appeals.sessionId, sessionId))
      .orderBy(desc(appeals.createdAt)),
  ])

  const claimText = new Map(head.nodes.map((node) => [node.id, node.text]))
  const scoreRow = scoreRows[0]
  const overrideRow = overrideRows[0]

  return {
    session: { id: head.sessionId, mode: head.mode, status: head.status },
    student: { name: head.studentName },
    submission: {
      id: head.submissionId,
      text: head.submissionText,
      productScore: head.productScore === null ? null : Number(head.productScore),
      wordCount: head.wordCount,
    },
    assignment: { id: head.assignmentId, title: head.assignmentTitle },
    auth: { courseLecturerId: head.courseLecturerId, institutionId: head.institutionId },
    claimGraph: { nodes: head.nodes, edges: head.edges, concepts: head.concepts },
    turns: turnRows.map((turn) => ({
      ordinal: turn.ordinal,
      questionVi: turn.questionVi,
      claimText: claimText.get(turn.claimNodeId) ?? '',
      transcript: turn.transcript,
      inputMode: turn.inputMode as 'voice' | 'typed',
      asrConfidence: turn.asrConfidence === null ? null : Number(turn.asrConfidence),
    })),
    score:
      scoreRow === undefined
        ? null
        : {
            dimensions: scoringOutputSchema.parse(scoreRow.rationale),
            composite: Number(scoreRow.composite),
            confidenceLow: Number(scoreRow.confidenceLow),
            confidenceHigh: Number(scoreRow.confidenceHigh),
            confidenceLabel: scoreRow.confidenceLabel as ConfidenceLabel,
            model: scoreRow.model,
            promptVersion: scoreRow.promptVersion,
          },
    override:
      overrideRow === undefined
        ? null
        : {
            scoreId: overrideRow.overrides.scoreId,
            lecturerId: overrideRow.overrides.lecturerId,
            original: overrideRow.overrides.original as OverrideDimensions,
            overridden: overrideRow.overrides.overridden as OverrideDimensions,
            note: overrideRow.overrides.note,
          },
    appeals: appealRows.map((row) => ({
      id: row.id,
      sessionId: row.sessionId,
      studentId: row.studentId,
      reason: row.reason,
      status: row.status as AppealRecord['status'],
      resolution: row.resolution,
      createdAt: row.createdAt,
    })),
  }
}

// ---------------------------------------------------------------------------
// Override + product-score repositories (FR-406).
// ---------------------------------------------------------------------------

export const drizzleOverrideRepository: OverrideRepository = {
  async findAuthContext(sessionId: string): Promise<OverrideAuthContext | null> {
    const rows = await db
      .select({
        scoreId: scores.id,
        submissionId: submissions.id,
        courseLecturerId: courses.lecturerId,
        institutionId: courses.institutionId,
        d1Recall: scores.d1Recall,
        d2Explanation: scores.d2Explanation,
        d3Application: scores.d3Application,
        d4Evaluation: scores.d4Evaluation,
        d5Metacognition: scores.d5Metacognition,
      })
      .from(scores)
      .innerJoin(sessions, eq(scores.sessionId, sessions.id))
      .innerJoin(submissions, eq(sessions.submissionId, submissions.id))
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(scores.sessionId, sessionId))
      .limit(1)

    const row = rows[0]
    if (row === undefined) return null
    return {
      scoreId: row.scoreId,
      submissionId: row.submissionId,
      courseLecturerId: row.courseLecturerId,
      institutionId: row.institutionId,
      originalDimensions: dimensionsFromColumns(row),
    }
  },

  async upsertOverride(input: OverrideRecord): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(overrides).where(eq(overrides.scoreId, input.scoreId))
      await tx.insert(overrides).values({
        scoreId: input.scoreId,
        lecturerId: input.lecturerId,
        original: input.original,
        overridden: input.overridden,
        note: input.note,
      })
    })
  },
}

export const drizzleProductScoreRepository: ProductScoreRepository = {
  async findSubmissionAuth(submissionId: string): Promise<SubmissionProductAuth | null> {
    const rows = await db
      .select({
        courseLecturerId: courses.lecturerId,
        institutionId: courses.institutionId,
      })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .innerJoin(courses, eq(assignments.courseId, courses.id))
      .where(eq(submissions.id, submissionId))
      .limit(1)
    return rows[0] ?? null
  },

  async setProductScore(submissionId: string, productScore: number | null): Promise<void> {
    await db
      .update(submissions)
      .set({ productScore: productScore === null ? null : productScore.toString() })
      .where(eq(submissions.id, submissionId))
  },
}
