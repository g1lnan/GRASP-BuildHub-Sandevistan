import { randomInt } from 'node:crypto'
import type { Actor } from '@/lib/auth/identity'
import {
  createCourseInputSchema,
  enrollmentInputSchema,
  updateCourseInputSchema,
} from '@/lib/validation/inputs'
import {
  AlreadyEnrolledError,
  AuthenticationRoleError,
  CourseArchivedError,
  JoinCodeRevokedError,
  ResourceForbiddenError,
  ResourceNotFoundError,
} from './errors'

const joinCodeAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export type CourseRecord = {
  readonly id: string
  readonly institutionId: string
  readonly lecturerId: string
  readonly archivedAt: Date | null
  readonly joinCodeRevokedAt: Date | null
}

export type CourseDetailRecord = CourseRecord & {
  readonly name: string
  readonly term: string
  readonly joinCode: string
  readonly createdAt: Date
}

export type NewCourseRecord = {
  readonly institutionId: string
  readonly lecturerId: string
  readonly name: string
  readonly term: string
  readonly joinCode: string
}

export interface CourseRepository {
  create(record: NewCourseRecord): Promise<CourseRecord>
  findById(id: string): Promise<CourseRecord | null>
  findDetailById(id: string): Promise<CourseDetailRecord | null>
  listByLecturer(lecturerId: string): Promise<readonly CourseDetailRecord[]>
  update(id: string, values: { readonly name?: string; readonly term?: string }): Promise<void>
  archive(id: string, archivedAt: Date): Promise<void>
  setJoinCode(id: string, joinCode: string, revokedAt: Date | null): Promise<void>
}

export interface EnrollmentRepository {
  enroll(request: {
    readonly joinCode: string
    readonly studentId: string
    readonly institutionId: string
  }): Promise<EnrollmentResult>
  listCoursesByStudent(
    studentId: string,
  ): Promise<readonly { readonly courseId: string; readonly course: CourseDetailRecord }[]>
  countByCourse(courseId: string): Promise<number>
}

export type EnrollmentResult =
  | { readonly kind: 'enrolled' }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'forbidden' }
  | { readonly kind: 'archived' }
  | { readonly kind: 'revoked' }
  | { readonly kind: 'already_enrolled' }

export function generateJoinCode(): string {
  return Array.from({ length: 8 }, () => joinCodeAlphabet[randomInt(joinCodeAlphabet.length)]).join(
    '',
  )
}

function requireOwnedMutableCourse(course: CourseRecord | null, actor: Actor): CourseRecord {
  if (course === null) throw new ResourceNotFoundError()
  if (actor.role !== 'lecturer') throw new AuthenticationRoleError()
  if (course.lecturerId !== actor.id || course.institutionId !== actor.institutionId) {
    throw new ResourceForbiddenError()
  }
  if (course.archivedAt !== null) throw new CourseArchivedError()
  return course
}

export async function createCourse(request: {
  readonly repository: CourseRepository
  readonly actor: Actor
  readonly input: unknown
}): Promise<CourseRecord> {
  if (request.actor.role !== 'lecturer') throw new AuthenticationRoleError()
  const input = createCourseInputSchema.parse(request.input)
  return request.repository.create({
    institutionId: request.actor.institutionId,
    lecturerId: request.actor.id,
    name: input.name,
    term: input.term,
    joinCode: generateJoinCode(),
  })
}

export async function updateCourse(request: {
  readonly repository: CourseRepository
  readonly actor: Actor
  readonly courseId: string
  readonly input: unknown
}): Promise<void> {
  const course = await request.repository.findById(request.courseId)
  requireOwnedMutableCourse(course, request.actor)
  const input = updateCourseInputSchema.parse(request.input)
  const values = {
    ...(input.name === undefined ? {} : { name: input.name }),
    ...(input.term === undefined ? {} : { term: input.term }),
  }
  await request.repository.update(request.courseId, values)
}

export async function renameCourse(request: {
  readonly repository: CourseRepository
  readonly actor: Actor
  readonly courseId: string
  readonly name: string
}): Promise<void> {
  await updateCourse({ ...request, input: { name: request.name } })
}

export async function archiveCourse(request: {
  readonly repository: CourseRepository
  readonly actor: Actor
  readonly courseId: string
  readonly now: Date
}): Promise<void> {
  const course = await request.repository.findById(request.courseId)
  requireOwnedMutableCourse(course, request.actor)
  await request.repository.archive(request.courseId, request.now)
}

export async function rotateJoinCode(request: {
  readonly repository: CourseRepository
  readonly actor: Actor
  readonly courseId: string
}): Promise<string> {
  const course = await request.repository.findById(request.courseId)
  requireOwnedMutableCourse(course, request.actor)
  const joinCode = generateJoinCode()
  await request.repository.setJoinCode(request.courseId, joinCode, null)
  return joinCode
}

export async function revokeJoinCode(request: {
  readonly repository: CourseRepository
  readonly actor: Actor
  readonly courseId: string
  readonly now: Date
}): Promise<void> {
  const course = await request.repository.findById(request.courseId)
  requireOwnedMutableCourse(course, request.actor)
  await request.repository.setJoinCode(request.courseId, generateJoinCode(), request.now)
}

export async function enrollWithJoinCode(request: {
  readonly enrollments: EnrollmentRepository
  readonly actor: Actor
  readonly input: unknown
}): Promise<void> {
  if (request.actor.role !== 'student') throw new AuthenticationRoleError()
  const { joinCode } = enrollmentInputSchema.parse(request.input)
  const result = await request.enrollments.enroll({
    joinCode,
    studentId: request.actor.id,
    institutionId: request.actor.institutionId,
  })
  switch (result.kind) {
    case 'enrolled':
      return
    case 'not_found':
      throw new ResourceNotFoundError()
    case 'forbidden':
      throw new ResourceForbiddenError()
    case 'archived':
      throw new CourseArchivedError()
    case 'revoked':
      throw new JoinCodeRevokedError()
    case 'already_enrolled':
      throw new AlreadyEnrolledError()
    default:
      return result
  }
}
