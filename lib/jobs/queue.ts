/**
 * DB-backed job queue (DESIGN §7.3). A cron-triggered POST /api/jobs/tick claims
 * work with SELECT ... FOR UPDATE SKIP LOCKED. Adequate to ~200 concurrent
 * sessions (NFR-7); upgrade to a real queue only if p95 analysis latency
 * breaches 120s under load.
 */

export type JobType = 'analyze_submission'

export type JobPayload = Record<string, string | number>

export type ClaimedJob = {
  readonly id: string
  readonly type: string
  readonly payload: JobPayload
  readonly attempts: number
}

export interface JobRepository {
  enqueue(type: JobType, payload: JobPayload): Promise<{ readonly id: string }>
  /** Atomically claim the next runnable job (FOR UPDATE SKIP LOCKED) and mark it running. */
  claimNext(workerId: string, now: Date): Promise<ClaimedJob | null>
  complete(id: string): Promise<void>
  /** retryAt null -> terminal failure; otherwise requeue as pending at retryAt. */
  fail(id: string, error: string, retryAt: Date | null): Promise<void>
}

export type JobHandler = (payload: JobPayload) => Promise<void>
export type JobHandlers = Partial<Record<JobType, JobHandler>>

export const MAX_JOB_ATTEMPTS = 3
const RETRY_BASE_SECONDS = 30

export async function enqueueJob(request: {
  readonly jobs: JobRepository
  readonly type: JobType
  readonly payload: JobPayload
}): Promise<{ readonly id: string }> {
  return request.jobs.enqueue(request.type, request.payload)
}

function backoffAt(attempts: number, now: Date): Date {
  return new Date(now.getTime() + attempts * RETRY_BASE_SECONDS * 1000)
}

/**
 * Drain up to `max` runnable jobs. Returns how many succeeded/failed so the tick
 * endpoint can report progress. Unknown job types fail terminally rather than
 * spin forever.
 */
export async function runJobTick(request: {
  readonly jobs: JobRepository
  readonly handlers: JobHandlers
  readonly workerId: string
  readonly now: Date
  readonly max?: number
}): Promise<{ readonly processed: number; readonly succeeded: number; readonly failed: number }> {
  const max = request.max ?? 10
  let processed = 0
  let succeeded = 0
  let failed = 0

  for (let i = 0; i < max; i += 1) {
    const job = await request.jobs.claimNext(request.workerId, request.now)
    if (job === null) break
    processed += 1

    const handler = request.handlers[job.type as JobType]
    if (handler === undefined) {
      await request.jobs.fail(job.id, `No handler for job type "${job.type}"`, null)
      failed += 1
      continue
    }

    try {
      await handler(job.payload)
      await request.jobs.complete(job.id)
      succeeded += 1
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Job failed'
      const retryAt = job.attempts < MAX_JOB_ATTEMPTS ? backoffAt(job.attempts, request.now) : null
      await request.jobs.fail(job.id, message, retryAt)
      failed += 1
    }
  }

  return { processed, succeeded, failed }
}
