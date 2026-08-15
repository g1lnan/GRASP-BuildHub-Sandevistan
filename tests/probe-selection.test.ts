import type { BloomLevel } from '@/lib/ai/probe-schemas'
import { type Rankable, selectProbes } from '@/lib/domain/probe-selection'
import { describe, expect, it } from 'vitest'

function probe(claimNodeId: string, bloomLevel: BloomLevel, fragility: number): Rankable {
  return { claimNodeId, bloomLevel, fragility }
}

function selected(candidates: Rankable[], count: number) {
  const { decisions } = selectProbes(candidates, count)
  return decisions.filter((d) => d.selected)
}

describe('selectProbes (FR-204)', () => {
  it('takes the highest-fragility candidates when coverage is already satisfied', () => {
    const candidates = [
      probe('c1', 'understand', 0.9),
      probe('c2', 'apply', 0.8),
      probe('c3', 'analyse', 0.7),
      probe('c1', 'evaluate', 0.2),
      probe('c2', 'reflect', 0.1),
    ]
    const chosen = selected(candidates, 3)
    expect(chosen).toHaveLength(3)
    expect(chosen.map((d) => d.fragility).sort((a, b) => b - a)).toEqual([0.9, 0.8, 0.7])
  })

  it('sacrifices raw fragility to guarantee >= 3 nodes and >= 3 Bloom levels', () => {
    // The five highest-fragility probes are all node c1 / bloom understand.
    const candidates = [
      probe('c1', 'understand', 0.99),
      probe('c1', 'understand', 0.98),
      probe('c1', 'understand', 0.97),
      probe('c1', 'understand', 0.96),
      probe('c1', 'understand', 0.95),
      probe('c2', 'apply', 0.4),
      probe('c3', 'analyse', 0.3),
    ]
    const chosen = selected(candidates, 5)
    expect(chosen).toHaveLength(5)
    expect(
      new Set(chosen.map((d) => candidates[d.index]?.claimNodeId)).size,
    ).toBeGreaterThanOrEqual(3)
    expect(new Set(chosen.map((d) => candidates[d.index]?.bloomLevel)).size).toBeGreaterThanOrEqual(
      3,
    )
  })

  it('selects all candidates when fewer than the requested count', () => {
    const candidates = [probe('c1', 'understand', 0.5), probe('c2', 'apply', 0.4)]
    const chosen = selected(candidates, 5)
    expect(chosen).toHaveLength(2)
  })

  it('assigns 1..N presentation ordinals that escalate by Bloom level', () => {
    const candidates = [
      probe('c1', 'reflect', 0.9),
      probe('c2', 'understand', 0.8),
      probe('c3', 'analyse', 0.7),
    ]
    const { decisions } = selectProbes(candidates, 3)
    const ordered = decisions
      .filter((d) => d.selected)
      .sort((a, b) => a.ordinal - b.ordinal)
      .map((d) => candidates[d.index]?.bloomLevel)
    expect(ordered).toEqual(['understand', 'analyse', 'reflect'])
    expect(
      decisions
        .filter((d) => d.selected)
        .map((d) => d.ordinal)
        .sort(),
    ).toEqual([1, 2, 3])
  })

  it('does not loop forever when the pool cannot meet the minima', () => {
    const candidates = [probe('c1', 'understand', 0.9), probe('c1', 'understand', 0.8)]
    const result = selectProbes(candidates, 5)
    expect(result.decisions.filter((d) => d.selected)).toHaveLength(2)
    expect(result.distinctNodes).toBe(1)
  })

  it('reports average fragility of the selected set', () => {
    const candidates = [probe('c1', 'understand', 1.0), probe('c2', 'apply', 0.5)]
    const result = selectProbes(candidates, 2)
    expect(result.averageFragility).toBeCloseTo(0.75, 6)
  })
})
