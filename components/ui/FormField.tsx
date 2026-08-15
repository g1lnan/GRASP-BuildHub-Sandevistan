import type { ReactNode } from 'react'

type Props = {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

export function FormField({ id, label, hint, error, children }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
      <label
        htmlFor={id}
        style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <span style={{ fontSize: 'var(--t-micro)', color: 'var(--ink-faint)' }}>{hint}</span>
      )}
      {error && (
        <span role="alert" style={{ fontSize: 'var(--t-micro)', color: 'var(--amber-dark)' }}>
          {error}
        </span>
      )}
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 'var(--s-3) var(--s-4)',
  borderRadius: 'var(--r-sm)',
  border: 'var(--border) solid var(--line-strong)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  fontSize: 'var(--t-body)',
  fontFamily: 'var(--font-ui)',
  lineHeight: 'var(--lh-body)',
  outline: 'none',
  minHeight: 'var(--tap-min)',
  boxSizing: 'border-box',
}
