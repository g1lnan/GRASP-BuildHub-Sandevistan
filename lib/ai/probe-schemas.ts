/**
 * Probe structured-output schemas — FR-203 / FR-204. Built with `zod/v4` for
 * consistency with the claim-graph schemas, and paired with hand-written strict
 * JSON Schemas for Groq's Structured Outputs (same subset rules: every object
 * `additionalProperties: false`, all properties `required`, no numeric/length
 * constraints — those are enforced by zod after parsing).
 */
import * as z from 'zod/v4'

export const PROBE_TYPES = [
  'counterfactual',
  'road_not_taken',
  'novel_transfer',
  'self_critique',
  'metacognitive',
  'trace_own_step',
] as const

export const BLOOM_LEVELS = ['understand', 'apply', 'analyse', 'evaluate', 'reflect'] as const

export type ProbeType = (typeof PROBE_TYPES)[number]
export type BloomLevel = (typeof BLOOM_LEVELS)[number]

export const ProbeCandidateSchema = z.object({
  claim_node_id: z.string(), // the claim node this probe interrogates
  probe_type: z.enum(PROBE_TYPES),
  bloom_level: z.enum(BLOOM_LEVELS),
  text_vi: z.string(), // the probe, in Vietnamese, quoting/referencing the student's own text
  expected_signals: z.array(z.string()), // what a genuine answer would surface
})

export const ProbeSetSchema = z.object({
  probes: z.array(ProbeCandidateSchema).min(1),
})

export type ProbeCandidateOutput = z.infer<typeof ProbeCandidateSchema>
export type ProbeSetOutput = z.infer<typeof ProbeSetSchema>

export const FragilityAssessmentSchema = z.object({
  index: z.number(), // aligns to the probe's position in the request list
  answerable: z.number(), // 0..1: how well a model could answer WITHOUT the student's submission
})

export const FragilityReportSchema = z.object({
  assessments: z.array(FragilityAssessmentSchema),
})

export type FragilityReportOutput = z.infer<typeof FragilityReportSchema>

export const probeSetJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    probes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          claim_node_id: { type: 'string' },
          probe_type: { type: 'string', enum: [...PROBE_TYPES] },
          bloom_level: { type: 'string', enum: [...BLOOM_LEVELS] },
          text_vi: { type: 'string' },
          expected_signals: { type: 'array', items: { type: 'string' } },
        },
        required: ['claim_node_id', 'probe_type', 'bloom_level', 'text_vi', 'expected_signals'],
      },
    },
  },
  required: ['probes'],
} as const

export const fragilityReportJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    assessments: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          index: { type: 'number' },
          answerable: { type: 'number' },
        },
        required: ['index', 'answerable'],
      },
    },
  },
  required: ['assessments'],
} as const
