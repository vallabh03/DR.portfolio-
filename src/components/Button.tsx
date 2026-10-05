import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router'

type Variant = 'primary' | 'secondary' | 'text'

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
  'group/btn inline-flex min-h-12 items-center justify-center gap-2.5 rounded-md text-[0.9375rem] font-medium leading-none transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50'

const styles: Record<Variant, string> = {
  primary: `${base} bg-fg px-6 text-bg hover:bg-accent hover:text-on-accent active:bg-accent-hover`,
  secondary: `${base} border border-fg/80 px-6 text-fg hover:bg-fg hover:text-bg`,
  text: 'group/btn inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-accent transition-colors duration-200 hover:text-accent-hover',
}

/** Primary, secondary and text-link buttons. Renders a Link, anchor or button. */
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
  const cls = `${styles[variant]} ${className}`
  const inner = variant === 'text' ? <span className="link-underline">{children}</span> : children

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={cls} aria-label={ariaLabel}>
        {inner}
      </Link>
    )
  }
  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={cls}
        aria-label={ariaLabel}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
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
      className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover/btn:translate-x-1 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 12h16M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
