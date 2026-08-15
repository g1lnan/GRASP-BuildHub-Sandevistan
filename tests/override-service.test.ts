import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import {
  type OverrideAuthContext,
  type OverrideDimensions,
  type OverrideRecord,
  type OverrideRepository,
  type ProductScoreRepository,
  type SubmissionProductAuth,
  applyScoreOverride,
  setSubmissionProductScore,
} from '@/lib/services/override-service'
import { describe, expect, it } from 'vitest'

const institutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000001')
const lecturerId = userIdSchema.parse('20000000-0000-4000-8000-000000000001')
const otherLecturerId = userIdSchema.parse('20000000-0000-4000-8000-000000000099')
const studentId = userIdSchema.parse('20000000-0000-4000-8000-000000000002')

const lecturer: Actor = { id: lecturerId, institutionId, role: 'lecturer' }
const otherLecturer: Actor = { id: otherLecturerId, institutionId, role: 'lecturer' }
const student: Actor = { id: studentId, institutionId, role: 'student' }

const baseline: OverrideDimensions = {
  d1Recall: 3,
  d2Explanation: 3,
  d3Application: 3,
  d4Evaluation: 3,
  d5Metacognition: 3,
}

class OverrideRepositoryFake implements OverrideRepository {
  saved: OverrideRecord | null = null
  constructor(private readonly context: OverrideAuthContext | null) {}
  async findAuthContext(): Promise<OverrideAuthContext | null> {
    return this.context
  }
  async upsertOverride(input: OverrideRecord): Promise<void> {
    this.saved = input
  }
}

const authContext: OverrideAuthContext = {
  scoreId: 'b0000000-0000-4000-8000-000000000001',
  submissionId: '60000000-0000-4000-8000-000000000001',
  courseLecturerId: lecturerId,
  institutionId,
  originalDimensions: baseline,
}

const validOverride: OverrideDimensions = {
  d1Recall: 4,
  d2Explanation: 3.5,
  d3Application: 4,
  d4Evaluation: 3,
  d5Metacognition: 4.5,
}

describe('applyScoreOverride', () => {
  it('persists original baseline and overridden values for the owning lecturer', async () => {
    // Given
    const overrides = new OverrideRepositoryFake(authContext)

    // When
    const record = await applyScoreOverride({
      overrides,
      actor: lecturer,
      sessionId: 'session-1',
      overridden: validOverride,
      note: '  cần trao đổi thêm  ',
    })

    // Then
    expect(record.original).toEqual(baseline)
    expect(record.overridden).toEqual(validOverride)
    expect(record.lecturerId).toEqual(lecturerId)
    expect(record.note).toEqual('cần trao đổi thêm')
    expect(overrides.saved).toEqual(record)
  })

  it('denies a lecturer who does not own the course', async () => {
    // Given
    const overrides = new OverrideRepositoryFake(authContext)

    // When
    const operation = applyScoreOverride({
      overrides,
      actor: otherLecturer,
      sessionId: 'session-1',
      overridden: validOverride,
    })

    // Then
    await expect(operation).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
    expect(overrides.saved).toBeNull()
  })

  it('rejects a non-lecturer actor', async () => {
    // Given
    const overrides = new OverrideRepositoryFake(authContext)

    // When
    const operation = applyScoreOverride({
      overrides,
      actor: student,
      sessionId: 'session-1',
      overridden: validOverride,
    })

    // Then
    await expect(operation).rejects.toMatchObject({ name: 'AuthenticationRoleError' })
  })

  it('rejects a dimension outside the 1..5 range', async () => {
    // Given
    const overrides = new OverrideRepositoryFake(authContext)

    // When
    const operation = applyScoreOverride({
      overrides,
      actor: lecturer,
      sessionId: 'session-1',
      overridden: { ...validOverride, d3Application: 6 },
    })

    // Then
    await expect(operation).rejects.toMatchObject({ name: 'InvalidOverrideError' })
  })

  it('returns not found when the session has no score context', async () => {
    // Given
    const overrides = new OverrideRepositoryFake(null)

    // When
    const operation = applyScoreOverride({
      overrides,
      actor: lecturer,
      sessionId: 'missing',
      overridden: validOverride,
    })

    // Then
    await expect(operation).rejects.toMatchObject({ name: 'ResourceNotFoundError' })
  })
})

class ProductScoreRepositoryFake implements ProductScoreRepository {
  saved: number | null | undefined = undefined
  constructor(private readonly auth: SubmissionProductAuth | null) {}
  async findSubmissionAuth(): Promise<SubmissionProductAuth | null> {
    return this.auth
  }
  async setProductScore(_submissionId: string, productScore: number | null): Promise<void> {
    this.saved = productScore
  }
}

const productAuth: SubmissionProductAuth = { courseLecturerId: lecturerId, institutionId }

describe('setSubmissionProductScore', () => {
  it('sets a product score within range for the owning lecturer', async () => {
    // Given
    const submissions = new ProductScoreRepositoryFake(productAuth)

    // When
    await setSubmissionProductScore({
      submissions,
      actor: lecturer,
      submissionId: 's1',
      productScore: 7.5,
    })

    // Then
    expect(submissions.saved).toEqual(7.5)
  })

  it('rejects a product score above 10', async () => {
    // Given
    const submissions = new ProductScoreRepositoryFake(productAuth)

    // When
    const operation = setSubmissionProductScore({
      submissions,
      actor: lecturer,
      submissionId: 's1',
      productScore: 11,
    })

    // Then
    await expect(operation).rejects.toMatchObject({ name: 'InvalidOverrideError' })
  })

  it('denies a lecturer who does not own the course', async () => {
    // Given
    const submissions = new ProductScoreRepositoryFake(productAuth)

    // When
    const operation = setSubmissionProductScore({
      submissions,
      actor: otherLecturer,
      submissionId: 's1',
      productScore: 7,
    })

    // Then
    await expect(operation).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
  })
})
