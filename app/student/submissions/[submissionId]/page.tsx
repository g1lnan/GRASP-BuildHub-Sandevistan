import { requireActorPage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleSubmissionRepository } from '@/lib/repositories/drizzle-submissions'
import { ResourceForbiddenError, ResourceNotFoundError } from '@/lib/services/errors'
import { type SubmissionStatus, getSubmissionStatus } from '@/lib/services/submission-service'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StartDefenseButton } from './StartDefenseButton'
import { StatusPoller } from './StatusPoller'

export const metadata = { title: `${vi.submission.statusHeading} — ${vi.metadata.title}` }

type Props = { params: Promise<{ submissionId: string }> }

const statusLabel: Record<SubmissionStatus, string> = {
  pending: vi.submission.statusPending,
  analysing: vi.submission.statusAnalysing,
  ready: vi.submission.statusReady,
  failed: vi.submission.statusFailed,
}

export default async function SubmissionStatusPage({ params }: Props) {
  const { submissionId } = await params
  const actor = await requireActorPage()

  let status: Awaited<ReturnType<typeof getSubmissionStatus>>
  try {
    status = await getSubmissionStatus({
      submissions: drizzleSubmissionRepository,
      actor,
      submissionId,
    })
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError || error instanceof ResourceForbiddenError) {
      notFound()
    }
    throw error
  }

  const inProgress = status.status === 'pending' || status.status === 'analysing'
  const pillClass = status.status === 'ready' ? 'pill pill--jade' : 'pill pill--amber'

  return (
    <div
      style={{ maxWidth: 'var(--w-content)', margin: '0 auto', padding: 'var(--s-10) var(--s-6)' }}
    >
      <StatusPoller active={inProgress} />

      <Link
        href={`/student/submit/${status.assignmentId}`}
        style={{
          fontSize: 'var(--t-small)',
          color: 'var(--ink-soft)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--s-1)',
          marginBottom: 'var(--s-4)',
        }}
      >
        ← {vi.submission.backToAssignment}
      </Link>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-h1)',
          fontWeight: 800,
          color: 'var(--ink)',
          marginBottom: 'var(--s-6)',
        }}
      >
        {vi.submission.statusHeading}
      </h1>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
          <span className={pillClass}>{statusLabel[status.status]}</span>
          <span style={{ fontSize: 'var(--t-small)', color: 'var(--ink-soft)' }}>
            {vi.submission.wordCount(status.wordCount)}
          </span>
        </div>

        <p
          style={{
            fontSize: 'var(--t-body)',
            color: 'var(--ink-soft)',
            lineHeight: 'var(--lh-body)',
          }}
        >
          {status.status === 'ready'
            ? vi.submission.analysisReady
            : status.status === 'failed'
              ? vi.errors.analysisFailed
              : vi.submission.analysisInProgress}
        </p>

        {status.status === 'ready' && <StartDefenseButton submissionId={status.id} />}

        {inProgress && (
          <div aria-hidden="true" style={{ fontSize: '2.5rem' }}>
            🐃
          </div>
        )}
      </div>
    </div>
  )
}
