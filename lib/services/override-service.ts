import { type ScoreDimensionKey, scoreDimensionKeys } from '@/lib/ai/scoring-schemas'
import type { Actor } from '@/lib/auth/identity'
import {
  AuthenticationRoleError,
  InvalidOverrideError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from './errors'

export type OverrideDimensions = Record<ScoreDimensionKey, number>

/** Authorisation + baseline needed to write an override for one session's score. */
export type OverrideAuthContext = {
  readonly scoreId: string
  readonly submissionId: string
  readonly courseLecturerId: string
  readonly institutionId: string
  /** The model's original per-dimension scores — always captured as `original`. */
  readonly originalDimensions: OverrideDimensions
}

export type OverrideRecord = {
  readonly scoreId: string
  readonly lecturerId: string
  readonly original: OverrideDimensions
  readonly overridden: OverrideDimensions
  readonly note: string | null
}

export interface OverrideRepository {
  findAuthContext(sessionId: string): Promise<OverrideAuthContext | null>
  upsertOverride(input: OverrideRecord): Promise<void>
}

export type SubmissionProductAuth = {
  readonly courseLecturerId: string
  readonly institutionId: string
}

export interface ProductScoreRepository {
  findSubmissionAuth(submissionId: string): Promise<SubmissionProductAuth | null>
  setProductScore(submissionId: string, productScore: number | null): Promise<void>
}

function roundOne(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10
}

function requireOwningLecturer(
  actor: Actor,
  context: { readonly courseLecturerId: string; readonly institutionId: string },
): void {
  if (actor.role !== 'lecturer') throw new AuthenticationRoleError()
  if (actor.id !== context.courseLecturerId || actor.institutionId !== context.institutionId) {
    throw new ResourceForbiddenError()
  }
}

function validateDimensions(input: Record<string, unknown>): OverrideDimensions {
  const result = {} as Record<ScoreDimensionKey, number>
  for (const key of scoreDimensionKeys) {
    const value = input[key]
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 1 || value > 5) {
      throw new InvalidOverrideError()
    }
    result[key] = roundOne(value)
  }
  return result
}

export type ApplyOverrideRequest = {
  readonly overrides: OverrideRepository
  readonly actor: Actor
  readonly sessionId: string
  readonly overridden: Record<string, unknown>
  readonly note?: string | null
}

/**
 * FR-406 — the calibration dataset. A lecturer adjusts any dimension; the row
 * persists {original, overridden, lecturer_id, note}. `original` is always the
 * model's baseline, so re-adjusting never loses the ground truth to compare against.
 */
export async function applyScoreOverride(request: ApplyOverrideRequest): Promise<OverrideRecord> {
  const context = await request.overrides.findAuthContext(request.sessionId)
  if (context === null) throw new ResourceNotFoundError()
  requireOwningLecturer(request.actor, context)

  const overridden = validateDimensions(request.overridden)
  const note = request.note === undefined || request.note === null ? null : request.note.trim()

  const record: OverrideRecord = {
    scoreId: context.scoreId,
    lecturerId: request.actor.id,
    original: context.originalDimensions,
    overridden,
    note: note === '' ? null : note,
  }
  await request.overrides.upsertOverride(record)
  return record
}

export type SetProductScoreRequest = {
  readonly submissions: ProductScoreRepository
  readonly actor: Actor
  readonly submissionId: string
  readonly productScore: number | null
}

export async function setSubmissionProductScore(request: SetProductScoreRequest): Promise<void> {
  const context = await request.submissions.findSubmissionAuth(request.submissionId)
  if (context === null) throw new ResourceNotFoundError()
  requireOwningLecturer(request.actor, context)

  if (request.productScore !== null) {
    const value = request.productScore
    if (!Number.isFinite(value) || value < 0 || value > 10) throw new InvalidOverrideError()
  }
  await request.submissions.setProductScore(
    request.submissionId,
    request.productScore === null ? null : roundOne(request.productScore),
  )
}
