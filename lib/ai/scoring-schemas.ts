import { z } from 'zod'

export const scoreDimensionKeys = [
  'd1Recall',
  'd2Explanation',
  'd3Application',
  'd4Evaluation',
  'd5Metacognition',
] as const

export type ScoreDimensionKey = (typeof scoreDimensionKeys)[number]

export const transcriptCitationSchema = z.object({
  turnOrdinal: z.number().int().positive(),
  quote: z.string().trim().min(3).max(500),
})

export const dimensionJudgmentSchema = z.object({
  score: z.number().min(1).max(5).multipleOf(0.1),
  rationaleVi: z.string().trim().min(20).max(2_000),
  citations: z.array(transcriptCitationSchema).min(1).max(5),
})

export const scoringOutputSchema = z.object({
  d1Recall: dimensionJudgmentSchema,
  d2Explanation: dimensionJudgmentSchema,
  d3Application: dimensionJudgmentSchema,
  d4Evaluation: dimensionJudgmentSchema,
  d5Metacognition: dimensionJudgmentSchema,
})

export type TranscriptCitation = z.infer<typeof transcriptCitationSchema>
export type DimensionJudgment = z.infer<typeof dimensionJudgmentSchema>
export type ScoringOutput = z.infer<typeof scoringOutputSchema>

const citationJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    turnOrdinal: { type: 'integer', minimum: 1 },
    quote: { type: 'string', minLength: 3, maxLength: 500 },
  },
  required: ['turnOrdinal', 'quote'],
} as const

const dimensionJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    score: { type: 'number', minimum: 1, maximum: 5, multipleOf: 0.1 },
    rationaleVi: { type: 'string', minLength: 20, maxLength: 2_000 },
    citations: { type: 'array', minItems: 1, maxItems: 5, items: citationJsonSchema },
  },
  required: ['score', 'rationaleVi', 'citations'],
} as const

export const scoringOutputJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: Object.fromEntries(scoreDimensionKeys.map((key) => [key, dimensionJsonSchema])),
  required: scoreDimensionKeys,
} as const
