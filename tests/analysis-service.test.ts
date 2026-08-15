import type { ClaimGraphModel, ClaimGraphResult } from '@/lib/ai/claimgraph'
import type { FragilityResult, ProbeGenResult, ProbeModel } from '@/lib/ai/probes'
import {
  type AnalysisSubmission,
  type AnalysisSubmissionRepository,
  type ClaimGraphRecord,
  type ClaimGraphRepository,
  type NewClaimGraph,
  type NewProbe,
  type ProbeRepository,
  analyzeSubmission,
} from '@/lib/services/analysis-service'
import type { UsageEventRow, UsageRepository } from '@/lib/usage/record'
import { describe, expect, it } from 'vitest'

const submissionId = '60000000-0000-4000-8000-000000000001'

class SubmissionRepositoryFake implements AnalysisSubmissionRepository {
  statuses: Array<{ status: string; error?: string | null }> = []
  constructor(private readonly submission: AnalysisSubmission | null) {}
  async findForAnalysis(): Promise<AnalysisSubmission | null> {
    return this.submission
  }
  async setStatus(_id: string, status: 'analysing' | 'ready' | 'failed', error?: string | null) {
    this.statuses.push({ status, error: error ?? null })
  }
}

class ClaimGraphRepositoryFake implements ClaimGraphRepository {
  saved: NewClaimGraph | null = null
  async createNextVersion(input: NewClaimGraph): Promise<ClaimGraphRecord> {
    this.saved = input
    return { id: 'cg-1', submissionId: input.submissionId, version: 1 }
  }
}

class ProbeRepositoryFake implements ProbeRepository {
  saved: readonly NewProbe[] | null = null
  async createMany(rows: readonly NewProbe[]): Promise<void> {
    this.saved = rows
  }
}

class UsageRepositoryFake implements UsageRepository {
  rows: UsageEventRow[] = []
  async record(row: UsageEventRow): Promise<void> {
    this.rows.push(row)
  }
}

const submission: AnalysisSubmission = {
  id: submissionId,
  studentId: 'student-a',
  status: 'pending',
  extractedText: 'Luận điểm của tôi về chính sách công.',
  probeCount: 5,
}

const graphResult: ClaimGraphResult = {
  provider: 'groq',
  model: 'openai/gpt-oss-120b',
  promptVersion: 'cg-v1',
  tokens: { inputTokens: 6000, outputTokens: 2500, cacheReadTokens: 0, cacheCreationTokens: 0 },
  graph: {
    nodes: [
      {
        id: 'c1',
        kind: 'thesis',
        text: 'Luận điểm của tôi',
        quote_span: { start: 0, end: 17 },
        concepts: ['chính sách'],
        confidence: 0.9,
      },
      {
        id: 'c2',
        kind: 'claim',
        text: 'về chính sách công',
        quote_span: { start: 18, end: 36 },
        concepts: ['chính sách công'],
        confidence: 0.8,
      },
      {
        id: 'c3',
        kind: 'evidence',
        text: 'chính sách công',
        quote_span: { start: 21, end: 36 },
        concepts: ['bằng chứng'],
        confidence: 0.6,
      },
    ],
    edges: [{ from: 'c3', to: 'c2', relation: 'supports' }],
    concepts: ['chính sách', 'chính sách công'],
  },
}

const okClaimGraphModel: ClaimGraphModel = {
  async generate(): Promise<ClaimGraphResult> {
    return graphResult
  },
}

