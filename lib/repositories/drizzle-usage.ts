import 'server-only'

import { db } from '@/lib/db'
import { usageEvents } from '@/lib/db/schema'
import type { UsageEventRow, UsageRepository } from '@/lib/usage/record'

export const drizzleUsageRepository: UsageRepository = {
  async record(row: UsageEventRow): Promise<void> {
    // numeric columns are stored as strings by postgres-js; integers stay numeric.
    await db.insert(usageEvents).values({
      sessionId: row.sessionId,
      submissionId: row.submissionId,
      stage: row.stage,
      provider: row.provider,
      model: row.model,
      inputTokens: row.inputTokens,
      cacheReadTokens: row.cacheReadTokens,
      cacheCreationTokens: row.cacheCreationTokens,
      outputTokens: row.outputTokens,
      audioSeconds: row.audioSeconds === null ? null : row.audioSeconds.toString(),
      costVnd: row.costVnd.toString(),
    })
  },
}
