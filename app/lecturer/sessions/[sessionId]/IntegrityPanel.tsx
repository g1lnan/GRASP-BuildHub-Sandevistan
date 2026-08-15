import type { TimingAnalysisResult } from '@/lib/domain/timing-analysis'
import { vi } from '@/lib/i18n/vi'

type IntegrityPanelProps = {
  readonly integritySignals: Record<string, unknown>
  readonly probes: readonly {
    readonly textVi: string
    readonly aiFragilityScore: number | null
    readonly aiFragilityWithEssayScore: number | null
    readonly followUpEligible: boolean
    readonly isFollowUp: boolean
  }[]
}

function FragilityBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null
  const pct = Math.round(value * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
      <span style={{ fontSize: 'var(--t-micro)', color: 'var(--ink-soft)', minWidth: 100 }}>
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          background: 'var(--bg-soft)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${String(pct)}%`,
            height: '100%',
            borderRadius: 4,
            background: value >= 0.5 ? 'var(--jade)' : 'var(--amber)',
            transition: 'width 0.3s',
          }}
        />
      </div>
      <span
        data-numeric
        style={{
          fontSize: 'var(--t-micro)',
          color: 'var(--ink-soft)',
          minWidth: 32,
          textAlign: 'right',
        }}
      >
        {pct}%
      </span>
    </div>
  )
}

function TimingSignalPills({ timingAnalysis }: { timingAnalysis: TimingAnalysisResult }) {
  if (timingAnalysis.signals.length === 0) {
    return <span className="pill">{vi.integrity.suspicionNone}</span>
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
      {timingAnalysis.signals.map((signal, i) => (
        <span key={[signal.type, i].join('-')} className="pill pill--amber" title={signal.detail}>
          {signal.type === 'uniform_timing' && vi.integrity.uniformTiming}
          {signal.type === 'paste_pattern' && vi.integrity.pastePattern}
          {signal.type === 'superhuman_speed' && vi.integrity.superhumanSpeed}
        </span>
      ))}
    </div>
  )
}

export function IntegrityPanel({ integritySignals, probes }: IntegrityPanelProps) {
  const timingAnalysis = integritySignals.timingAnalysis as TimingAnalysisResult | undefined
  const pasteEvents = integritySignals.pasteEvents as
    | Array<{ turnOrdinal: number; charCount: number }>
    | undefined
  const tabSwitches = integritySignals.tabSwitches as
    | Array<{ hiddenDurationMs: number }>
    | undefined
  const hasAnySignals =
    timingAnalysis !== undefined ||
    (pasteEvents !== undefined && pasteEvents.length > 0) ||
    (tabSwitches !== undefined && tabSwitches.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
      <h2
        style={{
          fontSize: 'var(--t-h2)',
          fontWeight: 700,
          color: 'var(--ink)',
          marginBottom: 'var(--s-1)',
        }}
      >
        {vi.integrity.heading}
      </h2>

      {timingAnalysis !== undefined && (
        <div
          className="card"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
        >
          <div className="label">{vi.integrity.timingPattern}</div>
          <TimingSignalPills timingAnalysis={timingAnalysis} />
        </div>
      )}

      {hasAnySignals && (
        <div
          className="card card--soft"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
        >
          {pasteEvents !== undefined && pasteEvents.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--t-small)', color: 'var(--ink)' }}>
                {vi.integrity.pasteDetected}
              </span>
              <span className="pill pill--amber">{pasteEvents.length}x</span>
            </div>
          )}
          {tabSwitches !== undefined && tabSwitches.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--t-small)', color: 'var(--ink)' }}>
                {vi.integrity.tabSwitches}
              </span>
              <span className="pill">{tabSwitches.length}x</span>
            </div>
          )}
        </div>
      )}

      {!hasAnySignals && (
        <div className="card card--soft" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
          {vi.integrity.noSignals}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        <div className="label">{vi.integrity.fragilityComparison}</div>
        {probes.map((probe) => {
          const cardClass = probe.isFollowUp ? 'card card--sky' : 'card card--soft'
          const truncated =
            probe.textVi.length > 80 ? probe.textVi.slice(0, 80).concat('\u2026') : probe.textVi
          return (
            <div
              key={probe.textVi}
              className={cardClass}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                <span
                  style={{
                    fontSize: 'var(--t-small)',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    flex: 1,
                  }}
                >
                  {truncated}
                </span>
                {probe.followUpEligible && (
                  <span className="pill pill--amber" style={{ fontSize: 'var(--t-micro)' }}>
                    {vi.integrity.followUpTriggered}
                  </span>
                )}
                {probe.isFollowUp && (
                  <span className="pill pill--sky" style={{ fontSize: 'var(--t-micro)' }}>
                    {vi.defense.followUpLabel}
                  </span>
                )}
              </div>
              <FragilityBar label={vi.integrity.blindFragility} value={probe.aiFragilityScore} />
              <FragilityBar
                label={vi.integrity.withEssayFragility}
                value={probe.aiFragilityWithEssayScore}
              />
            </div>
          )
        })}
      </div>

      <div
        className="card card--soft"
        style={{ fontSize: 'var(--t-micro)', color: 'var(--ink-faint)', fontStyle: 'italic' }}
      >
        {vi.integrity.limitation}
      </div>
    </div>
  )
}
