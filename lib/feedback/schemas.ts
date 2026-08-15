import { feedbackEvidenceSchema } from '@/lib/ai/feedback-schemas'
import { z } from 'zod'

export const feedbackReportViewSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  strengths: z.array(feedbackEvidenceSchema).min(2).max(4),
  gaps: z.array(feedbackEvidenceSchema).min(1).max(3),
  reviseConcepts: z.array(z.string().trim().min(2).max(160)).min(1).max(5),
  bodyVi: z.string().trim().min(60).max(4_000),
})

export type FeedbackReportView = z.infer<typeof feedbackReportViewSchema>
