'use client'

import { scoreDimensionKeys } from '@/lib/ai/scoring-schemas'
import { vi } from '@/lib/i18n/vi'
import { useCallback, useRef, useState } from 'react'

export type Dimensions = Record<(typeof scoreDimensionKeys)[number], number>

type Props = {
  sessionId: string
  baseline: Dimensions
  initialOverridden: Dimensions | null
  initialNote: string | null
}

type Status = 'idle' | 'saving' | 'saved' | 'error'

const STEP = 0.5
const clamp = (v: number) => Math.min(5, Math.max(1, Math.round(v * 10) / 10))

export function OverrideControl({ sessionId, baseline, initialOverridden, initialNote }: Props) {
  const [values, setValues] = useState<Dimensions>(initialOverridden ?? baseline)
  const [note, setNote] = useState(initialNote ?? '')
  const [status, setStatus] = useState<Status>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(
    async (nextValues: Dimensions, nextNote: string) => {
      setStatus('saving')
      try {
        const res = await fetch(`/api/sessions/${sessionId}/override`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overridden: nextValues, note: nextNote }),
        })
        setStatus(res.ok ? 'saved' : 'error')
      } catch {
        setStatus('error')
      }
    },
    [sessionId],
  )

  const step = (key: keyof Dimensions, delta: number) => {
    const next = { ...values, [key]: clamp(values[key] + delta) }
    setValues(next)
    save(next, note)
  }

  const onNoteBlur = () => {
    if (timer.current) clearTimeout(timer.current)
    save(values, note)
  }

  return (
    <div
      className="card card--gold"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}
    >
      <div>
        <h2 style={{ fontSize: 'var(--t-h3)', fontWeight: 700, color: 'var(--ink)' }}>
          {vi.override.heading}
        </h2>
        <p
          style={{ fontSize: 'var(--t-small)', color: 'var(--ink-soft)', marginTop: 'var(--s-1)' }}
        >
          {vi.override.hint}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        {scoreDimensionKeys.map((key) => {
          const changed = clamp(values[key]) !== clamp(baseline[key])
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--s-3)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink)' }}>
                  {vi.scoring.dimensions[key]}
                </div>
                {changed && (
                  <div style={{ fontSize: 'var(--t-micro)', color: 'var(--ink-faint)' }}>
                    {vi.override.original}: {baseline[key].toFixed(1)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                <Stepper
                  label={vi.override.decrease}
                  onClick={() => step(key, -STEP)}
                  disabled={values[key] <= 1}
                >
                  −
                </Stepper>
                <span
                  data-numeric
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 'var(--t-h3)',
                    minWidth: 44,
                    textAlign: 'center',
                    color: changed ? 'var(--gold-dark)' : 'var(--ink)',
                  }}
                >
                  {values[key].toFixed(1)}
                </span>
                <Stepper
                  label={vi.override.increase}
                  onClick={() => step(key, STEP)}
                  disabled={values[key] >= 5}
                >
                  +
                </Stepper>
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <label
          className="label"
          htmlFor="override-note"
          style={{ display: 'block', marginBottom: 'var(--s-1)' }}
        >
          {vi.override.note}
        </label>
        <textarea
          id="override-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={onNoteBlur}
          placeholder={vi.override.notePlaceholder}
          rows={2}
          style={{
            width: '100%',
            borderRadius: 'var(--r-sm)',
            border: 'var(--border) solid var(--line-strong)',
            padding: 'var(--s-2) var(--s-3)',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--t-small)',
            resize: 'vertical',
          }}
        />
      </div>

      <div
        aria-live="polite"
        style={{ fontSize: 'var(--t-small)', fontWeight: 700, minHeight: 20 }}
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
