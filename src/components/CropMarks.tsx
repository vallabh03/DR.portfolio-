import { motion } from 'motion/react'
import { EASE_IN_OUT, useDecorativeMotion } from '../lib/motion'

/** Corner positions, each with an L-shaped path drawn outward from the corner. */
const corners = [
  { pos: '-left-4 -top-4', d: 'M16 4 H4 V16' },
  { pos: '-right-4 -top-4', d: 'M4 4 H16 V16' },
  { pos: '-left-4 -bottom-4', d: 'M16 16 H4 V4' },
  { pos: '-right-4 -bottom-4', d: 'M4 16 H16 V4' },
]

/**
 * Printer's crop marks that draw in around a framed image — a quiet reference
 * to print editorial. Place inside a `relative` container. Decorative only.
 */
export default function CropMarks({ delay = 0, className = '' }: { delay?: number; className?: string }) {
  // Faint by design: a supporting detail, never competing with the image it frames.
  const animated = useDecorativeMotion()
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {corners.map((c, i) => (
        <svg key={i} viewBox="0 0 20 20" className={`absolute h-5 w-5 text-brass/60 ${c.pos}`} fill="none" stroke="currentColor" strokeWidth="1">
          <motion.path
            d={c.d}
            initial={animated ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: EASE_IN_OUT, delay: delay + i * 0.05 }}
          />
        </svg>
      ))}
    </div>
  )
}
