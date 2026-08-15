/**
 * Cost model — DESIGN §7.2 / §8. Prices are USD per 1M tokens, converted to
 * VND at FX_VND_PER_USD. Cache rates are provider-specific. Record cache
 * read/creation tokens separately or the cost model drifts (FR-505).
 *
 * This module is pure and has no I/O so the cost maths stays unit-testable.
 */

export const FX_VND_PER_USD = 26_000

export const PRICING = {
  // Anthropic (kept for the calibration/production path — see DESIGN §6.2)
  'claude-opus-4-8': { input: 5.0, output: 25.0, cacheRead: 0.1, cacheWrite: 1.25 },
  'claude-sonnet-5': { input: 2.0, output: 10.0, cacheRead: 0.1, cacheWrite: 1.25 }, // intro pricing to 2026-08-31; then 3.00/15.00
  'claude-haiku-4-5': { input: 1.0, output: 5.0, cacheRead: 0.1, cacheWrite: 1.25 },
  // Groq gpt-oss (the active prototype provider). Groq caches input at 0.5x (not
  // Anthropic's 0.1x); creation is provider-managed and not billed separately.
  'openai/gpt-oss-120b': { input: 0.15, output: 0.6, cacheRead: 0.5, cacheWrite: 0 },
  'openai/gpt-oss-20b': { input: 0.075, output: 0.3, cacheRead: 0.5, cacheWrite: 0 },
} as const

export type PricedModel = keyof typeof PRICING

export type TokenUsage = {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens: number
  readonly cacheCreationTokens: number
}

export function isPricedModel(model: string): model is PricedModel {
  return model in PRICING
}

/**
 * Cost of a single model call in VND. `input_tokens` from the API already
 * excludes cached tokens, so the three input buckets are summed independently.
 */
export function costVnd(model: PricedModel, usage: TokenUsage): number {
  const price = PRICING[model]
  const inputUsd =
    (usage.inputTokens +
      usage.cacheReadTokens * price.cacheRead +
      usage.cacheCreationTokens * price.cacheWrite) *
    price.input
  const outputUsd = usage.outputTokens * price.output
  const usd = (inputUsd + outputUsd) / 1_000_000
  return usd * FX_VND_PER_USD
}

/**
 * Normalise an Anthropic `response.usage` into our token buckets. The SDK uses
 * `null` for absent cache fields; treat those as zero.
 */
export function toTokenUsage(usage: {
  readonly input_tokens?: number | null
  readonly output_tokens?: number | null
  readonly cache_read_input_tokens?: number | null
  readonly cache_creation_input_tokens?: number | null
}): TokenUsage {
  return {
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
  }
}

/**
 * Normalise an OpenAI-shaped `usage` (Groq is OpenAI-compatible) into our token
 * buckets. Cached prompt tokens are reported under `prompt_tokens_details`.
 */
export function toTokenUsageOpenAI(usage: {
  readonly prompt_tokens?: number | null
  readonly completion_tokens?: number | null
  readonly prompt_tokens_details?: { readonly cached_tokens?: number | null } | null
}): TokenUsage {
  const cacheReadTokens = usage.prompt_tokens_details?.cached_tokens ?? 0
  return {
    inputTokens: Math.max(0, (usage.prompt_tokens ?? 0) - cacheReadTokens),
    outputTokens: usage.completion_tokens ?? 0,
    cacheReadTokens,
    cacheCreationTokens: 0,
  }
}
