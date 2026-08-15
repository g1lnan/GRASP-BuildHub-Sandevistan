import { z } from 'zod'

const authEnvironmentSchema = z.object({
  AUTH_SECRET: z.string().min(32),
})

export const authEnvironment = authEnvironmentSchema.parse({
  AUTH_SECRET: process.env.AUTH_SECRET,
})
