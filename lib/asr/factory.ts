import 'server-only'

import { AsrConfigurationError } from '@/lib/services/errors'
import Groq from 'groq-sdk'
import { GroqASRProvider } from './providers/groq'
import type { ASRProvider } from './types'

export function createASRProvider(environment: NodeJS.ProcessEnv = process.env): ASRProvider {
  const providerName = environment.ASR_PROVIDER?.trim().toLowerCase()
  if (providerName !== 'groq') throw new AsrConfigurationError()

  const apiKey = environment.ASR_API_KEY?.trim() || environment.GROQ_API_KEY?.trim()
  if (!apiKey) throw new AsrConfigurationError()

  return new GroqASRProvider(new Groq({ apiKey }))
}
