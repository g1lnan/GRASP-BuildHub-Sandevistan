import { z } from 'zod'

export const pasteEventSchema = z.object({
  turnOrdinal: z.number().int().positive(),
  timestampMs: z.number(),
  charCount: z.number().int().nonnegative(),
})

export const tabSwitchSchema = z.object({
  timestampMs: z.number(),
  hiddenDurationMs: z.number().int().nonnegative(),
})

export const typingCadenceSchema = z.object({
  turnOrdinal: z.number().int().positive(),
  keystrokeCount: z.number().int().nonnegative(),
  interKeystrokeIntervalsMs: z.array(z.number()).max(500),
  compositionTimeMs: z.number().int().nonnegative(),
})

export const focusBlurSchema = z.object({
  blurCount: z.number().int().nonnegative(),
  focusCount: z.number().int().nonnegative(),
})

export const integritySignalsSchema = z.object({
  pasteEvents: z.array(pasteEventSchema).max(50).optional(),
  tabSwitches: z.array(tabSwitchSchema).max(200).optional(),
  focusBlurCounts: focusBlurSchema.optional(),
  typingCadence: z.array(typingCadenceSchema).max(20).optional(),
})

export type PasteEvent = z.infer<typeof pasteEventSchema>
export type TabSwitch = z.infer<typeof tabSwitchSchema>
export type TypingCadence = z.infer<typeof typingCadenceSchema>
export type FocusBlurCounts = z.infer<typeof focusBlurSchema>
export type IntegritySignals = z.infer<typeof integritySignalsSchema>
