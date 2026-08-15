import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import {
  type NewSubmission,
  type PublishableAssignment,
  type SubmissionAssignmentRepository,
  type SubmissionAuthRecord,
  type SubmissionEnrollmentRepository,
  type SubmissionRecord,
  type SubmissionRepository,
  createSubmission,
  getSubmissionStatus,
} from '@/lib/services/submission-service'
import { describe, expect, it } from 'vitest'

const institutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000001')
const otherInstitutionId = institutionIdSchema.parse('10000000-0000-4000-8000-0000000000ff')
const lecturerId = userIdSchema.parse('20000000-0000-4000-8000-000000000001')
const studentAId = userIdSchema.parse('20000000-0000-4000-8000-000000000002')
const studentBId = userIdSchema.parse('20000000-0000-4000-8000-000000000003')

const studentA: Actor = { id: studentAId, institutionId, role: 'student' }
const studentB: Actor = { id: studentBId, institutionId, role: 'student' }
const lecturer: Actor = { id: lecturerId, institutionId, role: 'lecturer' }

const assignmentId = '50000000-0000-4000-8000-000000000001'
const courseId = '30000000-0000-4000-8000-000000000001'
const submissionId = '60000000-0000-4000-8000-000000000001'

const publishedAssignment: PublishableAssignment = {
  id: assignmentId,
  courseId,
  institutionId,
  publishedAt: new Date('2026-07-01T00:00:00.000Z'),
}

class SubmissionRepositoryFake implements SubmissionRepository {
  created: NewSubmission | null = null
  constructor(private readonly authRecord: SubmissionAuthRecord | null = null) {}
  async create(input: NewSubmission): Promise<SubmissionRecord> {
    this.created = input
    return {
      id: submissionId,
      assignmentId: input.assignmentId,
      studentId: input.studentId,
      status: 'pending',
    }
  }
  async findAuthById(): Promise<SubmissionAuthRecord | null> {
    return this.authRecord
  }
}

class AssignmentRepositoryFake implements SubmissionAssignmentRepository {
  constructor(private readonly assignment: PublishableAssignment | null) {}
  async findPublishable(): Promise<PublishableAssignment | null> {
    return this.assignment
  }
}

class EnrollmentRepositoryFake implements SubmissionEnrollmentRepository {
  constructor(private readonly enrolled: boolean) {}
  async isEnrolled(): Promise<boolean> {
    return this.enrolled
  }
}

const goodText = { source: 'text' as const, text: 'Luận điểm của tôi.', wordCount: 4 }
const now = new Date('2026-07-25T00:00:00.000Z')

function ownedSubmissionAuth(studentId: string): SubmissionAuthRecord {
  return {
    id: submissionId,
    assignmentId,
    studentId,
    status: 'ready',
    error: null,
    wordCount: 4,
    createdAt: now,
    courseId,
    courseLecturerId: lecturerId,
    institutionId,
  }
}

describe('createSubmission', () => {
  it('creates a pending submission for an enrolled student on a published assignment', async () => {
    const submissions = new SubmissionRepositoryFake()
    const result = await createSubmission({
      submissions,
      assignments: new AssignmentRepositoryFake(publishedAssignment),
      enrollments: new EnrollmentRepositoryFake(true),
      actor: studentA,
      assignmentId,
      extracted: goodText,
      now,
    })
    expect(result.status).toBe('pending')
    expect(submissions.created?.studentId).toBe(studentAId)
  })

  it('rejects a submission over the 20,000-word limit', async () => {
    const operation = createSubmission({
      submissions: new SubmissionRepositoryFake(),
      assignments: new AssignmentRepositoryFake(publishedAssignment),
      enrollments: new EnrollmentRepositoryFake(true),
      actor: studentA,
      assignmentId,
      extracted: { source: 'text', text: 'x', wordCount: 20_001 },
      now,
    })
    await expect(operation).rejects.toMatchObject({ name: 'WordLimitExceededError' })
  })

  it('rejects a submission to an unpublished assignment', async () => {
    const operation = createSubmission({
      submissions: new SubmissionRepositoryFake(),
      assignments: new AssignmentRepositoryFake({ ...publishedAssignment, publishedAt: null }),
      enrollments: new EnrollmentRepositoryFake(true),
      actor: studentA,
      assignmentId,
      extracted: goodText,
      now,
    })
    await expect(operation).rejects.toMatchObject({ name: 'AssignmentNotPublishedError' })
  })

  it('rejects a submission from a student not enrolled in the course', async () => {
    const operation = createSubmission({
      submissions: new SubmissionRepositoryFake(),
      assignments: new AssignmentRepositoryFake(publishedAssignment),
      enrollments: new EnrollmentRepositoryFake(false),
      actor: studentA,
      assignmentId,
      extracted: goodText,
      now,
    })
    await expect(operation).rejects.toMatchObject({ name: 'NotEnrolledError' })
  })

  it('rejects a non-student actor', async () => {
    const operation = createSubmission({
      submissions: new SubmissionRepositoryFake(),
      assignments: new AssignmentRepositoryFake(publishedAssignment),
      enrollments: new EnrollmentRepositoryFake(true),
      actor: lecturer,
      assignmentId,
      extracted: goodText,
      now,
    })
    await expect(operation).rejects.toMatchObject({ name: 'AuthenticationRoleError' })
  })
})

describe('getSubmissionStatus authorization', () => {
  it("denies student B reading student A's submission", async () => {
    const submissions = new SubmissionRepositoryFake(ownedSubmissionAuth(studentAId))
    const operation = getSubmissionStatus({ submissions, actor: studentB, submissionId })
    await expect(operation).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
  })

  it('lets a student read their own submission', async () => {
    const submissions = new SubmissionRepositoryFake(ownedSubmissionAuth(studentAId))
    const status = await getSubmissionStatus({ submissions, actor: studentA, submissionId })
    expect(status.status).toBe('ready')
    expect(status.studentId).toBe(studentAId)
  })

  it('lets the course lecturer read a submission in their course', async () => {
    const submissions = new SubmissionRepositoryFake(ownedSubmissionAuth(studentAId))
    const status = await getSubmissionStatus({ submissions, actor: lecturer, submissionId })
    expect(status.id).toBe(submissionId)
  })

  it('denies an actor from another institution', async () => {
    const submissions = new SubmissionRepositoryFake(ownedSubmissionAuth(studentAId))
    const outsider: Actor = { id: lecturerId, institutionId: otherInstitutionId, role: 'lecturer' }
    const operation = getSubmissionStatus({ submissions, actor: outsider, submissionId })
    await expect(operation).rejects.toMatchObject({ name: 'ResourceForbiddenError' })
  })

  it('returns not found for a missing submission', async () => {
    const submissions = new SubmissionRepositoryFake(null)
    const operation = getSubmissionStatus({ submissions, actor: studentA, submissionId })
    await expect(operation).rejects.toMatchObject({ name: 'ResourceNotFoundError' })
  })
})
