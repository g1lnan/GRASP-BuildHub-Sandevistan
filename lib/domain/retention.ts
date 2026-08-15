/**
 * FR-504 — audio retention. Default retention is off: a scheduled job hard-deletes
 * voice recordings once they are at least `retentionHours` old (default 24h).
 */
export const DEFAULT_AUDIO_RETENTION_HOURS = 24

/** The cutoff instant: audio created at or before this is eligible for deletion. */
export function audioRetentionCutoff(now: Date, retentionHours: number): Date {
  const hours =
    Number.isFinite(retentionHours) && retentionHours >= 0
      ? retentionHours
      : DEFAULT_AUDIO_RETENTION_HOURS
  return new Date(now.getTime() - hours * 60 * 60 * 1000)
}

/** Reads AUDIO_RETENTION_HOURS from the environment, falling back to the default. */
export function audioRetentionHours(): number {
  const raw = Number(process.env.AUDIO_RETENTION_HOURS)
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_AUDIO_RETENTION_HOURS
}
