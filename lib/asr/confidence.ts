export type ASRConfidenceSegment = {
  readonly start: number
  readonly end: number
  readonly avgLogprob: number
  readonly noSpeechProb: number
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Whisper exposes log probability and non-speech probability rather than a
 * single confidence field. Convert each segment to a bounded probability and
 * weight it by spoken duration so short noisy fragments do not dominate.
 */
export function confidenceFromSegments(segments: readonly ASRConfidenceSegment[]): number {
  if (segments.length === 0) return 0.5

  let weightedConfidence = 0
  let totalWeight = 0
  for (const segment of segments) {
    const weight = Math.max(0.01, segment.end - segment.start)
    const speechProbability = 1 - clamp(segment.noSpeechProb)
    const tokenProbability = clamp(Math.exp(segment.avgLogprob))
    weightedConfidence += tokenProbability * speechProbability * weight
    totalWeight += weight
  }
  return clamp(weightedConfidence / totalWeight)
}
