import { sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { claimGraphs, probes } from './analysis'
import { submissions, users } from './core'
import { primaryId, timestamps } from './shared'

export const sessions = pgTable(
  'sessions',
  {
    id: primaryId(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => submissions.id),
    claimGraphId: uuid('claim_graph_id')
      .notNull()
      .references(() => claimGraphs.id),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id),
    mode: text('mode').notNull(),
    status: text('status').notNull().default('in_progress'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    elapsedSeconds: integer('elapsed_seconds'),
    timeCapSeconds: integer('time_cap_seconds').notNull(),
    integritySignals: jsonb('integrity_signals')
      .$type<Record<string, string | number>>()
      .notNull()
      .default({}),
    ...timestamps(),
  },
  (table) => [
    index('idx_sessions_submission_id').on(table.submissionId),
    index('idx_sessions_claim_graph_id').on(table.claimGraphId),
    index('idx_sessions_student_id').on(table.studentId),
    index('idx_sessions_status').on(table.status),
    uniqueIndex('uq_sessions_in_progress_submission')
      .on(table.submissionId)
      .where(sql`${table.status} = 'in_progress'`),
    check('ck_sessions_mode', sql`${table.mode} in ('voice', 'typed', 'mixed')`),
    check('ck_sessions_time_cap', sql`${table.timeCapSeconds} between 360 and 600`),
    check(
      'ck_sessions_status',
      sql`${table.status} in ('in_progress', 'completed', 'expired', 'abandoned')`,
    ),
  ],
)

export const turns = pgTable(
  'turns',
  {
    id: primaryId(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    probeId: uuid('probe_id')
      .notNull()
      .references(() => probes.id),
    ordinal: integer('ordinal').notNull(),
    followUpOf: uuid('follow_up_of'),
    inputMode: text('input_mode').notNull(),
    audioUrl: text('audio_url'),
    audioDeletedAt: timestamp('audio_deleted_at', { withTimezone: true }),
    transcript: text('transcript').notNull(),
    asrConfidence: numeric('asr_confidence'),
    latencyMs: integer('latency_ms'),
    durationMs: integer('duration_ms'),
    ...timestamps(),
  },
  (table) => [
    index('idx_turns_session_id').on(table.sessionId),
    index('idx_turns_probe_id').on(table.probeId),
    unique('uq_turns_session_ordinal').on(table.sessionId, table.ordinal),
    foreignKey({ columns: [table.followUpOf], foreignColumns: [table.id] }),
    check('ck_turns_input_mode', sql`${table.inputMode} in ('voice', 'typed')`),
    check(
      'ck_turns_asr_confidence',
      sql`${table.asrConfidence} is null or ${table.asrConfidence} between 0 and 1`,
    ),
  ],
)
