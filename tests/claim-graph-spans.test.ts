import type { ClaimGraphOutput, ClaimNodeOutput } from '@/lib/ai/schemas'
import { resolveClaimGraphSpans, resolveClaimSpan } from '@/lib/domain/claim-graph'
import { describe, expect, it } from 'vitest'

const submission = 'Luận điểm của tôi về chính sách công. Bằng chứng cho thấy chi phí giảm.'

function node(overrides: Partial<ClaimNodeOutput>): ClaimNodeOutput {
  return {
    id: 'c1',
    kind: 'claim',
    text: 'chính sách công',
    quote_span: { start: 0, end: 0 },
    concepts: [],
    confidence: 0.9,
    ...overrides,
  }
}

describe('resolveClaimSpan', () => {
  it('leaves an already-correct span untouched', () => {
    const n = node({ text: 'Luận điểm của tôi', quote_span: { start: 0, end: 17 } })
    const result = resolveClaimSpan(n, submission)
    expect(result.status).toBe('exact')
    expect(result.status === 'exact' && result.node.quote_span).toEqual({ start: 0, end: 17 })
  })

  it('relocates a genuinely verbatim quote reported at the wrong offset', () => {
    // "chính sách công" really starts at index 21 — the model claims 0.
    const n = node({ text: 'chính sách công', quote_span: { start: 0, end: 15 } })
    const result = resolveClaimSpan(n, submission)
    expect(result.status).toBe('relocated')
    expect(result.status === 'relocated' && result.node.quote_span).toEqual({ start: 21, end: 36 })
  })

  it('flags text that is not a substring of the submission anywhere', () => {
    const n = node({ text: 'điều này không có trong bài', quote_span: { start: 0, end: 10 } })
    const result = resolveClaimSpan(n, submission)
    expect(result).toEqual({ status: 'not_found', nodeId: 'c1' })
  })
})

describe('resolveClaimGraphSpans', () => {
  it('passes and repairs offsets when every node text is genuinely verbatim', () => {
    const graph: ClaimGraphOutput = {
      nodes: [
        node({ id: 'c1', text: 'Luận điểm của tôi', quote_span: { start: 0, end: 17 } }),
        // wrong offset, but text is real
        node({ id: 'c2', text: 'chính sách công', quote_span: { start: 999, end: 999 } }),
        node({ id: 'c3', text: 'chi phí giảm', quote_span: { start: 58, end: 70 } }),
      ],
      edges: [],
      concepts: ['chính sách công'],
    }
    const report = resolveClaimGraphSpans(graph, submission)
    expect(report.pass).toBe(true)
    expect(report.nodes).toHaveLength(3)
    expect(report.relocatedNodeIds).toEqual(['c2'])
    expect(report.notFoundNodeIds).toEqual([])
    const c2 = report.nodes.find((n) => n.id === 'c2')
    expect(c2?.quote_span).toEqual({ start: 21, end: 36 })
  })

  it('fails and reports every node whose text is fabricated', () => {
    const graph: ClaimGraphOutput = {
      nodes: [
        node({ id: 'c1', text: 'Luận điểm của tôi', quote_span: { start: 0, end: 17 } }),
        node({ id: 'c2', text: 'câu này không tồn tại', quote_span: { start: 0, end: 5 } }),
        node({ id: 'c3', text: 'cũng không có', quote_span: { start: 0, end: 5 } }),
      ],
      edges: [],
      concepts: [],
    }
    const report = resolveClaimGraphSpans(graph, submission)
    expect(report.pass).toBe(false)
    expect(report.notFoundNodeIds).toEqual(['c2', 'c3'])
    // Only the genuinely verbatim node is returned in `nodes`.
    expect(report.nodes.map((n) => n.id)).toEqual(['c1'])
  })
})
