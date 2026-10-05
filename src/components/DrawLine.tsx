import { motion } from 'motion/react'
import { EASE_IN_OUT, ONCE, useDecorativeMotion } from '../lib/motion'

type Props = {
  /** Horizontal rules draw left → right; vertical rules top → bottom. */
  axis?: 'x' | 'y'
  className?: string
  delay?: number
  duration?: number
  /** Draw on mount (page entrance) instead of when scrolled into view. */
  immediate?: boolean
  /** Grow from the start edge (default) or outward from the centre. */
  fromCenter?: boolean
}

/** A thin rule that draws itself into position. Decorative only. */
export default function DrawLine({ axis = 'x', className = '', delay = 0, duration = 0.9, immediate, fromCenter }: Props) {
  const animated = useDecorativeMotion()
  const from = axis === 'x' ? { scaleX: 0 } : { scaleY: 0 }
  const to = axis === 'x' ? { scaleX: 1 } : { scaleY: 1 }
  const trigger = immediate ? { animate: to } : { whileInView: to, viewport: ONCE }

  return (
    <motion.span
      aria-hidden
      className={`block ${axis === 'x' ? 'h-px' : 'w-px'} ${fromCenter ? 'origin-center' : axis === 'x' ? 'origin-left' : 'origin-top'} ${className}`}
      initial={animated ? from : false}
      {...trigger}
      transition={{ duration, ease: EASE_IN_OUT, delay }}
    />
  )
}
