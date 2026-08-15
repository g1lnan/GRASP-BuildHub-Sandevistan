/**
 * AI-fragility gate metric — DESIGN §11 (`evals/fragility`). Pure and side-effect
 * free so the gate arithmetic is unit-testable without any model calls.
 *
 * A probe is "answerable" if a frontier model could answer it well WITHOUT the
 * source submission — i.e. its fragility (1 - answerable) is at or below
 * ANSWERABLE_FRAGILITY_MAX. The gate requires fewer than GATE_PCT of probes to
 * be answerable: the probes must actually be fragile, not just hard.
 */

export const ANSWERABLE_FRAGILITY_MAX = 0.5
export const GATE_PCT = 0.25

export type FragilityReport = {
  readonly total: number
  readonly answerable: number
  readonly answerablePct: number
  readonly meanFragility: number
  readonly pass: boolean
}

export function fragilityReport(
  fragility: readonly number[],
  options?: { readonly answerableFragilityMax?: number; readonly gatePct?: number },
): FragilityReport {
  const answerableMax = options?.answerableFragilityMax ?? ANSWERABLE_FRAGILITY_MAX
  const gatePct = options?.gatePct ?? GATE_PCT
  const total = fragility.length

  if (total === 0) {
    return { total: 0, answerable: 0, answerablePct: 0, meanFragility: 0, pass: true }
  }

  const answerable = fragility.filter((f) => f <= answerableMax).length
  const answerablePct = answerable / total
  const meanFragility = fragility.reduce((sum, f) => sum + f, 0) / total

  return {
    total,
    answerable,
    answerablePct,
    meanFragility,
    pass: answerablePct < gatePct,
  }
}
