import {
  type CalibrationSession,
  calibrationReport,
  cohensKappa,
  composite,
  pearson,
} from '@/lib/domain/calibration'
import { describe, expect, it } from 'vitest'
import { goldenCalibration } from '../evals/calibration/golden'

describe('pearson', () => {
  it('is 1 for a perfect positive linear relationship', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10)
  })

  it('is -1 for a perfect negative linear relationship', () => {
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 10)
  })

  it('returns NaN for fewer than two points or zero variance', () => {
    expect(pearson([1], [1])).toBeNaN()
    expect(pearson([2, 2, 2], [1, 3, 5])).toBeNaN()
  })
})

describe('cohensKappa', () => {
  it('is 1 for perfect agreement', () => {
    expect(cohensKappa([1, 2, 3, 3], [1, 2, 3, 3])).toBeCloseTo(1, 10)
  })

  it('is 0 (or below) when agreement is only what chance predicts', () => {
    // Two raters, each split 50/50, agreeing exactly at the chance rate.
    expect(cohensKappa([1, 1, 2, 2], [1, 2, 1, 2])).toBeCloseTo(0, 10)
  })
})

describe('composite', () => {
  it('applies the default rubric weights (sum to 1)', () => {
    expect(composite({ d1: 3, d2: 3, d3: 3, d4: 3, d5: 3 })).toBeCloseTo(3, 10)
  })
})

describe('calibrationReport (G1)', () => {
  it('passes the gate on the healthy golden set', () => {
    const report = calibrationReport(goldenCalibration)
    expect(report.n).toBe(20)
    expect(report.compositeR).toBeGreaterThan(0.7)
    expect(report.pass).toBe(true)
    expect(Number.isFinite(report.interRaterKappa)).toBe(true)
  })

  it('fails the gate when the model is uncorrelated with lecturers', () => {
    const sessions: CalibrationSession[] = [
      {
        id: 'a',
        model: { d1: 5, d2: 5, d3: 5, d4: 5, d5: 5 },
        lecturers: [{ d1: 1, d2: 1, d3: 1, d4: 1, d5: 1 }],
      },
      {
        id: 'b',
        model: { d1: 1, d2: 1, d3: 1, d4: 1, d5: 1 },
        lecturers: [{ d1: 5, d2: 5, d3: 5, d4: 5, d5: 5 }],
      },
      {
        id: 'c',
        model: { d1: 3, d2: 3, d3: 3, d4: 3, d5: 3 },
        lecturers: [{ d1: 3, d2: 3, d3: 3, d4: 3, d5: 3 }],
      },
    ]
    expect(calibrationReport(sessions).pass).toBe(false)
  })
})
