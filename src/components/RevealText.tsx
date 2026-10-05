import { useRef, type ElementType, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'
import { EASE } from './Reveal'

type Props = {
  /** Each line slides up from behind its own mask. */
  lines: ReactNode[]
  as?: ElementType
  id?: string
  className?: string
  delay?: number
  /** Animate on mount (above the fold) instead of when scrolled into view. */
  immediate?: boolean
}

/** Headline mask reveal, played once. */
export default function RevealText({ lines, as: Tag = 'h2', id, className, delay = 0, immediate }: Props) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' })
  const show = immediate || inView

  return (
    <Tag ref={ref} id={id} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.1em] -mb-[0.1em]">
          <motion.span
            className="block"
            initial={{ y: '110%' }}
            animate={show ? { y: '0%' } : { y: '110%' }}
            transition={{ duration: 0.65, ease: EASE, delay: delay + i * 0.08 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}
