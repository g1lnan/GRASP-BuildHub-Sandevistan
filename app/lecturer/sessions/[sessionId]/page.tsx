import { scoreDimensionKeys } from '@/lib/ai/scoring-schemas'
import { requireRolePage } from '@/lib/auth/guards'
import { db } from '@/lib/db'
import { probes as probesTable, sessions as sessionsTable } from '@/lib/db/schema'
import { type Quadrant, quadrantOf } from '@/lib/domain/quadrant'
import { vi } from '@/lib/i18n/vi'
import { getEvidenceBundle } from '@/lib/repositories/drizzle-outcomes'
import { getIntegritySignals } from '@/lib/repositories/drizzle-sessions'
import { asc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { IntegrityPanel } from './IntegrityPanel'
import { OverrideControl } from './OverrideControl'
import { ProductScoreControl } from './ProductScoreControl'

export const metadata = { title: `${vi.evidence.title} — ${vi.metadata.title}` }

type Props = { params: Promise<{ sessionId: string }> }

const QUADRANT_PILL: Record<Quadrant, string> = {
  mastery: 'pill pill--jade',
  hollow: 'pill pill--amber',
  expression_gap: 'pill pill--sky',
  needs_support: 'pill pill--violet',
}

export default async function EvidenceBundlePage({ params }: Props) {
  const { sessionId } = await params
  const actor = await requireRolePage(['lecturer'])

  const bundle = await getEvidenceBundle(sessionId)
  if (bundle === null) notFound()
  if (
    bundle.auth.courseLecturerId !== actor.id ||
    bundle.auth.institutionId !== actor.institutionId
  ) {
    notFound()
  }

  const sessionRow = await db
    .select({ claimGraphId: sessionsTable.claimGraphId })
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId))
    .limit(1)
  const claimGraphId = sessionRow[0]?.claimGraphId

  const [integritySignals, probeRows] = await Promise.all([
    getIntegritySignals(sessionId),
    claimGraphId !== undefined
      ? db
          .select({
            textVi: probesTable.textVi,
            aiFragilityScore: probesTable.aiFragilityScore,
            aiFragilityWithEssayScore: probesTable.aiFragilityWithEssayScore,
            followUpEligible: probesTable.followUpEligible,
            followUpOfProbeId: probesTable.followUpOfProbeId,
          })
          .from(probesTable)
          .where(eq(probesTable.claimGraphId, claimGraphId))
          .orderBy(asc(probesTable.ordinal))
      : Promise.resolve([]),
  ])

  const { score, override, submission } = bundle
  const understanding = score === null ? null : score.composite
  const derivedQuadrant = quadrantOf(submission.productScore, understanding)

  return (
    <div
      style={{ maxWidth: 'var(--w-content)', margin: '0 auto', padding: 'var(--s-10) var(--s-8)' }}
    >
      <Link
        href={`/lecturer/assignments/${bundle.assignment.id}/matrix`}
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
        ← {vi.evidence.backToMatrix}
      </Link>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--s-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--s-6)',
        }}
      >
        <div>
          <div style={{ fontSize: 'var(--t-small)', color: 'var(--ink-faint)' }}>
            {bundle.assignment.title}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--t-h1)',
              fontWeight: 800,
              color: 'var(--ink)',
            }}
          >
            {bundle.student.name}
          </h1>
          <div
            style={{
              display: 'flex',
              gap: 'var(--s-2)',
              flexWrap: 'wrap',
              marginTop: 'var(--s-2)',
            }}
          >
            {derivedQuadrant !== null && (
              <span className={QUADRANT_PILL[derivedQuadrant]}>
                {vi.evidence.quadrantLabel}: {vi.quadrant[derivedQuadrant]}
              </span>
            )}
            {override !== null && (
              <span className="pill pill--gold">{vi.evidence.overriddenTag}</span>
            )}
            {bundle.appeals.length > 0 && (
              <span className="pill pill--amber">{vi.evidence.appealTag}</span>
            )}
          </div>
        </div>
        <a href={`/api/sessions/${sessionId}/evidence`} className="btn3d btn3d--neutral" download>
          {vi.evidence.exportJson}
        </a>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 380px)',
          gap: 'var(--s-6)',
          alignItems: 'start',
        }}
      >
        {/* Left — transcript + submission */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
          {bundle.appeals.length > 0 && (
            <div
              className="card card--amber"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
            >
              <div className="label">{vi.evidence.appealsHeading}</div>
              {bundle.appeals.map((appeal) => (
                <div
                  key={appeal.id}
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-1)' }}
                >
                  <span
                    className={appeal.status === 'open' ? 'pill pill--amber' : 'pill pill--jade'}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    {appeal.status === 'open' ? vi.evidence.appealOpen : vi.evidence.appealResolved}
                  </span>
                  <p
                    style={{
                      fontSize: 'var(--t-body)',
                      color: 'var(--ink)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {appeal.reason}
                  </p>
                  <span style={{ fontSize: 'var(--t-micro)', color: 'var(--ink-faint)' }}>
                    {new Date(appeal.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div>
            <h2
              style={{
                fontSize: 'var(--t-h2)',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: 'var(--s-3)',
              }}
            >
              {vi.evidence.transcriptHeading}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
              {bundle.turns.map((turn) => (
                <div
                  key={turn.ordinal}
                  className="card"
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--s-2)',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="pill">{vi.evidence.turnLabel(turn.ordinal)}</span>
                    <span className={turn.inputMode === 'voice' ? 'pill pill--sky' : 'pill'}>
                      {turn.inputMode === 'voice' ? vi.evidence.voiceTag : vi.evidence.typedTag}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--t-small)', fontWeight: 600, color: 'var(--ink)' }}>
                    {turn.questionVi}
                  </div>
                  <p
                    style={{
                      fontSize: 'var(--t-body)',
                      color: 'var(--ink-soft)',
                      lineHeight: 'var(--lh-body)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {turn.transcript}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <IntegrityPanel
            integritySignals={integritySignals}
            probes={probeRows.map((p) => ({
              textVi: p.textVi,
              aiFragilityScore: p.aiFragilityScore !== null ? Number(p.aiFragilityScore) : null,
              aiFragilityWithEssayScore:
                p.aiFragilityWithEssayScore !== null ? Number(p.aiFragilityWithEssayScore) : null,
              followUpEligible: p.followUpEligible,
              isFollowUp: p.followUpOfProbeId !== null,
            }))}
          />

          <details>
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 700,
                color: 'var(--ink-soft)',
                fontSize: 'var(--t-small)',
              }}
            >
              {vi.evidence.submissionText}
            </summary>
            <p
              style={{
                marginTop: 'var(--s-3)',
                fontSize: 'var(--t-small)',
                color: 'var(--ink-soft)',
                lineHeight: 'var(--lh-body)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {submission.text}
            </p>
          </details>
        </div>

        {/* Right — product score, scores, override */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
          <ProductScoreControl submissionId={submission.id} initial={submission.productScore} />

          {score === null ? (
            <div className="card">
              <span className="pill pill--amber">{vi.evidence.notReady}</span>
            </div>
          ) : (
            <>
              <div className="card">
                <div className="label">{vi.scoring.composite}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--s-2)' }}>
                  <span
                    data-numeric
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--t-hero)',
                      fontWeight: 800,
                      color: 'var(--ink)',
                    }}
                  >
                    {score.composite.toFixed(1)}
                  </span>
                  <span style={{ color: 'var(--ink-faint)' }}>/ 5</span>
                </div>
                <div
                  style={{
                    fontSize: 'var(--t-small)',
                    color: 'var(--ink-soft)',
                    marginTop: 'var(--s-1)',
                  }}
                >
                  {vi.scoring.confidenceRange(score.confidenceLow, score.confidenceHigh)} ·{' '}
                  {vi.scoring.confidenceLabel[score.confidenceLabel]}
                </div>
              </div>

              <div>
                <h2
                  style={{
                    fontSize: 'var(--t-h3)',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    marginBottom: 'var(--s-3)',
                  }}
                >
                  {vi.evidence.scoresHeading}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
                  {scoreDimensionKeys.map((key) => {
                    const dim = score.dimensions[key]
                    return (
                      <div
                        key={key}
                        className="card card--soft"
                        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            gap: 'var(--s-2)',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 'var(--t-small)',
                              fontWeight: 700,
                              color: 'var(--ink)',
                            }}
                          >
                            {vi.scoring.dimensions[key]}
                          </span>
                          <span
                            data-numeric
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontWeight: 800,
                              color: 'var(--ink)',
                            }}
                          >
                            {dim.score.toFixed(1)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 'var(--t-micro)',
                            color: 'var(--ink-soft)',
                            lineHeight: 'var(--lh-small)',
                          }}
                        >
                          {dim.rationaleVi}
                        </p>
                      </div>
                    )
                  })}
                </div>
                <div
                  style={{
                    fontSize: 'var(--t-micro)',
                    color: 'var(--ink-faint)',
                    marginTop: 'var(--s-2)',
                  }}
                >
                  {vi.evidence.modelLabel}: {score.model}
                </div>
              </div>

              <OverrideControl
                sessionId={sessionId}
                baseline={{
                  d1Recall: score.dimensions.d1Recall.score,
                  d2Explanation: score.dimensions.d2Explanation.score,
                  d3Application: score.dimensions.d3Application.score,
                  d4Evaluation: score.dimensions.d4Evaluation.score,
                  d5Metacognition: score.dimensions.d5Metacognition.score,
                }}
                initialOverridden={override?.overridden ?? null}
                initialNote={override?.note ?? null}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
