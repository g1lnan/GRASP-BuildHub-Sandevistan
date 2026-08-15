import type { IntegritySignals } from './integrity-signals'

export type TimingSignalType = 'uniform_timing' | 'paste_pattern' | 'superhuman_speed'

export type TimingSignal = {
  readonly type: TimingSignalType
  readonly turnOrdinals: readonly number[]
  readonly detail: string
}

export type SuspicionLevel = 'none' | 'low' | 'medium' | 'high'

export type TimingAnalysisResult = {
  readonly signals: readonly TimingSignal[]
  readonly overallSuspicionLevel: SuspicionLevel
}

export type TimingTurnInput = {
  readonly ordinal: number
  readonly inputMode: 'typed' | 'voice'
  readonly transcript: string
  readonly latencyMs: number | null
  readonly durationMs: number
}

/**
 * Maximum keystrokes per second for a human typist using Vietnamese IME.
 * Telex requires ~2.5 keystrokes per visible character. At ~6 visible chars/sec
 * (world-class), that is ~15 keystrokes/sec.
 */
const MAX_KEYSTROKES_PER_SECOND = 15

/**
 * Fallback: maximum visible characters per second when keystroke data is
 * unavailable. Very conservative to avoid Vietnamese IME false positives.
 */
const MAX_CHARS_PER_SECOND_FALLBACK = 50

/** Minimum tab-away duration (ms) to be considered suspicious. */
const TAB_AWAY_THRESHOLD_MS = 8_000

/** Maximum composition time (ms) after tab return to flag paste pattern. */
const POST_TAB_COMPOSITION_THRESHOLD_MS = 5_000

/** Minimum typed turns required for uniform timing analysis. */
const MIN_TURNS_FOR_UNIFORM = 4

/** Maximum coefficient of variation for uniform timing flag. */
const MAX_CV_FOR_UNIFORM = 0.12

function coefficientOfVariation(values: readonly number[]): number {
  if (values.length < 2) return 1
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  if (mean === 0) return 0
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance) / mean
}

export function analyzeResponseTiming(
  turns: readonly TimingTurnInput[],
  clientSignals?: IntegritySignals,
): TimingAnalysisResult {
  const signals: TimingSignal[] = []
  const typedTurns = turns.filter((t) => t.inputMode === 'typed')

  // 1. Superhuman composition speed
  for (const turn of typedTurns) {
    const cadence = clientSignals?.typingCadence?.find((c) => c.turnOrdinal === turn.ordinal)
    if (cadence !== undefined && cadence.compositionTimeMs > 0) {
      const kps = cadence.keystrokeCount / (cadence.compositionTimeMs / 1000)
      if (kps > MAX_KEYSTROKES_PER_SECOND) {
        signals.push({
          type: 'superhuman_speed',
          turnOrdinals: [turn.ordinal],
          detail: `${Math.round(kps)} keystrokes/sec (max ${MAX_KEYSTROKES_PER_SECOND})`,
        })
      }
    } else if (turn.durationMs > 0 && turn.transcript.length > 0) {
      const cps = turn.transcript.length / (turn.durationMs / 1000)
      if (cps > MAX_CHARS_PER_SECOND_FALLBACK) {
        signals.push({
          type: 'superhuman_speed',
          turnOrdinals: [turn.ordinal],
          detail: `${Math.round(cps)} chars/sec (max ${MAX_CHARS_PER_SECOND_FALLBACK})`,
        })
      }
    }
  }

  // 2. Paste pattern: long tab-away followed by fast composition
  if (clientSignals?.tabSwitches !== undefined && clientSignals.typingCadence !== undefined) {
    for (const cadence of clientSignals.typingCadence) {
      const matchingSwitch = clientSignals.tabSwitches.find(
        (s) =>
          s.hiddenDurationMs > TAB_AWAY_THRESHOLD_MS &&
          cadence.compositionTimeMs > 0 &&
          cadence.compositionTimeMs < POST_TAB_COMPOSITION_THRESHOLD_MS,
      )
      if (matchingSwitch !== undefined) {
        signals.push({
          type: 'paste_pattern',
          turnOrdinals: [cadence.turnOrdinal],
          detail: `Tab away ${Math.round(matchingSwitch.hiddenDurationMs / 1000)}s, composed in ${Math.round(cadence.compositionTimeMs / 1000)}s`,
        })
      }
    }
  }

  // 3. Uniform timing across typed turns
  if (typedTurns.length >= MIN_TURNS_FOR_UNIFORM) {
    const durations = typedTurns.map((t) => t.durationMs).filter((d) => d > 0)
    if (durations.length >= MIN_TURNS_FOR_UNIFORM) {
      const cv = coefficientOfVariation(durations)
      if (cv < MAX_CV_FOR_UNIFORM) {
        signals.push({
          type: 'uniform_timing',
          turnOrdinals: typedTurns.map((t) => t.ordinal),
          detail: `CV=${cv.toFixed(3)} across ${durations.length} turns (threshold <${MAX_CV_FOR_UNIFORM})`,
        })
      }
    }
  }

  const overallSuspicionLevel: SuspicionLevel =
    signals.length === 0
      ? 'none'
      : signals.length === 1
        ? 'low'
        : signals.length === 2
          ? 'medium'
          : 'high'

  return { signals, overallSuspicionLevel }
}
