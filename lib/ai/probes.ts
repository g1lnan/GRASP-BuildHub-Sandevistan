import 'server-only'

import type { TokenUsage } from '@/lib/usage/pricing'
import { toTokenUsage, toTokenUsageOpenAI } from '@/lib/usage/pricing'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { MODELS, anthropic } from './client'
import { GROQ_MODELS, groq } from './groq-client'
import {
  FragilityReportSchema,
  type ProbeCandidateOutput,
  ProbeSetSchema,
  fragilityReportJsonSchema,
  probeSetJsonSchema,
} from './probe-schemas'
import {
  FRAGILITY_PROMPT_VERSION,
  FRAGILITY_SYSTEM,
  FRAGILITY_WITH_ESSAY_PROMPT_VERSION,
  FRAGILITY_WITH_ESSAY_SYSTEM,
  PROBE_GEN_PROMPT_VERSION,
  PROBE_GEN_SYSTEM,
} from './prompts/probes'
import type { ClaimGraphOutput } from './schemas'

export class ProbeGenerationError extends Error {
  readonly name = 'ProbeGenerationError'
}

export type ProbeGenResult = {
  readonly candidates: readonly ProbeCandidateOutput[]
  readonly provider: string
  readonly model: string
  readonly promptVersion: string
  readonly tokens: TokenUsage
}

export type FragilityResult = {
  /** fragility per probe, aligned by input order (0..1; 1 = most fragile). */
  readonly fragility: readonly number[]
  readonly provider: string
  readonly model: string
  readonly promptVersion: string
  readonly tokens: TokenUsage
}

/**
 * Model boundary for FR-203/204. Injected as an interface so the pipeline is
 * unit-testable with a fake and real Groq calls stay in the worker and `evals/`.
 */
export interface ProbeModel {
  generateProbes(input: {
    graph: ClaimGraphOutput
    submissionText: string
  }): Promise<ProbeGenResult>
  /** Blind-answerability scoring: fragility = 1 - answerable. Input is probe text ONLY. */
  scoreFragility(probeTexts: readonly string[]): Promise<FragilityResult>
  /** With-essay answerability scoring: can the probe be answered with essay access? */
  scoreFragilityWithEssay(
    probeTexts: readonly string[],
    essayText: string,
  ): Promise<FragilityResult>
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/** Compact, model-facing view of the graph — enough to ground probes without the raw span noise. */
function renderGraph(graph: ClaimGraphOutput): string {
  const nodes = graph.nodes
    .map((n) => `${n.id} [${n.kind}] "${n.text}" (concepts: ${n.concepts.join(', ')})`)
    .join('\n')
  const edges = graph.edges.map((e) => `${e.from} --${e.relation}--> ${e.to}`).join('\n')
  return `CLAIM NODES:\n${nodes}\n\nEDGES:\n${edges || '(none)'}`
}

export function groqProbeModel(): ProbeModel {
  return {
    async generateProbes(input): Promise<ProbeGenResult> {
      const response = await groq().chat.completions.create({
        model: GROQ_MODELS.probeGen,
        reasoning_effort: 'high',
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'probe_set', strict: true, schema: probeSetJsonSchema },
        },
        messages: [
          { role: 'system', content: PROBE_GEN_SYSTEM },
          {
            role: 'user',
            content: `${renderGraph(input.graph)}\n\nFULL SUBMISSION:\n${input.submissionText}`,
          },
        ],
      })

      const content = response.choices[0]?.message.content
      if (typeof content !== 'string' || content.length === 0) {
        throw new ProbeGenerationError('Probe generation response was empty')
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new ProbeGenerationError('Probe generation response was not valid JSON')
      }
      const result = ProbeSetSchema.safeParse(parsed)
      if (!result.success) throw new ProbeGenerationError('Probe set failed schema validation')

      return {
        candidates: result.data.probes,
        provider: 'groq',
        model: GROQ_MODELS.probeGen,
        promptVersion: PROBE_GEN_PROMPT_VERSION,
        tokens: response.usage
          ? toTokenUsageOpenAI(response.usage)
          : { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
      }
    },

    async scoreFragility(probeTexts): Promise<FragilityResult> {
      const fragility = new Array<number>(probeTexts.length).fill(0)
      if (probeTexts.length === 0) {
        return {
          fragility,
          provider: 'groq',
          model: GROQ_MODELS.fragilityAdversary,
          promptVersion: FRAGILITY_PROMPT_VERSION,
          tokens: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
        }
      }

      const numbered = probeTexts.map((t, i) => `${i}. ${t}`).join('\n')
      const response = await groq().chat.completions.create({
        model: GROQ_MODELS.fragilityAdversary,
        reasoning_effort: 'high',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'fragility_report',
            strict: true,
            schema: fragilityReportJsonSchema,
          },
        },
        messages: [
          { role: 'system', content: FRAGILITY_SYSTEM },
          { role: 'user', content: `Questions:\n${numbered}` },
        ],
      })

