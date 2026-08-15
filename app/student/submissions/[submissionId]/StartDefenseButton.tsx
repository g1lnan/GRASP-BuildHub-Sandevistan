'use client'

import { vi } from '@/lib/i18n/vi'
import { sessionViewSchema } from '@/lib/session/schemas'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function StartDefenseButton({ submissionId }: { submissionId: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const message =
          typeof body === 'object' &&
          body !== null &&
          'error' in body &&
          typeof body.error === 'string'
            ? body.error
            : vi.errors.serverError
        setError(message)
        return
      }
      const session = sessionViewSchema.parse(body)
      router.push(`/student/defend/${session.id}`)
    } catch {
      setError(vi.errors.serverError)
    } finally {
      setPending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
      <button type="button" className="btn3d" disabled={pending} onClick={start}>
        {pending ? vi.defense.starting : vi.defense.start}
      </button>
      {error !== null && (
        <div role="alert" style={{ color: 'var(--amber-dark)', fontSize: 'var(--t-small)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
