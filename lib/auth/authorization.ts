import type { Actor, InstitutionId, Role, UserId } from './identity'

export type StudentResourceOwner = {
  readonly id: UserId
  readonly institutionId: InstitutionId
}

export function hasRole(actor: Actor, allowedRoles: readonly Role[]): boolean {
  return allowedRoles.includes(actor.role)
}

export function canAccessStudentResource(actor: Actor, owner: StudentResourceOwner): boolean {
  if (actor.institutionId !== owner.institutionId) return false
  return actor.role !== 'student' || actor.id === owner.id
}
