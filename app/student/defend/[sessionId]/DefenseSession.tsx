'use client'

import { vi } from '@/lib/i18n/vi'
import type { FinalizationView } from '@/lib/scoring/schemas'
import { finalizationViewSchema } from '@/lib/scoring/schemas'
import type { SessionView } from '@/lib/session/runtime'
import { sessionViewSchema, voiceTurnResponseSchema } from '@/lib/session/schemas'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AppealForm } from './AppealForm'
import { VoiceAnswer } from './VoiceAnswer'
import { useIntegritySignals } from './useIntegritySignals'

function secondsUntil(deadlineAt: string): number {
  return Math.max(0, Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 1000))
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function responseError(body: unknown): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'string'
  ) {
    return body.error
  }
  return vi.errors.serverError
}

const dimensionKeys = [
  'd1Recall',
  'd2Explanation',
  'd3Application',
  'd4Evaluation',
  'd5Metacognition',
] as const

function CompletionCard({
  sessionId,
  status,
  score,
  scoring,
  scoreError,
  onRetry,
}: {
  sessionId: string
  status: SessionView['status']
  score: FinalizationView | null
  scoring: boolean
  scoreError: string | null
  onRetry: () => void
}) {
  const copy = useMemo(() => {
    if (status === 'expired') {
      return { title: vi.defense.expiredTitle, body: vi.defense.expiredBody, variant: 'amber' }
    }
    if (status === 'abandoned') {
      return { title: vi.defense.abandonedTitle, body: vi.defense.abandonedBody, variant: 'soft' }
    }
    return { title: vi.defense.completedTitle, body: vi.defense.completedBody, variant: 'jade' }
  }, [status])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      <div className={`card card--${copy.variant}`} style={{ textAlign: 'center' }}>
        <div aria-hidden="true" style={{ fontSize: '2.5rem', marginBottom: 'var(--s-3)' }}>
          🐃
        </div>
        <h1 style={{ marginBottom: 'var(--s-3)' }}>{copy.title}</h1>
        <p style={{ color: 'var(--ink-soft)' }}>{copy.body}</p>
      </div>

      {scoring && (
        <output className="card" style={{ textAlign: 'center' }}>
          {vi.scoring.calculating}
        </output>
      )}

      {scoreError !== null && !scoring && (
        <div className="card card--amber" role="alert">
          <p style={{ marginBottom: 'var(--s-3)' }}>{scoreError}</p>
          <button type="button" className="btn3d" onClick={onRetry}>
            {vi.scoring.retry}
          </button>
        </div>
      )}

      {score !== null && (
        <>
          <section className="card" aria-labelledby="understanding-score">
            <div style={{ textAlign: 'center', marginBottom: 'var(--s-6)' }}>
              <div className="label" id="understanding-score">
                {vi.scoring.heading}
              </div>
              <div
                data-numeric
                style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}
              >
                {score.composite.toFixed(1)} / 5.0
              </div>
              <div style={{ color: 'var(--ink-soft)', marginTop: 'var(--s-2)' }}>
                {vi.scoring.confidenceRange(score.confidence.low, score.confidence.high)} ·{' '}
                {vi.scoring.confidenceLabel[score.confidence.label]}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 'var(--s-4)' }}>
              {dimensionKeys.map((key) => {
                const dimension = score.dimensions[key]
                return (
                  <article key={key} className="card card--soft">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 'var(--s-4)',
                        alignItems: 'baseline',
                      }}
                    >
                      <h2 style={{ fontSize: 'var(--t-h3)' }}>{vi.scoring.dimensions[key]}</h2>
                      <strong data-numeric>{dimension.score.toFixed(1)} / 5.0</strong>
                    </div>
                    <p style={{ color: 'var(--ink-soft)', marginTop: 'var(--s-2)' }}>
                      {dimension.rationaleVi}
                    </p>
                    <div className="label" style={{ marginTop: 'var(--s-3)' }}>
                      {vi.scoring.evidence}
                    </div>
                    {dimension.citations.map((citation) => (
                      <blockquote
                        className="quote"
                        key={`${citation.turnOrdinal}-${citation.quote}`}
                        style={{ margin: 'var(--s-2) 0 0' }}
                      >
                        “{citation.quote}”
                      </blockquote>
                    ))}
                  </article>
                )
              })}
            </div>

            {score.confidence.recommendationVi !== null && (
              <div className="card card--amber" style={{ marginTop: 'var(--s-5)' }}>
                {score.confidence.recommendationVi}
              </div>
            )}
          </section>

          <section className="card card--jade" aria-labelledby="learning-report">
            <div className="label" id="learning-report">
              {vi.learningReport.heading}
            </div>
            <p style={{ color: 'var(--ink-soft)', marginTop: 'var(--s-2)' }}>
              {vi.learningReport.introduction}
            </p>
            <p style={{ marginTop: 'var(--s-4)' }}>{score.feedback.bodyVi}</p>

            {(
              [
                ['strengths', vi.learningReport.strengths],
                ['gaps', vi.learningReport.revisit],
              ] as const
            ).map(([key, heading]) => (
              <div key={key} style={{ marginTop: 'var(--s-5)' }}>
                <h2 style={{ fontSize: 'var(--t-h3)', marginBottom: 'var(--s-3)' }}>{heading}</h2>
                <div style={{ display: 'grid', gap: 'var(--s-3)' }}>
                  {score.feedback[key].map((item) => (
                    <article className="card card--soft" key={`${key}-${item.concept}`}>
                      <h3 style={{ fontSize: 'var(--t-body)' }}>{item.concept}</h3>
                      <p style={{ color: 'var(--ink-soft)', marginTop: 'var(--s-2)' }}>
                        {item.explanationVi}
                      </p>
                      <div className="label" style={{ marginTop: 'var(--s-3)' }}>
                        {vi.learningReport.evidence}
                      </div>
                      {item.citations.map((citation) => (
                        <blockquote
                          className="quote"
                          key={`${citation.turnOrdinal}-${citation.quote}`}
                          style={{ margin: 'var(--s-2) 0 0' }}
                        >
                          <small style={{ display: 'block', color: 'var(--ink-soft)' }}>
                            {citation.turnOrdinal === 0
                              ? vi.learningReport.submissionEvidence
                              : vi.learningReport.turnEvidence(citation.turnOrdinal)}
                          </small>
                          “{citation.quote}”
                        </blockquote>
                      ))}
                    </article>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginTop: 'var(--s-5)' }}>
              <h2 style={{ fontSize: 'var(--t-h3)', marginBottom: 'var(--s-2)' }}>
                {vi.learningReport.reviseConcepts}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
                {score.feedback.reviseConcepts.map((concept) => (
                  <span className="pill pill--sky" key={concept}>
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <AppealForm sessionId={sessionId} />
        </>
      )}
    </div>
  )
}

export function DefenseSession({ initial }: { initial: SessionView }) {
  const router = useRouter()
  const [session, setSession] = useState(initial)
  const [answer, setAnswer] = useState('')
  const [inputMode, setInputMode] = useState<'typed' | 'voice'>('typed')
  const [lastVoiceTurn, setLastVoiceTurn] = useState<{
    transcript: string
    confidence: number
  } | null>(null)
  const [remaining, setRemaining] = useState(() => secondsUntil(initial.deadlineAt))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState<FinalizationView | null>(null)
  const [scoring, setScoring] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)
  const [finalizeAttempted, setFinalizeAttempted] = useState(false)
  const signals = useIntegritySignals(session.id)

  useEffect(() => {
    setSession(initial)
    setRemaining(secondsUntil(initial.deadlineAt))
  }, [initial])

  useEffect(() => {
    if (!session.done && session.currentProbe !== null) {
      signals.startTurn(session.questionNumber)
    }
  }, [session.questionNumber, session.done, session.currentProbe, signals])

  useEffect(() => {
    if (session.done) return
    const timer = window.setInterval(() => {
      const next = secondsUntil(session.deadlineAt)
      setRemaining(next)
      if (next === 0) {
        setSession((current) => ({
          ...current,
          status: 'expired',
          done: true,
          currentProbe: null,
        }))
        router.refresh()
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [router, session.deadlineAt, session.done])

  useEffect(() => {
    if (!session.done || session.status === 'abandoned' || finalizeAttempted || score !== null) {
      return
    }
    setFinalizeAttempted(true)
    void finalizeScore()
  }, [finalizeAttempted, score, session.done, session.status])

  async function finalizeScore() {
    setScoring(true)
    setScoreError(null)
    try {
      const response = await fetch(`/api/sessions/${session.id}/finalize`, { method: 'POST' })
      const body: unknown = await response.json()
      if (!response.ok) {
        setScoreError(responseError(body))
        return
      }
      setScore(finalizationViewSchema.parse(body))
    } catch {
      setScoreError(vi.errors.serverError)
    } finally {
      setScoring(false)
    }
  }

  async function submitAnswer() {
    const probe = session.currentProbe
    if (probe === null || answer.trim().length === 0) return

    setPending(true)
    setError(null)
    try {
      const response = await fetch(`/api/sessions/${session.id}/turns`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ probeId: probe.id, text: answer }),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        setError(responseError(body))
        return
      }
      setSession(sessionViewSchema.parse(body))
      signals.endTurn()
      void signals.flush()
      setAnswer('')
    } catch {
      setError(vi.errors.serverError)
    } finally {
      setPending(false)
    }
  }

  async function submitRecording(audio: Blob, durationMs: number): Promise<boolean> {
    const probe = session.currentProbe
    if (probe === null) return false

    setPending(true)
    setError(null)
    try {
      const form = new FormData()
      form.set('probeId', probe.id)
      form.set('durationMs', durationMs.toString())
      form.set('audio', new File([audio], 'answer.webm', { type: audio.type || 'audio/webm' }))
      const response = await fetch(`/api/sessions/${session.id}/turns`, {
        method: 'POST',
        body: form,
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        setError(responseError(body))
        return false
      }
      const accepted = voiceTurnResponseSchema.parse(body)
      setSession(accepted.session)
      setLastVoiceTurn({
        transcript: accepted.acceptedTurn.transcript,
        confidence: accepted.acceptedTurn.asrConfidence,
      })
      signals.endTurn()
      void signals.flush()
      return accepted.acceptedTurn.persisted
    } catch {
      setError(vi.errors.serverError)
      return false
    } finally {
      setPending(false)
    }
  }

  if (session.done) {
    return (
      <CompletionCard
        sessionId={session.id}
        status={session.status}
        score={score}
        scoring={scoring}
        scoreError={scoreError}
        onRetry={finalizeScore}
      />
    )
  }
  const probe = session.currentProbe
  if (probe === null) {
    return (
      <CompletionCard
        sessionId={session.id}
        status="completed"
        score={score}
        scoring={scoring}
        scoreError={scoreError}
        onRetry={finalizeScore}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--s-4)',
        }}
      >
        <span className="pill pill--sky">{vi.defense.questionNumber(session.questionNumber)}</span>
        <span className={remaining <= 60 ? 'pill pill--amber' : 'pill'}>
          {vi.defense.timeRemaining}:{' '}
          <time dateTime={`PT${remaining}S`} data-numeric>
            {formatTime(remaining)}
          </time>
        </span>
      </div>

      <section className="card" aria-labelledby="defense-question">
        <div className="label" style={{ marginBottom: 'var(--s-2)' }}>
          {vi.defense.yourClaim}
        </div>
        <blockquote className="quote" style={{ margin: '0 0 var(--s-5)' }}>
          {probe.claimText}
        </blockquote>
        <h1
          id="defense-question"
          style={{ fontSize: 'var(--t-probe)', lineHeight: 'var(--lh-probe)' }}
        >
          {probe.textVi}
        </h1>
      </section>

      {lastVoiceTurn !== null && (
        <div className="card card--jade">
          <div className="label" style={{ marginBottom: 'var(--s-2)' }}>
            {vi.defense.transcriptHeading}
          </div>
          <p style={{ marginBottom: 'var(--s-2)' }}>{lastVoiceTurn.transcript}</p>
          <span style={{ color: 'var(--ink-soft)', fontSize: 'var(--t-small)' }}>
            {vi.defense.asrConfidence(Math.round(lastVoiceTurn.confidence * 100))}
          </span>
        </div>
      )}

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="label" style={{ marginBottom: 'var(--s-2)' }}>
          {vi.defense.answerMode}
        </legend>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s-3)' }}>
          <button
            type="button"
            className="btn3d"
            aria-pressed={inputMode === 'voice'}
            onClick={() => {
              setInputMode('voice')
              setError(null)
            }}
          >
            {vi.defense.voiceMode}
          </button>
          <button
            type="button"
            className="btn3d"
            aria-pressed={inputMode === 'typed'}
            onClick={() => {
              setInputMode('typed')
              setError(null)
            }}
          >
            {vi.defense.typedMode}
          </button>
        </div>
      </fieldset>

      {inputMode === 'typed' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            <label htmlFor="answer" style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>
              {vi.defense.answerLabel}
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              onPaste={(e) =>
                signals.recordPaste(session.questionNumber, e.clipboardData.getData('text').length)
              }
              onKeyDown={() => signals.recordKeystroke()}
              rows={8}
              maxLength={20_000}
              placeholder={vi.defense.answerPlaceholder}
              style={{
                padding: 'var(--s-4)',
                borderRadius: 'var(--r-card)',
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

          <button
            type="button"
            className="btn3d btn3d--wide"
            disabled={pending || answer.trim().length === 0 || remaining === 0}
            onClick={submitAnswer}
          >
            {pending ? vi.defense.submittingAnswer : vi.defense.submitAnswer}
          </button>
        </>
      ) : (
        <VoiceAnswer
          key={session.questionNumber}
          pending={pending}
          sessionExpired={remaining === 0}
          onSubmit={submitRecording}
          onError={setError}
        />
      )}

      {error !== null && (
        <div
          role="alert"
          className="card card--amber"
          style={{ color: 'var(--amber-dark)', fontSize: 'var(--t-small)' }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
