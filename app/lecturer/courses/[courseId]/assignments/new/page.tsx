import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleCourseRepository } from '@/lib/repositories/drizzle-courses'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NewAssignmentForm } from './NewAssignmentForm'

type Props = { params: Promise<{ courseId: string }> }

export const metadata = { title: `${vi.lecturer.newAssignment} — ${vi.metadata.title}` }

export default async function NewAssignmentPage({ params }: Props) {
  const { courseId } = await params
  const actor = await requireRolePage(['lecturer'])
  const course = await drizzleCourseRepository.findDetailById(courseId)

  if (course === null || course.lecturerId !== actor.id) notFound()
  if (course.archivedAt !== null) notFound()

  return (
    <div
      style={{
        maxWidth: 'var(--w-content)',
        margin: '0 auto',
        padding: 'var(--s-10) var(--s-8)',
      }}
    >
      <Link
        href={`/lecturer/courses/${courseId}`}
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

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-h1)',
          fontWeight: 800,
          color: 'var(--ink)',
          marginBottom: 'var(--s-2)',
        }}
      >
        {vi.lecturer.newAssignment}
      </h1>
      <div
        style={{ fontSize: 'var(--t-small)', color: 'var(--ink-soft)', marginBottom: 'var(--s-8)' }}
      >
        {course.name} · {course.term}
      </div>

      <div className="card" style={{ maxWidth: '640px' }}>
        <NewAssignmentForm courseId={courseId} />
      </div>
    </div>
  )
}
