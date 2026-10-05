import { useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import Section from '../components/Section'
import { doctor, isPlaceholder } from '../data/doctor'
import { useScroller } from '../context/ChapterContext'

const EASE = [0.16, 1, 0.3, 1] as const

export default function Experience() {
  const [active, setActive] = useState<number | null>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const scroller = useScroller()
  const { scrollYProgress } = useScroll({
    container: scroller ?? undefined,
    target: listRef,
    offset: ['start 75%', 'end 60%'],
  })
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <Section
      number={3}
      label="Experience"
      title={['Track', <span className="serif-accent">record</span>]}
      intro="A timeline of clinical roles and training. Hover over — or tap — any entry to reveal more about the role."
    >
      <ol ref={listRef} className="relative" onMouseLeave={() => setActive(null)}>
        {/* Track + animated progress */}
        <span aria-hidden className="absolute bottom-0 left-[0.4375rem] top-2 w-px bg-line md:left-[9.4375rem]" />
        <motion.span
          aria-hidden
          className="absolute bottom-0 left-[0.4375rem] top-2 w-px origin-top bg-accent md:left-[9.4375rem]"
          style={{ scaleY: line }}
        />

        {doctor.experience.map((item, i) => {
          const open = active === i
          const id = `exp-${i}`
          return (
            <motion.li
              key={i}
              className="relative pb-6"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.05 * i }}
              onMouseEnter={() => setActive(i)}
            >
              <button
                type="button"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setActive(open ? null : i)}
                onFocus={() => setActive(i)}
                data-cursor={open ? undefined : 'VIEW'}
                className="group grid w-full grid-cols-[1rem_1fr] gap-x-6 text-left md:grid-cols-[8rem_1rem_1fr] md:gap-x-6"
              >
                {/* Year (desktop column) */}
                <span
                  className={`hidden pt-1 text-right font-display text-2xl font-light tabular-nums tracking-[-0.03em] transition-colors duration-500 md:block ${
                    open ? 'text-accent' : 'text-muted'
                  }`}
                >
                  {item.year}
                </span>
                {/* Node */}
                <span className="relative flex justify-center pt-3">
                  <span
                    className={`relative z-10 block h-3.5 w-3.5 rounded-full border transition-all duration-500 ${
                      open ? 'scale-110 border-accent bg-accent' : 'border-line-strong bg-bg group-hover:border-fg'
                    }`}
                  />
                </span>
                {/* Content */}
                <span
                  className={`block rounded-3xl border p-6 transition-all duration-500 sm:p-7 ${
                    open ? 'border-line-strong bg-surface' : 'border-transparent'
                  }`}
                >
                  <span className="mb-2 block font-display text-sm tabular-nums text-accent md:hidden">{item.year}</span>
                  <span className="block font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-light leading-tight tracking-[-0.035em]">
                    {item.role}
                  </span>
                  <span className="mt-2 block text-sm text-muted">
                    {item.institution}
                    {item.location ? ` · ${item.location}` : ''}
                  </span>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.span
                        id={id}
                        className="block overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                      >
                        <span className={`block pt-5 leading-relaxed ${isPlaceholder(item.description) ? 'text-muted' : 'text-fg/85'}`}>
                          {item.description}
                        </span>
                        {item.highlights && (
                          <span className="mt-4 flex flex-wrap gap-2">
                            {item.highlights.map((h, j) => (
                              <span key={j} className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                                {h}
                              </span>
                            ))}
                          </span>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </button>
            </motion.li>
          )
        })}
      </ol>
      <p className="mt-10 text-sm text-subtle md:pl-[10.5rem]">Dates, positions and institutions will be added once verified.</p>
    </Section>
  )
}