      const content = response.choices[0]?.message.content
      if (typeof content !== 'string' || content.length === 0) {
        throw new ProbeGenerationError('Fragility response was empty')
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new ProbeGenerationError('Fragility response was not valid JSON')
      }
      const report = FragilityReportSchema.safeParse(parsed)
      if (!report.success)
        throw new ProbeGenerationError('Fragility report failed schema validation')

      // fragility = 1 - answerable, placed by the model's reported index.
      for (const a of report.data.assessments) {
        if (a.index >= 0 && a.index < fragility.length) {
          fragility[a.index] = clamp01(1 - clamp01(a.answerable))
        }
      }

      return {
        fragility,
        provider: 'groq',
        model: GROQ_MODELS.fragilityAdversary,
        promptVersion: FRAGILITY_PROMPT_VERSION,
        tokens: response.usage
          ? toTokenUsageOpenAI(response.usage)
          : { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
      }
    },

    async scoreFragilityWithEssay(probeTexts, essayText): Promise<FragilityResult> {
      const fragility = new Array<number>(probeTexts.length).fill(0)
      if (probeTexts.length === 0) {
        return {
          fragility,
          provider: 'groq',
          model: GROQ_MODELS.fragilityAdversary,
          promptVersion: FRAGILITY_WITH_ESSAY_PROMPT_VERSION,
          tokens: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
        }
      }

      const numbered = probeTexts.map((t, i) => `${i}. ${t}`).join('\n')
      const response = await groq().chat.completions.create({
        model: GROQ_MODELS.fragilityAdversary,
        reasoning_effort: 'high',
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'essay_fragility_report',
            strict: true,
            schema: fragilityReportJsonSchema,
          },
        },
        messages: [
          { role: 'system', content: FRAGILITY_WITH_ESSAY_SYSTEM },
          { role: 'user', content: `FULL SUBMISSION:\n${essayText}\n\nQuestions:\n${numbered}` },
        ],
      })

      const content = response.choices[0]?.message.content
      if (typeof content !== 'string' || content.length === 0) {
        throw new ProbeGenerationError('Fragility with essay response was empty')
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new ProbeGenerationError('Fragility with essay response was not valid JSON')
      }
      const report = FragilityReportSchema.safeParse(parsed)
      if (!report.success)
        throw new ProbeGenerationError('Fragility with essay report failed schema validation')

      for (const a of report.data.assessments) {
        if (a.index >= 0 && a.index < fragility.length) {
          fragility[a.index] = clamp01(1 - clamp01(a.answerable))
        }
      }

      return {
        fragility,
        provider: 'groq',
        model: GROQ_MODELS.fragilityAdversary,
        promptVersion: FRAGILITY_WITH_ESSAY_PROMPT_VERSION,
        tokens: response.usage
          ? toTokenUsageOpenAI(response.usage)
          : { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
      }
    },
  }
}

