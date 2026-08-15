import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import {
  type EnrollmentRepository,
  type EnrollmentResult,
  enrollWithJoinCode,
  generateJoinCode,
} from '@/lib/services/course-service'
import { joinCodeSchema } from '@/lib/validation/inputs'
import { describe, expect, it } from 'vitest'

const student: Actor = {
  id: userIdSchema.parse('20000000-0000-4000-8000-000000000001'),
  institutionId: institutionIdSchema.parse('10000000-0000-4000-8000-000000000001'),
  role: 'student',
}

class EnrollmentRepositoryFake implements EnrollmentRepository {
  constructor(private readonly result: EnrollmentResult) {}

  async enroll(): Promise<EnrollmentResult> {
    return this.result
  }

  async listCoursesByStudent(): Promise<
    readonly {
      readonly courseId: string
      readonly course: import('@/lib/services/course-service').CourseDetailRecord
    }[]
  > {
    return []
  }

  async countByCourse(): Promise<number> {
    return 0
  }
}

describe('join-code enrollment', () => {
  it('generates exactly eight uppercase unambiguous characters', () => {
    // Given / When
    const codes = Array.from({ length: 100 }, generateJoinCode)

    // Then
    expect(codes.every((code) => joinCodeSchema.safeParse(code).success)).toBe(true)
  })

  it.each([
    ['not_found', 'ResourceNotFoundError'],
    ['forbidden', 'ResourceForbiddenError'],
    ['archived', 'CourseArchivedError'],
    ['revoked', 'JoinCodeRevokedError'],
    ['already_enrolled', 'AlreadyEnrolledError'],
  ] as const)('maps %s repository outcomes to %s', async (kind, errorName) => {
    // Given
    const enrollments = new EnrollmentRepositoryFake({ kind })

    // When
    const operation = enrollWithJoinCode({
      enrollments,
      actor: student,
      input: { joinCode: 'GRASP234' },
    })

    // Then
    await expect(operation).rejects.toMatchObject({ name: errorName })
  })

  it('completes when the atomic repository enrolls the student', async () => {
    // Given
    const enrollments = new EnrollmentRepositoryFake({ kind: 'enrolled' })

    // When
    const operation = enrollWithJoinCode({
      enrollments,
      actor: student,
      input: { joinCode: 'GRASP234' },
    })

    // Then
    await expect(operation).resolves.toBeUndefined()
  })
})
