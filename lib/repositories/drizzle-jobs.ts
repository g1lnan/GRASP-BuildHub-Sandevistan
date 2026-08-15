import 'server-only'

import { db } from '@/lib/db'
import { jobs } from '@/lib/db/schema'
import type { ClaimedJob, JobPayload, JobRepository, JobType } from '@/lib/jobs/queue'
import { and, asc, eq, lte } from 'drizzle-orm'

export const drizzleJobRepository: JobRepository = {
  async enqueue(type: JobType, payload: JobPayload): Promise<{ readonly id: string }> {
    const rows = await db.insert(jobs).values({ type, payload }).returning({ id: jobs.id })
    const row = rows[0]
    if (row === undefined) throw new Error('Failed to enqueue job')
    return row
  },

  async claimNext(workerId: string, now: Date): Promise<ClaimedJob | null> {
    return db.transaction(async (transaction): Promise<ClaimedJob | null> => {
      const rows = await transaction
        .select({
          id: jobs.id,
          type: jobs.type,
          payload: jobs.payload,
          attempts: jobs.attempts,
        })
        .from(jobs)
        .where(and(eq(jobs.status, 'pending'), lte(jobs.runAfter, now)))
        .orderBy(asc(jobs.runAfter))
        .limit(1)
        .for('update', { skipLocked: true })
      const claimed = rows[0]
      if (claimed === undefined) return null

      const attempts = claimed.attempts + 1
      await transaction
        .update(jobs)
        .set({ status: 'running', lockedBy: workerId, lockedAt: now, attempts, updatedAt: now })
        .where(eq(jobs.id, claimed.id))

      return { id: claimed.id, type: claimed.type, payload: claimed.payload, attempts }
    })
  },

  async complete(id: string): Promise<void> {
    await db
      .update(jobs)
      .set({ status: 'completed', lockedBy: null, lockedAt: null, updatedAt: new Date() })
      .where(eq(jobs.id, id))
  },

  async fail(id: string, _error: string, retryAt: Date | null): Promise<void> {
    if (retryAt === null) {
      await db
        .update(jobs)
        .set({ status: 'failed', lockedBy: null, lockedAt: null, updatedAt: new Date() })
        .where(eq(jobs.id, id))
      return
    }
    await db
      .update(jobs)
      .set({
        status: 'pending',
        runAfter: retryAt,
        lockedBy: null,
        lockedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id))
  },
}
