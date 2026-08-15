import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleAssignmentRepository } from '@/lib/repositories/drizzle-assignments'
import { drizzleCourseRepository } from '@/lib/repositories/drizzle-courses'
import { getCohortMatrix } from '@/lib/repositories/drizzle-outcomes'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CohortMatrix } from './CohortMatrix'

type Props = { params: Promise<{ assignmentId: string }> }

export async function generateMetadata({ params }: Props) {
  const { assignmentId } = await params
  const a = await drizzleAssignmentRepository.findDetailById(assignmentId)
  return { title: a ? `${vi.matrix.title} — ${a.title}` : vi.matrix.title }
}

export default async function CohortMatrixPage({ params }: Props) {
  const { assignmentId } = await params
  const actor = await requireRolePage(['lecturer'])

  const assignment = await drizzleAssignmentRepository.findDetailById(assignmentId)
  if (assignment === null) notFound()

  const course = await drizzleCourseRepository.findDetailById(assignment.courseId)
  if (
    course === null ||
    course.lecturerId !== actor.id ||
    course.institutionId !== actor.institutionId
  ) {
    notFound()
  }

  const points = await getCohortMatrix(assignmentId)
  const plottedCount = points.filter(
    (p) => p.productScore !== null && p.understanding !== null && p.sessionId !== null,
  ).length

  return (
    <div
      style={{ maxWidth: 'var(--w-content)', margin: '0 auto', padding: 'var(--s-10) var(--s-8)' }}
    >
      <Link
        href={`/lecturer/assignments/${assignmentId}`}
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
        ← {vi.matrix.backToAssignment}
      </Link>

      <div style={{ marginBottom: 'var(--s-2)' }}>
        <div style={{ fontSize: 'var(--t-small)', color: 'var(--ink-faint)' }}>
          {course.name} · {assignment.title}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--t-h1)',
            fontWeight: 800,
            color: 'var(--ink)',
          }}
        >
          {vi.matrix.title}
        </h1>
      </div>
      <p
        style={{ fontSize: 'var(--t-body)', color: 'var(--ink-soft)', marginBottom: 'var(--s-6)' }}
      >
        {vi.matrix.subtitle}
      </p>

      {plottedCount === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--ink-soft)', fontSize: 'var(--t-body)' }}>{vi.matrix.noData}</p>
        </div>
      ) : (
        <>
          <div className="pill pill--jade" style={{ marginBottom: 'var(--s-5)' }}>
            {vi.matrix.plotted(plottedCount)}
          </div>
          <CohortMatrix points={points} />
        </>
      )}
    </div>
  )
}