const genResult: ProbeGenResult = {
  provider: 'groq',
  model: 'openai/gpt-oss-120b',
  promptVersion: 'pg-v1',
  tokens: { inputTokens: 2500, outputTokens: 1800, cacheReadTokens: 0, cacheCreationTokens: 0 },
  candidates: [
    {
      claim_node_id: 'c1',
      probe_type: 'counterfactual',
      bloom_level: 'understand',
      text_vi: 'P1',
      expected_signals: ['s1'],
    },
    {
      claim_node_id: 'c2',
      probe_type: 'self_critique',
      bloom_level: 'analyse',
      text_vi: 'P2',
      expected_signals: ['s2'],
    },
    {
      claim_node_id: 'c3',
      probe_type: 'trace_own_step',
      bloom_level: 'evaluate',
      text_vi: 'P3',
      expected_signals: ['s3'],
    },
    {
      claim_node_id: 'c1',
      probe_type: 'metacognitive',
      bloom_level: 'reflect',
      text_vi: 'P4',
      expected_signals: ['s4'],
    },
    {
      claim_node_id: 'c2',
      probe_type: 'road_not_taken',
      bloom_level: 'apply',
      text_vi: 'P5',
      expected_signals: ['s5'],
    },
    {
      claim_node_id: 'c3',
      probe_type: 'novel_transfer',
      bloom_level: 'analyse',
      text_vi: 'P6',
      expected_signals: ['s6'],
    },
  ],
}

const fragilityResult: FragilityResult = {
  provider: 'groq',
  model: 'openai/gpt-oss-120b',
  promptVersion: 'fr-v1',
  tokens: { inputTokens: 800, outputTokens: 300, cacheReadTokens: 0, cacheCreationTokens: 0 },
  fragility: [0.9, 0.8, 0.7, 0.6, 0.5, 0.4],
}

const okProbeModel: ProbeModel = {
  async generateProbes(): Promise<ProbeGenResult> {
    return genResult
  },
  async scoreFragility(): Promise<FragilityResult> {
    return fragilityResult
  },
  async scoreFragilityWithEssay(probeTexts: readonly string[]): Promise<FragilityResult> {
    return {
      fragility: probeTexts.map(() => 0.5),
      provider: 'groq',
      model: 'openai/gpt-oss-120b',
      promptVersion: 'fre-v1',
      tokens: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
    }
  },
}

