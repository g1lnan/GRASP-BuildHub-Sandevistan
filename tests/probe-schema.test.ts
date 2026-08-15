import { FragilityReportSchema, ProbeSetSchema } from '@/lib/ai/probe-schemas'
import { describe, expect, it } from 'vitest'

const validProbe = {
  claim_node_id: 'c1',
  probe_type: 'counterfactual',
  bloom_level: 'analyse',
  text_vi: 'Nếu giả định của bạn sai thì kết luận thay đổi thế nào?',
  expected_signals: ['nêu được giả định', 'liên hệ tới kết luận'],
}

describe('ProbeSetSchema (FR-203 contract)', () => {
  it('accepts a well-formed probe set', () => {
    expect(ProbeSetSchema.safeParse({ probes: [validProbe] }).success).toBe(true)
  })

  it('rejects an unknown probe_type', () => {
    const bad = { probes: [{ ...validProbe, probe_type: 'gotcha' }] }
    expect(ProbeSetSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects an unknown bloom_level', () => {
    const bad = { probes: [{ ...validProbe, bloom_level: 'memorise' }] }
    expect(ProbeSetSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects a probe missing expected_signals', () => {
    const withoutSignals = {
      claim_node_id: validProbe.claim_node_id,
      probe_type: validProbe.probe_type,
      bloom_level: validProbe.bloom_level,
      text_vi: validProbe.text_vi,
    }
    expect(ProbeSetSchema.safeParse({ probes: [withoutSignals] }).success).toBe(false)
  })
})

describe('FragilityReportSchema', () => {
  it('accepts indexed answerability assessments', () => {
    const report = {
      assessments: [
        { index: 0, answerable: 0.2 },
        { index: 1, answerable: 0.9 },
      ],
    }
    expect(FragilityReportSchema.safeParse(report).success).toBe(true)
  })

  it('rejects a non-numeric answerable value', () => {
    const report = { assessments: [{ index: 0, answerable: 'low' }] }
    expect(FragilityReportSchema.safeParse(report).success).toBe(false)
  })
})
