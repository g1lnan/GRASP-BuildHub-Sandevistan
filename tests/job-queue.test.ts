import {
  type ClaimedJob,
  type JobHandlers,
  type JobPayload,
  type JobRepository,
  type JobType,
  MAX_JOB_ATTEMPTS,
  enqueueJob,
  runJobTick,
} from '@/lib/jobs/queue'
import { describe, expect, it } from 'vitest'

type FakeJob = {
  id: string
  type: string
  payload: JobPayload
  attempts: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  runAfter: Date
}

class JobRepositoryFake implements JobRepository {
  jobs: FakeJob[] = []
  private seq = 0

  constructor(seed: Array<Partial<FakeJob> & { type: string }> = []) {
    for (const s of seed) {
      this.seq += 1
      this.jobs.push({
        id: `job-${this.seq}`,
        type: s.type,
        payload: s.payload ?? {},
        attempts: s.attempts ?? 0,
        status: s.status ?? 'pending',
        runAfter: s.runAfter ?? new Date(0),
      })
    }
  }

  async enqueue(type: JobType, payload: JobPayload): Promise<{ readonly id: string }> {
    this.seq += 1
    const id = `job-${this.seq}`
    this.jobs.push({ id, type, payload, attempts: 0, status: 'pending', runAfter: new Date(0) })
    return { id }
  }

  async claimNext(_workerId: string, now: Date): Promise<ClaimedJob | null> {
    const job = this.jobs.find((j) => j.status === 'pending' && j.runAfter <= now)
    if (job === undefined) return null
    job.attempts += 1
    job.status = 'running'
    return { id: job.id, type: job.type, payload: job.payload, attempts: job.attempts }
  }

  async complete(id: string): Promise<void> {
    const job = this.jobs.find((j) => j.id === id)
    if (job !== undefined) job.status = 'completed'
  }

  async fail(id: string, _error: string, retryAt: Date | null): Promise<void> {
    const job = this.jobs.find((j) => j.id === id)
    if (job === undefined) return
    if (retryAt === null) {
      job.status = 'failed'
    } else {
      job.status = 'pending'
      job.runAfter = retryAt
    }
  }
}

const now = new Date('2026-07-25T00:00:00.000Z')

describe('enqueueJob', () => {
  it('adds a pending job to the queue', async () => {
    const jobs = new JobRepositoryFake()
    const { id } = await enqueueJob({
      jobs,
      type: 'analyze_submission',
      payload: { submissionId: 's1' },
    })
    expect(jobs.jobs).toHaveLength(1)
    expect(jobs.jobs[0]?.id).toBe(id)
    expect(jobs.jobs[0]?.status).toBe('pending')
  })
})

describe('runJobTick', () => {
  const handlers: JobHandlers = { analyze_submission: async () => undefined }

  it('completes a successful job', async () => {
    const jobs = new JobRepositoryFake([
      { type: 'analyze_submission', payload: { submissionId: 's1' } },
    ])
    const result = await runJobTick({ jobs, handlers, workerId: 'w', now })
    expect(result).toMatchObject({ processed: 1, succeeded: 1, failed: 0 })
    expect(jobs.jobs[0]?.status).toBe('completed')
  })

  it('requeues a failing job while attempts remain', async () => {
    const failing: JobHandlers = {
      analyze_submission: async () => {
        throw new Error('boom')
      },
    }
    const jobs = new JobRepositoryFake([{ type: 'analyze_submission' }])
    const result = await runJobTick({ jobs, handlers: failing, workerId: 'w', now, max: 1 })
    expect(result).toMatchObject({ processed: 1, failed: 1 })
    expect(jobs.jobs[0]?.status).toBe('pending')
    expect(jobs.jobs[0]?.runAfter.getTime()).toBeGreaterThan(now.getTime())
  })

  it('fails a job terminally after the final attempt', async () => {
    const failing: JobHandlers = {
      analyze_submission: async () => {
        throw new Error('boom')
      },
    }
    // Pre-set attempts so this claim reaches MAX_JOB_ATTEMPTS.
    const jobs = new JobRepositoryFake([
      { type: 'analyze_submission', attempts: MAX_JOB_ATTEMPTS - 1 },
    ])
    await runJobTick({ jobs, handlers: failing, workerId: 'w', now, max: 1 })
    expect(jobs.jobs[0]?.status).toBe('failed')
  })

  it('fails an unknown job type terminally', async () => {
    const jobs = new JobRepositoryFake([{ type: 'unknown_type' }])
    const result = await runJobTick({ jobs, handlers, workerId: 'w', now })
    expect(result).toMatchObject({ processed: 1, failed: 1 })
    expect(jobs.jobs[0]?.status).toBe('failed')
  })

  it('does nothing on an empty queue', async () => {
    const jobs = new JobRepositoryFake()
    const result = await runJobTick({ jobs, handlers, workerId: 'w', now })
    expect(result).toMatchObject({ processed: 0, succeeded: 0, failed: 0 })
  })
})
