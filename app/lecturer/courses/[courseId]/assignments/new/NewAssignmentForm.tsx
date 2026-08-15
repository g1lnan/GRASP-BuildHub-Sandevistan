'use client'

import { vi } from '@/lib/i18n/vi'
import { useActionState } from 'react'
import { createAssignmentAction } from './actions'

type Props = { courseId: string }

export function NewAssignmentForm({ courseId }: Props) {
  const bound = createAssignmentAction.bind(null, courseId)
  const [state, action, pending] = useActionState(bound, { kind: 'idle' as const })

  const inputStyle: React.CSSProperties = {
    padding: 'var(--s-3) var(--s-4)',
    borderRadius: 'var(--r-sm)',
    border: 'var(--border) solid var(--line-strong)',
    background: 'var(--bg)',
    color: 'var(--ink)',
    fontSize: 'var(--t-body)',
    fontFamily: 'var(--font-ui)',
    minHeight: 'var(--tap-min)',
    width: '100%',
    boxSizing: 'border-box' as const,
  }

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="title"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.lecturer.assignmentTitle}
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={200}
          placeholder={vi.lecturer.assignmentTitlePlaceholder}
          style={inputStyle}
        />
      </div>

      {/* Prompt */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="prompt"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.lecturer.assignmentPrompt}
        </label>
        <textarea
          id="prompt"
          name="prompt"
          required
          rows={5}
          maxLength={10000}
          placeholder={vi.lecturer.assignmentPromptPlaceholder}
          style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
        />
      </div>

      {/* Due date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="dueAt"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.lecturer.assignmentDueAt}
        </label>
        <input id="dueAt" name="dueAt" type="datetime-local" required style={inputStyle} />
      </div>

      {/* Subject concepts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="subjectConcepts"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.lecturer.subjectConcepts}
        </label>
        <textarea
          id="subjectConcepts"
          name="subjectConcepts"
          required
          rows={4}
          placeholder={vi.lecturer.conceptsPlaceholder}
          style={{ ...inputStyle, minHeight: '96px', resize: 'vertical' }}
        />
        <span style={{ fontSize: 'var(--t-micro)', color: 'var(--ink-faint)' }}>
          {vi.lecturer.subjectConceptsHint}
        </span>
      </div>

      {/* Probe count */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="probeCount"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.lecturer.probeCount}
        </label>
        <input
          id="probeCount"
          name="probeCount"
          type="number"
          required
          min={5}
          max={8}
          defaultValue={6}
          style={{ ...inputStyle, maxWidth: '120px' }}
        />
      </div>

      {/* Time cap */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="timeCapSeconds"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.lecturer.timeCapSeconds}
        </label>
        <input
          id="timeCapSeconds"
          name="timeCapSeconds"
          type="number"
          required
          min={360}
          max={600}
          defaultValue={480}
          style={{ ...inputStyle, maxWidth: '120px' }}
        />
      </div>

      {/* Defense weight */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <label
          htmlFor="defenseWeightPct"
          style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink-soft)' }}
        >
          {vi.lecturer.defenseWeightPct}
        </label>
        <input
          id="defenseWeightPct"
          name="defenseWeightPct"
          type="number"
          required
          min={0}
          max={30}
          defaultValue={20}
          style={{ ...inputStyle, maxWidth: '120px' }}
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
        <a href={`/lecturer/courses/${courseId}`} className="btn3d btn3d--neutral">
          {vi.actions.cancel}
        </a>
        <button type="submit" disabled={pending} className="btn3d">
          {pending ? vi.actions.loading : vi.lecturer.saveAssignment}
        </button>
      </div>
    </form>
  )
}
