import { randomUUID, timingSafeEqual } from 'node:crypto'
import { audioRetentionHours } from '@/lib/domain/retention'
import { jobHandlers } from '@/lib/jobs/handlers'
import { runJobTick } from '@/lib/jobs/queue'
import { drizzleJobRepository } from '@/lib/repositories/drizzle-jobs'
import { deleteExpiredAudio, expireOverdueSessions } from '@/lib/repositories/drizzle-sessions'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Internal-only: the worker endpoint is triggered by cron, not by users. */
function isAuthorised(request: NextRequest): boolean {
  const secret = process.env.JOBS_TICK_SECRET
  if (secret === undefined || secret.length === 0) return false
  const provided = request.headers.get('x-jobs-secret') ?? ''
  const a = Buffer.from(provided)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const now = new Date()
  const expiredSessions = await expireOverdueSessions(now)
  const deletedAudio = await deleteExpiredAudio(now, audioRetentionHours())
  const result = await runJobTick({
    jobs: drizzleJobRepository,
    handlers: jobHandlers,
    workerId: `tick-${randomUUID()}`,
    now,
  })
  return NextResponse.json({ ...result, expiredSessions, deletedAudio }, { status: 200 })
}
