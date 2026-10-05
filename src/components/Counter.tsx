import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { EASE } from '../lib/motion'

/** A number that counts up once when it comes into view. */
export default function Counter({ value, className = '' }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)

  useEffect(() => {
    if (!inView) return
    if (reduce || value === 0) {
      setShown(value)
      return
    }
    const controls = animate(0, value, { duration: 1.2, ease: EASE, onUpdate: (v) => setShown(Math.round(v)) })
    return () => controls.stop()
  }, [inView, value, reduce])

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {shown}
    </span>
  )
}
