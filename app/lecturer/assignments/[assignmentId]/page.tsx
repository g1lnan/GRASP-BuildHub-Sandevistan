import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleAssignmentRepository } from '@/lib/repositories/drizzle-assignments'
import { drizzleCourseRepository } from '@/lib/repositories/drizzle-courses'
import { listSubmissionsByAssignment } from '@/lib/repositories/drizzle-submissions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PublishToggle } from './PublishToggle'

type Props = { params: Promise<{ assignmentId: string }> }

export async function generateMetadata({ params }: Props) {
  const { assignmentId } = await params
  const a = await drizzleAssignmentRepository.findDetailById(assignmentId)
  return { title: a ? `${a.title} — ${vi.metadata.title}` : vi.metadata.title }
}

export default async function AssignmentDetailPage({ params }: Props) {
  const { assignmentId } = await params
  const actor = await requireRolePage(['lecturer'])

  const assignment = await drizzleAssignmentRepository.findDetailById(assignmentId)
  if (assignment === null) notFound()

  const course = await drizzleCourseRepository.findDetailById(assignment.courseId)
  if (course === null || course.lecturerId !== actor.id) notFound()

  const isArchived = course.archivedAt !== null
  const submissions = await listSubmissionsByAssignment(assignmentId)

  return (
    <div
      style={{
        maxWidth: 'var(--w-content)',
        margin: '0 auto',
        padding: 'var(--s-10) var(--s-8)',
      }}
    >
      {/* Back */}
      <Link
        href={`/lecturer/courses/${course.id}`}
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
        ← {vi.lecturer.backToCourse}
      </Link>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--s-6)',
          flexWrap: 'wrap',
          marginBottom: 'var(--s-8)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 'var(--t-small)',
              color: 'var(--ink-faint)',
              marginBottom: 'var(--s-2)',
            }}
          >
            {course.name} · {course.term}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--t-h1)',
              fontWeight: 800,
              color: 'var(--ink)',
              marginBottom: 'var(--s-3)',
            }}
          >
            {assignment.title}
          </h1>
          <div
            style={{ display: 'flex', gap: 'var(--s-2)', alignItems: 'center', flexWrap: 'wrap' }}
          >
            {assignment.publishedAt !== null ? (
              <span className="pill pill--jade">{vi.lecturer.publishedStatus}</span>
            ) : (
              <span className="pill">{vi.lecturer.draftStatus}</span>
            )}
            {isArchived && <span className="pill pill--amber">{vi.lecturer.courseArchived}</span>}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--s-3)',
            alignItems: 'flex-end',
          }}
        >
          <Link href={`/lecturer/assignments/${assignment.id}/matrix`} className="btn3d btn3d--sky">
            {vi.matrix.viewMatrix}
          </Link>
          <PublishToggle
            assignmentId={assignment.id}
            publishedAt={assignment.publishedAt}
            isArchived={isArchived}
          />
        </div>
      </div>

      {/* Details card */}
      <div className="card" style={{ marginBottom: 'var(--s-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
          {/* Prompt */}
          <div>
            <div
              className="label"
              style={{ color: 'var(--ink-faint)', marginBottom: 'var(--s-2)' }}
            >
              {vi.lecturer.assignmentPrompt}
            </div>
            <p
              style={{
                fontSize: 'var(--t-body)',
                color: 'var(--ink)',
                whiteSpace: 'pre-wrap',
                lineHeight: 'var(--lh-body)',
              }}
            >
              {assignment.prompt}
            </p>
          </div>

          {/* Concepts */}
          <div>
            <div
              className="label"
              style={{ color: 'var(--ink-faint)', marginBottom: 'var(--s-2)' }}
            >
              {vi.lecturer.subjectConcepts}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
              {assignment.subjectConcepts.map((c) => (
                <span key={c} className="pill pill--jade">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Meta row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 'var(--s-4)',
            }}
          >
            <MetaItem label={vi.lecturer.assignmentDueAt}>
              {new Date(assignment.dueAt).toLocaleString('vi-VN')}
            </MetaItem>
            <MetaItem label={vi.lecturer.probeCount}>{String(assignment.probeCount)}</MetaItem>
            <MetaItem label={vi.lecturer.timeCapSeconds}>
              {`${String(assignment.timeCapSeconds)}s`}
            </MetaItem>
            <MetaItem label={vi.lecturer.defenseWeightPct}>
              {`${String(assignment.defenseWeightPct)}%`}
            </MetaItem>
          </div>

          {assignment.publishedAt !== null && (
            <MetaItem label={vi.lecturer.publishedAt}>
              {new Date(assignment.publishedAt).toLocaleString('vi-VN')}
            </MetaItem>
          )}
        </div>
      </div>

      {/* Submissions */}
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-h2)',
          fontWeight: 700,
          color: 'var(--ink)',
          margin: 'var(--s-8) 0 var(--s-4)',
        }}
      >
        {vi.analysis.submissions}
      </h2>
      {submissions.length === 0 ? (
        <p style={{ fontSize: 'var(--t-small)', color: 'var(--ink-faint)' }}>
          {vi.analysis.noSubmissions}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`/lecturer/submissions/${s.id}`}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--s-4)',
                textDecoration: 'none',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{s.studentDisplayName}</div>
                <div style={{ fontSize: 'var(--t-small)', color: 'var(--ink-faint)' }}>
                  {vi.submission.wordCount(s.wordCount)} ·{' '}
                  {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <span className={s.status === 'ready' ? 'pill pill--jade' : 'pill pill--amber'}>
                {submissionStatusLabel(s.status)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function submissionStatusLabel(status: string): string {
  switch (status) {
    case 'ready':
      return vi.submission.statusReady
    case 'analysing':
      return vi.submission.statusAnalysing
    case 'failed':
      return vi.submission.statusFailed
    default:
      return vi.submission.statusPending
  }
}

function MetaItem({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <div className="label" style={{ color: 'var(--ink-faint)', marginBottom: 'var(--s-1)' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--t-body)', fontWeight: 600, color: 'var(--ink)' }}>
        {children}
      </div>
    </div>
  )
}
