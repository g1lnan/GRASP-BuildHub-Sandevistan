#!/usr/bin/env tsx
/**
 * Gate G1 — calibration harness (DESIGN §11 / PRD §7). Reports Pearson r per
 * dimension and composite, Cohen's κ between lecturers, and a per-dimension
 * error breakdown. Gate: composite r > 0.7. Also splits sessions by typed- vs
 * voice-majority and reports composite r for each bucket when there is enough
 * data — the check for the response-modality validity gap noted in DESIGN §11.
 *
 * Sources:
 *   (default) the 20-session golden set — deterministic, run before every release.
 *   `--source db` — the live calibration dataset written by lecturer overrides
 *                   (FR-406). Requires DATABASE_URL. One lecturer per session, so
 *                   κ is reported as n/a there.
 *
 * Pure statistics only — no model calls. `pnpm eval:calibration`.
 */
import {
  type CalibrationSession,
  type DimensionScores,
  G1_PEARSON_GATE,
  calibrationReport,
} from '@/lib/domain/calibration'
import { goldenCalibration } from './golden'

function fmt(value: number, digits = 3): string {
  return Number.isFinite(value) ? value.toFixed(digits) : ' n/a '
}

async function loadFromDb(): Promise<readonly CalibrationSession[]> {
  const { closeDatabase, db } = await import('@/lib/db/connection')
  const { overrides, scores, turns } = await import('@/lib/db/schema')
  const { eq } = await import('drizzle-orm')

  const [rows, turnRows] = await Promise.all([
    db
      .select({
        sessionId: scores.sessionId,
        md1: scores.d1Recall,
        md2: scores.d2Explanation,
        md3: scores.d3Application,
        md4: scores.d4Evaluation,
        md5: scores.d5Metacognition,
        overridden: overrides.overridden,
      })
      .from(scores)
      .innerJoin(overrides, eq(overrides.scoreId, scores.id)),
    // Per-turn modality, so we can report the typed/voice mix per session — the
    // input the future modality-vs-score check (DESIGN §11) needs and doesn't have yet.
    db
      .select({ sessionId: turns.sessionId, inputMode: turns.inputMode })
      .from(turns),
  ])
  await closeDatabase()

  const modalityBySession = new Map<string, { typed: number; voice: number }>()
  for (const t of turnRows) {
    const entry = modalityBySession.get(t.sessionId) ?? { typed: 0, voice: 0 }
    if (t.inputMode === 'typed') entry.typed += 1
    else entry.voice += 1
    modalityBySession.set(t.sessionId, entry)
  }

  return rows.map((row) => {
    const o = row.overridden as Record<string, number>
    const lecturer: DimensionScores = {
      d1: o.d1Recall ?? 0,
      d2: o.d2Explanation ?? 0,
      d3: o.d3Application ?? 0,
      d4: o.d4Evaluation ?? 0,
      d5: o.d5Metacognition ?? 0,
    }
    const counts = modalityBySession.get(row.sessionId)
    const total = counts ? counts.typed + counts.voice : 0
    const modalityMix =
      counts !== undefined && total > 0
        ? { typed: counts.typed / total, voice: counts.voice / total }
        : null
    return {
      id: row.sessionId,
      model: {
        d1: Number(row.md1),
        d2: Number(row.md2),
        d3: Number(row.md3),
        d4: Number(row.md4),
        d5: Number(row.md5),
      },
      lecturers: [lecturer],
      ...(modalityMix !== null ? { modalityMix } : {}),
    }
  })
}

/**
 * FR-none / DESIGN §11 "Known validity limitation" — splits sessions by
 * typed-majority vs voice-majority and reports composite r for each bucket
 * when there's enough data. This is the check that tells us whether typed and
 * spoken responses are actually scored comparably, instead of assuming it.
 */
function reportModalitySplit(sessions: readonly CalibrationSession[]): void {
  const withMix = sessions.filter((s) => s.modalityMix !== undefined)
  if (withMix.length === 0) {
    console.log(
      '\nmodality split: no modality data on these sessions (the golden set does not carry it; real pilot sessions do).',
    )
    return
  }
  const typedMajority = withMix.filter((s) => (s.modalityMix?.typed ?? 0) >= 0.5)
  const voiceMajority = withMix.filter((s) => (s.modalityMix?.typed ?? 0) < 0.5)
  console.log(
    `\nmodality split: ${typedMajority.length} typed-majority, ${voiceMajority.length} voice-majority session(s)`,
  )
  for (const [label, subset] of [
    ['typed-majority', typedMajority],
    ['voice-majority', voiceMajority],
  ] as const) {
    if (subset.length < 2) {
      console.log(`  ${label}: n/a (need >= 2 sessions, have ${subset.length})`)
      continue
    }
    console.log(
      `  ${label}: n=${subset.length}, composite r=${fmt(calibrationReport(subset).compositeR)}`,
    )
  }
}

async function main(): Promise<void> {
  const useDb = process.argv.includes('--source') && process.argv.includes('db')
  const sessions = useDb ? await loadFromDb() : goldenCalibration

  console.log(
    `\nCalibration eval (G1) — source ${useDb ? 'db' : 'golden'}, ${sessions.length} sessions\n`,
  )

  if (sessions.length < 2) {
    console.log('Need at least 2 scored+overridden sessions to correlate. Collect more data.')
    process.exitCode = 1
    return
  }

  const report = calibrationReport(sessions)

  console.log('  dimension    r        MAE    bias')
  console.log('  ---------    ------   ----   -----')
  for (const d of report.perDimension) {
    const label = d.dimension === 'composite' ? 'COMPOSITE' : d.dimension.toUpperCase()
    console.log(`  ${label.padEnd(11)}  ${fmt(d.r)}   ${fmt(d.mae, 2)}   ${fmt(d.bias, 2)}`)
  }

  console.log(`\ninter-rater κ (lecturer agreement): ${fmt(report.interRaterKappa)}`)
  console.log(`composite Pearson r: ${fmt(report.compositeR)}  (gate > ${G1_PEARSON_GATE})`)
  reportModalitySplit(sessions)
  console.log(report.pass ? '\nGATE G1: PASS ✅\n' : '\nGATE G1: FAIL ❌\n')
  if (!report.pass) process.exitCode = 1
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Calibration eval failed')
  process.exitCode = 1
})
