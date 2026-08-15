import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleAssignmentRepository } from '@/lib/repositories/drizzle-assignments'
import { drizzleSubmissionEnrollmentRepository } from '@/lib/repositories/drizzle-submissions'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SubmitForm } from './SubmitForm'

type Props = { params: Promise<{ assignmentId: string }> }

export async function generateMetadata({ params }: Props) {
  const { assignmentId } = await params
  const assignment = await drizzleAssignmentRepository.findDetailById(assignmentId)
  return {
    title: assignment
      ? `${vi.submission.submit}: ${assignment.title} — ${vi.metadata.title}`
      : vi.metadata.title,
  }
}

export default async function SubmitPage({ params }: Props) {
  const { assignmentId } = await params
  const actor = await requireRolePage(['student'])

  const assignment = await drizzleAssignmentRepository.findDetailById(assignmentId)
  if (assignment === null || assignment.publishedAt === null) notFound()

  const enrolled = await drizzleSubmissionEnrollmentRepository.isEnrolled(
    assignment.courseId,
    actor.id,
  )
  if (!enrolled) notFound()

  return (
    <div
      style={{ maxWidth: 'var(--w-content)', margin: '0 auto', padding: 'var(--s-10) var(--s-6)' }}
    >
      <Link
        href={`/student/courses/${assignment.courseId}`}
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
        ← {vi.student.backToCourses}
      </Link>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-h1)',
          fontWeight: 800,
          color: 'var(--ink)',
          marginBottom: 'var(--s-2)',
        }}
      >
        {assignment.title}
      </h1>
      <p
        style={{
          fontSize: 'var(--t-body)',
          color: 'var(--ink-soft)',
          lineHeight: 'var(--lh-body)',
          marginBottom: 'var(--s-8)',
        }}
      >
        {assignment.prompt}
      </p>

      <div className="card">
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--t-h3)',
            fontWeight: 700,
            color: 'var(--ink)',
            marginBottom: 'var(--s-2)',
          }}
        >
          {vi.submission.submitTitle}
        </h2>
        <p
          style={{
            fontSize: 'var(--t-small)',
            color: 'var(--ink-soft)',
            marginBottom: 'var(--s-5)',
          }}
        >
          {vi.submission.submitInstructions}
        </p>
        <SubmitForm assignmentId={assignmentId} />
      </div>
    </div>
  )
}
