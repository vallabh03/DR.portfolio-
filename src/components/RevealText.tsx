import { Fragment, useRef, type ElementType, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'
import { EASE, useDecorativeMotion } from '../lib/motion'

type Props = {
  /** Each line slides up from behind its own mask. */
  lines: ReactNode[]
  as?: ElementType
  id?: string
  className?: string
  delay?: number
  /** Play on mount (page entrance) instead of when scrolled into view. */
  immediate?: boolean
}

/**
 * Headline mask reveal, played once. Page h1s are focus targets after a route
 * change, so they take tabIndex -1.
 */
export default function RevealText({ lines, as: Tag = 'h2', id, className = '', delay = 0, immediate }: Props) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' })
  const show = immediate || inView
  // Under reduced motion the text starts in place (a delayed instant jump would still hide it briefly).
  const animated = useDecorativeMotion()
  const isPageHeading = Tag === 'h1'

  return (
    <Tag
      ref={ref}
      id={id}
      className={`${className} ${isPageHeading ? 'focus:outline-none' : ''}`}
      {...(isPageHeading ? { tabIndex: -1 } : {})}
    >
      {lines.map((line, i) => (
        <Fragment key={i}>
          {/* A real space between lines, so the accessible name reads "Book a consultation", not "Book aconsultation" */}
          {i > 0 && ' '}
          <span className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
            <motion.span
              className="block"
              initial={animated ? { y: '108%' } : false}
              animate={show || !animated ? { y: '0%' } : { y: '108%' }}
              transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.09 }}
            >
              {line}
            </motion.span>
          </span>
        </Fragment>
      ))}
    </Tag>
  )
}
