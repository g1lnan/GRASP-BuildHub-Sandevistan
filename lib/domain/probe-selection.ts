/**
 * Probe ranking and selection — FR-204. Pure and side-effect free so the
 * coverage guarantees are unit-testable. Selects the top N candidates by
 * fragility while guaranteeing the chosen set spans >= 3 distinct claim nodes
 * and >= 3 distinct Bloom levels (when the candidate pool allows it).
 */

import type { BloomLevel } from '@/lib/ai/probe-schemas'

export const BLOOM_ORDER: readonly BloomLevel[] = [
  'understand',
  'apply',
  'analyse',
  'evaluate',
  'reflect',
]

export const MIN_DISTINCT_NODES = 3
export const MIN_DISTINCT_BLOOMS = 3

export type Rankable = {
  readonly claimNodeId: string
  readonly bloomLevel: BloomLevel
  readonly fragility: number
}

export type ProbeDecision = {
  readonly index: number // position in the input array
  readonly selected: boolean
  readonly ordinal: number // 1..N presentation order for selected; 0 otherwise
  readonly fragility: number
}

export type SelectionResult = {
  readonly decisions: readonly ProbeDecision[]
  readonly distinctNodes: number
  readonly distinctBlooms: number
  readonly averageFragility: number
}

function bloomRank(level: BloomLevel): number {
  const i = BLOOM_ORDER.indexOf(level)
  return i === -1 ? BLOOM_ORDER.length : i
}

export function selectProbes(candidates: readonly Rankable[], count: number): SelectionResult {
  const indexed = candidates.map((c, index) => ({ ...c, index }))
  const target = Math.max(0, Math.min(count, indexed.length))

  const byFragility = [...indexed].sort((a, b) => b.fragility - a.fragility || a.index - b.index)

  const needNodes = Math.min(MIN_DISTINCT_NODES, new Set(candidates.map((c) => c.claimNodeId)).size)
  const needBlooms = Math.min(
    MIN_DISTINCT_BLOOMS,
    new Set(candidates.map((c) => c.bloomLevel)).size,
  )

  const chosen = new Set<number>()
  const nodes = new Set<string>()
  const blooms = new Set<BloomLevel>()

  const take = (c: (typeof indexed)[number]) => {
    chosen.add(c.index)
    nodes.add(c.claimNodeId)
    blooms.add(c.bloomLevel)
  }

  const coverageGain = (c: (typeof indexed)[number]): number => {
    let gain = 0
    if (nodes.size < needNodes && !nodes.has(c.claimNodeId)) gain += 1
    if (blooms.size < needBlooms && !blooms.has(c.bloomLevel)) gain += 1
    return gain
  }

  // Phase A — coverage first: repeatedly take the highest-fragility candidate
  // that adds the most new node/bloom coverage, until both minima are met.
  while (chosen.size < target && (nodes.size < needNodes || blooms.size < needBlooms)) {
    let best: (typeof indexed)[number] | null = null
    let bestGain = 0
    for (const c of byFragility) {
      if (chosen.has(c.index)) continue
      const gain = coverageGain(c)
      if (gain > bestGain) {
        bestGain = gain
        best = c
      }
    }
    if (best === null) break // no remaining candidate improves coverage
    take(best)
  }

  // Phase B — fill remaining slots by fragility.
  for (const c of byFragility) {
    if (chosen.size >= target) break
    if (!chosen.has(c.index)) take(c)
  }

  // Presentation order: escalate by Bloom level, then by fragility.
  const selectedOrdered = indexed
    .filter((c) => chosen.has(c.index))
    .sort((a, b) => bloomRank(a.bloomLevel) - bloomRank(b.bloomLevel) || b.fragility - a.fragility)

  const ordinalByIndex = new Map<number, number>()
  selectedOrdered.forEach((c, i) => ordinalByIndex.set(c.index, i + 1))

  const decisions: ProbeDecision[] = indexed.map((c) => ({
    index: c.index,
    selected: chosen.has(c.index),
    ordinal: ordinalByIndex.get(c.index) ?? 0,
    fragility: c.fragility,
  }))

  const selectedFragility = selectedOrdered.map((c) => c.fragility)
  const averageFragility =
    selectedFragility.length === 0
      ? 0
      : selectedFragility.reduce((sum, f) => sum + f, 0) / selectedFragility.length

  return {
    decisions,
    distinctNodes: nodes.size,
    distinctBlooms: blooms.size,
    averageFragility,
  }
}
