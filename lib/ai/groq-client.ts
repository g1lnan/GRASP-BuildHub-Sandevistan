import 'server-only'

import Groq from 'groq-sdk'

export { GROQ_MODELS, type GroqModelId } from './models'

let client: Groq | null = null

/** Lazily construct the shared Groq client (reads GROQ_API_KEY). Lazy so builds
 * and unit tests that never touch the model don't need the key. */
export function groq(): Groq {
  if (client === null) client = new Groq()
  return client
}
