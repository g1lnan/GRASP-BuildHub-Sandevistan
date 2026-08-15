export const ASR_MAX_DURATION_MS = 60_000
export const ASR_MAX_FILE_BYTES = 25 * 1024 * 1024
export const ASR_TIMEOUT_MS = 4_500

const supportedMimeTypes = new Set([
  'audio/flac',
  'audio/m4a',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
])

export type ASRResult = {
  readonly transcript: string
  readonly confidence: number
  readonly durationSeconds: number
}

export type ASRTranscriptionOptions = {
  readonly languageCode: 'vi'
  readonly hints?: readonly string[]
  readonly mimeType?: string
  readonly signal?: AbortSignal
}

export interface ASRProvider {
  readonly name: string
  readonly model: string
  readonly costPerMinuteVnd: number
  readonly minimumBillableSeconds: number
  transcribe(audio: Buffer, options: ASRTranscriptionOptions): Promise<ASRResult>
}

export function baseAudioMimeType(mimeType: string): string {
  return mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? ''
}

export function isSupportedAudioMimeType(mimeType: string): boolean {
  return supportedMimeTypes.has(baseAudioMimeType(mimeType))
}
