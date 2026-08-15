import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { z } from 'zod'
import * as schema from './schema'

const databaseUrl = z.string().url().parse(process.env.DATABASE_URL)
const client = postgres(databaseUrl, { max: 10, prepare: false })

export const db = drizzle(client, { schema })
export const closeDatabase = async (): Promise<void> => client.end()
