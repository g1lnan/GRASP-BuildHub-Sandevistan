import { GATE_PCT, fragilityReport } from '@/lib/domain/fragility'
import { describe, expect, it } from 'vitest'

describe('fragilityReport (gate G-metric)', () => {
  it('passes when fewer than 25% of probes are answerable', () => {
    // 1 of 8 answerable = 12.5% < 25%.
    const report = fragilityReport([0.9, 0.8, 0.85, 0.7, 0.95, 0.6, 0.75, 0.3])
    expect(report.total).toBe(8)
    expect(report.answerable).toBe(1)
    expect(report.answerablePct).toBeCloseTo(0.125, 6)
    expect(report.pass).toBe(true)
  })

  it('fails when 25% or more of probes are answerable', () => {
    // 2 of 4 answerable = 50%.
    const report = fragilityReport([0.9, 0.8, 0.4, 0.2])
    expect(report.answerable).toBe(2)
    expect(report.pass).toBe(false)
  })

  it('treats a probe at the fragility boundary as answerable', () => {
    const report = fragilityReport([0.5, 0.9, 0.9, 0.9])
    expect(report.answerable).toBe(1)
  })

  it('reports mean fragility', () => {
    const report = fragilityReport([0.6, 0.8])
    expect(report.meanFragility).toBeCloseTo(0.7, 6)
  })

  it('passes vacuously on an empty set', () => {
    expect(fragilityReport([]).pass).toBe(true)
  })

  it('exposes the 25% gate constant', () => {
    expect(GATE_PCT).toBe(0.25)
  })
})
