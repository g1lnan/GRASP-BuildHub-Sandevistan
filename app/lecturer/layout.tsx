import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default async function LecturerLayout({ children }: { children: ReactNode }) {
  await requireRolePage(['lecturer', 'researcher'])

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        background: 'var(--bg-soft)',
      }}
    >
      {/* Sidebar — fixed 240px on desktop */}
      <nav
        aria-label={vi.lecturer.console}
        style={{
          width: 'var(--w-sidebar)',
          flexShrink: 0,
          background: 'var(--bg)',
          borderRight: 'var(--border) solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          padding: 'var(--s-6) 0',
          position: 'sticky',
          top: 0,
          height: '100dvh',
          overflowY: 'auto',
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '0 var(--s-6)',
            marginBottom: 'var(--s-8)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'var(--t-h2)',
              color: 'var(--jade)',
              letterSpacing: '-0.01em',
            }}
          >
            {vi.nav.grasp}
          </span>
          <div className="label" style={{ marginTop: 'var(--s-1)', color: 'var(--ink-faint)' }}>
            {vi.lecturer.console}
          </div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}>
          <NavLink href="/lecturer/courses">{vi.nav.courses}</NavLink>
        </div>

        {/* Sign out */}
        <div
          style={{
            padding: '0 var(--s-4)',
            borderTop: 'var(--border) solid var(--line)',
            paddingTop: 'var(--s-5)',
          }}
        >
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="btn3d btn3d--neutral btn3d--wide"
              style={{ fontSize: 'var(--t-micro)' }}
            >
              {vi.auth.signOut}
            </button>
          </form>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: 'var(--s-3) var(--s-6)',
        fontSize: 'var(--t-small)',
        fontWeight: 600,
        color: 'var(--ink-soft)',
        textDecoration: 'none',
        borderRadius: 0,
        transition: 'background 120ms',
      }}
    >
      {children}
    </Link>
  )
}
