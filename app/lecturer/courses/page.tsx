import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleCourseRepository } from '@/lib/repositories/drizzle-courses'
import Link from 'next/link'

export const metadata = { title: `${vi.lecturer.courses} — ${vi.metadata.title}` }

export default async function LecturerCoursesPage() {
  const actor = await requireRolePage(['lecturer'])
  const courses = await drizzleCourseRepository.listByLecturer(actor.id)

  return (
    <div
      style={{
        maxWidth: 'var(--w-content)',
        margin: '0 auto',
        padding: 'var(--s-10) var(--s-8)',
      }}
    >
      {/* Header */}
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
          {vi.lecturer.courses}
        </h1>
        <Link href="/lecturer/courses/new" className="btn3d">
          {vi.lecturer.newCourse}
        </Link>
      </div>

      {courses.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--s-16)',
            color: 'var(--ink-faint)',
          }}
        >
          <p style={{ fontSize: 'var(--t-h3)', fontWeight: 700, marginBottom: 'var(--s-4)' }}>
            {vi.lecturer.noCourses}
          </p>
          <Link href="/lecturer/courses/new" className="btn3d">
            {vi.lecturer.createFirstCourse}
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 'var(--s-4)',
          }}
        >
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/lecturer/courses/${course.id}`}
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
                  transition: 'box-shadow 120ms',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 'var(--t-h3)',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      marginBottom: 'var(--s-1)',
                    }}
                  >
                    {course.name}
                  </div>
                  <div style={{ fontSize: 'var(--t-small)', color: 'var(--ink-soft)' }}>
                    {course.term}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {course.archivedAt !== null ? (
                    <span className="pill pill--amber">{vi.lecturer.courseArchived}</span>
                  ) : (
                    <span className="pill pill--jade">{vi.lecturer.courseActive}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
