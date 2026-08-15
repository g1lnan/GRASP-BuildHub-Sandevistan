import { MAX_SUBMISSION_WORDS, countWords, isWithinWordLimit } from '@/lib/ingest/word-count'
import { describe, expect, it } from 'vitest'

describe('countWords', () => {
  it('counts whitespace-separated Vietnamese syllables', () => {
    expect(countWords('Tư duy phản biện là kỹ năng')).toBe(7)
  })

  it('treats runs of whitespace and newlines as single separators', () => {
    expect(countWords('  luận điểm \n\n  bằng   chứng ')).toBe(4)
  })

  it('returns zero for empty or whitespace-only input', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n  ')).toBe(0)
  })

  it('enforces the 20,000-word limit at the boundary', () => {
    const atLimit = Array.from({ length: MAX_SUBMISSION_WORDS }, () => 'từ').join(' ')
    const overLimit = `${atLimit} thêm`
    expect(isWithinWordLimit(atLimit)).toBe(true)
    expect(isWithinWordLimit(overLimit)).toBe(false)
  })
})
