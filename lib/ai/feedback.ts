import 'server-only'

import { toTokenUsage, toTokenUsageOpenAI } from '@/lib/usage/pricing'
import type Groq from 'groq-sdk'
import { MODELS, anthropic } from './client'
import { feedbackOutputJsonSchema, feedbackOutputSchema } from './feedback-schemas'
import {
  type FeedbackModel,
  FeedbackModelError,
  type FeedbackModelInput,
  type FeedbackModelResult,
} from './feedback-types'
import { GROQ_MODELS, groq } from './groq-client'
import { FEEDBACK_PROMPT_VERSION, FEEDBACK_SYSTEM } from './prompts/feedback'

export class GroqFeedbackModel implements FeedbackModel {
  readonly provider = 'groq'
  readonly model = GROQ_MODELS.feedback

  constructor(private readonly client?: Groq) {}

  async generate(input: FeedbackModelInput): Promise<FeedbackModelResult> {
    const response = await (this.client ?? groq()).chat.completions.create({
      model: this.model,
      reasoning_effort: 'medium',
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'learning_feedback',
          strict: true,
          schema: feedbackOutputJsonSchema,
        },
      },
      messages: [
        { role: 'system', content: FEEDBACK_SYSTEM },
        { role: 'user', content: JSON.stringify(input) },
      ],
    })
    const tokens = response.usage
      ? toTokenUsageOpenAI(response.usage)
      : { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 }
    const content = response.choices[0]?.message.content
    if (typeof content !== 'string' || content.length === 0) {
      throw new FeedbackModelError('Feedback response was empty', tokens)
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new FeedbackModelError('Feedback response was not valid JSON', tokens)
    }
    const result = feedbackOutputSchema.safeParse(parsed)
    if (!result.success) throw new FeedbackModelError('Feedback response failed validation', tokens)

    return {
      output: result.data,
      provider: this.provider,
      model: this.model,
      promptVersion: FEEDBACK_PROMPT_VERSION,
      tokens,
    }
  }
}

export class AnthropicFeedbackModel implements FeedbackModel {
  readonly provider = 'anthropic'
  readonly model = MODELS.feedback

  async generate(input: FeedbackModelInput): Promise<FeedbackModelResult> {
    const response = await anthropic().messages.create({
      model: this.model,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: feedbackOutputJsonSchema },
      },
      system: [
        {
          type: 'text',
          text: FEEDBACK_SYSTEM,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: JSON.stringify(input) }],
    })
    const tokens = toTokenUsage(response.usage)
    const textBlock = response.content.find((b) => b.type === 'text')
    const content = textBlock?.type === 'text' ? textBlock.text : undefined
    if (typeof content !== 'string' || content.length === 0) {
      throw new FeedbackModelError('Feedback response was empty', tokens)
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new FeedbackModelError('Feedback response was not valid JSON', tokens)
    }
    const result = feedbackOutputSchema.safeParse(parsed)
    if (!result.success) throw new FeedbackModelError('Feedback response failed validation', tokens)

    return {
      output: result.data,
      provider: this.provider,
      model: this.model,
      promptVersion: FEEDBACK_PROMPT_VERSION,
      tokens,
    }
  }
}
