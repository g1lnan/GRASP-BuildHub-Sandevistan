/**
 * Word counting for submissions (FR-201). Pure and side-effect free so the
 * over-limit boundary stays unit-testable. Vietnamese writes each syllable as a
 * whitespace-separated token, so counting runs of non-whitespace matches how a
 * reader would count "words" and gives a stable limit.
 */

export const MAX_SUBMISSION_WORDS = 20_000

export function countWords(text: string): number {
  const matches = text.trim().match(/\S+/gu)
  return matches === null ? 0 : matches.length
}

export function isWithinWordLimit(text: string): boolean {
  return countWords(text) <= MAX_SUBMISSION_WORDS
}
