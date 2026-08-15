import { dimensionJudgmentSchema } from '@/lib/ai/scoring-schemas'
import { feedbackReportViewSchema } from '@/lib/feedback/schemas'
import { z } from 'zod'

export const confidenceLabelSchema = z.enum(['high', 'medium', 'low'])

export const scoreViewSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  dimensions: z.object({
    d1Recall: dimensionJudgmentSchema,
    d2Explanation: dimensionJudgmentSchema,
    d3Application: dimensionJudgmentSchema,
    d4Evaluation: dimensionJudgmentSchema,
    d5Metacognition: dimensionJudgmentSchema,
  }),
  composite: z.number().min(1).max(5),
  confidence: z.object({
    low: z.number().min(1).max(5),
    high: z.number().min(1).max(5),
    label: confidenceLabelSchema,
    recommendationVi: z.string().nullable(),
  }),
})

export type ScoreView = z.infer<typeof scoreViewSchema>

export const finalizationViewSchema = scoreViewSchema.extend({
  feedback: feedbackReportViewSchema,
})

export type FinalizationView = z.infer<typeof finalizationViewSchema>
