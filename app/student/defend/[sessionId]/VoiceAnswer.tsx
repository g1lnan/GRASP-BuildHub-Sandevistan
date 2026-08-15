'use client'

import { vi } from '@/lib/i18n/vi'
import { useEffect, useMemo, useRef, useState } from 'react'

const recordingMimeTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
] as const

function supportedMimeType(): string | undefined {
  return recordingMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType))
}

function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

type Props = {
  readonly pending: boolean
  readonly sessionExpired: boolean
  readonly onSubmit: (audio: Blob, durationMs: number) => Promise<boolean>
  readonly onError: (message: string) => void
}

export function VoiceAnswer({ pending, sessionExpired, onSubmit, onError }: Props) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const stopTimerRef = useRef<number | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audio, setAudio] = useState<Blob | null>(null)
  const [durationMs, setDurationMs] = useState(0)

  const previewUrl = useMemo(() => (audio === null ? null : URL.createObjectURL(audio)), [audio])

  useEffect(() => {
    if (previewUrl === null) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => {
      setRecordingSeconds(Math.min(60, Math.floor((Date.now() - startedAtRef.current) / 1000)))
    }, 250)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    return () => {
      if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current)
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      for (const track of streamRef.current?.getTracks() ?? []) track.stop()
    }
  }, [])

  function stopRecording() {
    if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current)
    stopTimerRef.current = null
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  async function startRecording() {
    if (
      typeof MediaRecorder === 'undefined' ||
      navigator.mediaDevices?.getUserMedia === undefined
    ) {
      onError(vi.errors.voiceUnavailable)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = supportedMimeType()
      const recorder =
        mimeType === undefined ? new MediaRecorder(stream) : new MediaRecorder(stream, { mimeType })
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      startedAtRef.current = Date.now()
      setAudio(null)
      setDurationMs(0)
      setRecordingSeconds(0)
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const measuredDuration = Math.min(60_000, Math.max(1, Date.now() - startedAtRef.current))
        const recorded = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        })
        for (const track of stream.getTracks()) track.stop()
        streamRef.current = null
        recorderRef.current = null
        setRecording(false)
        setDurationMs(measuredDuration)
        if (recorded.size > 0) setAudio(recorded)
        else onError(vi.errors.noSpeechDetected)
      }
      recorder.start(250)
      setRecording(true)
      stopTimerRef.current = window.setTimeout(stopRecording, 60_000)
    } catch {
      onError(vi.errors.microphonePermission)
    }
  }

  async function submitRecording() {
    if (audio === null || durationMs <= 0) return
    const submitted = await onSubmit(audio, durationMs)
    if (submitted) {
      setAudio(null)
      setDurationMs(0)
      setRecordingSeconds(0)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
      <div className="card card--soft" style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, marginBottom: 'var(--s-2)' }}>
          {recording ? vi.defense.recording : vi.defense.voiceInstructions}
        </div>
        <div data-numeric style={{ color: 'var(--ink-soft)', marginBottom: 'var(--s-4)' }}>
          {formatRecordingTime(recordingSeconds)} / 1:00
        </div>
        {recording ? (
          <button type="button" className="btn3d btn3d--wide" onClick={stopRecording}>
            {vi.defense.stopRecording}
          </button>
        ) : (
          <button
            type="button"
            className="btn3d btn3d--wide"
            onClick={startRecording}
            disabled={pending || sessionExpired}
          >
            {audio === null ? vi.defense.startRecording : vi.defense.recordAgain}
          </button>
        )}
      </div>

      {previewUrl !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
          <div className="label">{vi.defense.recordingPreview}</div>
          <audio controls src={previewUrl} style={{ width: '100%' }}>
            <track kind="captions" />
          </audio>
        </div>
      )}

      <button
        type="button"
        className="btn3d btn3d--wide"
        disabled={pending || audio === null || recording || sessionExpired}
        onClick={submitRecording}
      >
        {pending ? vi.defense.transcribing : vi.defense.submitRecording}
      </button>
    </div>
  )
}
