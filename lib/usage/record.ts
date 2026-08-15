/**
 * Usage recording — FR-505. Every model and ASR call writes a usage_event row
 * with token counts and cost_vnd. An uninstrumented call is an invisible cost,
 * and there are no exceptions in this codebase.
 */
import { type PricedModel, type TokenUsage, costVnd, isPricedModel } from './pricing'

export type UsageEventRow = {
  readonly sessionId: string | null
  readonly submissionId: string | null
  readonly stage: string
  readonly provider: string
  readonly model: string
  readonly inputTokens: number
  readonly cacheReadTokens: number
  readonly cacheCreationTokens: number
  readonly outputTokens: number
  readonly audioSeconds: number | null
  readonly costVnd: number
}

export interface UsageRepository {
  record(row: UsageEventRow): Promise<void>
}

export class UnknownModelPricingError extends Error {
  readonly name = 'UnknownModelPricingError'
  constructor(model: string) {
    super(`No pricing entry for model "${model}"`)
  }
}

/**
 * Record a single model call. Computes cost from the token buckets so the
 * caller never hand-prices. An unknown model id is a bug, not a silent zero —
 * it would understate the cost model.
 */
export async function recordModelUsage(params: {
  readonly usage: UsageRepository
  readonly stage: string
  readonly model: string
  readonly tokens: TokenUsage
  readonly submissionId?: string | null
  readonly sessionId?: string | null
  readonly provider?: string
}): Promise<UsageEventRow> {
  if (!isPricedModel(params.model)) throw new UnknownModelPricingError(params.model)
  const model: PricedModel = params.model
  const row: UsageEventRow = {
    sessionId: params.sessionId ?? null,
    submissionId: params.submissionId ?? null,
    stage: params.stage,
    provider: params.provider ?? 'anthropic',
    model,
    inputTokens: params.tokens.inputTokens,
    cacheReadTokens: params.tokens.cacheReadTokens,
    cacheCreationTokens: params.tokens.cacheCreationTokens,
    outputTokens: params.tokens.outputTokens,
    audioSeconds: null,
    costVnd: costVnd(model, params.tokens),
  }
  await params.usage.record(row)
  return row
}

export async function recordASRUsage(params: {
  readonly usage: UsageRepository
  readonly provider: string
  readonly model: string
  readonly audioSeconds: number
  readonly costPerMinuteVnd: number
  readonly minimumBillableSeconds?: number
  readonly submissionId: string
  readonly sessionId: string
}): Promise<UsageEventRow> {
  const audioSeconds = Math.max(0, params.audioSeconds)
  const billableSeconds = Math.max(audioSeconds, params.minimumBillableSeconds ?? 0)
  const row: UsageEventRow = {
    sessionId: params.sessionId,
    submissionId: params.submissionId,
    stage: 'asr',
    provider: params.provider,
    model: params.model,
    inputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    outputTokens: 0,
    audioSeconds,
    costVnd: Math.ceil((billableSeconds / 60) * params.costPerMinuteVnd),
  }
  await params.usage.record(row)
  return row
}
