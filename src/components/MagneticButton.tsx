import { useRef, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Link } from 'react-router'

type Variant = 'solid' | 'outline' | 'ghost'

type Props = {
  children: ReactNode
  to?: string
  href?: string
  onClick?: (e: ReactMouseEvent) => void
  type?: 'button' | 'submit'
  variant?: Variant
  className?: string
  strength?: number
  cursor?: string
  disabled?: boolean
  ariaLabel?: string
  external?: boolean
}

const styles: Record<Variant, string> = {
  solid: 'bg-fg text-bg hover:bg-accent hover:text-on-accent',
  outline: 'border border-line-strong text-fg hover:border-fg hover:bg-fg hover:text-bg',
  ghost: 'text-fg hover:text-accent',
}

const finePointer = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** Pill button that drifts toward the pointer on desktop. Renders a Link, anchor or button. */
export default function MagneticButton({
  children,
  to,
  href,
  onClick,
  type = 'button',
  variant = 'solid',
  className = '',
  strength = 0.28,
  cursor,
  disabled,
  ariaLabel,
  external,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 })

  const onMove = (e: ReactMouseEvent) => {
    if (!finePointer() || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  const base = `group/btn relative inline-flex min-h-12 items-center justify-center gap-3 overflow-hidden rounded-full px-6 text-[0.8125rem] font-medium uppercase tracking-[0.14em] transition-colors duration-500 disabled:opacity-50 ${styles[variant]} ${className}`

  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center gap-3">{children}</span>
    </>
  )

  const common = {
    className: base,
    'data-cursor': cursor,
    'aria-label': ariaLabel,
  }

  let el: ReactNode
  if (to) {
    el = (
      <Link to={to} {...common} onClick={onClick}>
        {inner}
      </Link>
    )
  } else if (href) {
    el = (
      <a
        href={href}
        {...common}
        onClick={onClick}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    )
  } else {
    el = (
      <button type={type} {...common} onClick={onClick} disabled={disabled}>
        {inner}
      </button>
    )
  }

  return (
    <motion.span
      ref={ref}
      className="inline-block"
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {el}
    </motion.span>
  )
}

export function ArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 transition-transform duration-500 ease-out group-hover/btn:translate-x-1 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M4 12h16M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
