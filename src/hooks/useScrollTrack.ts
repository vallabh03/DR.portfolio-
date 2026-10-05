import { useState, type RefObject } from 'react'
import { useMotionValueEvent, useScroll, type MotionValue } from 'motion/react'

/**
 * Scroll progress (0 → 1) through a list, plus how many of its `count` steps
 * the reader has passed. Drives timeline lines and their nodes.
 */
export function useScrollTrack(target: RefObject<HTMLElement | null>, count: number): { progress: MotionValue<number>; reached: number } {
  const { scrollYProgress } = useScroll({ target, offset: ['start 70%', 'end 55%'] })
  const [reached, setReached] = useState(0)

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = count <= 1 ? (v > 0 ? 1 : 0) : Math.min(count, Math.floor(v * (count - 1) + 0.0001) + (v > 0 ? 1 : 0))
    setReached((r) => (r === next ? r : next))
  })

  return { progress: scrollYProgress, reached }
}
