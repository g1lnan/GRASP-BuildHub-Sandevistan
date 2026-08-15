#!/usr/bin/env tsx

import type { ScoringOutput } from '@/lib/ai/scoring-schemas'
import { closeDatabase, db } from '@/lib/db/connection'
import {
  assignments,
  claimGraphs,
  courses,
  enrollments,
  feedbackReports,
  institutions,
  probes,
  scores,
  sessions,
  submissions,
  turns,
  users,
} from '@/lib/db/schema'
import {
  type CohortStudent,
  cohortClaimNodes,
  cohortCompetencies,
  cohortEssayText,
  cohortFeedback,
  cohortProbes,
  cohortStudents,
  cohortTurnTranscripts,
  demoPassword,
  pendingStudent,
  seedAssignments,
  seedIds,
  seedUsers,
} from '@/lib/db/seed-data'
import { argon2id, hash } from 'argon2'

async function seed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new ProductionSeedError()
  const passwordHash = await hash(demoPassword, { type: argon2id })

  await db.transaction(async (transaction) => {
    await transaction
      .insert(institutions)
      .values({
        id: seedIds.institution,
        name: 'Đại học Demo Việt Nam',
        country: 'VN',
        dataRegion: 'ap-southeast-1',
      })
      .onConflictDoUpdate({
        target: institutions.id,
        set: { name: 'Đại học Demo Việt Nam', country: 'VN', dataRegion: 'ap-southeast-1' },
      })

    for (const user of seedUsers) {
      await transaction
        .insert(users)
        .values({ ...user, institutionId: seedIds.institution, passwordHash })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: user.email,
            role: user.role,
            displayName: user.displayName,
            passwordHash,
            updatedAt: new Date(),
          },
        })
    }

    await transaction
      .insert(courses)
      .values({
        id: seedIds.course,
        institutionId: seedIds.institution,
        lecturerId: seedIds.lecturer,
        name: 'Tư duy phản biện',
        term: 'Học kỳ 1 — 2026',
        joinCode: 'GRASP234',
      })
      .onConflictDoUpdate({
        target: courses.id,
        set: { name: 'Tư duy phản biện', term: 'Học kỳ 1 — 2026', updatedAt: new Date() },
      })

    await transaction
      .insert(enrollments)
      .values([
        { id: seedIds.enrollmentA, courseId: seedIds.course, studentId: seedIds.studentA },
        { id: seedIds.enrollmentB, courseId: seedIds.course, studentId: seedIds.studentB },
      ])
      .onConflictDoNothing({ target: [enrollments.courseId, enrollments.studentId] })

    for (const assignment of seedAssignments) {
      await transaction
        .insert(assignments)
        .values({
          ...assignment,
          courseId: seedIds.course,
          probeCount: 6,
          timeCapSeconds: 480,
          defenseWeightPct: 20,
        })
        .onConflictDoUpdate({
          target: assignments.id,
          set: {
            title: assignment.title,
            prompt: assignment.prompt,
            dueAt: assignment.dueAt,
            publishedAt: assignment.publishedAt,
            subjectConcepts: assignment.subjectConcepts,
            updatedAt: new Date(),
          },
        })
    }

    // --- Cohort: submissions + scored sessions so the 2×2 matrix has dots ---
    const wordCount = cohortEssayText.trim().split(/\s+/).length
    const startedAt = new Date('2026-07-20T02:00:00.000Z')
    const endedAt = new Date('2026-07-20T02:07:00.000Z')

    let index = 0
    for (const student of cohortStudents) {
      index += 1
      await upsertCohortStudent(
        transaction,
        student,
        passwordHash,
        index,
        wordCount,
        startedAt,
        endedAt,
      )
    }

    // Pending student: enrolled + a ready submission, but no scored session.
    await transaction
      .insert(users)
      .values({
        id: pendingStudent.id,
        email: pendingStudent.email,
        role: 'student',
        displayName: pendingStudent.displayName,
        institutionId: seedIds.institution,
        passwordHash,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: pendingStudent.email,
          displayName: pendingStudent.displayName,
          updatedAt: new Date(),
        },
      })
    await transaction
      .insert(enrollments)
      .values({ id: uid('40000000', 199), courseId: seedIds.course, studentId: pendingStudent.id })
      .onConflictDoNothing({ target: [enrollments.courseId, enrollments.studentId] })
    await transaction
      .insert(submissions)
      .values({
        id: uid('60000000', 99),
        assignmentId: seedIds.publishedAssignment,
        studentId: pendingStudent.id,
        source: 'text',
        extractedText: cohortEssayText,
        wordCount,
        productScore: null,
        status: 'ready',
      })
      .onConflictDoUpdate({
        target: submissions.id,
        set: { status: 'ready', updatedAt: new Date() },
      })
  })
}

type SeedTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const pad = (n: number): string => n.toString().padStart(12, '0')
const uid = (prefix: string, n: number): string => `${prefix}-0000-4000-8000-${pad(n)}`

