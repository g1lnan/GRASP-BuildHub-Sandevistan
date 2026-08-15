import { z } from 'zod'

export const sessionStatusSchema = z.enum(['in_progress', 'completed', 'expired', 'abandoned'])

export const sessionProbeSchema = z.object({
  id: z.string().uuid(),
  ordinal: z.number().int().positive(),
  textVi: z.string(),
  claimText: z.string(),
})

export const sessionViewSchema = z.object({
  id: z.string().uuid(),
  status: sessionStatusSchema,
  done: z.boolean(),
  deadlineAt: z.string().datetime(),
  questionNumber: z.number().int().nonnegative(),
  currentProbe: sessionProbeSchema.nullable(),
})

export const voiceTurnResponseSchema = z.object({
  session: sessionViewSchema,
  acceptedTurn: z.object({
    inputMode: z.literal('voice'),
    transcript: z.string(),
    asrConfidence: z.number().min(0).max(1),
    persisted: z.boolean(),
  }),
})

export type SessionView = z.infer<typeof sessionViewSchema>
export type VoiceTurnResponse = z.infer<typeof voiceTurnResponseSchema>
