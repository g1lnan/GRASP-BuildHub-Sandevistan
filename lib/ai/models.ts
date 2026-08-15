/**
 * Groq model routing constants (no side effects, no `server-only`) so both the
 * server pipeline and the `evals/` scripts can import them. The client factory
 * that actually reads GROQ_API_KEY lives in `groq-client.ts`.
 *
 * gpt-oss-120b carries the reasoning-critical paths (graph, probes, scoring);
 * gpt-oss-20b handles high-volume, low-stakes paths (turn triage, feedback).
 * Groq's strict Structured Outputs are supported only on the gpt-oss models, so
 * this is a deliberate choice, not a fallback.
 */
export const GROQ_MODELS = {
  claimGraph: 'openai/gpt-oss-120b',
  probeGen: 'openai/gpt-oss-120b',
  finalScore: 'openai/gpt-oss-120b',
  fragilityAdversary: 'openai/gpt-oss-120b', // strongest available = an honest adversary
  turnTriage: 'openai/gpt-oss-20b',
  feedback: 'openai/gpt-oss-20b',
} as const

export type GroqModelId = (typeof GROQ_MODELS)[keyof typeof GROQ_MODELS]
