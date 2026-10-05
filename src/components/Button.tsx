import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router'

type Variant = 'primary' | 'secondary' | 'inverse' | 'text'

type Props = {
  children: ReactNode
  /** Internal route (react-router). */
  to?: string
  /** External or tel:/mailto: link. */
  href?: string
  external?: boolean
  onClick?: (e: MouseEvent) => void
  type?: 'button' | 'submit'
  variant?: Variant
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

const base =
  'group/btn relative isolate inline-flex min-h-12 items-center justify-center gap-2.5 overflow-hidden rounded-md px-6 text-[0.9375rem] font-medium leading-none transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50'

/** Surface colours, and the fill that wipes in from the left on hover/focus. */
const styles: Record<Exclude<Variant, 'text'>, { button: string; fill: string }> = {
  primary: { button: 'bg-fg text-bg hover:text-on-accent focus-visible:text-on-accent', fill: 'bg-accent' },
  secondary: { button: 'border border-fg text-fg hover:text-bg focus-visible:text-bg', fill: 'bg-fg' },
  inverse: { button: 'bg-bg text-fg hover:text-on-accent focus-visible:text-on-accent', fill: 'bg-accent' },
}

const textStyle =
  'group/btn inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-accent transition-colors duration-200 hover:text-accent-hover'

/**
 * Primary, secondary, inverse (on ink) and text-link buttons. Hover is a fill
 * that wipes across from the left with a small arrow shift, never a fade.
 */
export default function Button({
  children,
  to,
  href,
  external,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
  ariaLabel,
}: Props) {
  const cls = variant === 'text' ? `${textStyle} ${className}` : `${base} ${styles[variant].button} ${className}`
  const inner =
    variant === 'text' ? (
      <span className="link-underline">{children}</span>
    ) : (
      <>
        <span
          aria-hidden
          className={`absolute inset-0 -z-10 origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover/btn:scale-x-100 group-focus-visible/btn:scale-x-100 ${styles[variant].fill}`}
        />
        {children}
      </>
    )

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={cls} aria-label={ariaLabel}>
        {inner}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} onClick={onClick} className={cls} aria-label={ariaLabel} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {inner}
      </a>
    )
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} aria-label={ariaLabel}>
      {inner}
    </button>
  )
}

export function ArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-1 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 12h16M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Diagonal arrow for links that open in a new tab. */
export function ArrowUpRight({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowUp({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 20V4M6 10l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
