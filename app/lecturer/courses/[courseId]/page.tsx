import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleAssignmentRepository } from '@/lib/repositories/drizzle-assignments'
import { drizzleCourseRepository } from '@/lib/repositories/drizzle-courses'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CourseActions } from './CourseActions'

type Props = { params: Promise<{ courseId: string }> }

export async function generateMetadata({ params }: Props) {
  const { courseId } = await params
  const course = await drizzleCourseRepository.findDetailById(courseId)
  return { title: course ? `${course.name} — ${vi.metadata.title}` : vi.metadata.title }
}

export default async function CourseDetailPage({ params }: Props) {
  const { courseId } = await params
  const actor = await requireRolePage(['lecturer'])
  const course = await drizzleCourseRepository.findDetailById(courseId)

  if (course === null || course.lecturerId !== actor.id) notFound()

  const assignments = await drizzleAssignmentRepository.listByCourse(courseId)

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
        href="/lecturer/courses"
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
        ← {vi.lecturer.backToCourses}
      </Link>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--s-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--s-8)',
        }}
      >
        <div>
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
        </div>

        <CourseActions
          courseId={courseId}
          isArchived={course.archivedAt !== null}
          joinCode={course.joinCode}
          joinCodeRevokedAt={course.joinCodeRevokedAt}
        />
      </div>

      {/* Assignments section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--s-5)',
            flexWrap: 'wrap',
            gap: 'var(--s-3)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--t-h2)',
              fontWeight: 700,
              color: 'var(--ink)',
            }}
          >
            {vi.lecturer.assignments}
          </h2>
          {course.archivedAt === null && (
            <Link href={`/lecturer/courses/${courseId}/assignments/new`} className="btn3d">
              {vi.lecturer.newAssignment}
            </Link>
          )}
        </div>

        {assignments.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--s-12)',
              color: 'var(--ink-faint)',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: 'var(--s-4)' }}>
              {vi.lecturer.noAssignments}
            </p>
            {course.archivedAt === null && (
              <Link href={`/lecturer/courses/${courseId}/assignments/new`} className="btn3d">
                {vi.lecturer.createFirstAssignment}
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            {assignments.map((a) => (
              <Link
                key={a.id}
                href={`/lecturer/assignments/${a.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--s-4)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 'var(--t-body)',
                        fontWeight: 600,
                        color: 'var(--ink)',
                        marginBottom: 'var(--s-1)',
                      }}
                    >
                      {a.title}
                    </div>
                    <div style={{ fontSize: 'var(--t-small)', color: 'var(--ink-soft)' }}>
                      {vi.lecturer.assignmentDueAt}: {new Date(a.dueAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {a.publishedAt !== null ? (
                      <span className="pill pill--jade">{vi.lecturer.publishedStatus}</span>
                    ) : (
                      <span className="pill">{vi.lecturer.draftStatus}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
