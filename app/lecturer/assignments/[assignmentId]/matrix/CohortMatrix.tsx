'use client'

import {
  PRODUCT_THRESHOLD,
  type Quadrant,
  UNDERSTANDING_THRESHOLD,
  quadrantOf,
} from '@/lib/domain/quadrant'
import { vi } from '@/lib/i18n/vi'

export type MatrixPoint = {
  readonly submissionId: string
  readonly studentName: string
  readonly productScore: number | null
  readonly understanding: number | null
  readonly sessionId: string | null
  readonly overridden: boolean
}

const QUADRANT_COLOR: Record<Quadrant, string> = {
  mastery: 'var(--q-mastery)',
  hollow: 'var(--q-hollow)',
  expression_gap: 'var(--q-expression-gap)',
  needs_support: 'var(--q-needs-support)',
}
const QUADRANT_TINT: Record<Quadrant, string> = {
  mastery: 'var(--q-mastery-tint)',
  hollow: 'var(--q-hollow-tint)',
  expression_gap: 'var(--q-expression-gap-tint)',
  needs_support: 'var(--q-needs-support-tint)',
}

// SVG geometry
const W = 640
const H = 460
const PAD = { l: 52, r: 20, t: 20, b: 52 }
const X_MAX = 10
const Y_MIN = 1
const Y_MAX = 5

const xFor = (p: number) => PAD.l + (p / X_MAX) * (W - PAD.l - PAD.r)
const yFor = (u: number) => PAD.t + (1 - (u - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD.t - PAD.b)

export function CohortMatrix({ points }: { points: readonly MatrixPoint[] }) {
  const plotted = points.filter(
    (p): p is MatrixPoint & { productScore: number; understanding: number; sessionId: string } =>
      p.productScore !== null && p.understanding !== null && p.sessionId !== null,
  )
  const pending = points.filter((p) => p.productScore === null || p.understanding === null)

  const xThresh = xFor(PRODUCT_THRESHOLD)
  const yThresh = yFor(UNDERSTANDING_THRESHOLD)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-6)' }}>
      <div className="card" style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          role="img"
          aria-label={vi.matrix.title}
          style={{ maxWidth: '100%', height: 'auto', minWidth: 420 }}
        >
          {/* Quadrant tints. Top row = strong understanding. */}
          <rect
            x={xThresh}
            y={PAD.t}
            width={W - PAD.r - xThresh}
            height={yThresh - PAD.t}
            fill={QUADRANT_TINT.mastery}
          />
          <rect
            x={PAD.l}
            y={PAD.t}
            width={xThresh - PAD.l}
            height={yThresh - PAD.t}
            fill={QUADRANT_TINT.expression_gap}
          />
          <rect
            x={xThresh}
            y={yThresh}
            width={W - PAD.r - xThresh}
            height={H - PAD.b - yThresh}
            fill={QUADRANT_TINT.hollow}
          />
          <rect
            x={PAD.l}
            y={yThresh}
            width={xThresh - PAD.l}
            height={H - PAD.b - yThresh}
            fill={QUADRANT_TINT.needs_support}
          />

          {/* Plot frame */}
          <rect
            x={PAD.l}
            y={PAD.t}
            width={W - PAD.l - PAD.r}
            height={H - PAD.t - PAD.b}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth={2}
          />
          {/* Threshold divider lines */}
          <line
            x1={xThresh}
            y1={PAD.t}
            x2={xThresh}
            y2={H - PAD.b}
            stroke="var(--line-strong)"
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          <line
            x1={PAD.l}
            y1={yThresh}
            x2={W - PAD.r}
            y2={yThresh}
            stroke="var(--line-strong)"
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          {/* Axis labels */}
          <text
            x={(PAD.l + W - PAD.r) / 2}
            y={H - 14}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill="var(--ink-soft)"
          >
            {vi.matrix.axisProduct}
          </text>
          <text
            x={16}
            y={(PAD.t + H - PAD.b) / 2}
            textAnchor="middle"
            fontSize={13}
            fontWeight={700}
            fill="var(--ink-soft)"
            transform={`rotate(-90 16 ${(PAD.t + H - PAD.b) / 2})`}
          >
            {vi.matrix.axisUnderstanding}
          </text>

          {/* Dots */}
          {plotted.map((p) => {
            const q = quadrantOf(p.productScore, p.understanding) as Quadrant
            const cx = xFor(p.productScore)
            const cy = yFor(p.understanding)
            return (
              <a
                key={p.submissionId}
                href={`/lecturer/sessions/${p.sessionId}`}
                aria-label={`${p.studentName} — ${vi.quadrant[q]}`}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  fill={QUADRANT_COLOR[q]}
                  stroke="#fff"
                  strokeWidth={2}
                />
                {p.overridden && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={11}
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth={1.5}
                  />
                )}
                <title>{p.studentName}</title>
              </a>
            )
          })}
        </svg>
      </div>

      {/* Legend — teaching actions, keyboard-accessible student list */}
      <div className="card card--soft">
        <div className="label" style={{ marginBottom: 'var(--s-3)' }}>
          {vi.matrix.legend}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--s-3)',
          }}
        >
          {(['mastery', 'expression_gap', 'hollow', 'needs_support'] as const).map((q) => (
            <div key={q} style={{ display: 'flex', gap: 'var(--s-2)', alignItems: 'flex-start' }}>
              <span
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: QUADRANT_COLOR[q],
                  border: '2px solid #fff',
                  boxShadow: '0 0 0 1px var(--line-strong)',
                  marginTop: 3,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{vi.quadrant[q]}</div>
                <div style={{ fontSize: 'var(--t-small)', color: 'var(--ink-soft)' }}>
                  {vi.quadrant.action[q]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending students (missing an axis) */}
      {pending.length > 0 && (
        <div className="card">
          <div className="label" style={{ marginBottom: 'var(--s-2)' }}>
            {vi.matrix.pendingCount(pending.length)}
          </div>
          <p
            style={{
              fontSize: 'var(--t-small)',
              color: 'var(--ink-faint)',
              marginBottom: 'var(--s-3)',
            }}
          >
            {vi.matrix.pendingNote}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
            {pending.map((p) => (
              <span key={p.submissionId} className="pill">
                {p.studentName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
