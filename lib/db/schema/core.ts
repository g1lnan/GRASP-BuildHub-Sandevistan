import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { primaryId, timestamps } from './shared'

export const institutions = pgTable('institutions', {
  id: primaryId(),
  name: text('name').notNull(),
  country: text('country'),
  dataRegion: text('data_region').notNull(),
  ...timestamps(),
})

export const users = pgTable(
  'users',
  {
    id: primaryId(),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull(),
    displayName: text('display_name').notNull(),
    ...timestamps(),
  },
  (table) => [
    index('idx_users_institution_id').on(table.institutionId),
    check('ck_users_role', sql`${table.role} in ('lecturer', 'student', 'researcher')`),
  ],
)

export const courses = pgTable(
  'courses',
  {
    id: primaryId(),
    institutionId: uuid('institution_id')
      .notNull()
      .references(() => institutions.id),
    lecturerId: uuid('lecturer_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    term: text('term').notNull(),
    joinCode: text('join_code').notNull(),
    joinCodeRevokedAt: timestamp('join_code_revoked_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index('idx_courses_institution_id').on(table.institutionId),
    index('idx_courses_lecturer_id').on(table.lecturerId),
    index('idx_courses_join_code').on(table.joinCode),
    check('ck_courses_join_code', sql`${table.joinCode} ~ '^[A-HJ-NP-Z2-9]{8}$'`),
  ],
)

export const enrollments = pgTable(
  'enrollments',
  {
    id: primaryId(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ...timestamps(),
  },
  (table) => [
    unique('uq_enrollments_course_student').on(table.courseId, table.studentId),
    index('idx_enrollments_course_id').on(table.courseId),
    index('idx_enrollments_student_id').on(table.studentId),
  ],
)

export const assignments = pgTable(
  'assignments',
  {
    id: primaryId(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    prompt: text('prompt').notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    subjectConcepts: jsonb('subject_concepts').$type<readonly string[]>().notNull().default([]),
    probeCount: integer('probe_count').notNull(),
    timeCapSeconds: integer('time_cap_seconds').notNull(),
    defenseWeightPct: integer('defense_weight_pct').notNull(),
    rubricWeights: jsonb('rubric_weights')
      .$type<Record<string, number>>()
      .notNull()
      .default({ d1: 0.15, d2: 0.3, d3: 0.25, d4: 0.2, d5: 0.1 }),
    ...timestamps(),
  },
  (table) => [
    index('idx_assignments_course_id').on(table.courseId),
    check('ck_assignments_probe_count', sql`${table.probeCount} between 5 and 8`),
    check('ck_assignments_time_cap', sql`${table.timeCapSeconds} between 360 and 600`),
    check('ck_assignments_defense_weight', sql`${table.defenseWeightPct} between 0 and 30`),
  ],
)

export const submissions = pgTable(
  'submissions',
  {
    id: primaryId(),
    assignmentId: uuid('assignment_id')
      .notNull()
      .references(() => assignments.id),
    studentId: uuid('student_id')
      .notNull()
      .references(() => users.id),
    source: text('source').notNull(),
    fileUrl: text('file_url'),
    extractedText: text('extracted_text').notNull(),
    wordCount: integer('word_count').notNull(),
    productScore: numeric('product_score'),
    status: text('status').notNull().default('pending'),
    error: text('error'),
    ...timestamps(),
  },
  (table) => [
    index('idx_submissions_assignment_id').on(table.assignmentId),
    index('idx_submissions_student_id').on(table.studentId),
    index('idx_submissions_status').on(table.status),
    check('ck_submissions_source', sql`${table.source} in ('docx', 'pdf', 'text')`),
    check('ck_submissions_word_count', sql`${table.wordCount} between 0 and 20000`),
    check(
      'ck_submissions_status',
      sql`${table.status} in ('pending', 'analysing', 'ready', 'failed')`,
    ),
  ],
)
