import { vi } from '@/lib/i18n/vi'
import { NewCourseForm } from './NewCourseForm'

export const metadata = { title: `${vi.lecturer.newCourse} — ${vi.metadata.title}` }

export default function NewCoursePage() {
  return (
    <div
      style={{
        maxWidth: 'var(--w-content)',
        margin: '0 auto',
        padding: 'var(--s-10) var(--s-8)',
      }}
    >
      <div style={{ marginBottom: 'var(--s-8)' }}>
        <a
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
        </a>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--t-h1)',
            fontWeight: 800,
            color: 'var(--ink)',
          }}
        >
          {vi.lecturer.newCourse}
        </h1>
      </div>

      <div className="card" style={{ maxWidth: '560px' }}>
        <NewCourseForm />
      </div>
    </div>
  )
}
