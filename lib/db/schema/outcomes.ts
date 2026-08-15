import type { FeedbackEvidence } from '@/lib/ai/feedback-schemas'
import type { ScoringOutput } from '@/lib/ai/scoring-schemas'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { submissions, users } from './core'
import { sessions } from './sessions'
import { primaryId, timestamps } from './shared'

export const scores = pgTable(
  'scores',
  {
    id: primaryId(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    d1Recall: numeric('d1_recall').notNull(),
    d2Explanation: numeric('d2_explanation').notNull(),
    d3Application: numeric('d3_application').notNull(),
    d4Evaluation: numeric('d4_evaluation').notNull(),
    d5Metacognition: numeric('d5_metacognition').notNull(),
    composite: numeric('composite').notNull(),
    confidenceLow: numeric('confidence_low').notNull(),
    confidenceHigh: numeric('confidence_high').notNull(),
    confidenceLabel: text('confidence_label').notNull(),
    rationale: jsonb('rationale').$type<ScoringOutput>().notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    ...timestamps(),
  },
  (table) => [
    unique('uq_scores_session_id').on(table.sessionId),
    check('ck_scores_d1', sql`${table.d1Recall} between 1 and 5`),
    check('ck_scores_d2', sql`${table.d2Explanation} between 1 and 5`),
    check('ck_scores_d3', sql`${table.d3Application} between 1 and 5`),
    check('ck_scores_d4', sql`${table.d4Evaluation} between 1 and 5`),
    check('ck_scores_d5', sql`${table.d5Metacognition} between 1 and 5`),
    check('ck_scores_confidence_label', sql`${table.confidenceLabel} in ('high', 'medium', 'low')`),
  ],
)

export const overrides = pgTable(
  'overrides',
  {
    id: primaryId(),
    scoreId: uuid('score_id')
      .notNull()
      .references(() => scores.id, { onDelete: 'cascade' }),
    lecturerId: uuid('lecturer_id')
      .notNull()
      .references(() => users.id),
    original: jsonb('original').$type<Record<string, number>>().notNull(),
    overridden: jsonb('overridden').$type<Record<string, number>>().notNull(),
    note: text('note'),
    ...timestamps(),
  },
  (table) => [
    index('idx_overrides_score_id').on(table.scoreId),
    index('idx_overrides_lecturer_id').on(table.lecturerId),
  ],
)

export const feedbackReports = pgTable(
  'feedback_reports',
  {
    id: primaryId(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    strengths: jsonb('strengths').$type<readonly FeedbackEvidence[]>().notNull(),
    gaps: jsonb('gaps').$type<readonly FeedbackEvidence[]>().notNull(),
    reviseConcepts: jsonb('revise_concepts').$type<readonly string[]>().notNull(),
    bodyVi: text('body_vi').notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    ...timestamps(),
  },
  (table) => [unique('uq_feedback_reports_session_id').on(table.sessionId)],
)

export const appeals = pgTable(
  'appeals',
  {
    id: primaryId(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('open'),
    resolution: text('resolution'),
    ...timestamps(),
  },
  (table) => [
    index('idx_appeals_session_id').on(table.sessionId),
    check('ck_appeals_status', sql`${table.status} in ('open', 'resolved')`),
  ],
)

export const usageEvents = pgTable(
  'usage_events',
  {
    id: primaryId(),
    sessionId: uuid('session_id').references(() => sessions.id),
    submissionId: uuid('submission_id').references(() => submissions.id),
    stage: text('stage').notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens'),
    cacheReadTokens: integer('cache_read_tokens'),
    cacheCreationTokens: integer('cache_creation_tokens'),
    outputTokens: integer('output_tokens'),
    audioSeconds: numeric('audio_seconds'),
    costVnd: numeric('cost_vnd').notNull(),
    ...timestamps(),
  },
  (table) => [
    index('idx_usage_events_session_id').on(table.sessionId),
    index('idx_usage_events_stage').on(table.stage),
  ],
)
