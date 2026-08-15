import 'server-only'

import { institutionIdSchema, roleSchema, userIdSchema } from '@/lib/auth/identity'
import { credentialsSchema } from '@/lib/validation/inputs'
import { verify } from 'argon2'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authEnvironment } from './auth/environment'
import { findAuthenticationUser } from './auth/user-repository'

export const { auth, handlers, signIn, signOut } = NextAuth({
  secret: authEnvironment.AUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) return null
        const user = await findAuthenticationUser(parsed.data.email)
        if (user === null) return null
        const passwordMatches = await verify(user.passwordHash, parsed.data.password)
        if (!passwordMatches) return null
        return {
          id: user.id,
          institutionId: user.institutionId,
          role: user.role,
          email: user.email,
          name: user.displayName,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.institutionId = user.institutionId
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = userIdSchema.parse(token.userId)
      session.user.institutionId = institutionIdSchema.parse(token.institutionId)
      session.user.role = roleSchema.parse(token.role)
      return session
    },
  },
})
