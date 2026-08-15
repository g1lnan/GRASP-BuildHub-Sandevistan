import { audioDurationSeconds } from '@/lib/asr/audio-duration'
import { confidenceFromSegments } from '@/lib/asr/confidence'
import { GroqASRProvider } from '@/lib/asr/providers/groq'
import { transcribeWithTimeout } from '@/lib/asr/transcribe'
import type { ASRProvider } from '@/lib/asr/types'
import { type UsageEventRow, type UsageRepository, recordASRUsage } from '@/lib/usage/record'
import type Groq from 'groq-sdk'
import { describe, expect, it, vi } from 'vitest'

class UsageRepositoryFake implements UsageRepository {
  readonly rows: UsageEventRow[] = []

  async record(row: UsageEventRow): Promise<void> {
    this.rows.push(row)
  }
}

describe('ASR confidence', () => {
  it('weights Whisper confidence metadata by segment duration', () => {
    const confidence = confidenceFromSegments([
      { start: 0, end: 1, avgLogprob: Math.log(0.5), noSpeechProb: 0 },
      { start: 1, end: 4, avgLogprob: Math.log(0.9), noSpeechProb: 0.1 },
    ])

    expect(confidence).toBeCloseTo(0.7325, 4)
  })

  it('uses a neutral recorded confidence when segment metadata is absent', () => {
    expect(confidenceFromSegments([])).toBe(0.5)
  })
})

describe('server-side audio duration', () => {
  it('reads declared and observed WebM duration without trusting the client', () => {
    const duration = Buffer.alloc(8)
    duration.writeDoubleBE(12_500)
    const webm = Buffer.concat([
      Buffer.from([0x2a, 0xd7, 0xb1, 0x83, 0x0f, 0x42, 0x40]),
      Buffer.from([0x44, 0x89, 0x88]),
      duration,
    ])

    expect(audioDurationSeconds(webm, 'audio/webm;codecs=opus')).toBeCloseTo(12.5)
  })

  it('measures all unknown-sized MediaRecorder WebM clusters', () => {
    const cluster = (timecode: number, relativeTimecode: number) => {
      const timecodeBytes = Buffer.alloc(2)
      timecodeBytes.writeUInt16BE(timecode)
      const relativeBytes = Buffer.alloc(2)
      relativeBytes.writeInt16BE(relativeTimecode)
      return Buffer.concat([
        Buffer.from([0x1f, 0x43, 0xb6, 0x75, 0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
        Buffer.from([0xe7, 0x82]),
        timecodeBytes,
        Buffer.from([0xa3, 0x84, 0x81]),
        relativeBytes,
        Buffer.from([0x80]),
      ])
    }
    const webm = Buffer.concat([
      Buffer.from([0x2a, 0xd7, 0xb1, 0x83, 0x0f, 0x42, 0x40]),
      cluster(0, 60),
      cluster(700, 50),
    ])

    expect(audioDurationSeconds(webm, 'audio/webm;codecs=opus')).toBeCloseTo(0.75)
  })

  it('does not mistake Cluster ID bytes inside a known-sized block for a boundary', () => {
    const firstContent = Buffer.concat([
      Buffer.from([0xe7, 0x82, 0x00, 0x00]),
      Buffer.from([0xa3, 0x84, 0x81, 0x03, 0xe8, 0x80]),
      Buffer.from([0xa3, 0x89, 0x81, 0x03, 0xe8, 0x80, 0x1f, 0x43, 0xb6, 0x75, 0x00]),
    ])
    const secondContent = Buffer.from([0xe7, 0x82, 0xfd, 0xe8, 0xa3, 0x84, 0x81, 0x03, 0xe8, 0x80])
    const knownCluster = (content: Buffer) =>
      Buffer.concat([Buffer.from([0x1f, 0x43, 0xb6, 0x75, 0x80 | content.length]), content])
    const webm = Buffer.concat([
      Buffer.from([0x2a, 0xd7, 0xb1, 0x83, 0x0f, 0x42, 0x40]),
      knownCluster(firstContent),
      knownCluster(secondContent),
    ])

    expect(audioDurationSeconds(webm, 'audio/webm;codecs=opus')).toBeCloseTo(66)
  })

  it('reads WAV duration from server-visible byte rate and data length', () => {
    const pcmBytes = Buffer.alloc(32_000)
    const wav = Buffer.alloc(44 + pcmBytes.length)
    wav.write('RIFF', 0)
    wav.writeUInt32LE(wav.length - 8, 4)
    wav.write('WAVE', 8)
    wav.write('fmt ', 12)
    wav.writeUInt32LE(16, 16)
    wav.writeUInt16LE(1, 20)
    wav.writeUInt16LE(1, 22)
    wav.writeUInt32LE(16_000, 24)
    wav.writeUInt32LE(32_000, 28)
    wav.writeUInt16LE(2, 32)
    wav.writeUInt16LE(16, 34)
    wav.write('data', 36)
    wav.writeUInt32LE(pcmBytes.length, 40)
    pcmBytes.copy(wav, 44)

    expect(audioDurationSeconds(wav, 'audio/wav')).toBe(1)
  })

  it('rejects generic Ogg streams whose codec granule rate is unknown', () => {
    const ogg = Buffer.alloc(27)
    ogg.write('OggS', 0)
    ogg.writeBigUInt64LE(2_880_000n, 6)

    expect(() => audioDurationSeconds(ogg, 'audio/ogg')).toThrowError(
      expect.objectContaining({ name: 'UnsupportedAudioError' }),
    )
  })

  it('rejects a non-Opus Ogg stream with a spoofed OpusHead body substring', () => {
    const ogg = Buffer.alloc(50)
    ogg.write('OggS', 0)
    ogg[5] = 0x02
    ogg.writeBigUInt64LE(2_880_000n, 6)
    ogg.writeUInt32LE(7, 14)
    ogg[26] = 1
    ogg[27] = 14
    ogg.write('vorbisOpusHead', 28)

    expect(() => audioDurationSeconds(ogg, 'audio/ogg')).toThrowError(
      expect.objectContaining({ name: 'UnsupportedAudioError' }),
    )
  })
})

describe('GroqASRProvider', () => {
  it('requests Vietnamese verbose transcription with vocabulary hints', async () => {
    const create = vi.fn().mockResolvedValue({
      text: 'Đây là câu trả lời.',
      duration: 12,
      segments: [
        {
          start: 0,
          end: 12,
          avg_logprob: Math.log(0.9),
          no_speech_prob: 0.05,
        },
      ],
    })
    const client = { audio: { transcriptions: { create } } } as unknown as Groq
    const provider = new GroqASRProvider(client)
    const signal = new AbortController().signal

    const result = await provider.transcribe(Buffer.from('audio'), {
      languageCode: 'vi',
      hints: ['quản trị chiến lược', 'lợi thế cạnh tranh'],
      mimeType: 'audio/webm;codecs=opus',
      signal,
    })

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'whisper-large-v3-turbo',
        language: 'vi',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
        prompt: expect.stringContaining('quản trị chiến lược'),
      }),
      { signal },
    )
    expect(result).toMatchObject({
      transcript: 'Đây là câu trả lời.',
      durationSeconds: 12,
    })
    expect(result.confidence).toBeCloseTo(0.855, 3)
  })
})

