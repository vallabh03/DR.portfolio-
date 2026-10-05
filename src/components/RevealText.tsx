import { useRef, type ElementType, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { useAppReady } from '../context/ChapterContext'

type Mode = 'mask' | 'fade'

type Props = {
  /** Plain text is split into words. Pass `lines` for multi-line headings. */
  text?: string
  lines?: ReactNode[]
  as?: ElementType
  className?: string
  mode?: Mode
  delay?: number
  stagger?: number
}

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Editorial text reveal.
 *  - mask: each word/line slides up from behind a clipping mask (headings)
 *  - fade: words brighten one after another (body copy, like a reading cursor)
 */
export default function RevealText({ text, lines, as: Tag = 'p', className, mode = 'fade', delay = 0, stagger }: Props) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -8% 0px' })
  const ready = useAppReady()
  const show = inView && ready

  if (lines) {
    return (
      <Tag ref={ref} className={className}>
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
            <motion.span
              className="block will-change-transform"
              initial={{ y: '110%' }}
              animate={show ? { y: '0%' } : { y: '110%' }}
              transition={{ duration: 1.1, ease: EASE, delay: delay + i * (stagger ?? 0.09) }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </Tag>
    )
  }

  const words = (text ?? '').split(/\s+/).filter(Boolean)
  const step = stagger ?? (mode === 'mask' ? 0.05 : Math.min(0.025, 1.2 / Math.max(words.length, 1)))

  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) =>
          mode === 'mask' ? (
            <span key={i} className="inline-block overflow-hidden pb-[0.1em] -mb-[0.1em] align-bottom">
              <motion.span
                className="inline-block will-change-transform"
                initial={{ y: '110%' }}
                animate={show ? { y: '0%' } : { y: '110%' }}
                transition={{ duration: 0.9, ease: EASE, delay: delay + i * step }}
              >
                {w}
                {i < words.length - 1 ? ' ' : ''}
              </motion.span>
            </span>
          ) : (
            <motion.span
              key={i}
              initial={{ opacity: 0.12 }}
              animate={show ? { opacity: 1 } : { opacity: 0.12 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: delay + i * step }}
            >
              {w}
              {i < words.length - 1 ? ' ' : ''}
            </motion.span>
          ),
        )}
      </span>
    </Tag>
  )
}
