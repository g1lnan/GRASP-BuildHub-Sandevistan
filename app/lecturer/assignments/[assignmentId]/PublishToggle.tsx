'use client'

import { vi } from '@/lib/i18n/vi'
import { useActionState } from 'react'
import { togglePublishAction } from './actions'

type Props = {
  assignmentId: string
  publishedAt: Date | null
  isArchived: boolean
}

export function PublishToggle({ assignmentId, publishedAt, isArchived }: Props) {
  const isPublished = publishedAt !== null
  // To publish: set now; to unpublish: set null
  const nextPublishedAt = isPublished ? null : new Date()
  const bound = togglePublishAction.bind(null, assignmentId, nextPublishedAt)
  const [state, action, pending] = useActionState(bound, { kind: 'idle' as const })

  if (isArchived) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
      <form action={action}>
        <button
          type="submit"
          disabled={pending}
          className={isPublished ? 'btn3d btn3d--neutral' : 'btn3d btn3d--gold'}
        >
          {pending
            ? vi.actions.loading
            : isPublished
              ? vi.lecturer.unpublishAssignment
              : vi.lecturer.publishAssignment}
        </button>
      </form>

      {state.kind === 'error' && (
        <div
          role="alert"
          style={{
            padding: 'var(--s-3)',
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
    </div>
  )
}
