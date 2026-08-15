/**
 * Follow-up probe structured-output schemas. Built with `zod/v4` for
 * consistency with other AI output schemas. Paired with a hand-written strict
 * JSON Schema for Groq Structured Outputs.
 */
import * as z from 'zod/v4'

export const FollowUpProbeSchema = z.object({
  text_vi: z.string(),
  rationale: z.string(),
})

export type FollowUpProbeOutput = z.infer<typeof FollowUpProbeSchema>

export const followUpProbeJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    text_vi: { type: 'string' },
    rationale: { type: 'string' },
  },
  required: ['text_vi', 'rationale'],
} as const
