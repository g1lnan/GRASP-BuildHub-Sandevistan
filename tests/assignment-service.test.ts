import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import {
  type AssignmentCourseRepository,
  type AssignmentRecord,
  type AssignmentRepository,
  listStudentAssignments,
  setAssignmentPublished,
} from '@/lib/services/assignment-service'
import type { CourseRecord } from '@/lib/services/course-service'
import { describe, expect, it } from 'vitest'

const institutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000001')
const lecturerId = userIdSchema.parse('20000000-0000-4000-8000-000000000001')
const studentId = userIdSchema.parse('20000000-0000-4000-8000-000000000002')
const lecturer: Actor = { id: lecturerId, institutionId, role: 'lecturer' }
const student: Actor = { id: studentId, institutionId, role: 'student' }
const assignment: AssignmentRecord = {
  id: '50000000-0000-4000-8000-000000000001',
  courseId: '30000000-0000-4000-8000-000000000001',
  publishedAt: null,
}

const detailBase = {
  title: 'Phân tích lập luận',
  prompt: 'Trình bày luận điểm.',
  dueAt: new Date('2026-09-30T16:59:59.000Z'),
  subjectConcepts: ['luận điểm'] as readonly string[],
  probeCount: 6,
  timeCapSeconds: 480,
  defenseWeightPct: 20,
  createdAt: new Date('2026-07-01T00:00:00.000Z'),
} as const

class AssignmentRepositoryFake implements AssignmentRepository {
  publishedAt: Date | null = null

  async create(): Promise<AssignmentRecord> {
    return assignment
  }

  async findById(): Promise<AssignmentRecord | null> {
    return assignment
  }

  async findDetailById(): Promise<
    import('@/lib/services/assignment-service').AssignmentDetailRecord | null
  > {
    return { ...assignment, ...detailBase }
  }

  async listByCourse(): Promise<
    readonly import('@/lib/services/assignment-service').AssignmentDetailRecord[]
  > {
    return [{ ...assignment, ...detailBase }]
  }

  async setPublishedAt(_id: string, publishedAt: Date | null): Promise<void> {
    this.publishedAt = publishedAt
  }

  async listPublishedForStudent(): Promise<
    readonly import('@/lib/services/assignment-service').AssignmentDetailRecord[]
  > {
    return [{ ...assignment, publishedAt: new Date('2026-07-01T00:00:00.000Z'), ...detailBase }]
  }
}

class CourseRepositoryFake implements AssignmentCourseRepository {
  constructor(private readonly course: CourseRecord) {}

  async findById(): Promise<CourseRecord> {
    return this.course
  }
}

const activeCourse: CourseRecord = {
  id: assignment.courseId,
  institutionId,
  lecturerId,
  archivedAt: null,
  joinCodeRevokedAt: null,
}

describe('assignment authorization and visibility', () => {
  it('publishes an assignment owned by the lecturer', async () => {
    // Given
    const assignments = new AssignmentRepositoryFake()
    const publishedAt = new Date('2026-07-25T00:00:00.000Z')

    // When
    await setAssignmentPublished({
      assignments,
      courses: new CourseRepositoryFake(activeCourse),
      actor: lecturer,
      assignmentId: assignment.id,
      publishedAt,
    })

    // Then
    expect(assignments.publishedAt).toEqual(publishedAt)
  })

  it('rejects publishing in an archived course', async () => {
    // Given
    const assignments = new AssignmentRepositoryFake()
    const archivedCourse = { ...activeCourse, archivedAt: new Date('2026-07-01T00:00:00.000Z') }

    // When
    const operation = setAssignmentPublished({
      assignments,
      courses: new CourseRepositoryFake(archivedCourse),
      actor: lecturer,
      assignmentId: assignment.id,
      publishedAt: new Date(),
    })

    // Then
    await expect(operation).rejects.toMatchObject({ name: 'CourseArchivedError' })
  })

  it('lists only the repository-published assignments for the student', async () => {
    // Given
    const assignments = new AssignmentRepositoryFake()

    // When
    const result = await listStudentAssignments({ assignments, actor: student, now: new Date() })

    // Then
    expect(result).toHaveLength(1)
    expect(result[0]?.publishedAt).not.toBeNull()
  })
})
