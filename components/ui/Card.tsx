import type { ReactNode } from 'react'

type Variant = 'default' | 'soft' | 'jade' | 'gold' | 'sky' | 'amber'

const variantClass: Record<Variant, string> = {
  default: 'card',
  soft: 'card card--soft',
  jade: 'card card--jade',
  gold: 'card card--gold',
  sky: 'card card--sky',
  amber: 'card card--amber',
}

type Props = {
  variant?: Variant
  children: ReactNode
  className?: string
}

export function Card({ variant = 'default', children, className = '' }: Props) {
  return <div className={`${variantClass[variant]} ${className}`}>{children}</div>
}
