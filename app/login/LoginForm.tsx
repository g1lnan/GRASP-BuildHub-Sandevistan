'use client'

import { vi } from '@/lib/i18n/vi'
import { useActionState } from 'react'
import { loginAction } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { kind: 'idle' as const })

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="email"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.auth.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          style={{
            padding: 'var(--s-3) var(--s-4)',
            borderRadius: 'var(--r-sm)',
            border: 'var(--border) solid var(--line-strong)',
            background: 'var(--bg)',
            color: 'var(--ink)',
            fontSize: 'var(--t-body)',
            fontFamily: 'var(--font-ui)',
            minHeight: 'var(--tap-min)',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="password"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.auth.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          style={{
            padding: 'var(--s-3) var(--s-4)',
            borderRadius: 'var(--r-sm)',
            border: 'var(--border) solid var(--line-strong)',
            background: 'var(--bg)',
            color: 'var(--ink)',
            fontSize: 'var(--t-body)',
            fontFamily: 'var(--font-ui)',
            minHeight: 'var(--tap-min)',
          }}
        />
      </div>

      {state.kind === 'error' && (
        <div
          role="alert"
          style={{
            padding: 'var(--s-4)',
            borderRadius: 'var(--r-sm)',
            border: 'var(--border) solid var(--amber)',
            background: 'var(--amber-tint)',
            color: 'var(--amber-dark)',
            fontSize: 'var(--t-small)',
          }}
        >
          {state.message}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn3d btn3d--wide">
        {pending ? vi.actions.loading : vi.auth.signIn}
      </button>
    </form>
  )
}
