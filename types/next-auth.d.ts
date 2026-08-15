import type { Role } from '@/lib/auth/identity'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    institutionId: string
    role: Role
  }

  interface Session {
    user: {
      id: string
      institutionId: string
      role: Role
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    institutionId: string
    role: Role
  }
}
