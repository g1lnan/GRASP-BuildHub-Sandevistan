import { anthropicFollowUpModel } from '@/lib/ai/follow-up'
import { createASRProvider } from '@/lib/asr/factory'
import { ASR_MAX_FILE_BYTES, isSupportedAudioMimeType } from '@/lib/asr/types'
import {
  AuthenticationRequiredError,
  AuthorizationDeniedError,
  requireRole,
} from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleSessionRepository } from '@/lib/repositories/drizzle-sessions'
import { drizzleUsageRepository } from '@/lib/repositories/drizzle-usage'
import {
  AsrConfigurationError,
  AsrNoSpeechError,
  AsrTimeoutError,
  AsrTranscriptionError,
  AuthenticationRoleError,
  EmptyTurnTranscriptError,
  ResourceForbiddenError,
  ResourceNotFoundError,
  TurnConflictError,
  UnexpectedProbeError,
  UnsupportedAudioError,
} from '@/lib/services/errors'
import { submitTypedTurn, submitVoiceTurn } from '@/lib/session/runtime'
import { typedTurnInputSchema, voiceTurnInputSchema } from '@/lib/validation/inputs'
import { type NextRequest, NextResponse } from 'next/server'
import { ZodError, z } from 'zod'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const actor = await requireRole(['student'])
    const { sessionId } = z.object({ sessionId: z.string().uuid() }).parse(await params)
    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const input = voiceTurnInputSchema.parse({
        probeId: form.get('probeId'),
        durationMs: form.get('durationMs'),
      })
      const audio = form.get('audio')
      if (!(audio instanceof File)) throw new UnsupportedAudioError()
      if (audio.size === 0 || audio.size > ASR_MAX_FILE_BYTES) throw new UnsupportedAudioError()
      if (!isSupportedAudioMimeType(audio.type)) throw new UnsupportedAudioError()

      const result = await submitVoiceTurn({
        sessions: drizzleSessionRepository,
        usage: drizzleUsageRepository,
        asr: createASRProvider(),
        actor,
        sessionId,
        probeId: input.probeId,
        audio: Buffer.from(await audio.arrayBuffer()),
        mimeType: audio.type,
        durationMs: input.durationMs,
        followUpModel: anthropicFollowUpModel(),
      })
      return NextResponse.json(
        {
          session: result.session,
          acceptedTurn: {
            inputMode: 'voice',
            transcript: result.transcript,
            asrConfidence: result.asrConfidence,
            persisted: result.persisted,
          },
        },
        { status: 200 },
      )
    }

    const input = typedTurnInputSchema.parse(await request.json())
    return NextResponse.json(
      await submitTypedTurn({
        sessions: drizzleSessionRepository,
        actor,
        sessionId,
        probeId: input.probeId,
        text: input.text,
        now: new Date(),
        followUpModel: anthropicFollowUpModel(),
      }),
      { status: 200 },
    )
  } catch (error: unknown) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ error: vi.errors.authenticationRequired }, { status: 401 })
    }
    if (error instanceof AuthorizationDeniedError || error instanceof AuthenticationRoleError) {
      return NextResponse.json({ error: vi.errors.roleRequired }, { status: 403 })
    }
    if (error instanceof ResourceNotFoundError) {
      return NextResponse.json({ error: vi.errors.notFound }, { status: 404 })
    }
    if (error instanceof ResourceForbiddenError) {
      return NextResponse.json({ error: vi.errors.forbidden }, { status: 403 })
    }
    if (error instanceof UnexpectedProbeError) {
      return NextResponse.json({ error: vi.errors.unexpectedProbe }, { status: 409 })
    }
    if (error instanceof TurnConflictError) {
      return NextResponse.json({ error: vi.errors.turnConflict }, { status: 409 })
    }
    if (error instanceof EmptyTurnTranscriptError) {
      return NextResponse.json({ error: vi.errors.emptyAnswer }, { status: 422 })
    }
    if (error instanceof UnsupportedAudioError) {
      return NextResponse.json({ error: vi.errors.unsupportedAudio }, { status: 400 })
    }
    if (error instanceof AsrNoSpeechError) {
      return NextResponse.json({ error: vi.errors.noSpeechDetected }, { status: 422 })
    }
    if (error instanceof AsrTimeoutError) {
      return NextResponse.json({ error: vi.errors.asrTimeout }, { status: 504 })
    }
    if (error instanceof AsrConfigurationError || error instanceof AsrTranscriptionError) {
      return NextResponse.json({ error: vi.errors.asrUnavailable }, { status: 503 })
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: vi.errors.invalidInput }, { status: 400 })
    }
    return NextResponse.json({ error: vi.errors.serverError }, { status: 500 })
  }
}
