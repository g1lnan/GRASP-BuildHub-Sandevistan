import { type FeedbackOutput, feedbackOutputSchema } from '@/lib/ai/feedback-schemas'
import { feedbackCitationsMatchSources } from '@/lib/domain/feedback'
import { describe, expect, it } from 'vitest'

const output: FeedbackOutput = {
  strengths: [
    {
      concept: 'Quan hệ nhân quả',
      explanationVi: 'Bạn đã giải thích rõ cách nguyên nhân dẫn đến kết quả trong lập luận.',
      citations: [{ turnOrdinal: 1, quote: 'nguyên nhân làm thay đổi kết quả' }],
    },
    {
      concept: 'Bằng chứng định lượng',
      explanationVi: 'Bạn đã dùng số liệu trong bài để hỗ trợ cho kết luận của mình.',
      citations: [{ turnOrdinal: 0, quote: 'dữ liệu khảo sát cho thấy mức tăng 20%' }],
    },
  ],
  gaps: [
    {
      concept: 'Giới hạn của mẫu khảo sát',
      explanationVi: 'Bạn đã nhận ra hạn chế nhưng chưa giải thích tác động của nó đến kết luận.',
      citations: [{ turnOrdinal: 1, quote: 'mẫu khảo sát còn khá nhỏ' }],
    },
  ],
  reviseConcepts: ['Sai lệch chọn mẫu'],
  bodyVi:
    'Bạn đã bảo vệ được quan hệ nhân quả và cách dùng số liệu. Bước tiếp theo là xem lại sai lệch chọn mẫu để đánh giá giới hạn của kết luận chính xác hơn.',
}
const firstGap = output.gaps[0]
if (firstGap === undefined) throw new Error('Feedback fixture requires a gap')

describe('feedback output', () => {
  it('requires at least two distinct strengths and one gap', () => {
    expect(feedbackOutputSchema.parse(output)).toEqual(output)
    expect(
      feedbackOutputSchema.safeParse({
        ...output,
        strengths: [output.strengths[0], output.strengths[0]],
      }).success,
    ).toBe(false)
  })

  it('validates exact citations against submission and transcript sources', () => {
    const sources = {
      submissionText: 'Bài viết dùng dữ liệu khảo sát cho thấy mức tăng 20% trong một năm.',
      turns: [
        {
          ordinal: 1,
          questionVi: 'Bạn đánh giá giới hạn nào?',
          transcript:
            'Tôi cho rằng nguyên nhân làm thay đổi kết quả, nhưng mẫu khảo sát còn khá nhỏ.',
        },
      ],
    }
    expect(feedbackCitationsMatchSources(output, sources)).toBe(true)
    expect(
      feedbackCitationsMatchSources(
        {
          ...output,
          gaps: [
            {
              ...firstGap,
              citations: [{ turnOrdinal: 2, quote: 'mẫu khảo sát còn khá nhỏ' }],
            },
          ],
        },
        sources,
      ),
    ).toBe(false)
  })
})
