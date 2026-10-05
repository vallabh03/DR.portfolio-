import type { ReactNode } from 'react'

type Props = {
  id: string
  /** `surface` sets the section on white paper for rhythm between sections. */
  tone?: 'base' | 'surface'
  className?: string
  children: ReactNode
}

/** A home-page section: anchor target, spacing rhythm and container. */
export default function PageSection({ id, tone = 'base', className = '', children }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
      className={`border-t border-line focus:outline-none ${tone === 'surface' ? 'bg-surface' : ''} ${className}`}
    >
      <div className="container-page section-y">{children}</div>
    </section>
  )
}
