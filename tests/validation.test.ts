import {
  assignmentInputSchema,
  credentialsSchema,
  joinCodeSchema,
  voiceTurnInputSchema,
} from '@/lib/validation/inputs'
import { describe, expect, it } from 'vitest'

const validAssignment = {
  courseId: '10000000-0000-4000-8000-000000000001',
  title: 'Lập luận chính sách',
  prompt: 'Trình bày lập luận và bằng chứng.',
  dueAt: '2026-08-01T09:00:00.000Z',
  subjectConcepts: ['lập luận'],
  probeCount: 6,
  timeCapSeconds: 480,
  defenseWeightPct: 20,
}

describe('input validation', () => {
  it('rejects malformed credentials when email and password are invalid', () => {
    // Given
    const input = { email: 'not-an-email', password: '' }

    // When
    const result = credentialsSchema.safeParse(input)

    // Then
    expect(result.success).toBe(false)
  })

  it.each(['ABCDEFG', 'ABCDEFGHI', 'ABCD0O1I', 'abcd2345'])(
    'rejects an ambiguous or malformed join code %s',
    (joinCode) => {
      // Given / When
      const result = joinCodeSchema.safeParse(joinCode)

      // Then
      expect(result.success).toBe(false)
    },
  )

  it.each([
    ['probeCount', 4],
    ['probeCount', 9],
    ['timeCapSeconds', 359],
    ['timeCapSeconds', 601],
    ['defenseWeightPct', -1],
    ['defenseWeightPct', 31],
  ])('rejects %s at the out-of-bounds value %s', (field, value) => {
    // Given
    const input = { ...validAssignment, [field]: value }

    // When
    const result = assignmentInputSchema.safeParse(input)

    // Then
    expect(result.success).toBe(false)
  })

  it('accepts every inclusive assignment bound', () => {
    // Given
    const boundaryAssignments = [
      { ...validAssignment, probeCount: 5, timeCapSeconds: 360, defenseWeightPct: 0 },
      { ...validAssignment, probeCount: 8, timeCapSeconds: 600, defenseWeightPct: 30 },
    ]

    // When
    const results = boundaryAssignments.map((input) => assignmentInputSchema.safeParse(input))

    // Then
    expect(results.every((result) => result.success)).toBe(true)
  })

  it('accepts voice clips up to 60 seconds and coerces multipart duration', () => {
    const result = voiceTurnInputSchema.safeParse({
      probeId: '90000000-0000-4000-8000-000000000001',
      durationMs: '60000',
    })

    expect(result).toMatchObject({ success: true, data: { durationMs: 60_000 } })
  })

  it.each(['0', '60001', 'not-a-duration'])('rejects invalid voice duration %s', (durationMs) => {
    const result = voiceTurnInputSchema.safeParse({
      probeId: '90000000-0000-4000-8000-000000000001',
      durationMs,
    })

    expect(result.success).toBe(false)
  })
})
