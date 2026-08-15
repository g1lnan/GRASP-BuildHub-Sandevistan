import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import {
  type AppealRecord,
  type AppealRepository,
  type AppealSessionAuth,
  type SessionStatus,
  submitAppeal,
} from '@/lib/services/appeal-service'
import { describe, expect, it } from 'vitest'

const institutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000001')
const studentId = userIdSchema.parse('20000000-0000-4000-8000-000000000002')
const otherStudentId = userIdSchema.parse('20000000-0000-4000-8000-000000000003')
const lecturerId = userIdSchema.parse('20000000-0000-4000-8000-000000000001')

const student: Actor = { id: studentId, institutionId, role: 'student' }
const otherStudent: Actor = { id: otherStudentId, institutionId, role: 'student' }
const lecturer: Actor = { id: lecturerId, institutionId, role: 'lecturer' }

class AppealRepositoryFake implements AppealRepository {
  saved: { sessionId: string; studentId: string; reason: string } | null = null
  constructor(private readonly context: AppealSessionAuth | null) {}
  async findSessionAuth(): Promise<AppealSessionAuth | null> {
    return this.context
  }
  async upsertOpenAppeal(input: {
    sessionId: string
    studentId: string
    reason: string
  }): Promise<AppealRecord> {
    this.saved = input
    return {
      id: 'appeal-1',
      sessionId: input.sessionId,
      studentId: input.studentId,
      reason: input.reason,
      status: 'open',
      resolution: null,
      createdAt: new Date('2026-07-26T00:00:00.000Z'),
    }
  }
}

function authFor(status: SessionStatus): AppealSessionAuth {
  return { studentId, institutionId, status }
}

const goodReason = 'Tôi muốn giảng viên xem xét lại kết quả này.'

describe('submitAppeal (FR-503)', () => {
  it('records an appeal on a completed session owned by the student', async () => {
    // Given
    const appeals = new AppealRepositoryFake(authFor('completed'))

    // When
    const appeal = await submitAppeal({
      appeals,
      actor: student,
      sessionId: 's1',
      reason: goodReason,
    })

    // Then
    expect(appeal.status).toBe('open')
    expect(appeals.saved).toEqual({ sessionId: 's1', studentId, reason: goodReason })
  })

  it('allows an appeal on an expired session', async () => {
    const appeals = new AppealRepositoryFake(authFor('expired'))
    await expect(
      submitAppeal({ appeals, actor: student, sessionId: 's1', reason: goodReason }),
    ).resolves.toMatchObject({ status: 'open' })
  })

  it('rejects a session that has not finished', async () => {
    const appeals = new AppealRepositoryFake(authFor('in_progress'))
    await expect(
      submitAppeal({ appeals, actor: student, sessionId: 's1', reason: goodReason }),
    ).rejects.toMatchObject({ name: 'AppealNotAllowedError' })
    expect(appeals.saved).toBeNull()
  })

  it('rejects a reason shorter than 10 characters', async () => {
    const appeals = new AppealRepositoryFake(authFor('completed'))
    await expect(
      submitAppeal({ appeals, actor: student, sessionId: 's1', reason: 'ngắn' }),
    ).rejects.toMatchObject({ name: 'InvalidAppealError' })
  })

  it('rejects a non-student actor', async () => {
    const appeals = new AppealRepositoryFake(authFor('completed'))
    await expect(
      submitAppeal({ appeals, actor: lecturer, sessionId: 's1', reason: goodReason }),
    ).rejects.toMatchObject({ name: 'AuthenticationRoleError' })
  })

  it('denies a student appealing another student session', async () => {
    const appeals = new AppealRepositoryFake(authFor('completed'))
    await expect(
      submitAppeal({ appeals, actor: otherStudent, sessionId: 's1', reason: goodReason }),
    ).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
  })

  it('returns not found when the session does not exist', async () => {
    const appeals = new AppealRepositoryFake(null)
    await expect(
      submitAppeal({ appeals, actor: student, sessionId: 'missing', reason: goodReason }),
    ).rejects.toMatchObject({ name: 'ResourceNotFoundError' })
  })
})
