import type { TokenUsage } from '@/lib/usage/pricing'
import type { ScoringOutput } from './scoring-schemas'

export type ScoringTurnInput = {
  readonly ordinal: number
  readonly questionVi: string
  readonly claimText: string
  readonly transcript: string
  readonly inputMode: 'voice' | 'typed'
  readonly asrConfidence: number | null
}

export type ScoringModelResult = {
  readonly output: ScoringOutput
  readonly provider: string
  readonly model: string
  readonly promptVersion: string
  readonly tokens: TokenUsage
}

export class ScoringModelError extends Error {
  readonly name = 'ScoringModelError'
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

export interface ScoringModel {
  readonly provider: string
  readonly model: string
  score(input: {
    readonly submissionText: string
    readonly turns: readonly ScoringTurnInput[]
  }): Promise<ScoringModelResult>
}
