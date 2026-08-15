import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireRolePage(['student'])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: 'var(--bg-soft)',
      }}
    >
      {/* Top nav */}
      <header
        style={{
          background: 'var(--bg)',
          borderBottom: 'var(--border) solid var(--line)',
          padding: '0 var(--s-6)',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link
          href="/student"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'var(--t-h2)',
            color: 'var(--jade)',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          {vi.nav.grasp}
        </Link>

        <div style={{ display: 'flex', gap: 'var(--s-4)', alignItems: 'center' }}>
          <Link
            href="/student/join"
            style={{
              fontSize: 'var(--t-small)',
              fontWeight: 600,
              color: 'var(--ink-soft)',
              textDecoration: 'none',
            }}
          >
            {vi.student.joinCourse}
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="btn3d btn3d--neutral"
              style={{ fontSize: 'var(--t-micro)' }}
            >
              {vi.auth.signOut}
            </button>
          </form>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}
