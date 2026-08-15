import { z } from 'zod'

export const feedbackCitationSchema = z.object({
  /** Zero cites the submission; positive values cite the matching transcript turn. */
  turnOrdinal: z.number().int().min(0),
  quote: z.string().trim().min(3).max(500),
})

export const feedbackEvidenceSchema = z.object({
  concept: z.string().trim().min(2).max(160),
  explanationVi: z.string().trim().min(20).max(1_500),
  citations: z.array(feedbackCitationSchema).min(1).max(3),
})

export const feedbackOutputSchema = z
  .object({
    strengths: z.array(feedbackEvidenceSchema).min(2).max(4),
    gaps: z.array(feedbackEvidenceSchema).min(1).max(3),
    reviseConcepts: z.array(z.string().trim().min(2).max(160)).min(1).max(5),
    bodyVi: z.string().trim().min(60).max(4_000),
  })
  .superRefine((output, context) => {
    const concepts = output.strengths.map((item) => item.concept.toLocaleLowerCase('vi'))
    if (new Set(concepts).size !== concepts.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['strengths'],
        message: 'Strengths must name distinct concepts',
      })
    }
  })

export type FeedbackCitation = z.infer<typeof feedbackCitationSchema>
export type FeedbackEvidence = z.infer<typeof feedbackEvidenceSchema>
export type FeedbackOutput = z.infer<typeof feedbackOutputSchema>

const citationJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    turnOrdinal: { type: 'integer', minimum: 0 },
    quote: { type: 'string', minLength: 3, maxLength: 500 },
  },
  required: ['turnOrdinal', 'quote'],
} as const

const evidenceJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    concept: { type: 'string', minLength: 2, maxLength: 160 },
    explanationVi: { type: 'string', minLength: 20, maxLength: 1_500 },
    citations: { type: 'array', minItems: 1, maxItems: 3, items: citationJsonSchema },
  },
  required: ['concept', 'explanationVi', 'citations'],
} as const

export const feedbackOutputJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    strengths: { type: 'array', minItems: 2, maxItems: 4, items: evidenceJsonSchema },
    gaps: { type: 'array', minItems: 1, maxItems: 3, items: evidenceJsonSchema },
    reviseConcepts: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: { type: 'string', minLength: 2, maxLength: 160 },
    },
    bodyVi: { type: 'string', minLength: 60, maxLength: 4_000 },
  },
  required: ['strengths', 'gaps', 'reviseConcepts', 'bodyVi'],
} as const
