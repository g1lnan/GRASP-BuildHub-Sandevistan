import { requireRolePage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import {
  type ClaimGraphView,
  findLatestClaimGraphBySubmission,
} from '@/lib/repositories/drizzle-claim-graphs'
import { type ProbeRow, listProbesByClaimGraph } from '@/lib/repositories/drizzle-probes'
import { drizzleSubmissionRepository } from '@/lib/repositories/drizzle-submissions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const metadata = { title: `${vi.analysis.analysisTitle} — ${vi.metadata.title}` }

type Props = { params: Promise<{ submissionId: string }> }

function fragilityPercent(score: number | null): string {
  if (score === null) return '—'
  return `${Math.round(score * 100)}%`
}

export default async function LecturerSubmissionAnalysisPage({ params }: Props) {
  const { submissionId } = await params
  const actor = await requireRolePage(['lecturer'])

  const auth = await drizzleSubmissionRepository.findAuthById(submissionId)
  if (auth === null) notFound()
  // Course-owning lecturer only (server-side authorisation).
  if (auth.courseLecturerId !== actor.id || auth.institutionId !== actor.institutionId) notFound()

  const graph = await findLatestClaimGraphBySubmission(submissionId)
  const probes = graph === null ? [] : await listProbesByClaimGraph(graph.id)
  const selected = probes.filter((p) => p.selected).sort((a, b) => a.ordinal - b.ordinal)

  return (
    <div
      style={{ maxWidth: 'var(--w-content)', margin: '0 auto', padding: 'var(--s-10) var(--s-8)' }}
    >
      <Link
        href={`/lecturer/assignments/${auth.assignmentId}`}
        style={{
          fontSize: 'var(--t-small)',
          color: 'var(--ink-soft)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--s-1)',
          marginBottom: 'var(--s-4)',
        }}
      >
        ← {vi.analysis.backToAssignment}
      </Link>

      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--t-h1)',
          fontWeight: 800,
          color: 'var(--ink)',
          marginBottom: 'var(--s-6)',
        }}
      >
        {vi.analysis.analysisTitle}
      </h1>

      {graph === null || auth.status !== 'ready' ? (
        <div className="card">
          <span className="pill pill--amber">{submissionStatusLabel(auth.status)}</span>
          <p
            style={{ marginTop: 'var(--s-3)', color: 'var(--ink-soft)', fontSize: 'var(--t-body)' }}
          >
            {vi.analysis.notReadyYet}
          </p>
        </div>
      ) : (
        <AnalysisBody graph={graph} selected={selected} />
      )}
    </div>
  )
}

function AnalysisBody({
  graph,
  selected,
}: {
  graph: ClaimGraphView
  selected: readonly ProbeRow[]
}) {
  const nodeText = new Map(graph.nodes.map((n) => [n.id, n.text]))
  const avgFragility =
    selected.length === 0
      ? 0
      : selected.reduce((sum, p) => sum + (p.aiFragilityScore ?? 0), 0) / selected.length
  const distinctNodes = new Set(selected.map((p) => p.claimNodeId)).size
  const distinctBlooms = new Set(selected.map((p) => p.bloomLevel)).size
  const competencies = [...new Set(graph.nodes.flatMap((n) => n.concepts))]

  return (
    <>
      {/* Summary stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--s-4)',
          marginBottom: 'var(--s-6)',
        }}
      >
        <div className="card">
          <div className="label" style={{ color: 'var(--ink-faint)' }}>
            {vi.analysis.claimGraph}
          </div>
          <div style={{ fontSize: 'var(--t-h2)', fontWeight: 800, color: 'var(--ink)' }}>
            {vi.analysis.claimNodes(graph.nodes.length)}
          </div>
        </div>
        <div className="card">
          <div className="label" style={{ color: 'var(--ink-faint)' }}>
            {vi.analysis.avgFragility}
          </div>
          <div style={{ fontSize: 'var(--t-h2)', fontWeight: 800, color: 'var(--jade)' }}>
            {fragilityPercent(avgFragility)}
          </div>
        </div>
        <div className="card">
          <div className="label" style={{ color: 'var(--ink-faint)' }}>
            {vi.analysis.coverage}
          </div>
          <div style={{ fontSize: 'var(--t-body)', fontWeight: 700, color: 'var(--ink)' }}>
            {vi.analysis.coverageValue(distinctNodes, distinctBlooms)}
          </div>
        </div>
      </div>

      {/* Competency mapping (GDPT 2018) */}
      {competencies.length > 0 && (
        <div className="card card--sky" style={{ marginBottom: 'var(--s-6)' }}>
          <div className="label" style={{ color: 'var(--sky-dark)', marginBottom: 'var(--s-1)' }}>
            {vi.analysis.competencies}
          </div>
          <p
            style={{
              fontSize: 'var(--t-small)',
              color: 'var(--ink-soft)',
              marginBottom: 'var(--s-3)',
            }}
          >
            {vi.analysis.competenciesHint}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
            {competencies.map((c) => (
              <span key={c} className="pill pill--sky">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Selected probes */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--s-3)',
          marginBottom: 'var(--s-2)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--t-h2)',
            fontWeight: 700,
            color: 'var(--ink)',
          }}
        >
          {vi.analysis.probesHeading}
        </h2>
      </div>
      <p
        style={{
          fontSize: 'var(--t-small)',
          color: 'var(--ink-faint)',
          marginBottom: 'var(--s-5)',
        }}
      >
        {vi.analysis.probesHint} · {vi.analysis.aiFragilityHint}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
        {selected.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
          >
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)', alignItems: 'center' }}
            >
              <span className="pill">{`${p.ordinal}`}</span>
              <span className="pill pill--jade">{vi.analysis.bloom[p.bloomLevel]}</span>
              <span className="pill">{vi.analysis.probeType[p.probeType]}</span>
              <span
                className={
                  (p.aiFragilityScore ?? 0) >= 0.5 ? 'pill pill--jade' : 'pill pill--amber'
                }
              >
                {vi.analysis.aiFragility}: {fragilityPercent(p.aiFragilityScore)}
              </span>
            </div>

            <p
              style={{
                fontSize: 'var(--t-body)',
                color: 'var(--ink)',
                fontWeight: 600,
                lineHeight: 'var(--lh-body)',
              }}
            >
              {p.textVi}
            </p>

            {nodeText.get(p.claimNodeId) !== undefined && (
              <div
                style={{
                  borderLeft: 'var(--border) solid var(--line-strong)',
                  paddingLeft: 'var(--s-3)',
                  fontSize: 'var(--t-small)',
                  color: 'var(--ink-soft)',
                  fontStyle: 'italic',
                }}
              >
                <span className="label" style={{ color: 'var(--ink-faint)', fontStyle: 'normal' }}>
                  {vi.analysis.quotedFrom}
                </span>
                <div style={{ marginTop: 'var(--s-1)' }}>“{nodeText.get(p.claimNodeId)}”</div>
              </div>
            )}

            {p.expectedSignals.length > 0 && (
              <div>
                <div
                  className="label"
                  style={{ color: 'var(--ink-faint)', marginBottom: 'var(--s-1)' }}
                >
                  {vi.analysis.expectedSignals}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
                  {p.expectedSignals.map((s) => (
                    <span key={s} className="pill">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function submissionStatusLabel(status: string): string {
  switch (status) {
    case 'ready':
      return vi.submission.statusReady
    case 'analysing':
      return vi.submission.statusAnalysing
    case 'failed':
      return vi.submission.statusFailed
    default:
      return vi.submission.statusPending
  }
}