describe('ASR timeout and usage', () => {
  it('aborts providers that exceed the configured deadline', async () => {
    let capturedSignal: AbortSignal | undefined
    const provider: ASRProvider = {
      name: 'slow',
      model: 'slow-asr',
      costPerMinuteVnd: 10,
      minimumBillableSeconds: 0,
      async transcribe(_audio, options) {
        capturedSignal = options.signal
        return new Promise(() => undefined)
      },
    }

    await expect(
      transcribeWithTimeout({
        provider,
        audio: Buffer.from('audio'),
        options: { languageCode: 'vi' },
        timeoutMs: 5,
      }),
    ).rejects.toMatchObject({ name: 'AsrTimeoutError' })
    expect(capturedSignal?.aborted).toBe(true)
  })

  it('records actual audio duration and the provider minimum billable duration', async () => {
    const usage = new UsageRepositoryFake()

    const row = await recordASRUsage({
      usage,
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
      audioSeconds: 4,
      costPerMinuteVnd: 18,
      minimumBillableSeconds: 10,
      submissionId: '60000000-0000-4000-8000-000000000001',
      sessionId: '80000000-0000-4000-8000-000000000001',
    })

    expect(row).toMatchObject({
      stage: 'asr',
      audioSeconds: 4,
      costVnd: 3,
      inputTokens: 0,
      outputTokens: 0,
    })
    expect(usage.rows).toEqual([row])
  })
})
