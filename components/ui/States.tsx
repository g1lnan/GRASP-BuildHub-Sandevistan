import { vi } from '@/lib/i18n/vi'

type Props = {
  message?: string
}

export function EmptyState({ message = vi.errors.notFound }: Props) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: 'var(--s-16)',
        color: 'var(--ink-faint)',
        fontSize: 'var(--t-body)',
      }}
    >
      {message}
    </div>
  )
}

export function ErrorMessage({ message = vi.errors.serverError }: Props) {
  return (
    <div
      role="alert"
      style={{
        padding: 'var(--s-4)',
        borderRadius: 'var(--r-sm)',
        border: 'var(--border) solid var(--amber)',
        background: 'var(--amber-tint)',
        color: 'var(--amber-dark)',
        fontSize: 'var(--t-small)',
      }}
    >
      {message}
    </div>
  )
}
