'use client'

import { vi } from '@/lib/i18n/vi'
import { useActionState } from 'react'
import { createCourseAction } from './actions'

export function NewCourseForm() {
  const [state, action, pending] = useActionState(createCourseAction, { kind: 'idle' as const })

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="name"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.lecturer.courseName}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={200}
          placeholder={vi.lecturer.courseNamePlaceholder}
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
          htmlFor="term"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.lecturer.courseTerm}
        </label>
        <input
          id="term"
          name="term"
          type="text"
          required
          maxLength={100}
          placeholder={vi.lecturer.courseTermPlaceholder}
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

      <div style={{ display: 'flex', gap: 'var(--s-3)', justifyContent: 'flex-end' }}>
        <a href="/lecturer/courses" className="btn3d btn3d--neutral">
          {vi.actions.cancel}
        </a>
        <button type="submit" disabled={pending} className="btn3d">
          {pending ? vi.actions.loading : vi.lecturer.createCourse}
        </button>
      </div>
    </form>
  )
}