function roundOne(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

function buildRationale(understanding: number): ScoringOutput {
  const s = Math.min(5, Math.max(1, roundOne(understanding)))
  const quote = 'luận điểm chính'
  const dim = (rationaleVi: string) => ({
    score: s,
    rationaleVi,
    citations: [{ turnOrdinal: 1, quote }],
  })
  return {
    d1Recall: dim('Sinh viên nhắc lại được luận điểm chính từ bài làm của mình.'),
    d2Explanation: dim('Sinh viên giải thích lại ý tưởng bằng lời của mình khá mạch lạc.'),
    d3Application: dim('Sinh viên chuyển lập luận sang một tình huống chính sách khác.'),
    d4Evaluation: dim('Sinh viên nêu được giới hạn của bằng chứng trong lập luận.'),
    d5Metacognition: dim('Sinh viên nhận ra điểm chưa chắc chắn và hướng bổ sung thêm.'),
  }
}

function confidenceOf(u: number): { low: number; high: number; label: 'high' | 'medium' | 'low' } {
  return {
    low: Math.max(1, roundOne(u - 0.4)),
    high: Math.min(5, roundOne(u + 0.4)),
    label: u >= 4 ? 'high' : u >= 3 ? 'medium' : 'low',
  }
}

async function upsertCohortStudent(
  transaction: SeedTransaction,
  student: CohortStudent,
  passwordHash: string,
  index: number,
  wordCount: number,
  startedAt: Date,
  endedAt: Date,
): Promise<void> {
  if (student.isNew) {
    await transaction
      .insert(users)
      .values({
        id: student.id,
        email: student.email,
        role: 'student',
        displayName: student.displayName,
        institutionId: seedIds.institution,
        passwordHash,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: student.email,
          displayName: student.displayName,
          passwordHash,
          updatedAt: new Date(),
        },
      })
  }

  await transaction
    .insert(enrollments)
    .values({ id: uid('40000000', 100 + index), courseId: seedIds.course, studentId: student.id })
    .onConflictDoNothing({ target: [enrollments.courseId, enrollments.studentId] })

  const submissionId = uid('60000000', index)
  const claimGraphId = uid('70000000', index)
  const sessionId = uid('90000000', index)
  const scoreId = uid('b0000000', index)

  await transaction
    .insert(submissions)
    .values({
      id: submissionId,
      assignmentId: seedIds.publishedAssignment,
      studentId: student.id,
      source: 'text',
      extractedText: cohortEssayText,
      wordCount,
      productScore: student.productScore.toString(),
      status: 'ready',
    })
    .onConflictDoUpdate({
      target: submissions.id,
      set: {
        productScore: student.productScore.toString(),
        status: 'ready',
        updatedAt: new Date(),
      },
    })

  await transaction
    .insert(claimGraphs)
    .values({
      id: claimGraphId,
      submissionId,
      version: 1,
      model: 'seed',
      promptVersion: 'seed-v1',
      nodes: cohortClaimNodes,
      edges: [],
      concepts: cohortCompetencies,
    })
    .onConflictDoNothing({ target: claimGraphs.id })

  for (const [p, probe] of cohortProbes.entries()) {
    await transaction
      .insert(probes)
      .values({
        id: uid('80000000', index * 10 + p + 1),
        claimGraphId,
        claimNodeId: probe.claimNodeId,
        ordinal: p + 1,
        probeType: probe.probeType,
        bloomLevel: probe.bloomLevel,
        textVi: probe.textVi,
        expectedSignals: probe.expectedSignals,
        aiFragilityScore: probe.aiFragilityScore.toString(),
        selected: true,
      })
      .onConflictDoNothing({ target: probes.id })
  }

  await transaction
    .insert(sessions)
    .values({
      id: sessionId,
      submissionId,
      claimGraphId,
      studentId: student.id,
      mode: 'typed',
      status: 'completed',
      startedAt,
      endedAt,
      elapsedSeconds: 420,
      timeCapSeconds: 480,
    })
    .onConflictDoNothing({ target: sessions.id })

  for (const [p, transcript] of cohortTurnTranscripts.entries()) {
    await transaction
      .insert(turns)
      .values({
        id: uid('a0000000', index * 10 + p + 1),
        sessionId,
        probeId: uid('80000000', index * 10 + p + 1),
        ordinal: p + 1,
        inputMode: 'typed',
        transcript,
        latencyMs: 1200,
      })
      .onConflictDoNothing({ target: turns.id })
  }

  const dimensions = buildRationale(student.understanding)
  const composite = roundOne(student.understanding)
  const confidence = confidenceOf(student.understanding)
  await transaction
    .insert(scores)
    .values({
      id: scoreId,
      sessionId,
      d1Recall: dimensions.d1Recall.score.toString(),
      d2Explanation: dimensions.d2Explanation.score.toString(),
      d3Application: dimensions.d3Application.score.toString(),
      d4Evaluation: dimensions.d4Evaluation.score.toString(),
      d5Metacognition: dimensions.d5Metacognition.score.toString(),
      composite: composite.toString(),
      confidenceLow: confidence.low.toString(),
      confidenceHigh: confidence.high.toString(),
      confidenceLabel: confidence.label,
      rationale: dimensions,
      model: 'seed',
      promptVersion: 'seed-v1',
    })
    .onConflictDoNothing({ target: scores.sessionId })

  await transaction
    .insert(feedbackReports)
    .values({
      sessionId,
      strengths: cohortFeedback.strengths,
      gaps: cohortFeedback.gaps,
      reviseConcepts: cohortFeedback.reviseConcepts,
      bodyVi: cohortFeedback.bodyVi,
      model: 'seed',
      promptVersion: 'seed-v1',
    })
    .onConflictDoNothing({ target: feedbackReports.sessionId })
}

class ProductionSeedError extends Error {
  readonly name = 'ProductionSeedError'
}

seed()
  .then(async () => closeDatabase())
  .catch(async (error: unknown) => {
    if (error instanceof Error) console.error(error.message)
    else console.error('Unknown seed failure')
    await closeDatabase()
    process.exitCode = 1
  })
