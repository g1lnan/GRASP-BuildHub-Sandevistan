'use client'

import { vi } from '@/lib/i18n/vi'
import { useActionState } from 'react'
import { archiveCourseAction, rotateJoinCodeAction } from './actions'

type Props = {
  courseId: string
  isArchived: boolean
  joinCode: string
  joinCodeRevokedAt: Date | null
}

export function CourseActions({ courseId, isArchived, joinCode, joinCodeRevokedAt }: Props) {
  const boundArchive = archiveCourseAction.bind(null, courseId)
  const boundRotate = rotateJoinCodeAction.bind(null, courseId)

  const [archiveState, archiveAction, archivePending] = useActionState(boundArchive, {
    kind: 'idle' as const,
  })
  const [rotateState, rotateAction, rotatePending] = useActionState(boundRotate, {
    kind: 'idle' as const,
  })

  const errorMsg =
    (archiveState.kind === 'error' && archiveState.message) ||
    (rotateState.kind === 'error' && rotateState.message) ||
    null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
      {/* Join code card */}
      <div
        className="card card--soft"
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)', flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label" style={{ color: 'var(--ink-faint)', marginBottom: 'var(--s-1)' }}>
            {vi.lecturer.joinCode}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'var(--t-h2)',
              letterSpacing: '0.12em',
              color: joinCodeRevokedAt !== null ? 'var(--ink-faint)' : 'var(--jade)',
              textDecoration: joinCodeRevokedAt !== null ? 'line-through' : 'none',
            }}
          >
            {joinCode}
          </div>
          {joinCodeRevokedAt !== null && (
            <div
              style={{
                fontSize: 'var(--t-micro)',
                color: 'var(--amber-dark)',
                marginTop: 'var(--s-1)',
              }}
            >
              {vi.errors.joinCodeRevoked}
            </div>
          )}
        </div>

        {!isArchived && (
          <form action={rotateAction}>
            <button
              type="submit"
              disabled={rotatePending}
              className="btn3d btn3d--neutral"
              style={{ fontSize: 'var(--t-micro)' }}
            >
              {rotatePending ? vi.actions.loading : vi.lecturer.rotateJoinCode}
            </button>
          </form>
        )}
      </div>

      {/* Archive action */}
      {!isArchived && (
        <form action={archiveAction}>
          <button type="submit" disabled={archivePending} className="btn3d btn3d--neutral">
            {archivePending ? vi.actions.loading : vi.lecturer.archiveCourse}
          </button>
        </form>
      )}

      {isArchived && <span className="pill pill--amber">{vi.lecturer.courseArchived}</span>}

      {errorMsg && (
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
          {errorMsg}
        </div>
      )}
    </div>
  )
}
