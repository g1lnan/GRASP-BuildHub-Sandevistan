import type Groq from 'groq-sdk'
import { toFile } from 'groq-sdk'
import { z } from 'zod'
import { confidenceFromSegments } from '../confidence'
import { type ASRProvider, type ASRTranscriptionOptions, baseAudioMimeType } from '../types'

const GROQ_ASR_MODEL = 'whisper-large-v3-turbo'

const groqTranscriptionSchema = z.object({
  text: z.string(),
  duration: z.number().nonnegative().optional(),
  segments: z
    .array(
      z.object({
        start: z.number(),
        end: z.number(),
        avg_logprob: z.number(),
        no_speech_prob: z.number(),
      }),
    )
    .optional(),
})

function extensionFor(mimeType: string | undefined): string {
  switch (baseAudioMimeType(mimeType ?? 'audio/webm')) {
    case 'audio/flac':
      return 'flac'
    case 'audio/m4a':
    case 'audio/mp4':
      return 'm4a'
    case 'audio/mpeg':
      return 'mp3'
    case 'audio/ogg':
      return 'ogg'
    case 'audio/wav':
      return 'wav'
    default:
      return 'webm'
  }
}

function promptFromHints(hints: readonly string[] | undefined): string | undefined {
  if (hints === undefined || hints.length === 0) return undefined
  const prompt = `Thuật ngữ môn học: ${hints.join(', ')}`
  return prompt.slice(0, 800)
}

export class GroqASRProvider implements ASRProvider {
  readonly name = 'groq'
  readonly model = GROQ_ASR_MODEL
  readonly costPerMinuteVnd = 18
  readonly minimumBillableSeconds = 10

  constructor(private readonly client: Groq) {}

  async transcribe(audio: Buffer, options: ASRTranscriptionOptions) {
    const mimeType = baseAudioMimeType(options.mimeType ?? 'audio/webm')
    const file = await toFile(audio, `turn.${extensionFor(mimeType)}`, { type: mimeType })
    const prompt = promptFromHints(options.hints)
    const raw: unknown = await this.client.audio.transcriptions.create(
      {
        file,
        model: this.model,
        language: options.languageCode,
        ...(prompt === undefined ? {} : { prompt }),
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
        temperature: 0,
      },
      { signal: options.signal },
    )
    const parsed = groqTranscriptionSchema.parse(raw)
    const segments =
      parsed.segments?.map((segment) => ({
        start: segment.start,
        end: segment.end,
        avgLogprob: segment.avg_logprob,
        noSpeechProb: segment.no_speech_prob,
      })) ?? []
    const inferredDuration = segments.at(-1)?.end ?? 0
    return {
      transcript: parsed.text.trim(),
      confidence: confidenceFromSegments(segments),
      durationSeconds: parsed.duration ?? inferredDuration,
    }
  }
}
