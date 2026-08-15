import type { ClaimGraphOutput, ClaimNodeOutput } from '@/lib/ai/schemas'

/**
 * Verifies and repairs `quote_span` on every Claim Graph node — FR-202 / DESIGN
 * §4.2. `quote_span` is load-bearing (a probe later quotes it back at the
 * student, FR-203), but the model is asked to self-report character offsets
 * over the whole submission, and it is unreliable at that arithmetic even when
 * `text` itself is genuinely verbatim. Recomputing the offset in code — rather
 * than trusting the model's count — is the same defence `citationsMatchTranscripts()`
 * (lib/domain/scoring.ts) applies to scoring citations. Pure and side-effect
 * free so the repair logic is unit-testable without a model call.
 */

export type ResolvedClaimNode = ClaimNodeOutput & {
  readonly quote_span: { readonly start: number; readonly end: number }
}

export type ClaimSpanResolution =
  /** The model's own offsets already pointed at `text`. Nothing to fix. */
  | { readonly status: 'exact'; readonly node: ResolvedClaimNode }
  /** `text` is a genuine verbatim substring, but at a different offset than claimed. */
  | { readonly status: 'relocated'; readonly node: ResolvedClaimNode }
  /** `text` is not found anywhere in the submission — a fabricated or edited quote. */
  | { readonly status: 'not_found'; readonly nodeId: string }

export function resolveClaimSpan(node: ClaimNodeOutput, submission: string): ClaimSpanResolution {
  const claimedSlice = submission.slice(node.quote_span.start, node.quote_span.end)
  if (claimedSlice === node.text) {
    return { status: 'exact', node: node as ResolvedClaimNode }
  }

  const index = submission.indexOf(node.text)
  if (index === -1) {
    return { status: 'not_found', nodeId: node.id }
  }

  return {
    status: 'relocated',
    node: { ...node, quote_span: { start: index, end: index + node.text.length } },
  }
}

export type ClaimGraphSpanReport = {
  /** All resolved nodes, in input order, for graphs with zero `not_found` nodes. */
  readonly nodes: readonly ResolvedClaimNode[]
  readonly relocatedNodeIds: readonly string[]
  readonly notFoundNodeIds: readonly string[]
  readonly pass: boolean
}

/** Resolves every node's span. `pass` is false if any node's text isn't a genuine substring. */
export function resolveClaimGraphSpans(
  graph: ClaimGraphOutput,
  submission: string,
): ClaimGraphSpanReport {
  const nodes: ResolvedClaimNode[] = []
  const relocatedNodeIds: string[] = []
  const notFoundNodeIds: string[] = []

  for (const node of graph.nodes) {
    const resolution = resolveClaimSpan(node, submission)
    if (resolution.status === 'not_found') {
      notFoundNodeIds.push(resolution.nodeId)
      continue
    }
    if (resolution.status === 'relocated') relocatedNodeIds.push(resolution.node.id)
    nodes.push(resolution.node)
  }

  return { nodes, relocatedNodeIds, notFoundNodeIds, pass: notFoundNodeIds.length === 0 }
}