describe('analyzeSubmission', () => {
  it('runs graph -> probes -> fragility -> selection and marks the submission ready', async () => {
    const submissions = new SubmissionRepositoryFake(submission)
    const claimGraphs = new ClaimGraphRepositoryFake()
    const probes = new ProbeRepositoryFake()
    const usage = new UsageRepositoryFake()

    const result = await analyzeSubmission({
      submissions,
      claimGraphs,
      probes,
      usage,
      claimGraphModel: okClaimGraphModel,
      probeModel: okProbeModel,
      submissionId,
    })

    expect(submissions.statuses.map((s) => s.status)).toEqual(['analysing', 'ready'])
    // FR-505: one usage_event per model call — graph, probe_gen, fragility, fragility_with_essay.
    expect(usage.rows.map((r) => r.stage)).toEqual(['claim_graph', 'probe_gen', 'fragility', 'fragility_with_essay'])
    // All candidates persisted; exactly probeCount selected.
    expect(probes.saved).toHaveLength(6)
    expect(result.selectedCount).toBe(5)
    const selected = probes.saved?.filter((p) => p.selected) ?? []
    expect(selected).toHaveLength(5)
    // FR-204 coverage: selected span >= 3 distinct nodes and >= 3 Bloom levels.
    expect(new Set(selected.map((p) => p.claimNodeId)).size).toBeGreaterThanOrEqual(3)
    expect(new Set(selected.map((p) => p.bloomLevel)).size).toBeGreaterThanOrEqual(3)
    // Fragility is carried onto the persisted probe.
    expect(probes.saved?.[0]?.aiFragilityScore).toBe(0.9)
  })

  it('marks the submission failed and rethrows when a model errors', async () => {
    const submissions = new SubmissionRepositoryFake(submission)
    const claimGraphs = new ClaimGraphRepositoryFake()
    const probes = new ProbeRepositoryFake()
    const usage = new UsageRepositoryFake()
    const failingModel: ClaimGraphModel = {
      async generate(): Promise<ClaimGraphResult> {
        throw new Error('parse failed')
      },
    }

    const operation = analyzeSubmission({
      submissions,
      claimGraphs,
      probes,
      usage,
      claimGraphModel: failingModel,
      probeModel: okProbeModel,
      submissionId,
    })

    await expect(operation).rejects.toThrow('parse failed')
    expect(submissions.statuses.map((s) => s.status)).toEqual(['analysing', 'failed'])
    expect(usage.rows).toHaveLength(0)
    expect(probes.saved).toBeNull()
  })

  it('fails analysis before persisting probes that reference a missing claim node', async () => {
    const submissions = new SubmissionRepositoryFake(submission)
    const probes = new ProbeRepositoryFake()
    const invalidProbeModel: ProbeModel = {
      async generateProbes(): Promise<ProbeGenResult> {
        return {
          ...genResult,
          candidates: [
            {
              claim_node_id: 'missing-claim',
              probe_type: 'counterfactual',
              bloom_level: 'understand',
              text_vi: 'P1',
              expected_signals: ['s1'],
            },
          ],
        }
      },
      async scoreFragility(): Promise<FragilityResult> {
        return fragilityResult
      },
      async scoreFragilityWithEssay(probeTexts: readonly string[]): Promise<FragilityResult> {
        return {
          fragility: probeTexts.map(() => 0.5),
          provider: 'groq',
          model: 'openai/gpt-oss-120b',
          promptVersion: 'fre-v1',
          tokens: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
        }
      },
    }

    const operation = analyzeSubmission({
      submissions,
      claimGraphs: new ClaimGraphRepositoryFake(),
      probes,
      usage: new UsageRepositoryFake(),
      claimGraphModel: okClaimGraphModel,
      probeModel: invalidProbeModel,
      submissionId,
    })

    await expect(operation).rejects.toMatchObject({ name: 'InvalidProbeClaimError' })
    expect(submissions.statuses.map((status) => status.status)).toEqual(['analysing', 'failed'])
    expect(probes.saved).toBeNull()
  })

  it('fails analysis when a claim node quotes text absent from the submission', async () => {
    const submissions = new SubmissionRepositoryFake(submission)
    const claimGraphs = new ClaimGraphRepositoryFake()
    const probes = new ProbeRepositoryFake()
    const usage = new UsageRepositoryFake()
    const fabricatedTextModel: ClaimGraphModel = {
      async generate(): Promise<ClaimGraphResult> {
        return {
          ...graphResult,
          graph: {
            ...graphResult.graph,
            nodes: [
              {
                ...graphResult.graph.nodes[0],
                text: 'câu này không có trong bài nộp',
              } as (typeof graphResult.graph.nodes)[number],
              ...graphResult.graph.nodes.slice(1),
            ],
          },
        }
      },
    }

    const operation = analyzeSubmission({
      submissions,
      claimGraphs,
      probes,
      usage,
      claimGraphModel: fabricatedTextModel,
      probeModel: okProbeModel,
      submissionId,
    })

    await expect(operation).rejects.toMatchObject({ name: 'InvalidClaimSpanError' })
    expect(submissions.statuses.map((s) => s.status)).toEqual(['analysing', 'failed'])
    // Usage for the claim-graph call is still recorded — the call happened and cost money.
    expect(usage.rows.map((r) => r.stage)).toEqual(['claim_graph'])
    expect(claimGraphs.saved).toBeNull()
    expect(probes.saved).toBeNull()
  })
  it('throws not found for a missing submission', async () => {
    const operation = analyzeSubmission({
      submissions: new SubmissionRepositoryFake(null),
      claimGraphs: new ClaimGraphRepositoryFake(),
      probes: new ProbeRepositoryFake(),
      usage: new UsageRepositoryFake(),
      claimGraphModel: okClaimGraphModel,
      probeModel: okProbeModel,
      submissionId,
    })
    await expect(operation).rejects.toMatchObject({ name: 'ResourceNotFoundError' })
  })
})
