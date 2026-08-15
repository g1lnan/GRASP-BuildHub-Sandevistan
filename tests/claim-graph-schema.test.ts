import { ClaimGraphSchema } from '@/lib/ai/schemas'
import { describe, expect, it } from 'vitest'

const validGraph = {
  nodes: [
    {
      id: 'c1',
      kind: 'thesis',
      text: 'Chính sách này hiệu quả.',
      quote_span: { start: 0, end: 24 },
      concepts: ['chính sách'],
      confidence: 0.9,
    },
    {
      id: 'c2',
      kind: 'claim',
      text: 'Bằng chứng cho thấy chi phí giảm.',
      quote_span: { start: 25, end: 58 },
      concepts: ['chi phí'],
      confidence: 0.8,
    },
    {
      id: 'c3',
      kind: 'evidence',
      text: 'Số liệu năm 2025 giảm 12%.',
      quote_span: { start: 59, end: 85 },
      concepts: ['số liệu'],
      confidence: 0.7,
    },
  ],
  edges: [{ from: 'c3', to: 'c2', relation: 'supports' }],
  concepts: ['chính sách', 'chi phí', 'số liệu'],
}

describe('ClaimGraphSchema (DESIGN §4.2 contract)', () => {
  it('accepts a well-formed graph', () => {
    expect(ClaimGraphSchema.safeParse(validGraph).success).toBe(true)
  })

  it('requires at least three claim nodes', () => {
    const tooFew = { ...validGraph, nodes: validGraph.nodes.slice(0, 2) }
    expect(ClaimGraphSchema.safeParse(tooFew).success).toBe(false)
  })

  it('rejects an unknown node kind', () => {
    const badKind = {
      ...validGraph,
      nodes: [{ ...validGraph.nodes[0], kind: 'opinion' }, ...validGraph.nodes.slice(1)],
    }
    expect(ClaimGraphSchema.safeParse(badKind).success).toBe(false)
  })

  it('rejects an out-of-range confidence', () => {
    const badConfidence = {
      ...validGraph,
      nodes: [{ ...validGraph.nodes[0], confidence: 1.4 }, ...validGraph.nodes.slice(1)],
    }
    expect(ClaimGraphSchema.safeParse(badConfidence).success).toBe(false)
  })

  it('rejects an unknown edge relation', () => {
    const badEdge = { ...validGraph, edges: [{ from: 'c3', to: 'c2', relation: 'rebuts' }] }
    expect(ClaimGraphSchema.safeParse(badEdge).success).toBe(false)
  })
})
