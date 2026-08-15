import { canAccessStudentResource, hasRole } from '@/lib/auth/authorization'
import { type Actor, institutionIdSchema, userIdSchema } from '@/lib/auth/identity'
import { describe, expect, it } from 'vitest'

const institutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000001')
const otherInstitutionId = institutionIdSchema.parse('10000000-0000-4000-8000-000000000002')
const studentAId = userIdSchema.parse('20000000-0000-4000-8000-000000000001')
const studentBId = userIdSchema.parse('20000000-0000-4000-8000-000000000002')

const studentA: Actor = {
  id: studentAId,
  institutionId,
  role: 'student',
}

describe('server authorization', () => {
  it('denies lecturer operations to a student', () => {
    // Given / When
    const allowed = hasRole(studentA, ['lecturer'])

    // Then
    expect(allowed).toBe(false)
  })

  it('allows Student A to access Student A resources', () => {
    // Given / When
    const allowed = canAccessStudentResource(studentA, { id: studentAId, institutionId })

    // Then
    expect(allowed).toBe(true)
  })

  it('denies Student A access to Student B resources', () => {
    // Given / When
    const allowed = canAccessStudentResource(studentA, { id: studentBId, institutionId })

    // Then
    expect(allowed).toBe(false)
  })

  it('denies access to a resource in another institution', () => {
    // Given / When
    const allowed = canAccessStudentResource(studentA, {
      id: studentAId,
      institutionId: otherInstitutionId,
    })

    // Then
    expect(allowed).toBe(false)
  })
})
