import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Section from '../components/Section'
import MedicalImage from '../components/MedicalImage'
import { doctor, isPlaceholder } from '../data/doctor'

const EASE = [0.16, 1, 0.3, 1] as const

export default function Expertise() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <Section
      number={5}
      label="Expertise"
      layout="stacked"
      title={['Areas of', <span className="serif-accent">clinical focus</span>]}
      intro="Only verified specialties are listed here. Select an area to see the conditions and procedures it covers."
    >
      <ol className="border-t border-line">
        {doctor.expertise.map((item, i) => {
          const isOpen = open === i
          const id = `expertise-${i}`
          return (
            <motion.li
              key={i}
              className="group relative border-b border-line"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              transition={{ duration: 1, ease: EASE }}
            >
              {/* hover wash */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-accent-soft transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"
              />
              <div className="relative grid gap-6 py-10 md:grid-cols-12 md:gap-8 md:py-14">
                <span
                  aria-hidden
                  className="font-display text-[clamp(4rem,11vw,10rem)] font-extralight leading-[0.8] tracking-[-0.06em] text-fg/[0.12] transition-colors duration-700 group-hover:text-accent md:col-span-3"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="md:col-span-5 md:pt-2">
                  <h2 className={`display-md transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 ${isPlaceholder(item.title) ? 'text-fg/75' : ''}`}>
                    <span className="sr-only">{String(i + 1).padStart(2, '0')}. </span>
                    {item.title}
                  </h2>
                  <p className={`mt-4 max-w-md leading-relaxed ${isPlaceholder(item.description) ? 'text-muted' : 'text-fg/80'}`}>
                    {item.description}
                  </p>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={id}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="mt-6 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em]"
                    data-cursor={isOpen ? 'CLOSE' : 'OPEN'}
                  >
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-line-strong transition-colors group-hover:border-fg">
                      <span className="absolute h-px w-3 bg-current" />
                      <span className={`absolute h-3 w-px bg-current transition-transform duration-500 ${isOpen ? 'scale-y-0' : ''}`} />
                    </span>
                    <span className="link-underline">{isOpen ? 'Hide details' : 'Conditions & procedures'}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={id}
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                      >
                        <ul className="flex flex-wrap gap-2 pt-5">
                          {item.details.map((d, j) => (
                            <li key={j} className="rounded-full border border-line px-3.5 py-1.5 text-sm text-muted">
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
                    placeholderLabel={`Expertise ${String(i + 1).padStart(2, '0')}`}
                    className="aspect-[4/3] w-full rounded-[1.5rem]"
                  />
                </div>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </Section>
  )
}
