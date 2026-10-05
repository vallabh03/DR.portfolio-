import type { ReactNode } from 'react'
import { motion } from 'motion/react'

export const EASE = [0.16, 1, 0.3, 1] as const

type Props = {
  children: ReactNode
  as?: 'div' | 'li' | 'section' | 'article' | 'p'
  id?: string
  className?: string
  delay?: number
}

/** Subtle scroll reveal: a short rise and fade, played once. */
export default function Reveal({ children, as = 'div', id, className, delay = 0 }: Props) {
  const Tag = motion[as]
  return (
    <Tag
      id={id}
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {children}
    </Tag>
  )
}
