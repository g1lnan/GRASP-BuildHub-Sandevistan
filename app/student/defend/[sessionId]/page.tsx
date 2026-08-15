import { requireActorPage } from '@/lib/auth/guards'
import { vi } from '@/lib/i18n/vi'
import { drizzleSessionRepository } from '@/lib/repositories/drizzle-sessions'
import { ResourceForbiddenError, ResourceNotFoundError } from '@/lib/services/errors'
import { getTypedSession } from '@/lib/session/runtime'
import { notFound } from 'next/navigation'
import { DefenseSession } from './DefenseSession'

export const metadata = { title: `${vi.defense.heading} — ${vi.metadata.title}` }

type Props = { params: Promise<{ sessionId: string }> }

export default async function DefendPage({ params }: Props) {
  const { sessionId } = await params
  const actor = await requireActorPage()

  try {
    const session = await getTypedSession({
      sessions: drizzleSessionRepository,
      actor,
      sessionId,
      now: new Date(),
    })
    return (
      <main
        data-screen="defend"
        style={{
          maxWidth: 'var(--w-defend)',
          margin: '0 auto',
          padding: 'var(--s-10) var(--s-6) var(--s-16)',
        }}
      >
        <DefenseSession initial={session} />
      </main>
    )
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundError || error instanceof ResourceForbiddenError) {
      notFound()
    }
    throw error
  }
}
