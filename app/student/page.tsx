import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleEnrollmentRepository } from '@/lib/repositories/drizzle-courses'
import Link from 'next/link'

export const metadata = { title: `${vi.student.myCourses} — ${vi.metadata.title}` }

export default async function StudentHomePage() {
  const actor = await requireRolePage(['student'])
  const enrollments = await drizzleEnrollmentRepository.listCoursesByStudent(actor.id)

  return (
    <div
      style={{
        maxWidth: 'var(--w-content)',
        margin: '0 auto',
        padding: 'var(--s-10) var(--s-6)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--s-8)',
          flexWrap: 'wrap',
          gap: 'var(--s-4)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--t-h1)',
            fontWeight: 800,
            color: 'var(--ink)',
          }}
        >
          {vi.student.myCourses}
        </h1>
        <Link href="/student/join" className="btn3d">
          {vi.student.joinCourse}
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--s-16)',
            color: 'var(--ink-faint)',
          }}
        >
          {/* Nghé mascot placeholder */}
          <div aria-hidden="true" style={{ fontSize: '4rem', marginBottom: 'var(--s-4)' }}>
            🐃
          </div>
          <p style={{ fontWeight: 700, fontSize: 'var(--t-h3)', marginBottom: 'var(--s-2)' }}>
            {vi.student.noCourses}
          </p>
          <p style={{ fontSize: 'var(--t-small)', marginBottom: 'var(--s-6)' }}>
            {vi.student.joinFirst}
          </p>
          <Link href="/student/join" className="btn3d">
            {vi.student.joinCourse}
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--s-4)',
          }}
        >
          {enrollments.map(({ course }) => (
            <Link
              key={course.id}
              href={`/student/courses/${course.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card card--jade"
                style={{ height: '100%', cursor: 'pointer', minHeight: '120px' }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--t-h3)',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    marginBottom: 'var(--s-2)',
                  }}
                >
                  {course.name}
                </div>
                <div style={{ fontSize: 'var(--t-small)', color: 'var(--ink-soft)' }}>
                  {course.term}
                </div>
                {course.archivedAt !== null && (
                  <div style={{ marginTop: 'var(--s-3)' }}>
                    <span className="pill pill--amber">{vi.lecturer.courseArchived}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
