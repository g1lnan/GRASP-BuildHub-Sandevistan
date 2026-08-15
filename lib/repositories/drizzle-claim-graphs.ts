import 'server-only'

import { db } from '@/lib/db'
import type { ClaimNode } from '@/lib/db/schema'
import { claimGraphs } from '@/lib/db/schema'
import type {
  ClaimGraphRecord,
  ClaimGraphRepository,
  NewClaimGraph,
} from '@/lib/services/analysis-service'
import { ResourceNotFoundError } from '@/lib/services/errors'
import { desc, eq } from 'drizzle-orm'

export type ClaimGraphView = {
  readonly id: string
  readonly version: number
  readonly nodes: readonly ClaimNode[]
  readonly concepts: readonly string[]
}

/** Read-only view of a submission's most recent claim graph (lecturer analysis page). */
export async function findLatestClaimGraphBySubmission(
  submissionId: string,
): Promise<ClaimGraphView | null> {
  const rows = await db
    .select({
      id: claimGraphs.id,
      version: claimGraphs.version,
      nodes: claimGraphs.nodes,
      concepts: claimGraphs.concepts,
    })
    .from(claimGraphs)
    .where(eq(claimGraphs.submissionId, submissionId))
    .orderBy(desc(claimGraphs.version))
    .limit(1)
  return rows[0] ?? null
}

export const drizzleClaimGraphRepository: ClaimGraphRepository = {
  /**
   * FR-206: re-analysis creates a new version; prior sessions keep their
   * original graph. Compute the next version inside a transaction with a locking
   * read so two concurrent analyses cannot collide on the unique
   * (submission_id, version) constraint.
   */
  async createNextVersion(input: NewClaimGraph): Promise<ClaimGraphRecord> {
    return db.transaction(async (transaction): Promise<ClaimGraphRecord> => {
      const latest = await transaction
        .select({ version: claimGraphs.version })
        .from(claimGraphs)
        .where(eq(claimGraphs.submissionId, input.submissionId))
        .orderBy(desc(claimGraphs.version))
        .limit(1)
        .for('update')
      const nextVersion = (latest[0]?.version ?? 0) + 1

      const rows = await transaction
        .insert(claimGraphs)
        .values({
          submissionId: input.submissionId,
          version: nextVersion,
          model: input.model,
          promptVersion: input.promptVersion,
          nodes: input.nodes,
          edges: input.edges,
          concepts: input.concepts,
        })
        .returning({
          id: claimGraphs.id,
          submissionId: claimGraphs.submissionId,
          version: claimGraphs.version,
        })
      const row = rows[0]
      if (row === undefined) throw new ResourceNotFoundError()
      return row
    })
  },
}
