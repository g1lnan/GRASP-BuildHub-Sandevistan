import { vi } from '@/lib/i18n/vi'
import { LoginForm } from './LoginForm'

export const metadata = {
  title: `${vi.auth.loginTitle} — ${vi.metadata.title}`,
}

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--s-6) var(--s-4)',
        background: 'var(--bg-soft)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--s-8)',
        }}
      >
        {/* Logo / mascot area */}
        <div style={{ textAlign: 'center' }}>
          <div
            aria-hidden="true"
            style={{
              fontSize: '3rem',
              lineHeight: 1,
              marginBottom: 'var(--s-3)',
            }}
          >
            {/* Nghé placeholder — SVG mascot ships as flat 3-colour SVG */}
            <svg
              width="72"
              height="72"
              viewBox="0 0 72 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label={vi.auth.mascotAlt}
            >
              <title>{vi.auth.mascotAlt}</title>
              <circle cx="36" cy="36" r="36" fill="var(--jade-tint)" />
              <ellipse cx="36" cy="42" rx="18" ry="16" fill="var(--jade)" />
              <ellipse cx="36" cy="30" rx="14" ry="12" fill="var(--jade)" />
              <circle cx="30" cy="28" r="3" fill="var(--bg)" />
              <circle cx="42" cy="28" r="3" fill="var(--bg)" />
              <ellipse cx="36" cy="50" rx="8" ry="5" fill="var(--jade-dark)" />
              {/* Horns */}
              <path
                d="M22 24 Q18 16 24 18"
                stroke="var(--jade-dark)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M50 24 Q54 16 48 18"
                stroke="var(--jade-dark)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--t-h1)',
              lineHeight: 'var(--lh-h1)',
              fontWeight: 800,
              color: 'var(--ink)',
            }}
          >
            {vi.auth.loginTitle}
          </h1>
          <p style={{ color: 'var(--ink-soft)', marginTop: 'var(--s-2)' }}>
            {vi.auth.loginSubtitle}
          </p>
        </div>

        <div className="card">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
