import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import PageSection from '../components/PageSection'
import SectionHeader from '../components/SectionHeader'
import MedicalImage from '../components/MedicalImage'
import Reveal, { EASE } from '../components/Reveal'
import { doctor, isPlaceholder } from '../data/doctor'

export default function Expertise() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <PageSection id="expertise">
      <SectionHeader
        id="expertise-title"
        label="Expertise"
        title={['Areas of', <span className="em-serif">clinical focus</span>]}
        intro="Only verified specialties are listed here. Select an area to see the conditions and procedures it covers."
      />

      <ol className="mt-12 border-t border-line md:mt-16">
        {doctor.expertise.map((item, i) => {
          const isOpen = open === i
          const id = `expertise-panel-${i}`
          const n = String(i + 1).padStart(2, '0')
          return (
            <Reveal as="li" key={i} className="group border-b border-line">
              <div className="grid gap-6 py-8 md:grid-cols-12 md:gap-8 md:py-12">
                <span aria-hidden className="font-serif text-2xl tabular-nums text-brass md:col-span-2 md:text-3xl">
                  {n}
                </span>

                <div className="md:col-span-6">
                  <h3 className={`heading-3 !text-[clamp(1.5rem,1.3rem+0.8vw,2rem)] ${isPlaceholder(item.title) ? 'text-fg/75' : ''}`}>
                    <span className="sr-only">{n}. </span>
                    {item.title}
                  </h3>
                  <p className={`measure mt-3 ${isPlaceholder(item.description) ? 'text-muted' : 'text-fg/85'}`}>{item.description}</p>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="mt-4 inline-flex min-h-11 items-center gap-3 font-medium text-accent transition-colors duration-200 hover:text-accent-hover"
                  >
                    <span aria-hidden className="relative flex h-6 w-6 items-center justify-center rounded-sm border border-current">
                      <span className="absolute h-px w-2.5 bg-current" />
                      <span className={`absolute h-2.5 w-px bg-current transition-transform duration-200 ${isOpen ? 'scale-y-0' : ''}`} />
                    </span>
                    {isOpen ? 'Hide details' : 'Conditions & procedures'}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={id}
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.35, ease: EASE }}
                      >
                        <ul className="flex flex-wrap gap-2 pt-3">
                          {item.details.map((d, j) => (
                            <li key={j} className="rounded-sm border border-line-strong px-3 py-1.5 text-sm text-muted">
                              {d}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="md:col-span-4">
                  <MedicalImage
                    src={item.image}
                    alt={`${item.title} — illustrative image`}
                    placeholderLabel={`Expertise ${n}`}
                    className="aspect-[4/3] w-full rounded-lg"
                  />
                </div>
              </div>
            </Reveal>
          )
        })}
      </ol>
    </PageSection>
  )
}
