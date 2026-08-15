import 'server-only'

import type { BloomLevel, ProbeType } from '@/lib/ai/probe-schemas'
import { db } from '@/lib/db'
import { probes } from '@/lib/db/schema'
import type { NewProbe, ProbeRepository } from '@/lib/services/analysis-service'
import { asc, eq } from 'drizzle-orm'

export type ProbeRow = {
  readonly id: string
  readonly claimNodeId: string
  readonly ordinal: number
  readonly probeType: ProbeType
  readonly bloomLevel: BloomLevel
  readonly textVi: string
  readonly expectedSignals: readonly string[]
  readonly aiFragilityScore: number | null
  readonly aiFragilityWithEssayScore: number | null
  readonly selected: boolean
  readonly followUpEligible: boolean
}

export const drizzleProbeRepository: ProbeRepository = {
  async createMany(rows: readonly NewProbe[]): Promise<void> {
    if (rows.length === 0) return
    await db.insert(probes).values(
      rows.map((p) => ({
        claimGraphId: p.claimGraphId,
        claimNodeId: p.claimNodeId,
        ordinal: p.ordinal,
        probeType: p.probeType,
        bloomLevel: p.bloomLevel,
        textVi: p.textVi,
        expectedSignals: p.expectedSignals,
        aiFragilityScore: p.aiFragilityScore.toString(),
        aiFragilityWithEssayScore: p.aiFragilityWithEssayScore.toString(),
        selected: p.selected,
        followUpEligible: p.followUpEligible,
      })),
    )
  },
}

/** Read-only view query for the lecturer analysis page. */
export async function listProbesByClaimGraph(claimGraphId: string): Promise<readonly ProbeRow[]> {
  const rows = await db
    .select({
      id: probes.id,
      claimNodeId: probes.claimNodeId,
      ordinal: probes.ordinal,
      probeType: probes.probeType,
      bloomLevel: probes.bloomLevel,
      textVi: probes.textVi,
      expectedSignals: probes.expectedSignals,
      aiFragilityScore: probes.aiFragilityScore,
      aiFragilityWithEssayScore: probes.aiFragilityWithEssayScore,
      selected: probes.selected,
      followUpEligible: probes.followUpEligible,
    })
    .from(probes)
    .where(eq(probes.claimGraphId, claimGraphId))
    .orderBy(asc(probes.ordinal))
  return rows.map((r) => ({
    id: r.id,
    claimNodeId: r.claimNodeId,
    ordinal: r.ordinal,
    probeType: r.probeType as ProbeType,
    bloomLevel: r.bloomLevel as BloomLevel,
    textVi: r.textVi,
    expectedSignals: r.expectedSignals,
    aiFragilityScore: r.aiFragilityScore === null ? null : Number(r.aiFragilityScore),
    aiFragilityWithEssayScore:
      r.aiFragilityWithEssayScore === null ? null : Number(r.aiFragilityWithEssayScore),
    selected: r.selected,
    followUpEligible: r.followUpEligible ?? false,
  }))
}
