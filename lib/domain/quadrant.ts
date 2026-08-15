export const quadrants = ['mastery', 'hollow', 'expression_gap', 'needs_support'] as const
export type Quadrant = (typeof quadrants)[number]

/** FR-405 thresholds. Product on a /10 scale, understanding on a /5 scale. */
export const PRODUCT_THRESHOLD = 6.5
export const UNDERSTANDING_THRESHOLD = 3.5

export function quadrant(productScore: number, understandingScore: number): Quadrant {
  const productStrong = productScore >= PRODUCT_THRESHOLD
  const understandingStrong = understandingScore >= UNDERSTANDING_THRESHOLD
  if (productStrong && understandingStrong) return 'mastery'
  if (productStrong) return 'hollow'
  if (understandingStrong) return 'expression_gap'
  return 'needs_support'
}

/**
 * Null-safe quadrant. Returns null when either axis is missing — a student
 * without both a product score and a scored session is never placed on the
 * matrix (and never labelled), per FR-405 / DESIGN §4.5.
 */
export function quadrantOf(
  productScore: number | null,
  understandingScore: number | null,
): Quadrant | null {
  if (productScore === null || understandingScore === null) return null
  return quadrant(productScore, understandingScore)
}
