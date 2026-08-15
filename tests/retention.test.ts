import { DEFAULT_AUDIO_RETENTION_HOURS, audioRetentionCutoff } from '@/lib/domain/retention'
import { describe, expect, it } from 'vitest'

describe('audioRetentionCutoff (FR-504)', () => {
  const now = new Date('2026-07-26T12:00:00.000Z')

  it('subtracts the retention window from now', () => {
    expect(audioRetentionCutoff(now, 24)).toEqual(new Date('2026-07-25T12:00:00.000Z'))
  })

  it('supports a shorter window', () => {
    expect(audioRetentionCutoff(now, 1)).toEqual(new Date('2026-07-26T11:00:00.000Z'))
  })

  it('falls back to the default window for invalid input', () => {
    const expected = new Date(now.getTime() - DEFAULT_AUDIO_RETENTION_HOURS * 3600 * 1000)
    expect(audioRetentionCutoff(now, Number.NaN)).toEqual(expected)
    expect(audioRetentionCutoff(now, -5)).toEqual(expected)
  })

  it('treats zero as delete-immediately (cutoff equals now)', () => {
    expect(audioRetentionCutoff(now, 0)).toEqual(now)
  })
})
