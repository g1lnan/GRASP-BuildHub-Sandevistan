'use client'

import { vi } from '@/lib/i18n/vi'
import { useActionState } from 'react'
import { joinCourseAction } from './actions'

export function JoinCourseForm() {
  const [state, action, pending] = useActionState(joinCourseAction, { kind: 'idle' as const })

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="joinCode"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.student.joinCode}
        </label>
        <input
          id="joinCode"
          name="joinCode"
          type="text"
          required
          minLength={8}
          maxLength={8}
          placeholder={vi.student.joinCodePlaceholder}
          autoCapitalize="characters"
          style={{
            padding: 'var(--s-3) var(--s-4)',
            borderRadius: 'var(--r-sm)',
            border: 'var(--border) solid var(--line-strong)',
            background: 'var(--bg)',
            color: 'var(--ink)',
            fontSize: 'var(--t-h2)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            minHeight: 'var(--tap-min)',
            textAlign: 'center',
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
        {pending ? vi.actions.loading : vi.student.joinCourseBtn}
      </button>
    </form>
  )
}
