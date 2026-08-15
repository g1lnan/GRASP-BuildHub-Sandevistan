import { AsrTimeoutError, AsrTranscriptionError } from '@/lib/services/errors'
import { type ASRProvider, type ASRTranscriptionOptions, ASR_TIMEOUT_MS } from './types'

export async function transcribeWithTimeout(params: {
  readonly provider: ASRProvider
  readonly audio: Buffer
  readonly options: Omit<ASRTranscriptionOptions, 'signal'>
  readonly timeoutMs?: number
}): Promise<Awaited<ReturnType<ASRProvider['transcribe']>>> {
  const controller = new AbortController()
  const timeoutMs = params.timeoutMs ?? ASR_TIMEOUT_MS
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      controller.abort()
      reject(new AsrTimeoutError())
    }, timeoutMs)
  })

  try {
    return await Promise.race([
      params.provider.transcribe(params.audio, {
        ...params.options,
        signal: controller.signal,
      }),
      timeout,
    ])
  } catch (error: unknown) {
    if (error instanceof AsrTimeoutError) throw error
    throw new AsrTranscriptionError('ASR transcription failed', { cause: error })
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
  }
}
