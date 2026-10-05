import type { ReactNode } from 'react'
import RevealText from './RevealText'
import Reveal from './Reveal'

type Props = {
  /** Small label above the headline, e.g. "About". */
  label: string
  /** Headline lines; each reveals from behind a mask. */
  title: ReactNode[]
  intro?: ReactNode
  /** h1 on standalone pages, h2 for home-page sections. */
  as?: 'h1' | 'h2'
  id?: string
  className?: string
  immediate?: boolean
  children?: ReactNode
}

/** Label, headline and intro shared by every section. */
export default function SectionHeader({ label, title, intro, as = 'h2', id, className = '', immediate, children }: Props) {
  return (
    <header className={className}>
      <p className="label flex items-center gap-3">
        <span aria-hidden className="h-px w-6 bg-brass" />
        {label}
      </p>
      <RevealText
        as={as}
        lines={title}
        className={`${as === 'h1' ? 'heading-1' : 'heading-2'} mt-5 text-balance`}
        immediate={immediate}
        id={id}
      />
      {intro && (
        <Reveal delay={0.1}>
          <p className="lead measure mt-6">{intro}</p>
        </Reveal>
      )}
      {children}
    </header>
  )
}
