import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import PageSection from '../components/PageSection'
import SectionHeader from '../components/SectionHeader'
import MedicalImage from '../components/MedicalImage'
import Reveal, { EASE } from '../components/Reveal'
import { doctor, isPlaceholder } from '../data/doctor'

export default function Research() {
  const [open, setOpen] = useState<string | null>('0-0')
  let counter = 0

  return (
    <PageSection id="research" tone="surface">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <SectionHeader
          id="research-title"
          label="Research"
          title={['Research &', <span className="em-serif">academic work</span>]}
          intro="Research interests, publications, clinical studies, conferences and presentations. Entries are listed only once they have been verified, with links to the original sources."
          className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start"
        >
          <div className="mt-10">
            <p className="label">Research interests</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {doctor.researchInterests.map((r, i) => (
                <li key={i} className={`rounded-sm border border-line-strong px-3 py-1.5 text-sm ${isPlaceholder(r) ? 'text-muted' : ''}`}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </SectionHeader>

        <div className="min-w-0 lg:col-span-7">
          <MedicalImage
            src="/images/research.jpg"
            alt="Research and academic work"
            placeholderLabel="Research"
            className="aspect-[16/9] w-full rounded-lg"
            hoverZoom={false}
          />

          <div className="mt-12 space-y-12">
            {doctor.research.map((group, gi) => (
              <Reveal as="section" key={group.category}>
                <div className="mb-3 flex items-baseline justify-between gap-4">
                  <h3 id={`rg-${gi}`} className="label !text-fg">
                    {group.category}
                  </h3>
                  <span className="text-sm tabular-nums text-muted">{String(group.items.length).padStart(2, '0')}</span>
                </div>
                <ul className="border-t border-line" aria-labelledby={`rg-${gi}`}>
                  {group.items.map((item, ii) => {
                    counter += 1
                    const n = counter
                    const key = `${gi}-${ii}`
                    const isOpen = open === key
                    const panel = `research-panel-${key}`
                    return (
                      <li key={key} className="border-b border-line">
                        <h4>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={panel}
                            onClick={() => setOpen(isOpen ? null : key)}
                            className="group grid min-h-16 w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-5 text-left sm:grid-cols-[6.5rem_1fr_auto_auto] sm:gap-x-6"
                          >
                            <span className="label col-span-2 sm:col-span-1">Research {String(n).padStart(2, '0')}</span>
                            <span
                              className={`font-serif text-xl leading-snug transition-colors duration-200 group-hover:text-accent sm:text-[1.375rem] ${
                                isPlaceholder(item.title) ? 'text-fg/75' : ''
                              }`}
                            >
                              {item.title}
                            </span>
                            <span className="hidden text-sm tabular-nums text-muted sm:block">{item.year}</span>
                            <span
                              aria-hidden
                              className="relative flex h-6 w-6 items-center justify-center rounded-sm border border-line-strong transition-colors duration-200 group-hover:border-accent group-hover:text-accent"
                            >
                              <span className="absolute h-px w-2.5 bg-current" />
                              <span className={`absolute h-2.5 w-px bg-current transition-transform duration-200 ${isOpen ? 'scale-y-0' : ''}`} />
                            </span>
                          </button>
                        </h4>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              id={panel}
                              role="region"
                              className="overflow-hidden"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
                              transition={{ duration: 0.35, ease: EASE }}
                            >
                              <div className="grid gap-3 pb-6 sm:grid-cols-[6.5rem_1fr] sm:gap-6">
                                <span className="text-sm tabular-nums text-muted sm:hidden">{item.year}</span>
                                <div className="sm:col-start-2">
                                  <p className={`measure leading-relaxed ${isPlaceholder(item.description) ? 'text-muted' : 'text-fg/85'}`}>
                                    {item.description}
                                  </p>
                                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                    {item.venue && <span className="text-muted">{item.venue}</span>}
                                    {item.link ? (
                                      <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-11 items-center font-medium text-accent hover:text-accent-hover"
                                      >
                                        <span className="link-underline">Read publication ↗</span>
                                      </a>
                                    ) : (
                                      <span className="text-muted">[PUBLICATION LINK]</span>
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
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </PageSection>
  )
}
