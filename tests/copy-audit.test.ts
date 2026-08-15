import { findCopyViolations } from '@/scripts/copy-audit-core'
import { describe, expect, it } from 'vitest'

describe('copy audit', () => {
  it('reports a forbidden phrase in a fixture', () => {
    // Given
    const fixture = 'This answer is AI-written.'

    // When
    const violations = findCopyViolations(fixture)

    // Then
    expect(violations).toHaveLength(1)
  })

  it('accepts supportive Vietnamese feedback', () => {
    // Given
    const fixture = 'Cần trao đổi thêm để làm rõ lập luận.'

    // When
    const violations = findCopyViolations(fixture)

    // Then
    expect(violations).toEqual([])
  })
})
