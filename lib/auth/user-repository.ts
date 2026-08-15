import 'server-only'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { roleSchema } from './identity'

export type AuthenticationUser = {
  readonly id: string
  readonly institutionId: string
  readonly email: string
  readonly displayName: string
  readonly passwordHash: string
  readonly role: 'lecturer' | 'student' | 'researcher'
}

export async function findAuthenticationUser(email: string): Promise<AuthenticationUser | null> {
  const rows = await db
    .select({
      id: users.id,
      institutionId: users.institutionId,
      email: users.email,
      displayName: users.displayName,
      passwordHash: users.passwordHash,
      role: users.role,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  const row = rows[0]
  if (row === undefined) return null
  return { ...row, role: roleSchema.parse(row.role) }
}
