type Variant = 'default' | 'jade' | 'gold' | 'amber'

const variantClass: Record<Variant, string> = {
  default: 'pill',
  jade: 'pill pill--jade',
  gold: 'pill pill--gold',
  amber: 'pill pill--amber',
}

type Props = {
  variant?: Variant
  children: string
}

export function Pill({ variant = 'default', children }: Props) {
  return <span className={variantClass[variant]}>{children}</span>
}
