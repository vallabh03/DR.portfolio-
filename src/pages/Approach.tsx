import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import Section from '../components/Section'
import { doctor } from '../data/doctor'
import { useScroller } from '../context/ChapterContext'

const EASE = [0.16, 1, 0.3, 1] as const

export default function Approach() {
  const stages = doctor.approach
  const trackRef = useRef<HTMLOListElement>(null)
  const scroller = useScroller()
  const { scrollYProgress } = useScroll({
    container: scroller ?? undefined,
    target: trackRef,
    offset: ['start 60%', 'end 70%'],
  })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const [current, setCurrent] = useState(0)
  // The active stage is the last one whose top has passed the middle of the viewport.
  useMotionValueEvent(scrollYProgress, 'change', () => {
    const items = trackRef.current?.querySelectorAll<HTMLElement>(':scope > li')
    if (!items) return
    const mid = window.innerHeight * 0.55
    let idx = 0
    items.forEach((li, i) => {
      if (li.getBoundingClientRect().top < mid) idx = i
    })
    setCurrent(idx)
  })

  return (
    <Section
      number={6}
      label="Approach"
      layout="stacked"
      title={['The consultation', <span className="serif-accent">journey</span>]}
      intro="What to expect, from the first conversation to follow-up. Every patient is different — this describes the general process, not a promise of any particular outcome."
    >
      <div className="grid gap-10 lg:grid-cols-12">
        {/* Sticky stage counter (desktop) */}
        <aside className="hidden lg:col-span-3 lg:block" aria-hidden>
          <div className="sticky top-40">
            <p className="eyebrow">Stage</p>
            <div className="mt-4 flex items-end gap-2 font-display font-extralight leading-none tracking-[-0.06em]">
              <span className="relative inline-block h-[6.5rem] overflow-hidden text-[6.5rem]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={current}
                    className="block"
                    initial={{ y: '100%' }}
                    animate={{ y: '0%' }}
                    exit={{ y: '-100%' }}
                    transition={{ duration: 0.6, ease: EASE }}
                  >
                    0{current + 1}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="pb-3 text-2xl text-muted">/0{stages.length}</span>
            </div>
            <p className="mt-6 text-sm uppercase tracking-[0.16em] text-accent">{stages[current].title}</p>
          </div>
        </aside>

        <ol ref={trackRef} className="relative lg:col-span-9">
          <span aria-hidden className="absolute bottom-10 left-[1.1875rem] top-10 w-px bg-line sm:left-[1.6875rem]" />
          <motion.span
            aria-hidden
            className="absolute bottom-10 left-[1.1875rem] top-10 w-px origin-top bg-gradient-to-b from-accent to-accent-2 sm:left-[1.6875rem]"
            style={{ scaleY: fill }}
          />
          {stages.map((s, i) => (
            <motion.li
              key={s.title}
              className="relative grid grid-cols-[2.5rem_1fr] gap-5 py-10 sm:grid-cols-[3.5rem_1fr] sm:gap-10 sm:py-16"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '0px 0px -15% 0px' }}
            >
              <motion.span
                className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-bg font-display text-xs tabular-nums sm:h-14 sm:w-14 sm:text-sm"
                variants={{ hidden: { scale: 0.5, opacity: 0 }, show: { scale: 1, opacity: 1 } }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                0{i + 1}
              </motion.span>
              <div className="min-w-0">
                <div className="overflow-hidden">
                  <motion.h2
                    className="font-display text-[clamp(2rem,5.5vw,5rem)] font-light uppercase leading-[0.95] tracking-[-0.045em]"
                    variants={{ hidden: { y: '100%' }, show: { y: '0%' } }}
                    transition={{ duration: 1, ease: EASE, delay: 0.08 }}
                  >
                    {s.title}
                  </motion.h2>
                </div>
                <motion.p
                  className="lead mt-5 max-w-2xl"
                  variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
                >
                  {s.description}
                </motion.p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>

      <p className="mt-16 max-w-3xl rounded-3xl border border-line p-6 text-sm leading-relaxed text-muted sm:p-8">
        <span className="eyebrow mb-2 block !text-fg">Please note</span>
        Treatment decisions depend on each person’s circumstances and are made together after a full clinical assessment.
        No specific result can be guaranteed.
      </p>
    </Section>
  )
}
