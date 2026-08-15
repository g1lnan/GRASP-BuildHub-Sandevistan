import { z } from 'zod'

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
})

export const joinCodeSchema = z.string().regex(/^[A-HJ-NP-Z2-9]{8}$/)

export const assignmentInputSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  prompt: z.string().trim().min(1).max(10_000),
  dueAt: z
    .string()
    .datetime({ offset: true })
    .transform((value) => new Date(value)),
  subjectConcepts: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
  probeCount: z.number().int().min(5).max(8),
  timeCapSeconds: z.number().int().min(360).max(600),
  defenseWeightPct: z.number().int().min(0).max(30),
})

export const createCourseInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  term: z.string().trim().min(1).max(100),
})

export const updateCourseInputSchema = createCourseInputSchema
  .partial()
  .refine((value) => value.name !== undefined || value.term !== undefined)

export const enrollmentInputSchema = z.object({ joinCode: joinCodeSchema })

export const submissionTextInputSchema = z.object({
  assignmentId: z.string().uuid(),
  text: z.string().trim().min(1),
})

export const startSessionInputSchema = z.object({
  submissionId: z.string().uuid(),
})

export const typedTurnInputSchema = z.object({
  probeId: z.string().uuid(),
  text: z.string().trim().min(1).max(20_000),
})

export const voiceTurnInputSchema = z.object({
  probeId: z.string().uuid(),
  durationMs: z.coerce.number().int().min(1).max(60_000),
})

export const appealInputSchema = z.object({
  reason: z.string().trim().min(10).max(2_000),
})

export type SubmissionTextInput = z.infer<typeof submissionTextInputSchema>
export type AppealInput = z.infer<typeof appealInputSchema>
export type StartSessionInput = z.infer<typeof startSessionInputSchema>
export type TypedTurnInput = z.infer<typeof typedTurnInputSchema>
export type VoiceTurnInput = z.infer<typeof voiceTurnInputSchema>

export type CredentialsInput = z.infer<typeof credentialsSchema>
export type AssignmentInput = z.infer<typeof assignmentInputSchema>
export type CreateCourseInput = z.infer<typeof createCourseInputSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseInputSchema>
