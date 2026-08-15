import { quadrant, quadrantOf } from '@/lib/domain/quadrant'
import { describe, expect, it } from 'vitest'

describe('quadrant (FR-405)', () => {
  it('places strong product + strong understanding as mastery', () => {
    expect(quadrant(8, 4)).toBe('mastery')
  })

  it('places strong product + weak understanding as hollow', () => {
    expect(quadrant(8, 3)).toBe('hollow')
  })

  it('places weak product + strong understanding as expression_gap', () => {
    expect(quadrant(5, 4)).toBe('expression_gap')
  })

  it('places weak product + weak understanding as needs_support', () => {
    expect(quadrant(5, 3)).toBe('needs_support')
  })

  it('treats the thresholds (6.5 / 3.5) as inclusive on the strong side', () => {
    expect(quadrant(6.5, 3.5)).toBe('mastery')
  })
})

describe('quadrantOf null-safety', () => {
  it('returns null when the product axis is missing', () => {
    expect(quadrantOf(null, 4)).toBeNull()
  })

  it('returns null when the understanding axis is missing', () => {
    expect(quadrantOf(8, null)).toBeNull()
  })

  it('returns a quadrant when both axes are present', () => {
    expect(quadrantOf(8, 4)).toBe('mastery')
  })
})
