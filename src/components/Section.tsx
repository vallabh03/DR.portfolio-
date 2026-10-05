import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useAppReady } from '../context/ChapterContext'
import { pad } from '../data/chapters'
import RevealText from './RevealText'
import Footer from './Footer'

type Props = {
  number: number
  label: string
  /** Heading lines — each line reveals from behind a mask. */
  title: ReactNode[]
  intro?: string
  /** Content under the intro in the header column. */
  headerExtra?: ReactNode
  /**
   * split   — sticky editorial header on the left, content on the right (desktop)
   * stacked — header above, full-width content below
   */
  layout?: 'split' | 'stacked'
  children: ReactNode
}

const EASE = [0.16, 1, 0.3, 1] as const

/** Animated chapter number: digits roll up into place. */
export function SectionNumber({ n, label }: { n: number; label: string }) {
  const ready = useAppReady()
  return (
    <div className="flex items-center gap-4">
      <span className="inline-flex overflow-hidden font-display text-sm tabular-nums text-accent">
        {pad(n)
          .split('')
          .map((d, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ y: '100%' }}
              animate={ready ? { y: '0%' } : undefined}
              transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.08 }}
            >
              {d}
            </motion.span>
          ))}
      </span>
      <motion.span
        className="h-px w-10 origin-left bg-line-strong"
        initial={{ scaleX: 0 }}
        animate={ready ? { scaleX: 1 } : undefined}
        transition={{ duration: 1, ease: EASE, delay: 0.2 }}
        aria-hidden
      />
      <span className="eyebrow">{label}</span>
    </div>
  )
}

export default function Section({ number, label, title, intro, headerExtra, layout = 'split', children }: Props) {
  const split = layout === 'split'
  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto w-full max-w-[1680px] flex-1 px-5 pb-20 pt-28 sm:px-8 md:pt-32 lg:px-14 xl:px-20">
        <div className={split ? 'grid gap-14 lg:grid-cols-12 lg:gap-10 xl:gap-16' : ''}>
          <header className={split ? 'lg:col-span-5 lg:sticky lg:top-32 lg:self-start' : 'max-w-5xl'}>
            <SectionNumber n={number} label={label} />
            <RevealText as="h1" lines={title} className="display-section mt-8 text-balance" delay={0.15} />
            {intro && <RevealText text={intro} className="lead mt-8 max-w-xl" delay={0.35} />}
            {headerExtra}
          </header>
          <div className={split ? 'min-w-0 lg:col-span-7' : 'mt-16 md:mt-24'}>{children}</div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
