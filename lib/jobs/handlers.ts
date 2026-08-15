import 'server-only'

import { anthropicClaimGraphModel } from '@/lib/ai/claimgraph'
import { anthropicProbeModel } from '@/lib/ai/probes'
import { drizzleClaimGraphRepository } from '@/lib/repositories/drizzle-claim-graphs'
import { drizzleProbeRepository } from '@/lib/repositories/drizzle-probes'
import { drizzleAnalysisSubmissionRepository } from '@/lib/repositories/drizzle-submissions'
import { drizzleUsageRepository } from '@/lib/repositories/drizzle-usage'
import { analyzeSubmission } from '@/lib/services/analysis-service'
import type { JobHandlers, JobPayload } from './queue'

function requireSubmissionId(payload: JobPayload): string {
  const value = payload.submissionId
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('analyze_submission payload missing submissionId')
  }
  return value
}

/** Production handler wiring: real repositories + the Anthropic-backed models. */
export const jobHandlers: JobHandlers = {
  analyze_submission: async (payload) => {
    await analyzeSubmission({
      submissions: drizzleAnalysisSubmissionRepository,
      claimGraphs: drizzleClaimGraphRepository,
      probes: drizzleProbeRepository,
      usage: drizzleUsageRepository,
      claimGraphModel: anthropicClaimGraphModel(),
      probeModel: anthropicProbeModel(),
      submissionId: requireSubmissionId(payload),
    })
  },
}
