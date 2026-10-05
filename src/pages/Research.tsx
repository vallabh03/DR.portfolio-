import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Section from '../components/Section'
import MedicalImage from '../components/MedicalImage'
import { doctor, isPlaceholder } from '../data/doctor'

const EASE = [0.16, 1, 0.3, 1] as const

export default function Research() {
  const [open, setOpen] = useState<string | null>('0-0')
  let counter = 0

  return (
    <Section
      number={7}
      label="Research"
      title={['Research &', <span className="serif-accent">academic work</span>]}
      intro="Research interests, publications, clinical studies, conferences and presentations. Entries are listed only once they have been verified, with links to the original sources."
      headerExtra={
        <div className="mt-10">
          <p className="eyebrow">Research interests</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {doctor.researchInterests.map((r, i) => (
              <li key={i} className="rounded-full border border-line px-4 py-2 text-sm text-muted">
                {r}
              </li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="group">
        <MedicalImage
          src="/images/research.jpg"
          alt="Research and academic work"
          placeholderLabel="Research"
          className="aspect-[16/9] w-full rounded-[2rem]"
        />
      </div>

      <div className="mt-16 space-y-14">
        {doctor.research.map((group, gi) => (
          <section key={group.category} aria-labelledby={`rg-${gi}`}>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 id={`rg-${gi}`} className="eyebrow !text-fg">
                {group.category}
              </h2>
              <span className="text-xs tabular-nums text-subtle">{String(group.items.length).padStart(2, '0')}</span>
            </div>
            <ul className="border-t border-line">
              {group.items.map((item, ii) => {
                counter += 1
                const n = counter
                const key = `${gi}-${ii}`
                const isOpen = open === key
                const panel = `research-panel-${key}`
                return (
                  <li key={key} className="border-b border-line">
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panel}
                        onClick={() => setOpen(isOpen ? null : key)}
                        className="group/row grid w-full grid-cols-[1fr_auto] items-center gap-4 py-6 text-left sm:grid-cols-[7.5rem_1fr_auto_auto] sm:gap-6"
                      >
                        <span className="eyebrow col-span-2 !text-[0.625rem] sm:col-span-1">Research {String(n).padStart(2, '0')}</span>
                        <span className={`font-display text-xl font-normal tracking-[-0.02em] transition-transform duration-500 group-hover/row:translate-x-1 sm:text-2xl ${isPlaceholder(item.title) ? 'text-fg/75' : ''}`}>
                          {item.title}
                        </span>
                        <span className="hidden text-sm tabular-nums text-muted sm:block">{item.year}</span>
                        <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line-strong transition-colors group-hover/row:border-fg">
                          <span className="absolute h-px w-3 bg-current" />
                          <span className={`absolute h-3 w-px bg-current transition-transform duration-500 ${isOpen ? 'scale-y-0' : ''}`} />
                        </span>
                      </button>
                    </h3>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panel}
                          role="region"
                          className="overflow-hidden"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.6, ease: EASE }}
                        >
                          <div className="grid gap-6 pb-8 sm:grid-cols-[7.5rem_1fr] sm:gap-6">
                            <span className="text-sm tabular-nums text-muted sm:hidden">{item.year}</span>
                            <div className="sm:col-start-2">
                              <p className={`max-w-2xl leading-relaxed ${isPlaceholder(item.description) ? 'text-muted' : 'text-fg/85'}`}>
                                {item.description}
                              </p>
                              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                                {item.venue && <span className="text-muted">{item.venue}</span>}
                                {item.link ? (
                                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-2 text-accent" data-cursor="OPEN">
                                    Read publication ↗
                                  </a>
                                ) : (
                                  <span className="text-subtle">[PUBLICATION LINK]</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Section>
  )
}
