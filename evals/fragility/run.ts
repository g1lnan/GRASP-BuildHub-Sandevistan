#!/usr/bin/env tsx
/**
 * AI-fragility gate harness (DESIGN §11). Feeds each golden probe to a frontier
 * model on Groq WITHOUT the source essay and measures how many it can answer
 * blind. Gate: < 25% answerable — the probes must actually be fragile.
 *
 * Real model calls, so this lives in evals/ and is run on demand
 * (`pnpm eval:fragility`), never in the unit-test suite. Requires GROQ_API_KEY.
 * It imports the Groq client directly rather than lib/ai/groq-client (which is
 * `server-only` and cannot be loaded outside a Server Component).
 */
import { GROQ_MODELS } from '@/lib/ai/models'
import { FragilityReportSchema, fragilityReportJsonSchema } from '@/lib/ai/probe-schemas'
import { FRAGILITY_PROMPT_VERSION, FRAGILITY_SYSTEM } from '@/lib/ai/prompts/probes'
import { fragilityReport } from '@/lib/domain/fragility'
import Groq from 'groq-sdk'
import { goldenProbes } from './golden'

function clamp01(v: number): number {
  return Number.isNaN(v) ? 0 : Math.min(1, Math.max(0, v))
}

async function main(): Promise<void> {
  const client = new Groq()
  const numbered = goldenProbes.map((p, i) => `${i}. ${p.textVi}`).join('\n')

  const response = await client.chat.completions.create({
    model: GROQ_MODELS.fragilityAdversary,
    reasoning_effort: 'high',
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'fragility_report', strict: true, schema: fragilityReportJsonSchema },
    },
    messages: [
      { role: 'system', content: FRAGILITY_SYSTEM },
      { role: 'user', content: `Questions:\n${numbered}` },
    ],
  })

  const content = response.choices[0]?.message.content ?? ''
  const report = FragilityReportSchema.parse(JSON.parse(content))

  const fragility = new Array<number>(goldenProbes.length).fill(0)
  for (const a of report.assessments) {
    if (a.index >= 0 && a.index < fragility.length) {
      fragility[a.index] = clamp01(1 - clamp01(a.answerable))
    }
  }

  const result = fragilityReport(fragility)

  console.log(
    `\nAI-fragility eval — model ${GROQ_MODELS.fragilityAdversary}, prompt ${FRAGILITY_PROMPT_VERSION}\n`,
  )
  goldenProbes.forEach((p, i) => {
    const f = fragility[i] ?? 0
    const answerable = f <= 0.5
    const flag = answerable === p.expectedAnswerableBlind ? ' ' : '!'
    console.log(
      `${flag} ${p.id}  fragility=${f.toFixed(2)}  ${answerable ? 'ANSWERABLE' : 'fragile   '}  (expected ${p.expectedAnswerableBlind ? 'answerable' : 'fragile'})`,
    )
  })
  console.log(
    `\nanswerable ${result.answerable}/${result.total} = ${(result.answerablePct * 100).toFixed(1)}%  (gate < 25%)`,
  )
  console.log(`mean fragility ${result.meanFragility.toFixed(2)}`)
  console.log(result.pass ? '\nGATE: PASS ✅\n' : '\nGATE: FAIL ❌\n')
  if (!result.pass) process.exitCode = 1
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Fragility eval failed')
  process.exitCode = 1
})
