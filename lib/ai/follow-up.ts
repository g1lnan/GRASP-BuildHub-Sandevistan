import 'server-only'

import type { TokenUsage } from '@/lib/usage/pricing'
import { toTokenUsage, toTokenUsageOpenAI } from '@/lib/usage/pricing'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type Groq from 'groq-sdk'
import { MODELS, anthropic } from './client'
import { FollowUpProbeSchema, followUpProbeJsonSchema } from './follow-up-schemas'
import { GROQ_MODELS, groq } from './groq-client'
import { FOLLOW_UP_PROMPT_VERSION, FOLLOW_UP_SYSTEM } from './prompts/follow-up'

export class FollowUpGenerationError extends Error {
  readonly name = 'FollowUpGenerationError'
}

export type FollowUpResult = {
  readonly textVi: string
  readonly rationale: string
  readonly provider: string
  readonly model: string
  readonly promptVersion: string
  readonly tokens: TokenUsage
}

export interface FollowUpModel {
  generateFollowUp(input: {
    readonly originalProbeText: string
    readonly studentAnswer: string
    readonly claimText: string
  }): Promise<FollowUpResult>
}

function renderFollowUpInput(input: {
  readonly originalProbeText: string
  readonly studentAnswer: string
  readonly claimText: string
}): string {
  return `ORIGINAL PROBE:\n${input.originalProbeText}\n\nSTUDENT'S ANSWER:\n${input.studentAnswer}\n\nCLAIM FROM ESSAY:\n${input.claimText}`
}

export function groqFollowUpModel(): FollowUpModel {
  return {
    async generateFollowUp(input): Promise<FollowUpResult> {
      const response = await groq().chat.completions.create({
        model: GROQ_MODELS.followUp,
        reasoning_effort: 'low',
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'follow_up_probe', strict: true, schema: followUpProbeJsonSchema },
        },
        messages: [
          { role: 'system', content: FOLLOW_UP_SYSTEM },
          { role: 'user', content: renderFollowUpInput(input) },
        ],
      })
      const content = response.choices[0]?.message.content
      if (typeof content !== 'string' || content.length === 0) {
        throw new FollowUpGenerationError('Follow-up response was empty')
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        throw new FollowUpGenerationError('Follow-up response was not valid JSON')
      }
      const result = FollowUpProbeSchema.safeParse(parsed)
      if (!result.success) {
        throw new FollowUpGenerationError('Follow-up response failed validation')
      }
      return {
        textVi: result.data.text_vi,
        rationale: result.data.rationale,
        provider: 'groq',
        model: GROQ_MODELS.followUp,
        promptVersion: FOLLOW_UP_PROMPT_VERSION,
        tokens: response.usage
          ? toTokenUsageOpenAI(response.usage)
          : { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
      }
    },
  }
}

export function anthropicFollowUpModel(): FollowUpModel {
  return {
    async generateFollowUp(input): Promise<FollowUpResult> {
      const response = await anthropic().messages.parse({
        model: MODELS.followUp,
        max_tokens: 2000,
        thinking: { type: 'adaptive' },
        output_config: {
          effort: 'low',
          format: zodOutputFormat(FollowUpProbeSchema),
        },
        system: [
          {
            type: 'text',
            text: FOLLOW_UP_SYSTEM,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{ role: 'user', content: renderFollowUpInput(input) }],
      })
      if (response.parsed_output === null) {
        throw new FollowUpGenerationError('Follow-up parse failed')
      }
      return {
        textVi: response.parsed_output.text_vi,
        rationale: response.parsed_output.rationale,
        provider: 'anthropic',
        model: MODELS.followUp,
        promptVersion: FOLLOW_UP_PROMPT_VERSION,
        tokens: toTokenUsage(response.usage),
      }
    },
  }
}
