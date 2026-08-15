import { FX_VND_PER_USD, costVnd, toTokenUsage, toTokenUsageOpenAI } from '@/lib/usage/pricing'
import { UnknownModelPricingError, recordModelUsage } from '@/lib/usage/record'
import type { UsageEventRow, UsageRepository } from '@/lib/usage/record'
import { describe, expect, it } from 'vitest'

class UsageRepositoryFake implements UsageRepository {
  rows: UsageEventRow[] = []
  async record(row: UsageEventRow): Promise<void> {
    this.rows.push(row)
  }
}

describe('costVnd', () => {
  it('prices Opus input and output tokens at the FX rate', () => {
    // 1M input @ $5 + 1M output @ $25 = $30 -> * 26,000 VND
    const cost = costVnd('claude-opus-4-8', {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
    })
    expect(cost).toBe(30 * FX_VND_PER_USD)
  })

  it('prices the Groq gpt-oss-120b prototype model', () => {
    // 1M input @ $0.15 + 1M output @ $0.60 = $0.75 -> * 26,000 VND
    const cost = costVnd('openai/gpt-oss-120b', {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
    })
    expect(cost).toBeCloseTo(0.75 * FX_VND_PER_USD, 6)
  })

  it('bills cache reads at 0.1x and cache writes at 1.25x input', () => {
    const cost = costVnd('claude-opus-4-8', {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 1_000_000, // $5 * 0.1 = $0.5
      cacheCreationTokens: 1_000_000, // $5 * 1.25 = $6.25
    })
    expect(cost).toBeCloseTo(6.75 * FX_VND_PER_USD, 6)
  })

  it('bills Groq cache reads at 0.5x input', () => {
    const cost = costVnd('openai/gpt-oss-120b', {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 1_000_000,
      cacheCreationTokens: 0,
    })
    expect(cost).toBeCloseTo(0.075 * FX_VND_PER_USD, 6)
  })
})

describe('toTokenUsage', () => {
  it('coerces null cache fields to zero', () => {
    expect(
      toTokenUsage({ input_tokens: 100, output_tokens: 50, cache_read_input_tokens: null }),
    ).toEqual({ inputTokens: 100, outputTokens: 50, cacheReadTokens: 0, cacheCreationTokens: 0 })
  })

  it('separates cached Groq prompt tokens from uncached input', () => {
    expect(
      toTokenUsageOpenAI({
        prompt_tokens: 1_000,
        completion_tokens: 200,
        prompt_tokens_details: { cached_tokens: 400 },
      }),
    ).toEqual({
      inputTokens: 600,
      outputTokens: 200,
      cacheReadTokens: 400,
      cacheCreationTokens: 0,
    })
  })
})

describe('recordModelUsage', () => {
  it('records a priced usage_event row for a known model', async () => {
    const usage = new UsageRepositoryFake()
    const row = await recordModelUsage({
      usage,
      stage: 'claim_graph',
      model: 'claude-opus-4-8',
      tokens: { inputTokens: 6000, outputTokens: 2500, cacheReadTokens: 0, cacheCreationTokens: 0 },
      submissionId: 'sub-1',
    })
    expect(usage.rows).toHaveLength(1)
    expect(row.stage).toBe('claim_graph')
    expect(row.submissionId).toBe('sub-1')
    expect(row.costVnd).toBeGreaterThan(0)
  })

  it('refuses to silently zero-cost an unpriced model', async () => {
    const usage = new UsageRepositoryFake()
    await expect(
      recordModelUsage({
        usage,
        stage: 'claim_graph',
        model: 'claude-unknown-9',
        tokens: { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheCreationTokens: 0 },
      }),
    ).rejects.toBeInstanceOf(UnknownModelPricingError)
    expect(usage.rows).toHaveLength(0)
  })
})
