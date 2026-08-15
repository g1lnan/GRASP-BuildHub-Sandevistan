/**
 * Claim Graph structured-output schemas — DESIGN §4.2.
 *
 * These schemas are passed to `zodOutputFormat`, whose helper imports from
 * `zod/v4`. They MUST be built with the same module (`zod/v4`), or the helper
 * rejects them. Boundary-input validation elsewhere uses classic `zod` (v3);
 * keep the two apart.
 */
import * as z from 'zod/v4'

export const ClaimNodeSchema = z.object({
  id: z.string(), // "c1", "c2", ...
  kind: z.enum(['thesis', 'claim', 'evidence', 'assumption', 'definition']),
  text: z.string(), // the student's OWN words, verbatim
  quote_span: z.object({ start: z.number(), end: z.number() }),
  concepts: z.array(z.string()),
  confidence: z.number().min(0).max(1),
})

export const ClaimEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  relation: z.enum(['supports', 'contradicts', 'depends_on', 'exemplifies']),
})

export const ClaimGraphSchema = z.object({
  nodes: z.array(ClaimNodeSchema).min(3),
  edges: z.array(ClaimEdgeSchema),
  concepts: z.array(z.string()),
})

export type ClaimGraphOutput = z.infer<typeof ClaimGraphSchema>
export type ClaimNodeOutput = z.infer<typeof ClaimNodeSchema>
export type ClaimEdgeOutput = z.infer<typeof ClaimEdgeSchema>

/**
 * JSON Schema handed to Groq's strict Structured Outputs. Strict mode supports
 * only a subset of JSON Schema — no `minItems`/`minimum`/`maximum`, every object
 * needs `additionalProperties: false`, and every property must be listed in
 * `required`. Value constraints (>= 3 nodes, confidence 0..1) are therefore not
 * expressed here; `ClaimGraphSchema` above stays the validation source of truth
 * and is applied to the model's response after parsing.
 */
export const claimGraphJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string' },
          kind: {
            type: 'string',
            enum: ['thesis', 'claim', 'evidence', 'assumption', 'definition'],
          },
          text: { type: 'string' },
          quote_span: {
            type: 'object',
            additionalProperties: false,
            properties: { start: { type: 'number' }, end: { type: 'number' } },
            required: ['start', 'end'],
          },
          concepts: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' },
        },
        required: ['id', 'kind', 'text', 'quote_span', 'concepts', 'confidence'],
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          relation: {
            type: 'string',
            enum: ['supports', 'contradicts', 'depends_on', 'exemplifies'],
          },
        },
        required: ['from', 'to', 'relation'],
      },
    },
    concepts: { type: 'array', items: { type: 'string' } },
  },
  required: ['nodes', 'edges', 'concepts'],
} as const
