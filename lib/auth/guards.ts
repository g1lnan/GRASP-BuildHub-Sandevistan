import 'server-only'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { type Actor, type Role, institutionIdSchema, roleSchema, userIdSchema } from './identity'

export class AuthenticationRequiredError extends Error {
  readonly name = 'AuthenticationRequiredError'
}

export class AuthorizationDeniedError extends Error {
  readonly name = 'AuthorizationDeniedError'
}

export async function requireActor(): Promise<Actor> {
  const session = await auth()
  if (session?.user === undefined) throw new AuthenticationRequiredError()
  return {
    id: userIdSchema.parse(session.user.id),
    institutionId: institutionIdSchema.parse(session.user.institutionId),
    role: roleSchema.parse(session.user.role),
  }
}

export async function requireRole(allowedRoles: readonly Role[]): Promise<Actor> {
  const actor = await requireActor()
  if (!allowedRoles.includes(actor.role)) throw new AuthorizationDeniedError()
  return actor
}

/** Home path for a signed-in role — where to send a mismatched-role visitor. */
function homePathForRole(role: Role): string {
  if (role === 'student') return '/student'
  return '/lecturer/courses' // lecturer + researcher
}

/**
 * Page/layout variant of {@link requireActor}: redirects to /login when
 * unauthenticated instead of throwing (which would render a 500). Use this in
 * Server Components; keep {@link requireActor} for route handlers that map
 * errors to HTTP status codes.
 */
export async function requireActorPage(): Promise<Actor> {
  const session = await auth()
  if (session?.user === undefined) redirect('/login')
  return {
    id: userIdSchema.parse(session.user.id),
    institutionId: institutionIdSchema.parse(session.user.institutionId),
    role: roleSchema.parse(session.user.role),
  }
}

/**
 * Page/layout variant of {@link requireRole}: redirects unauthenticated
 * visitors to /login and role-mismatched visitors to their own home.
 */
export async function requireRolePage(allowedRoles: readonly Role[]): Promise<Actor> {
  const actor = await requireActorPage()
  if (!allowedRoles.includes(actor.role)) redirect(homePathForRole(actor.role))
  return actor
}
