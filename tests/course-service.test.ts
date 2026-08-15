import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import {
  type CourseRecord,
  type CourseRepository,
  renameCourse,
} from '@/lib/services/course-service'
import { ResourceNotFoundError } from '@/lib/services/errors'
import { describe, expect, it } from 'vitest'

const lecturerId = userIdSchema.parse('20000000-0000-4000-8000-000000000010')
const institutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000001')
const actor: Actor = { id: lecturerId, institutionId, role: 'lecturer' }

class CourseRepositoryFake implements CourseRepository {
  readonly renamed: string[] = []

  constructor(private readonly course: CourseRecord | null) {}

  async create(): Promise<CourseRecord> {
    if (this.course === null) throw new ResourceNotFoundError()
    return this.course
  }

  async findById(_id: string): Promise<CourseRecord | null> {
    return this.course
  }

  async findDetailById(): Promise<
    import('@/lib/services/course-service').CourseDetailRecord | null
  > {
    return null
  }

  async listByLecturer(): Promise<
    readonly import('@/lib/services/course-service').CourseDetailRecord[]
  > {
    return []
  }

  async update(_id: string, values: { readonly name?: string }): Promise<void> {
    if (values.name !== undefined) this.renamed.push(values.name)
  }

  async archive(): Promise<void> {}

  async setJoinCode(): Promise<void> {}
}

describe('course archive enforcement', () => {
  it('rejects edits when the course is archived', async () => {
    // Given
    const repository = new CourseRepositoryFake({
      id: '30000000-0000-4000-8000-000000000001',
      institutionId,
      lecturerId,
      archivedAt: new Date('2026-07-01T00:00:00.000Z'),
      joinCodeRevokedAt: null,
    })

    // When
    const operation = renameCourse({ repository, actor, courseId: 'course-id', name: 'Tên mới' })

    // Then
    await expect(operation).rejects.toMatchObject({ name: 'CourseArchivedError' })
    expect(repository.renamed).toEqual([])
  })
})
