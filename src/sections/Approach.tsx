import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import PageSection from '../components/PageSection'
import SectionHeader from '../components/SectionHeader'
import Reveal, { EASE } from '../components/Reveal'
import { doctor } from '../data/doctor'
import { useScrollSpy } from '../hooks/useScrollSpy'

const stageIds = doctor.approach.map((_, i) => `approach-stage-${i}`)

export default function Approach() {
  const stages = doctor.approach
  const spied = useScrollSpy(stageIds)
  // Hold the last stage while the reading line sits between or beyond stages.
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    if (spied) setCurrent(stageIds.indexOf(spied))
  }, [spied])

  return (
    <PageSection id="approach" tone="surface">
      <SectionHeader
        id="approach-title"
        label="Approach"
        title={['The consultation', <span className="em-serif">journey</span>]}
        intro="What to expect, from the first conversation to follow-up. Every patient is different — this describes the general process, not a promise of any particular outcome."
      />

      <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12">
        {/* Stage counter (desktop) */}
        <aside className="hidden lg:col-span-4 lg:block" aria-hidden>
          <div className="sticky top-32">
            <p className="label">Stage</p>
            <div className="mt-3 flex items-baseline gap-2 font-serif leading-none">
              <span className="relative inline-block h-[5.5rem] overflow-hidden text-[5.5rem] tabular-nums text-brass">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={current}
                    className="block"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    0{current + 1}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="text-2xl text-muted">/ 0{stages.length}</span>
            </div>
            <p className="mt-5 font-medium text-accent">{stages[current].title}</p>
          </div>
        </aside>

        <ol className="border-t border-line lg:col-span-8">
          {stages.map((s, i) => (
            <Reveal
              as="li"
              key={s.title}
              id={stageIds[i]}
              className="grid grid-cols-[2.75rem_1fr] gap-4 border-b border-line py-8 sm:grid-cols-[4rem_1fr] sm:gap-6 md:py-12"
            >
              <span className="font-serif text-xl tabular-nums text-brass sm:text-2xl" aria-hidden>
                0{i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-serif text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.1] tracking-[-0.015em]">
                  <span className="sr-only">Stage {i + 1}: </span>
                  {s.title}
                </h3>
                <p className="lead measure mt-3">{s.description}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>

      <Reveal className="mt-12 md:mt-16">
        <p className="measure rounded-lg border border-line bg-bg p-6 leading-relaxed text-muted sm:p-8">
          <span className="label mb-2 block !text-fg">Please note</span>
          Treatment decisions depend on each person’s circumstances and are made together after a full clinical assessment.
          No specific result can be guaranteed.
        </p>
      </Reveal>
    </PageSection>
  )
}
