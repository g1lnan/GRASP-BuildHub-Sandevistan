import { requireActor } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { enqueueJob } from '@/lib/jobs/queue'
import { drizzleJobRepository } from '@/lib/repositories/drizzle-jobs'
import { drizzleSubmissionRepository } from '@/lib/repositories/drizzle-submissions'
import { ResourceForbiddenError, ResourceNotFoundError } from '@/lib/services/errors'
import { getSubmissionStatus } from '@/lib/services/submission-service'
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const { submissionId } = await params
  try {
    const actor = await requireActor()
    // Authorise (owner or course lecturer) before enqueuing any work.
    await getSubmissionStatus({
      submissions: drizzleSubmissionRepository,
      actor,
      submissionId,
    })
    await enqueueJob({
      jobs: drizzleJobRepository,
      type: 'analyze_submission',
      payload: { submissionId },
    })
    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError)
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    if (error instanceof ResourceForbiddenError)
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    return NextResponse.json({ error: vi.errors.serverError }, { status: 500 })
  }
}