/**
 * Anthropic-backed Probe model — production provider (DESIGN §6.2). Uses
 * `messages.parse` with `zodOutputFormat` for zod/v4 schemas, adaptive
 * thinking, and cache_control on the frozen system prompt.
 */
export function anthropicProbeModel(): ProbeModel {
  return {
    async generateProbes(input): Promise<ProbeGenResult> {
      const response = await anthropic().messages.parse({
        model: MODELS.probeGen,
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'high',
          format: zodOutputFormat(ProbeSetSchema),
        },
        system: [
          {
            type: 'text',
            text: PROBE_GEN_SYSTEM,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: `${renderGraph(input.graph)}\n\nFULL SUBMISSION:\n${input.submissionText}`,
          },
        ],
      })

      if (response.parsed_output === null) {
        throw new ProbeGenerationError('Probe generation parse failed')
      }

      return {
        candidates: response.parsed_output.probes,
        provider: 'anthropic',
        model: MODELS.probeGen,
        promptVersion: PROBE_GEN_PROMPT_VERSION,
        tokens: toTokenUsage(response.usage),
      }
    },

    async scoreFragility(probeTexts): Promise<FragilityResult> {
      const fragility = new Array<number>(probeTexts.length).fill(0)
      if (probeTexts.length === 0) {
        return {
          fragility,
          provider: 'anthropic',
          model: MODELS.fragilityAdversary,
          promptVersion: FRAGILITY_PROMPT_VERSION,
          tokens: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
        }
      }

      const numbered = probeTexts.map((t, i) => `${i}. ${t}`).join('\n')
      const response = await anthropic().messages.parse({
        model: MODELS.fragilityAdversary,
        max_tokens: 4000,
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'high',
          format: zodOutputFormat(FragilityReportSchema),
        },
        system: [
          {
            type: 'text',
            text: FRAGILITY_SYSTEM,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: `Questions:\n${numbered}` }],
      })

      if (response.parsed_output === null) {
        throw new ProbeGenerationError('Fragility parse failed')
      }

      for (const a of response.parsed_output.assessments) {
        if (a.index >= 0 && a.index < fragility.length) {
          fragility[a.index] = clamp01(1 - clamp01(a.answerable))
        }
      }

      return {
        fragility,
        provider: 'anthropic',
        model: MODELS.fragilityAdversary,
        promptVersion: FRAGILITY_PROMPT_VERSION,
        tokens: toTokenUsage(response.usage),
      }
    },

    async scoreFragilityWithEssay(probeTexts, essayText): Promise<FragilityResult> {
      const fragility = new Array<number>(probeTexts.length).fill(0)
      if (probeTexts.length === 0) {
        return {
          fragility,
          provider: 'anthropic',
          model: MODELS.fragilityAdversary,
          promptVersion: FRAGILITY_WITH_ESSAY_PROMPT_VERSION,
          tokens: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
        }
      }

      const numbered = probeTexts.map((t, i) => `${i}. ${t}`).join('\n')
      const response = await anthropic().messages.parse({
        model: MODELS.fragilityAdversary,
        max_tokens: 4000,
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'high',
          format: zodOutputFormat(FragilityReportSchema),
        },
        system: [
          {
            type: 'text',
            text: FRAGILITY_WITH_ESSAY_SYSTEM,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          { role: 'user', content: `FULL SUBMISSION:\n${essayText}\n\nQuestions:\n${numbered}` },
        ],
      })

      if (response.parsed_output === null) {
        throw new ProbeGenerationError('Fragility with essay parse failed')
      }

      for (const a of response.parsed_output.assessments) {
        if (a.index >= 0 && a.index < fragility.length) {
          fragility[a.index] = clamp01(1 - clamp01(a.answerable))
        }
      }

      return {
        fragility,
        provider: 'anthropic',
        model: MODELS.fragilityAdversary,
        promptVersion: FRAGILITY_WITH_ESSAY_PROMPT_VERSION,
        tokens: toTokenUsage(response.usage),
      }
    },
  }
}
