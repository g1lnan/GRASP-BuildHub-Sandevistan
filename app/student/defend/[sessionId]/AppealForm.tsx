'use client'

import { vi } from '@/lib/i18n/vi'
import { useState } from 'react'

type Status = 'idle' | 'submitting' | 'submitted' | 'error'

export function AppealForm({ sessionId }: { sessionId: string }) {
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  async function submit() {
    if (reason.trim().length < 10) {
      setStatus('error')
      setMessage(vi.errors.invalidInput)
      return
    }
    setStatus('submitting')
    setMessage(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        setStatus('submitted')
        return
      }
      const body: unknown = await res.json().catch(() => null)
      setStatus('error')
      setMessage(
        body !== null &&
          typeof body === 'object' &&
          'error' in body &&
          typeof body.error === 'string'
          ? body.error
          : vi.errors.serverError,
      )
    } catch {
      setStatus('error')
      setMessage(vi.errors.serverError)
    }
  }

  if (status === 'submitted') {
    return (
      <section className="card card--soft" aria-live="polite">
        <div className="label" style={{ marginBottom: 'var(--s-2)' }}>
          {vi.appeal.submitted}
        </div>
        <p style={{ color: 'var(--ink-soft)' }}>{vi.appeal.submittedBody}</p>
        <button
          type="button"
          className="btn3d btn3d--neutral"
          style={{ marginTop: 'var(--s-3)' }}
          onClick={() => {
            setStatus('idle')
            setOpen(true)
          }}
        >
          {vi.appeal.edit}
        </button>
      </section>
    )
  }

  if (!open) {
    return (
      <section className="card card--soft" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 'var(--s-3)' }}>{vi.appeal.prompt}</p>
        <button type="button" className="btn3d btn3d--neutral" onClick={() => setOpen(true)}>
          {vi.appeal.heading}
        </button>
      </section>
    )
  }

  return (
    <section
      className="card card--soft"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
    >
      <div className="label">{vi.appeal.heading}</div>
      <label
        htmlFor="appeal-reason"
        style={{ fontWeight: 700, color: 'var(--ink-soft)', fontSize: 'var(--t-small)' }}
      >
        {vi.appeal.reasonLabel}
      </label>
      <textarea
        id="appeal-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={vi.appeal.placeholder}
        rows={4}
        maxLength={2_000}
        style={{
          width: '100%',
          borderRadius: 'var(--r-card)',
          border: 'var(--border) solid var(--line-strong)',
          padding: 'var(--s-3) var(--s-4)',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--t-body)',
          lineHeight: 'var(--lh-body)',
          resize: 'vertical',
        }}
      />
      {status === 'error' && message !== null && (
        <div role="alert" style={{ color: 'var(--amber-dark)', fontSize: 'var(--t-small)' }}>
          {message}
        </div>
      )}
      <button
        type="button"
        className="btn3d"
        disabled={status === 'submitting' || reason.trim().length < 10}
        onClick={submit}
      >
        {status === 'submitting' ? vi.appeal.submitting : vi.appeal.submit}
      </button>
    </section>
  )
}
