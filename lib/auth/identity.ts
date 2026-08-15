import { z } from 'zod'

export const roles = ['lecturer', 'student', 'researcher'] as const
export const roleSchema = z.enum(roles)
export const userIdSchema = z.string().uuid().brand('UserId')
export const institutionIdSchema = z.string().uuid().brand('InstitutionId')

export type Role = z.infer<typeof roleSchema>
export type UserId = z.infer<typeof userIdSchema>
export type InstitutionId = z.infer<typeof institutionIdSchema>

export type Actor = {
  readonly id: UserId
  readonly institutionId: InstitutionId
  readonly role: Role
}
