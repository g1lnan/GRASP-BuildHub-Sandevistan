import type { Actor } from '@/lib/auth/identity'
import { assignmentInputSchema } from '@/lib/validation/inputs'
import type { CourseRecord } from './course-service'
import {
  AuthenticationRoleError,
  CourseArchivedError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from './errors'

export type AssignmentRecord = {
  readonly id: string
  readonly courseId: string
  readonly publishedAt: Date | null
}

export type AssignmentDetailRecord = AssignmentRecord & {
  readonly title: string
  readonly prompt: string
  readonly dueAt: Date
  readonly subjectConcepts: readonly string[]
  readonly probeCount: number
  readonly timeCapSeconds: number
  readonly defenseWeightPct: number
  readonly createdAt: Date
}

export interface AssignmentRepository {
  create(input: {
    readonly courseId: string
    readonly title: string
    readonly prompt: string
    readonly dueAt: Date
    readonly subjectConcepts: readonly string[]
    readonly probeCount: number
    readonly timeCapSeconds: number
    readonly defenseWeightPct: number
  }): Promise<AssignmentRecord>
  findById(id: string): Promise<AssignmentRecord | null>
  findDetailById(id: string): Promise<AssignmentDetailRecord | null>
  listByCourse(courseId: string): Promise<readonly AssignmentDetailRecord[]>
  setPublishedAt(id: string, publishedAt: Date | null): Promise<void>
  listPublishedForStudent(studentId: string, now: Date): Promise<readonly AssignmentDetailRecord[]>
}

export interface AssignmentCourseRepository {
  findById(id: string): Promise<CourseRecord | null>
}

function requireAssignmentCourse(course: CourseRecord | null, actor: Actor): CourseRecord {
  if (course === null) throw new ResourceNotFoundError()
  if (actor.role !== 'lecturer') throw new AuthenticationRoleError()
  if (course.lecturerId !== actor.id || course.institutionId !== actor.institutionId) {
    throw new ResourceForbiddenError()
  }
  if (course.archivedAt !== null) throw new CourseArchivedError()
  return course
}

export async function createAssignment(request: {
  readonly assignments: AssignmentRepository
  readonly courses: AssignmentCourseRepository
  readonly actor: Actor
  readonly input: unknown
}): Promise<AssignmentRecord> {
  const input = assignmentInputSchema.parse(request.input)
  const course = await request.courses.findById(input.courseId)
  requireAssignmentCourse(course, request.actor)
  return request.assignments.create(input)
}

export async function setAssignmentPublished(request: {
  readonly assignments: AssignmentRepository
  readonly courses: AssignmentCourseRepository
  readonly actor: Actor
  readonly assignmentId: string
  readonly publishedAt: Date | null
}): Promise<void> {
  const assignment = await request.assignments.findById(request.assignmentId)
  if (assignment === null) throw new ResourceNotFoundError()
  const course = await request.courses.findById(assignment.courseId)
  requireAssignmentCourse(course, request.actor)
  await request.assignments.setPublishedAt(request.assignmentId, request.publishedAt)
}

export async function listStudentAssignments(request: {
  readonly assignments: AssignmentRepository
  readonly actor: Actor
  readonly now: Date
}): Promise<readonly AssignmentDetailRecord[]> {
  if (request.actor.role !== 'student') throw new AuthenticationRoleError()
  return request.assignments.listPublishedForStudent(request.actor.id, request.now)
}
