import 'server-only'

import mammoth from 'mammoth'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import { countWords } from './word-count'

/**
 * Text ingestion for FR-201. Extracts plain text from a .docx (mammoth), a .pdf
 * (pdf-parse), or a pasted string, and reports the word count. The over-limit
 * decision lives in the submission service so it stays testable without file
 * fixtures; this module only turns bytes into text.
 */

export type SubmissionSource = 'docx' | 'pdf' | 'text'

export type ExtractedSubmission = {
  readonly source: SubmissionSource
  readonly text: string
  readonly wordCount: number
}

export class EmptySubmissionError extends Error {
  readonly name = 'EmptySubmissionError'
}

export class UnsupportedSourceError extends Error {
  readonly name = 'UnsupportedSourceError'
}

function normalise(raw: string): string {
  // Collapse Windows newlines and trim trailing whitespace; keep the interior
  // intact so quote_span offsets from the model line up with what we store.
  return raw.replace(/\r\n/g, '\n').trim()
}

export async function extractFromText(input: string): Promise<ExtractedSubmission> {
  const text = normalise(input)
  if (text.length === 0) throw new EmptySubmissionError()
  return { source: 'text', text, wordCount: countWords(text) }
}

export async function extractFromDocx(buffer: Buffer): Promise<ExtractedSubmission> {
  const result = await mammoth.extractRawText({ buffer })
  const text = normalise(result.value)
  if (text.length === 0) throw new EmptySubmissionError()
  return { source: 'docx', text, wordCount: countWords(text) }
}

export async function extractFromPdf(buffer: Buffer): Promise<ExtractedSubmission> {
  const result = await pdfParse(buffer)
  const text = normalise(result.text)
  if (text.length === 0) throw new EmptySubmissionError()
  return { source: 'pdf', text, wordCount: countWords(text) }
}

export async function extractSubmission(input: {
  readonly source: SubmissionSource
  readonly text?: string
  readonly buffer?: Buffer
}): Promise<ExtractedSubmission> {
  switch (input.source) {
    case 'text':
      return extractFromText(input.text ?? '')
    case 'docx':
      if (input.buffer === undefined) throw new EmptySubmissionError()
      return extractFromDocx(input.buffer)
    case 'pdf':
      if (input.buffer === undefined) throw new EmptySubmissionError()
      return extractFromPdf(input.buffer)
    default:
      throw new UnsupportedSourceError()
  }
}
