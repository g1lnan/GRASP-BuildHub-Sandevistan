import type { FeedbackOutput } from '@/lib/ai/feedback-schemas'
import type { FeedbackTurnInput } from '@/lib/ai/feedback-types'

export function feedbackCitationsMatchSources(
  output: FeedbackOutput,
  sources: { readonly submissionText: string; readonly turns: readonly FeedbackTurnInput[] },
): boolean {
  const transcripts = new Map(sources.turns.map((turn) => [turn.ordinal, turn.transcript]))
  return [...output.strengths, ...output.gaps].every((item) =>
    item.citations.every((citation) => {
      if (citation.turnOrdinal === 0) return sources.submissionText.includes(citation.quote)
      return transcripts.get(citation.turnOrdinal)?.includes(citation.quote) === true
    }),
  )
}
