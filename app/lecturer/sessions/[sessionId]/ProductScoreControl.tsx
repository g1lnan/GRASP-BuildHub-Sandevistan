'use client'

import { vi } from '@/lib/i18n/vi'
import { useCallback, useState } from 'react'

type Status = 'idle' | 'saving' | 'saved' | 'error'

const STEP = 0.5
const clamp = (v: number) => Math.min(10, Math.max(0, Math.round(v * 10) / 10))

export function ProductScoreControl({
  submissionId,
  initial,
}: {
  submissionId: string
  initial: number | null
}) {
  const [value, setValue] = useState<number>(initial ?? 6.5)
  const [status, setStatus] = useState<Status>('idle')

  const save = useCallback(
    async (next: number) => {
      setStatus('saving')
      try {
        const res = await fetch(`/api/submissions/${submissionId}/product-score`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productScore: next }),
        })
        setStatus(res.ok ? 'saved' : 'error')
      } catch {
        setStatus('error')
      }
    },
    [submissionId],
  )

  const step = (delta: number) => {
    const next = clamp(value + delta)
    setValue(next)
    save(next)
  }

  return (
    <div
      className="card card--soft"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
    >
      <div className="label">{vi.override.productScore}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
        <Stepper label={vi.override.decrease} onClick={() => step(-STEP)} disabled={value <= 0}>
          −
        </Stepper>
        <span
          data-numeric
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 'var(--t-h2)',
            minWidth: 56,
            textAlign: 'center',
            color: 'var(--sky-dark)',
          }}
        >
          {value.toFixed(1)}
        </span>
        <Stepper label={vi.override.increase} onClick={() => step(STEP)} disabled={value >= 10}>
          +
        </Stepper>
        <div
          aria-live="polite"
          style={{ fontSize: 'var(--t-small)', fontWeight: 700, marginLeft: 'var(--s-2)' }}
        >
          {status === 'saving' && (
            <span style={{ color: 'var(--ink-soft)' }}>{vi.override.saving}</span>
          )}
          {status === 'saved' && (
            <span style={{ color: 'var(--jade-dark)' }}>✓ {vi.override.saved}</span>
          )}
          {status === 'error' && (
            <span style={{ color: 'var(--amber-dark)' }}>{vi.errors.serverError}</span>
          )}
        </div>
      </div>
      {initial === null && status === 'idle' && (
        <p style={{ fontSize: 'var(--t-micro)', color: 'var(--ink-faint)' }}>
          {vi.matrix.pendingNote}
        </p>
      )}
    </div>
  )
}

function Stepper({
  children,
  label,
  onClick,
  disabled,
}: {
  children: string
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 44,
        height: 44,
        borderRadius: 'var(--r-btn)',
        border: 'var(--border) solid var(--line-strong)',
        background: disabled ? 'var(--bg-sunk)' : 'var(--neutral)',
        color: disabled ? 'var(--ink-faint)' : 'var(--ink)',
        boxShadow: disabled ? 'none' : '0 var(--slab) 0 var(--neutral-dark)',
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--t-h2)',
        fontWeight: 800,
        lineHeight: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}
