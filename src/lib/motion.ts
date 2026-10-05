import { useReducedMotion } from 'motion/react'

/** Long, decelerating curve with no overshoot: the house easing for reveals. */
export const EASE = [0.16, 1, 0.3, 1] as const
/** Symmetric curve for wipes, masks and transitions that move across the frame. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const
/** Accelerating curve for everything that leaves: exits get out of the way. */
export const EASE_EXIT = [0.4, 0, 1, 1] as const

/** Viewport options for reveals that play once as they enter. */
export const ONCE = { once: true, margin: '0px 0px -10% 0px' } as const

/**
 * False when the visitor prefers reduced motion. MotionConfig already removes
 * transform movement; decorative clip-path and line drawing check this too.
 */
export function useDecorativeMotion() {
  return !useReducedMotion()
}

/**
 * Props for a page-entrance settle (short rise + fade). Under reduced motion it
 * returns nothing, so the content is simply there: never hidden behind a delay.
 */
export function useEntrance() {
  const animated = useDecorativeMotion()
  return (delay = 0) =>
    animated
      ? {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, ease: EASE, delay },
        }
      : {}
}
