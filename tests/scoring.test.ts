import type { ScoringOutput } from '@/lib/ai/scoring-schemas'
import { scoringOutputSchema } from '@/lib/ai/scoring-schemas'
import {
  citationsMatchTranscripts,
  compositeScore,
  confidenceInterval,
  defaultRubricWeights,
  normalizeRubricWeights,
} from '@/lib/domain/scoring'
import { describe, expect, it } from 'vitest'

const output: ScoringOutput = {
  d1Recall: {
    score: 5,
    rationaleVi: 'Bạn đã nhắc lại chính xác luận điểm trung tâm của bài làm.',
    citations: [{ turnOrdinal: 1, quote: 'Luận điểm chính của tôi' }],
  },
  d2Explanation: {
    score: 4,
    rationaleVi: 'Bạn đã giải thích được cơ chế bằng lời của mình và còn một khoảng trống nhỏ.',
    citations: [{ turnOrdinal: 1, quote: 'vì bằng chứng này cho thấy' }],
  },
  d3Application: {
    score: 3,
    rationaleVi: 'Bạn đã vận dụng được ý tưởng nhưng chưa nêu rõ điều kiện thay đổi.',
    citations: [{ turnOrdinal: 2, quote: 'trong trường hợp mới' }],
  },
  d4Evaluation: {
    score: 2,
    rationaleVi: 'Bạn mới chỉ nêu một giới hạn mà chưa so sánh phương án thay thế.',
    citations: [{ turnOrdinal: 2, quote: 'giới hạn của cách này' }],
  },
  d5Metacognition: {
    score: 1,
    rationaleVi: 'Bạn chưa xác định cụ thể phần nào trong lập luận còn chưa chắc chắn.',
    citations: [{ turnOrdinal: 2, quote: 'tôi hoàn toàn chắc chắn' }],
  },
}

describe('scoring contract', () => {
  it('enforces one-decimal dimension scores and transcript citations', () => {
    expect(scoringOutputSchema.safeParse(output).success).toBe(true)
    expect(
      scoringOutputSchema.safeParse({
        ...output,
        d1Recall: { ...output.d1Recall, score: 3.14 },
      }).success,
    ).toBe(false)
    expect(
      scoringOutputSchema.safeParse({
        ...output,
        d1Recall: { ...output.d1Recall, citations: [] },
      }).success,
    ).toBe(false)
  })

  it('computes the assignment-weighted composite deterministically', () => {
    expect(compositeScore(output, defaultRubricWeights)).toBe(3.2)
    expect(
      compositeScore(output, normalizeRubricWeights({ d1: 1, d2: 0, d3: 0, d4: 0, d5: 0 })),
    ).toBe(5)
  })

  it('falls back to the published rubric when persisted weights are invalid', () => {
    expect(normalizeRubricWeights({ d1: 0, d2: 0, d3: 0, d4: 0, d5: 0 })).toEqual(
      defaultRubricWeights,
    )
  })

  it('widens and labels confidence for partial sessions', () => {
    const complete = confidenceInterval({
      composite: 3.8,
      expectedProbeCount: 5,
      turns: [1, 2, 3, 4, 5].map((ordinal) => ({
        probeId: `probe-${ordinal}`,
        inputMode: 'typed' as const,
        asrConfidence: null,
      })),
    })
    const partial = confidenceInterval({
      composite: 3.8,
      expectedProbeCount: 5,
      turns: [1, 2].map((ordinal) => ({
        probeId: `probe-${ordinal}`,
        inputMode: 'voice' as const,
        asrConfidence: 0.6,
      })),
    })

    expect(complete).toMatchObject({ low: 3.4, high: 4.2, label: 'high' })
    expect(partial.label).toBe('low')
    expect(partial.high - partial.low).toBeGreaterThan(complete.high - complete.low)
  })

  it('rejects citations that are not exact transcript substrings', () => {
    const turns = [
      { ordinal: 1, transcript: 'Luận điểm chính của tôi vì bằng chứng này cho thấy kết quả.' },
      {
        ordinal: 2,
        transcript:
          'Trong trường hợp mới, giới hạn của cách này là tôi hoàn toàn chắc chắn chưa đúng.',
      },
    ]
    expect(citationsMatchTranscripts(output, turns)).toBe(false)
    expect(
      citationsMatchTranscripts(
        {
          ...output,
          d3Application: {
            ...output.d3Application,
            citations: [{ turnOrdinal: 2, quote: 'Trong trường hợp mới' }],
          },
        },
        turns,
      ),
    ).toBe(true)
  })
})
