import 'server-only'

import { toTokenUsage, toTokenUsageOpenAI } from '@/lib/usage/pricing'
import type Groq from 'groq-sdk'
import { MODELS, anthropic } from './client'
import { GROQ_MODELS, groq } from './groq-client'
import { SCORING_PROMPT_VERSION, SCORING_SYSTEM } from './prompts/scoring'
import { scoringOutputJsonSchema, scoringOutputSchema } from './scoring-schemas'
import {
  type ScoringModel,
  ScoringModelError,
  type ScoringModelResult,
  type ScoringTurnInput,
} from './scoring-types'

export class GroqScoringModel implements ScoringModel {
  readonly provider = 'groq'
  readonly model = GROQ_MODELS.finalScore

  constructor(private readonly client?: Groq) {}

  async score(input: {
    readonly submissionText: string
    readonly turns: readonly ScoringTurnInput[]
  }): Promise<ScoringModelResult> {
    const response = await (this.client ?? groq()).chat.completions.create({
      model: this.model,
      reasoning_effort: 'high',
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'session_score', strict: true, schema: scoringOutputJsonSchema },
      },
      messages: [
        { role: 'system', content: SCORING_SYSTEM },
        {
          role: 'user',
          content: JSON.stringify({
            submission: input.submissionText,
            turns: input.turns,
          }),
        },
      ],
    })
    const tokens = response.usage
      ? toTokenUsageOpenAI(response.usage)
      : { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 }
    const content = response.choices[0]?.message.content
    if (typeof content !== 'string' || content.length === 0) {
      throw new ScoringModelError('Scoring response was empty', tokens)
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new ScoringModelError('Scoring response was not valid JSON', tokens)
    }
    const result = scoringOutputSchema.safeParse(parsed)
    if (!result.success) throw new ScoringModelError('Scoring response failed validation', tokens)

    return {
      output: result.data,
      provider: this.provider,
      model: this.model,
      promptVersion: SCORING_PROMPT_VERSION,
      tokens,
    }
  }
}

export class AnthropicScoringModel implements ScoringModel {
  readonly provider = 'anthropic'
  readonly model = MODELS.finalScore

  async score(input: {
    readonly submissionText: string
    readonly turns: readonly ScoringTurnInput[]
  }): Promise<ScoringModelResult> {
    const response = await anthropic().messages.create({
      model: this.model,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'high',
        format: { type: 'json_schema', schema: scoringOutputJsonSchema },
      },
      system: [
        {
          type: 'text',
          text: SCORING_SYSTEM,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            submission: input.submissionText,
            turns: input.turns,
          }),
        },
      ],
    })
    const tokens = toTokenUsage(response.usage)
    const textBlock = response.content.find((b) => b.type === 'text')
    const content = textBlock?.type === 'text' ? textBlock.text : undefined
    if (typeof content !== 'string' || content.length === 0) {
      throw new ScoringModelError('Scoring response was empty', tokens)
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new ScoringModelError('Scoring response was not valid JSON', tokens)
    }
    const result = scoringOutputSchema.safeParse(parsed)
    if (!result.success) throw new ScoringModelError('Scoring response failed validation', tokens)

    return {
      output: result.data,
      provider: this.provider,
      model: this.model,
      promptVersion: SCORING_PROMPT_VERSION,
      tokens,
    }
  }
}
