import {
  type ScoreDimensionKey,
  type ScoringOutput,
  scoreDimensionKeys,
} from '@/lib/ai/scoring-schemas'

export const defaultRubricWeights = {
  d1: 0.15,
  d2: 0.3,
  d3: 0.25,
  d4: 0.2,
  d5: 0.1,
} as const

export type RubricWeights = {
  readonly d1: number
  readonly d2: number
  readonly d3: number
  readonly d4: number
  readonly d5: number
}

export type ConfidenceLabel = 'high' | 'medium' | 'low'

export type ConfidenceInterval = {
  readonly low: number
  readonly high: number
  readonly label: ConfidenceLabel
  readonly evidenceQuality: number
}

export type ConfidenceTurn = {
  readonly probeId: string
  readonly inputMode: 'voice' | 'typed'
  readonly asrConfidence: number | null
}

const dimensionWeightKeys: Record<ScoreDimensionKey, keyof RubricWeights> = {
  d1Recall: 'd1',
  d2Explanation: 'd2',
  d3Application: 'd3',
  d4Evaluation: 'd4',
  d5Metacognition: 'd5',
}

function roundOne(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

export function normalizeRubricWeights(input: Record<string, number>): RubricWeights {
  const { d1, d2, d3, d4, d5 } = input
  const validWeight = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0
  if (
    !validWeight(d1) ||
    !validWeight(d2) ||
    !validWeight(d3) ||
    !validWeight(d4) ||
    !validWeight(d5)
  ) {
    return defaultRubricWeights
  }
  const total = d1 + d2 + d3 + d4 + d5
  if (total <= 0) return defaultRubricWeights
  return {
    d1: d1 / total,
    d2: d2 / total,
    d3: d3 / total,
    d4: d4 / total,
    d5: d5 / total,
  }
}

export function compositeScore(output: ScoringOutput, weights: RubricWeights): number {
  const value = scoreDimensionKeys.reduce(
    (sum, key) => sum + output[key].score * weights[dimensionWeightKeys[key]],
    0,
  )
  return roundOne(value)
}

/**
 * `reliability` measures transcription fidelity only — how much we trust that
 * the transcript matches what the student actually said/typed (1.0 for typed:
 * there is no transcription step; ASR confidence for voice). It does NOT model
 * whether typed and spoken responses are produced under comparable conditions —
 * typing allows pausing, revising, and rereading in a way real-time speech does
 * not, and that gap is a separate, currently unmeasured source of validity risk.
 * See DESIGN.md §11 "Known validity limitation" — this is tracked, not solved.
 */
export function confidenceInterval(input: {
  readonly composite: number
  readonly expectedProbeCount: number
  readonly turns: readonly ConfidenceTurn[]
}): ConfidenceInterval {
  const expected = Math.max(1, input.expectedProbeCount)
  const completeness = Math.min(1, input.turns.length / expected)
  const reliability =
    input.turns.length === 0
      ? 0
      : input.turns.reduce((sum, turn) => {
          if (turn.inputMode === 'typed') return sum + 1
          return sum + Math.min(1, Math.max(0, turn.asrConfidence ?? 0.5))
        }, 0) / input.turns.length
  const coverage = Math.min(
    1,
    new Set(input.turns.map((turn) => turn.probeId)).size / Math.min(expected, 3),
  )
  const evidenceQuality = Math.min(1, 0.65 * completeness + 0.25 * reliability + 0.1 * coverage)
  const margin = roundOne(1.3 - 0.9 * evidenceQuality)
  const label: ConfidenceLabel =
    evidenceQuality >= 0.9 ? 'high' : evidenceQuality >= 0.65 ? 'medium' : 'low'
  return {
    low: roundOne(Math.max(1, input.composite - margin)),
    high: roundOne(Math.min(5, input.composite + margin)),
    label,
    evidenceQuality,
  }
}

export function citationsMatchTranscripts(
  output: ScoringOutput,
  turns: readonly { readonly ordinal: number; readonly transcript: string }[],
): boolean {
  const transcriptByOrdinal = new Map(turns.map((turn) => [turn.ordinal, turn.transcript]))
  return scoreDimensionKeys.every((key) =>
    output[key].citations.every((citation) =>
      transcriptByOrdinal.get(citation.turnOrdinal)?.includes(citation.quote),
    ),
  )
}
