import type { TokenUsage } from '@/lib/usage/pricing'
import type { FeedbackOutput } from './feedback-schemas'
import type { ScoringOutput } from './scoring-schemas'

export type FeedbackTurnInput = {
  readonly ordinal: number
  readonly questionVi: string
  readonly transcript: string
}

export type FeedbackModelInput = {
  readonly submissionText: string
  readonly turns: readonly FeedbackTurnInput[]
  readonly score: ScoringOutput
}

export type FeedbackModelResult = {
  readonly output: FeedbackOutput
  readonly provider: string
  readonly model: string
  readonly promptVersion: string
  readonly tokens: TokenUsage
}

export class FeedbackModelError extends Error {
  readonly name = 'FeedbackModelError'
  constructor(
    message: string,
    readonly tokens: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
    },
  ) {
    super(message)
  }
}

export interface FeedbackModel {
  readonly provider: string
  readonly model: string
  generate(input: FeedbackModelInput): Promise<FeedbackModelResult>
}
