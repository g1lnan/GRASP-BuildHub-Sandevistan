import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleAssignmentRepository } from '@/lib/repositories/drizzle-assignments'
import {
  drizzleCourseRepository,
  drizzleEnrollmentRepository,
} from '@/lib/repositories/drizzle-courses'
import Link from 'next/link'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ courseId: string }> }

export async function generateMetadata({ params }: Props) {
  const { courseId } = await params
  const course = await drizzleCourseRepository.findDetailById(courseId)
  return { title: course ? `${course.name} — ${vi.metadata.title}` : vi.metadata.title }
}

export default async function StudentCourseDetailPage({ params }: Props) {
  const { courseId } = await params
  const actor = await requireRolePage(['student'])

  // Verify enrollment
  const enrollments = await drizzleEnrollmentRepository.listCoursesByStudent(actor.id)
  const enrollment = enrollments.find((e) => e.courseId === courseId)
  if (enrollment === undefined) notFound()

  const course = enrollment.course
  const assignments = await drizzleAssignmentRepository.listByCourse(courseId)
  const published = assignments.filter((a) => a.publishedAt !== null)

  return (
    <div
      style={{
        maxWidth: 'var(--w-content)',
        margin: '0 auto',
        padding: 'var(--s-10) var(--s-6)',
      }}
    >
      <Link
        href="/student"
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

      <div style={{ marginBottom: 'var(--s-8)' }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--t-h1)',
            fontWeight: 800,
            color: 'var(--ink)',
            marginBottom: 'var(--s-1)',
          }}
        >
          {course.name}
        </h1>
        <div style={{ fontSize: 'var(--t-small)', color: 'var(--ink-soft)' }}>{course.term}</div>
        {course.archivedAt !== null && (
          <div style={{ marginTop: 'var(--s-3)' }}>
            <span className="pill pill--amber">{vi.lecturer.courseArchived}</span>
          </div>
        )}
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-h2)',
          fontWeight: 700,
          color: 'var(--ink)',
          marginBottom: 'var(--s-5)',
        }}
      >
        {vi.student.assignments}
      </h2>

      {published.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--s-12)',
            color: 'var(--ink-faint)',
          }}
        >
          <div aria-hidden="true" style={{ fontSize: '3rem', marginBottom: 'var(--s-4)' }}>
            🐃
          </div>
          <p style={{ fontWeight: 600, marginBottom: 'var(--s-2)' }}>{vi.student.noAssignments}</p>
          <p style={{ fontSize: 'var(--t-small)' }}>{vi.student.checkBack}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          {published.map((a) => (
            <div key={a.id} className="card card--jade">
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--t-h3)',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  marginBottom: 'var(--s-2)',
                }}
              >
                {a.title}
              </div>
              <div
                style={{
                  fontSize: 'var(--t-small)',
                  color: 'var(--ink-soft)',
                  marginBottom: 'var(--s-4)',
                }}
              >
                {vi.student.dueAt}: {new Date(a.dueAt).toLocaleDateString('vi-VN')}
              </div>
              <p
                style={{
                  fontSize: 'var(--t-small)',
                  color: 'var(--ink-soft)',
                  lineHeight: 'var(--lh-body)',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: 'var(--s-4)',
                }}
              >
                {a.prompt}
              </p>
              <Link href={`/student/submit/${a.id}`} className="btn3d">
                {vi.submission.submit}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
