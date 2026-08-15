import type { ReactNode } from 'react'

type Variant = 'jade' | 'gold' | 'sky' | 'violet' | 'neutral'

const variantClass: Record<Variant, string> = {
  jade: 'btn3d',
  gold: 'btn3d btn3d--gold',
  sky: 'btn3d btn3d--sky',
  violet: 'btn3d btn3d--violet',
  neutral: 'btn3d btn3d--neutral',
}

type Props = {
  variant?: Variant
  wide?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: () => void
  children: ReactNode
  'aria-label'?: string
}

export function Button3d({
  variant = 'jade',
  wide = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  'aria-label': ariaLabel,
}: Props) {
  const cls = `${variantClass[variant]}${wide ? ' btn3d--wide' : ''}`
  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
