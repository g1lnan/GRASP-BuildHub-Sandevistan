'use client'

import { useCallback, useEffect, useRef } from 'react'

type PasteEvent = {
  readonly turnOrdinal: number
  readonly timestampMs: number
  readonly charCount: number
}

type TabSwitch = {
  readonly timestampMs: number
  readonly hiddenDurationMs: number
}

type TypingCadence = {
  readonly turnOrdinal: number
  readonly keystrokeCount: number
  readonly interKeystrokeIntervalsMs: number[]
  readonly compositionTimeMs: number
}

type Signals = {
  pasteEvents: PasteEvent[]
  tabSwitches: TabSwitch[]
  focusBlurCounts: { blurCount: number; focusCount: number }
  typingCadence: TypingCadence[]
}

export function useIntegritySignals(sessionId: string) {
  const signals = useRef<Signals>({
    pasteEvents: [],
    tabSwitches: [],
    focusBlurCounts: { blurCount: 0, focusCount: 0 },
    typingCadence: [],
  })
  const tabHiddenAt = useRef<number | null>(null)
  const currentTurn = useRef<{
    ordinal: number
    firstKeystrokeAt: number | null
    lastKeystrokeAt: number | null
    keystrokeCount: number
    intervals: number[]
  } | null>(null)

  // Tab visibility tracking
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        tabHiddenAt.current = Date.now()
      } else if (tabHiddenAt.current !== null) {
        const hiddenDurationMs = Date.now() - tabHiddenAt.current
        signals.current.tabSwitches.push({
          timestampMs: tabHiddenAt.current,
          hiddenDurationMs,
        })
        tabHiddenAt.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Focus/blur tracking
  useEffect(() => {
    function handleBlur() {
      signals.current.focusBlurCounts.blurCount += 1
    }
    function handleFocus() {
      signals.current.focusBlurCounts.focusCount += 1
    }
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const recordPaste = useCallback((turnOrdinal: number, charCount: number) => {
    signals.current.pasteEvents.push({
      turnOrdinal,
      timestampMs: Date.now(),
      charCount,
    })
  }, [])

  const recordKeystroke = useCallback(() => {
    const turn = currentTurn.current
    if (turn === null) return
    const now = Date.now()
    if (turn.firstKeystrokeAt === null) {
      turn.firstKeystrokeAt = now
    } else if (turn.lastKeystrokeAt !== null && turn.intervals.length < 500) {
      turn.intervals.push(now - turn.lastKeystrokeAt)
    }
    turn.lastKeystrokeAt = now
    turn.keystrokeCount += 1
  }, [])

  const startTurn = useCallback((ordinal: number) => {
    currentTurn.current = {
      ordinal,
      firstKeystrokeAt: null,
      lastKeystrokeAt: null,
      keystrokeCount: 0,
      intervals: [],
    }
  }, [])

  const endTurn = useCallback(() => {
    const turn = currentTurn.current
    if (turn === null) return
    const compositionTimeMs =
      turn.firstKeystrokeAt !== null && turn.lastKeystrokeAt !== null
        ? turn.lastKeystrokeAt - turn.firstKeystrokeAt
        : 0
    signals.current.typingCadence.push({
      turnOrdinal: turn.ordinal,
      keystrokeCount: turn.keystrokeCount,
      interKeystrokeIntervalsMs: turn.intervals,
      compositionTimeMs,
    })
    currentTurn.current = null
  }, [])

  const flush = useCallback(async () => {
    try {
      const snapshot = {
        pasteEvents:
          signals.current.pasteEvents.length > 0 ? [...signals.current.pasteEvents] : undefined,
        tabSwitches:
          signals.current.tabSwitches.length > 0 ? [...signals.current.tabSwitches] : undefined,
        focusBlurCounts:
          signals.current.focusBlurCounts.blurCount > 0 ||
          signals.current.focusBlurCounts.focusCount > 0
            ? { ...signals.current.focusBlurCounts }
            : undefined,
        typingCadence:
          signals.current.typingCadence.length > 0 ? [...signals.current.typingCadence] : undefined,
      }
      // Only send if there's actual data
      if (
        snapshot.pasteEvents === undefined &&
        snapshot.tabSwitches === undefined &&
        snapshot.focusBlurCounts === undefined &&
        snapshot.typingCadence === undefined
      ) {
        return
      }
      await fetch(`/api/sessions/${sessionId}/signals`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(snapshot),
      })
      // Clear sent data
      signals.current.pasteEvents = []
      signals.current.tabSwitches = []
      signals.current.focusBlurCounts = { blurCount: 0, focusCount: 0 }
      signals.current.typingCadence = []
    } catch {
      // Signal reporting failures are silently swallowed
    }
  }, [sessionId])

  // Flush on beforeunload
  useEffect(() => {
    function handleBeforeUnload() {
      const snapshot = {
        pasteEvents:
          signals.current.pasteEvents.length > 0 ? signals.current.pasteEvents : undefined,
        tabSwitches:
          signals.current.tabSwitches.length > 0 ? signals.current.tabSwitches : undefined,
        focusBlurCounts:
          signals.current.focusBlurCounts.blurCount > 0 ||
          signals.current.focusBlurCounts.focusCount > 0
            ? signals.current.focusBlurCounts
            : undefined,
        typingCadence:
          signals.current.typingCadence.length > 0 ? signals.current.typingCadence : undefined,
      }
      if (
        snapshot.pasteEvents !== undefined ||
        snapshot.tabSwitches !== undefined ||
        snapshot.focusBlurCounts !== undefined ||
        snapshot.typingCadence !== undefined
      ) {
        navigator.sendBeacon(`/api/sessions/${sessionId}/signals`, JSON.stringify(snapshot))
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [sessionId])

  return { recordPaste, recordKeystroke, startTurn, endTurn, flush }
}
