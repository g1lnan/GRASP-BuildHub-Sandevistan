import 'server-only'

import type { TokenUsage } from '@/lib/usage/pricing'
import { toTokenUsage, toTokenUsageOpenAI } from '@/lib/usage/pricing'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { MODELS, anthropic } from './client'
import { GROQ_MODELS, groq } from './groq-client'
import { CLAIM_GRAPH_PROMPT_VERSION, CLAIM_GRAPH_SYSTEM } from './prompts/claimgraph'
import { type ClaimGraphOutput, ClaimGraphSchema, claimGraphJsonSchema } from './schemas'

export class ClaimGraphParseError extends Error {
  readonly name = 'ClaimGraphParseError'
}

export type ClaimGraphResult = {
  readonly graph: ClaimGraphOutput
  readonly provider: string
  readonly model: string
  readonly promptVersion: string
  readonly tokens: TokenUsage
}

/**
 * The model boundary for FR-202. Depending on this interface — rather than a
 * concrete SDK — keeps the pipeline unit-testable with a fake, confines real
 * model calls to `evals/` and production (DESIGN §11), and lets us swap the
 * provider (Groq for the prototype, Anthropic for calibration) in one line.
 */
export interface ClaimGraphModel {
  generate(text: string): Promise<ClaimGraphResult>
}

/**
 * Groq-backed Claim Graph model — the active prototype provider. Uses Groq's
 * strict Structured Outputs (`response_format: json_schema`, `strict: true`) so
 * the response conforms to the contract; we still validate with the zod schema
 * afterwards, since strict mode cannot express the value constraints (>= 3
 * nodes, confidence 0..1).
 */
export function groqClaimGraphModel(): ClaimGraphModel {
  return {
    async generate(text: string): Promise<ClaimGraphResult> {
      const response = await groq().chat.completions.create({
        model: GROQ_MODELS.claimGraph,
        reasoning_effort: 'high',
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'claim_graph', strict: true, schema: claimGraphJsonSchema },
        },
        messages: [
          { role: 'system', content: CLAIM_GRAPH_SYSTEM },
          { role: 'user', content: text },
        ],
      })

      const content = response.choices[0]?.message.content
      if (typeof content !== 'string' || content.length === 0) {
        throw new ClaimGraphParseError('Claim graph response was empty')
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new ClaimGraphParseError('Claim graph response was not valid JSON')
      }

      const result = ClaimGraphSchema.safeParse(parsed)
      if (!result.success) {
        throw new ClaimGraphParseError('Claim graph failed schema validation')
      }

      return {
        graph: result.data,
        provider: 'groq',
        model: GROQ_MODELS.claimGraph,
        promptVersion: CLAIM_GRAPH_PROMPT_VERSION,
        tokens: response.usage
          ? toTokenUsageOpenAI(response.usage)
          : { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
      }
    },
  }
}

/**
 * Anthropic-backed Claim Graph model — kept for the calibration/production path
 * (DESIGN §6.2). Call shape follows DESIGN §6.3 exactly: adaptive thinking,
 * `output_config` with a zod format, no sampling params, and a cache_control
 * breakpoint after the frozen system prompt (DESIGN §6.4).
 */
export function anthropicClaimGraphModel(): ClaimGraphModel {
  return {
    async generate(text: string): Promise<ClaimGraphResult> {
      const response = await anthropic().messages.parse({
        model: MODELS.claimGraph,
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'high',
          format: zodOutputFormat(ClaimGraphSchema),
        },
        system: [
          {
            type: 'text',
            text: CLAIM_GRAPH_SYSTEM, // stable -> cacheable prefix
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: text }], // volatile -> after the breakpoint
      })

      // parsed_output is null if parsing failed — never assume.
      if (response.parsed_output === null) {
        throw new ClaimGraphParseError('Claim graph parse failed')
      }

      return {
        graph: response.parsed_output,
        provider: 'anthropic',
        model: MODELS.claimGraph,
        promptVersion: CLAIM_GRAPH_PROMPT_VERSION,
        tokens: toTokenUsage(response.usage),
      }
    },
  }
}
