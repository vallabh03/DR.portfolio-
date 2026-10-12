import type { ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import { EASE, EASE_IN_OUT } from '../lib/motion'

/**
 * Page-to-page curtain. App renders one PageTransition per pathname inside
 * AnimatePresence (mode "wait"), so every route change runs the same sequence,
 * whether it came from a link, the menu or the browser's Back and Forward:
 *
 *   1. exit   the clinical blue curtain drops over the current page (300 ms)
 *   2. swap   the old page unmounts and the new one mounts behind the curtain;
 *             scroll position and focus are set while it is covered
 *   3. enter  the curtain lifts away upward and the new content rises in (400 ms)
 *
 * Because the sequence is driven by the location rather than by clicks, rapid
 * clicks cannot overlap: AnimatePresence finishes the running exit, then mounts
 * only the latest route. The first page of a visit (direct URL or refresh) is
 * not covered; AnimatePresence starts with initial={false}.
 *
 * Under reduced motion there is no curtain or movement, only a short crossfade.
 */

/** The site's clinical blue, with a pale blue rule along the leading edge. */
export const CURTAIN_COLOUR = '#1B5F8C'
const EDGE = '#B9DCF3'

/** The curtain: above the page (hidden), over it (covering), then lifted away. */
export const curtainVariants: Variants = {
  initial: { y: '0%' },
  enter: { y: '-100%', transition: { duration: 0.4, ease: EASE_IN_OUT } },
  exit: { y: ['-100%', '0%'], transition: { duration: 0.3, ease: EASE_IN_OUT } },
}

/** The page content: fades out under the curtain, rises in as it lifts. */
export const contentVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE, delay: 0.12 } },
  exit: { opacity: 0, transition: { duration: 0.26, ease: 'linear' } },
}

/** Reduced motion: a short crossfade, no curtain and no movement. */
export const calmVariants: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.2, ease: 'linear' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'linear' } },
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()

  if (reduced) {
    return (
      <motion.div variants={calmVariants} initial="initial" animate="enter" exit="exit">
        {children}
      </motion.div>
    )
  }

  // The outer element is never transformed, so the fixed curtain stays relative to the viewport.
  return (
    <motion.div initial="initial" animate="enter" exit="exit">
      <motion.div variants={contentVariants}>{children}</motion.div>
      <motion.div
        aria-hidden
        variants={curtainVariants}
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[100lvh] will-change-transform"
        style={{ backgroundColor: CURTAIN_COLOUR }}
      >
        {/* A pale rule along the leading edge */}
        <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ backgroundColor: EDGE }} />
      </motion.div>
    </motion.div>
  )
}
