'use client'

import { vi } from '@/lib/i18n/vi'
import { useActionState } from 'react'
import { type SubmitState, submitAction } from './actions'

export function SubmitForm({ assignmentId }: { assignmentId: string }) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitAction, {
    kind: 'idle',
  })

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      <input type="hidden" name="assignmentId" value={assignmentId} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="text"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.submission.pasteText}
        </label>
        <textarea
          id="text"
          name="text"
          rows={12}
          placeholder={vi.submission.pastePlaceholder}
          style={{
            padding: 'var(--s-3) var(--s-4)',
            borderRadius: 'var(--r-sm)',
            border: 'var(--border) solid var(--line-strong)',
            background: 'var(--bg)',
            color: 'var(--ink)',
            fontSize: 'var(--t-body)',
            fontFamily: 'var(--font-ui)',
            lineHeight: 'var(--lh-body)',
            resize: 'vertical',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="file"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.submission.uploadFile}
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ fontSize: 'var(--t-small)', color: 'var(--ink-soft)' }}
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
        {pending ? vi.submission.submitting : vi.submission.submitButton}
      </button>
    </form>
  )
}
