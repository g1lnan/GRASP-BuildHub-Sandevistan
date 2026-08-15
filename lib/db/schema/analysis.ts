import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { submissions } from './core'
import { primaryId, timestamps } from './shared'

export type ClaimNode = {
  readonly id: string
  readonly kind: 'thesis' | 'claim' | 'evidence' | 'assumption' | 'definition'
  readonly text: string
  readonly quoteSpan: { readonly start: number; readonly end: number }
  readonly concepts: readonly string[]
  readonly confidence: number
}

export type ClaimEdge = {
  readonly from: string
  readonly to: string
  readonly relation: 'supports' | 'contradicts' | 'depends_on' | 'exemplifies'
}

export const claimGraphs = pgTable(
  'claim_graphs',
  {
    id: primaryId(),
    submissionId: uuid('submission_id')
      .notNull()
      .references(() => submissions.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    nodes: jsonb('nodes').$type<readonly ClaimNode[]>().notNull(),
    edges: jsonb('edges').$type<readonly ClaimEdge[]>().notNull(),
    concepts: jsonb('concepts').$type<readonly string[]>().notNull(),
    ...timestamps(),
  },
  (table) => [
    index('idx_claim_graphs_submission_id').on(table.submissionId),
    unique('uq_claim_graphs_submission_version').on(table.submissionId, table.version),
  ],
)

export const probes = pgTable(
  'probes',
  {
    id: primaryId(),
    claimGraphId: uuid('claim_graph_id')
      .notNull()
      .references(() => claimGraphs.id),
    claimNodeId: text('claim_node_id').notNull(),
    ordinal: integer('ordinal').notNull(),
    probeType: text('probe_type').notNull(),
    bloomLevel: text('bloom_level').notNull(),
    textVi: text('text_vi').notNull(),
    expectedSignals: jsonb('expected_signals').$type<readonly string[]>().notNull(),
    aiFragilityScore: numeric('ai_fragility_score'),
    selected: boolean('selected').notNull().default(false),
    aiFragilityWithEssayScore: numeric('ai_fragility_with_essay_score'),
    followUpEligible: boolean('follow_up_eligible').notNull().default(false),
    followUpOfProbeId: uuid('follow_up_of_probe_id'),
    sessionId: uuid('session_id'),
    ...timestamps(),
  },
  (table) => [
    index('idx_probes_claim_graph_id').on(table.claimGraphId),
    index('idx_probes_selected').on(table.selected),
    check(
      'ck_probes_type',
      sql`${table.probeType} in ('counterfactual', 'road_not_taken', 'novel_transfer', 'self_critique', 'metacognitive', 'trace_own_step')`,
    ),
    check(
      'ck_probes_bloom_level',
      sql`${table.bloomLevel} in ('understand', 'apply', 'analyse', 'evaluate', 'reflect')`,
    ),
    foreignKey({ columns: [table.followUpOfProbeId], foreignColumns: [table.id] }),
  ],
)
