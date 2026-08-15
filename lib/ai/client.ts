import 'server-only'

import Anthropic from '@anthropic-ai/sdk'

/**
 * Model routing — DESIGN §6.2. Routing is a product decision with a cost
 * consequence (§8, PRD Q1). Default to Opus-tier for reasoning-critical paths
 * during the pilot: we cannot calibrate against a model we intend to swap out.
 * The step-down to Sonnet-tier is an explicit, measured decision at gate G1.
 *
 * Model IDs are exact — never append a date suffix (DESIGN §6.1).
 */
export const MODELS = {
  claimGraph: 'claude-opus-4-8', // quality determines whether a lecturer trusts us
  probeGen: 'claude-opus-4-8', // AI-fragility is the whole product
  fragilityAdversary: 'claude-opus-4-8', // adversarial scoring must match probe quality
  finalScore: 'claude-opus-4-8', // the number a grade depends on
  turnTriage: 'claude-sonnet-5', // high volume, low stakes, discarded after routing
  feedback: 'claude-sonnet-5', // helpful != hard
  followUp: 'claude-haiku-4-5', // NEW: fast inline follow-up generation
} as const

export type ModelId = (typeof MODELS)[keyof typeof MODELS]

let client: Anthropic | null = null

/**
 * Lazily construct the shared client. Constructing eagerly would require
 * ANTHROPIC_API_KEY at import time, which breaks builds and unit tests that
 * never touch the model. The key is read from the environment by the SDK.
 */
export function anthropic(): Anthropic {
  if (client === null) client = new Anthropic()
  return client
}
