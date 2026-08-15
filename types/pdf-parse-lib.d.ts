/**
 * The pdf-parse package's index.js runs a debug harness that reads a bundled
 * test PDF when imported as the main module; importing the inner lib entry
 * avoids that. @types/pdf-parse only declares the top-level module, so mirror
 * its signature for the subpath.
 */
declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfParseResult {
    numpages: number
    numrender: number
    info: unknown
    metadata: unknown
    version: string
    text: string
  }
  function pdfParse(dataBuffer: Buffer): Promise<PdfParseResult>
  export = pdfParse
}
