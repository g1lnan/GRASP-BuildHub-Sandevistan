import { defaultRubricWeights } from './scoring'

/**
 * Gate G1 statistics (DESIGN §11). Pure functions over the calibration dataset:
 * the model's per-dimension understanding scores vs. blind lecturer scores.
 * No DB, no I/O — the eval harness in `evals/calibration/` feeds these.
 */

export const G1_PEARSON_GATE = 0.7

export const calibrationDimensions = ['d1', 'd2', 'd3', 'd4', 'd5'] as const
export type CalibrationDimension = (typeof calibrationDimensions)[number]
export type DimensionScores = Record<CalibrationDimension, number>

export type CalibrationSession = {
  readonly id: string
  /** Optional label used only for reporting (e.g. quadrant). */
  readonly quadrant?: string
  /** The model's per-dimension scores (1..5). */
  readonly model: DimensionScores
  /** One or more independent blind lecturer scorings (1..5 per dimension). */
  readonly lecturers: readonly DimensionScores[]
  /**
   * Fraction of this session's turns answered by voice vs typed (0..1, sums to 1).
   * Optional and not yet populated by the golden set — real pilot sessions carry
   * it so a future report can test whether score or error differs by modality
   * (DESIGN.md §11 "Known validity limitation"). Absence does not imply parity.
   */
  readonly modalityMix?: { readonly typed: number; readonly voice: number }
}

/** Pearson correlation. Returns NaN for < 2 points or zero variance. */
export function pearson(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return Number.NaN
  let sx = 0
  let sy = 0
  let sxx = 0
  let syy = 0
  let sxy = 0
  for (let i = 0; i < n; i += 1) {
    const x = xs[i] as number
    const y = ys[i] as number
    sx += x
    sy += y
    sxx += x * x
    syy += y * y
    sxy += x * y
  }
  const cov = n * sxy - sx * sy
  const varX = n * sxx - sx * sx
  const varY = n * syy - sy * sy
  const denom = Math.sqrt(varX * varY)
  return denom === 0 ? Number.NaN : cov / denom
}

/** Cohen's kappa between two raters over categorical labels of equal length. */
export function cohensKappa(
  a: readonly (string | number)[],
  b: readonly (string | number)[],
): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return Number.NaN
  const countA = new Map<string | number, number>()
  const countB = new Map<string | number, number>()
  let agree = 0
  for (let i = 0; i < n; i += 1) {
    if (a[i] === b[i]) agree += 1
    countA.set(a[i] as string | number, (countA.get(a[i] as string | number) ?? 0) + 1)
    countB.set(b[i] as string | number, (countB.get(b[i] as string | number) ?? 0) + 1)
  }
  const po = agree / n
  let pe = 0
  for (const category of new Set([...countA.keys(), ...countB.keys()])) {
    pe += ((countA.get(category) ?? 0) / n) * ((countB.get(category) ?? 0) / n)
  }
  if (pe === 1) return 1
  return (po - pe) / (1 - pe)
}

/** Weighted composite understanding score on the /5 scale (default rubric weights). */
export function composite(dims: DimensionScores): number {
  const w = defaultRubricWeights
  return dims.d1 * w.d1 + dims.d2 * w.d2 + dims.d3 * w.d3 + dims.d4 * w.d4 + dims.d5 * w.d5
}

function meanDimensions(scorings: readonly DimensionScores[]): DimensionScores {
  const sum: DimensionScores = { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0 }
  for (const s of scorings) {
    for (const key of calibrationDimensions) sum[key] += s[key]
  }
  const n = Math.max(1, scorings.length)
  return {
    d1: sum.d1 / n,
    d2: sum.d2 / n,
    d3: sum.d3 / n,
    d4: sum.d4 / n,
    d5: sum.d5 / n,
  }
}

export type DimensionError = {
  readonly dimension: CalibrationDimension | 'composite'
  /** Pearson r between model and mean-lecturer scores. */
  readonly r: number
  /** Mean absolute error, model vs mean lecturer. */
  readonly mae: number
  /** Mean signed error (model − lecturer): positive = model scores higher. */
  readonly bias: number
}

export type CalibrationReport = {
  readonly n: number
  readonly compositeR: number
  /** Cohen's κ between the first two lecturers (composite banded to integers). NaN if < 2 raters. */
  readonly interRaterKappa: number
  readonly perDimension: readonly DimensionError[]
  readonly pass: boolean
}

function mae(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n === 0) return Number.NaN
  let total = 0
  for (let i = 0; i < n; i += 1) total += Math.abs((xs[i] as number) - (ys[i] as number))
  return total / n
}

function bias(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n === 0) return Number.NaN
  let total = 0
  for (let i = 0; i < n; i += 1) total += (xs[i] as number) - (ys[i] as number)
  return total / n
}

/**
 * Computes the full G1 report. Gate passes when the composite Pearson r exceeds
 * {@link G1_PEARSON_GATE}. κ is reported alongside — if lecturers disagree with
 * each other, r against them is not meaningful (DESIGN §11).
 */
export function calibrationReport(
  sessions: readonly CalibrationSession[],
  gate: number = G1_PEARSON_GATE,
): CalibrationReport {
  const lecturerMeans = sessions.map((s) => meanDimensions(s.lecturers))

  const perDimension: DimensionError[] = calibrationDimensions.map((dim) => {
    const modelValues = sessions.map((s) => s.model[dim])
    const lecturerValues = lecturerMeans.map((m) => m[dim])
    return {
      dimension: dim,
      r: pearson(modelValues, lecturerValues),
      mae: mae(modelValues, lecturerValues),
      bias: bias(modelValues, lecturerValues),
    }
  })

  const modelComposites = sessions.map((s) => composite(s.model))
  const lecturerComposites = lecturerMeans.map((m) => composite(m))
  const compositeR = pearson(modelComposites, lecturerComposites)
  perDimension.push({
    dimension: 'composite',
    r: compositeR,
    mae: mae(modelComposites, lecturerComposites),
    bias: bias(modelComposites, lecturerComposites),
  })

  // Inter-rater κ on composite banded to the nearest integer (1..5).
  const band = (value: number) => Math.round(value)
  const raterA: number[] = []
  const raterB: number[] = []
  for (const s of sessions) {
    if (s.lecturers.length >= 2) {
      raterA.push(band(composite(s.lecturers[0] as DimensionScores)))
      raterB.push(band(composite(s.lecturers[1] as DimensionScores)))
    }
  }
  const interRaterKappa = raterA.length === 0 ? Number.NaN : cohensKappa(raterA, raterB)

  return {
    n: sessions.length,
    compositeR,
    interRaterKappa,
    perDimension,
    pass: Number.isFinite(compositeR) && compositeR > gate,
  }
}
