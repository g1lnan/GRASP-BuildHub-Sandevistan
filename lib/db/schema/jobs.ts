import { sql } from 'drizzle-orm'
import { check, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { primaryId, timestamps } from './shared'

export const jobs = pgTable(
  'jobs',
  {
    id: primaryId(),
    type: text('type').notNull(),
    payload: jsonb('payload').$type<Record<string, string | number>>().notNull(),
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    runAfter: timestamp('run_after', { withTimezone: true }).notNull().defaultNow(),
    lockedBy: text('locked_by'),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index('idx_jobs_status_run_after').on(table.status, table.runAfter),
    check('ck_jobs_status', sql`${table.status} in ('pending', 'running', 'completed', 'failed')`),
    check('ck_jobs_attempts', sql`${table.attempts} >= 0`),
  ],
)
