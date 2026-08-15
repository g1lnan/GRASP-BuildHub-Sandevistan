import type { ClaimGraphModel } from '@/lib/ai/claimgraph'
import type { BloomLevel, ProbeType } from '@/lib/ai/probe-schemas'
import type { ProbeModel } from '@/lib/ai/probes'
import type { ClaimEdgeOutput, ClaimNodeOutput } from '@/lib/ai/schemas'
import { selectProbes } from '@/lib/domain/probe-selection'
import type { UsageRepository } from '@/lib/usage/record'
import { recordModelUsage } from '@/lib/usage/record'
import { InvalidProbeClaimError, ResourceNotFoundError } from './errors'

/**
 * Ingest -> Claim Graph -> Probes pipeline (DESIGN §5.1, FR-202/203/204). Models
 * are injected as interfaces so this orchestration is exercised in unit tests
 * with fakes; real model calls happen only in the worker and `evals/`.
 */

export type PersistedClaimNode = {
  readonly id: string
  readonly kind: ClaimNodeOutput['kind']
  readonly text: string
  readonly quoteSpan: { readonly start: number; readonly end: number }
  readonly concepts: readonly string[]
  readonly confidence: number
}

export type PersistedClaimEdge = ClaimEdgeOutput

export type NewClaimGraph = {
  readonly submissionId: string
  readonly model: string
  readonly promptVersion: string
  readonly nodes: readonly PersistedClaimNode[]
  readonly edges: readonly PersistedClaimEdge[]
  readonly concepts: readonly string[]
}

export type ClaimGraphRecord = {
  readonly id: string
  readonly submissionId: string
  readonly version: number
}

export type NewProbe = {
  readonly claimGraphId: string
  readonly claimNodeId: string
  readonly ordinal: number
  readonly probeType: ProbeType
  readonly bloomLevel: BloomLevel
  readonly textVi: string
  readonly expectedSignals: readonly string[]
  readonly aiFragilityScore: number
  readonly selected: boolean
}

export type AnalysisSubmission = {
  readonly id: string
  readonly studentId: string
  readonly status: string
  readonly extractedText: string
  readonly probeCount: number
}

export type AnalysisResult = {
  readonly claimGraph: ClaimGraphRecord
  readonly probeCount: number
  readonly selectedCount: number
}

export interface AnalysisSubmissionRepository {
  findForAnalysis(id: string): Promise<AnalysisSubmission | null>
  setStatus(
    id: string,
    status: 'analysing' | 'ready' | 'failed',
    error?: string | null,
  ): Promise<void>
}

export interface ClaimGraphRepository {
  createNextVersion(input: NewClaimGraph): Promise<ClaimGraphRecord>
}

export interface ProbeRepository {
  createMany(probes: readonly NewProbe[]): Promise<void>
}

/** Map the model's snake_case output onto our persisted camelCase shape. */
function toPersistedNode(node: ClaimNodeOutput): PersistedClaimNode {
  return {
    id: node.id,
    kind: node.kind,
    text: node.text,
    quoteSpan: { start: node.quote_span.start, end: node.quote_span.end },
    concepts: node.concepts,
    confidence: node.confidence,
  }
}

export async function analyzeSubmission(request: {
  readonly submissions: AnalysisSubmissionRepository
  readonly claimGraphs: ClaimGraphRepository
  readonly probes: ProbeRepository
  readonly usage: UsageRepository
  readonly claimGraphModel: ClaimGraphModel
  readonly probeModel: ProbeModel
  readonly submissionId: string
}): Promise<AnalysisResult> {
  const submission = await request.submissions.findForAnalysis(request.submissionId)
  if (submission === null) throw new ResourceNotFoundError()

  await request.submissions.setStatus(submission.id, 'analysing')
  try {
    // 1. Claim Graph (FR-202)
    const graph = await request.claimGraphModel.generate(submission.extractedText)
    await recordModelUsage({
      usage: request.usage,
      stage: 'claim_graph',
      model: graph.model,
      provider: graph.provider,
      tokens: graph.tokens,
      submissionId: submission.id,
    })
    const claimGraph = await request.claimGraphs.createNextVersion({
      submissionId: submission.id,
      model: graph.model,
      promptVersion: graph.promptVersion,
      nodes: graph.graph.nodes.map(toPersistedNode),
      edges: graph.graph.edges,
      concepts: graph.graph.concepts,
    })

    // 2. Candidate probes (FR-203)
    const gen = await request.probeModel.generateProbes({
      graph: graph.graph,
      submissionText: submission.extractedText,
    })
    await recordModelUsage({
      usage: request.usage,
      stage: 'probe_gen',
      model: gen.model,
      provider: gen.provider,
      tokens: gen.tokens,
      submissionId: submission.id,
    })
    const claimNodeIds = new Set(graph.graph.nodes.map((node) => node.id))
    if (gen.candidates.some((candidate) => !claimNodeIds.has(candidate.claim_node_id))) {
      throw new InvalidProbeClaimError()
    }

    // 3. AI-fragility scoring (blind answerability)
    const frag = await request.probeModel.scoreFragility(gen.candidates.map((c) => c.text_vi))
    await recordModelUsage({
      usage: request.usage,
      stage: 'fragility',
      model: frag.model,
      provider: frag.provider,
      tokens: frag.tokens,
      submissionId: submission.id,
    })

    // 4. Rank by fragility x coverage, select N (FR-204)
    const selection = selectProbes(
      gen.candidates.map((c, i) => ({
        claimNodeId: c.claim_node_id,
        bloomLevel: c.bloom_level,
        fragility: frag.fragility[i] ?? 0,
      })),
      submission.probeCount,
    )

    const probes: NewProbe[] = gen.candidates.map((c, i) => {
      const decision = selection.decisions[i]
      return {
        claimGraphId: claimGraph.id,
        claimNodeId: c.claim_node_id,
        ordinal: decision?.ordinal ?? 0,
        probeType: c.probe_type,
        bloomLevel: c.bloom_level,
        textVi: c.text_vi,
        expectedSignals: c.expected_signals,
        aiFragilityScore: decision?.fragility ?? 0,
        selected: decision?.selected ?? false,
      }
    })
    await request.probes.createMany(probes)

    // 5. Ready (FR-205)
    await request.submissions.setStatus(submission.id, 'ready')
    return {
      claimGraph,
      probeCount: probes.length,
      selectedCount: probes.filter((p) => p.selected).length,
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Analysis failed'
    await request.submissions.setStatus(submission.id, 'failed', message)
    throw error
  }
}
