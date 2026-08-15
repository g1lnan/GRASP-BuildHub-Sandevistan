import { vi } from '@/lib/i18n/vi'
import Link from 'next/link'
import { JoinCourseForm } from './JoinCourseForm'

export const metadata = { title: `${vi.student.joinCourse} — ${vi.metadata.title}` }

export default function JoinCoursePage() {
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

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-h1)',
          fontWeight: 800,
          color: 'var(--ink)',
          marginBottom: 'var(--s-8)',
        }}
      >
        {vi.student.joinCourse}
      </h1>

      <div className="card" style={{ maxWidth: '400px' }}>
        <JoinCourseForm />
      </div>
    </div>
  )
}
