import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { doctor, isPlaceholder } from '../data/doctor'
import { EASE, EASE_EXIT, EASE_IN_OUT, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import BookingPrompt from '../components/BookingPrompt'

export default function Expertise() {
  const entrance = useEntrance()
  const items = doctor.expertise
  const [open, setOpen] = useState<number | null>(null)
  const [preview, setPreview] = useState(0)
  const shown = open ?? preview
  const animated = useDecorativeMotion()

  return (
    <>
      {/* ── Hero: oversized headline with the introduction set against it ── */}
      <section aria-labelledby="expertise-title" className="container-page pb-12 pt-10 md:pb-20 md:pt-16 lg:pt-24">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
          <RevealText as="h1" id="expertise-title" lines={['Areas of', 'clinical focus']} className="display-hero lg:col-span-8" delay={0.1} immediate />
          <motion.p
            className="lead measure lg:col-span-4 lg:pb-3"
            {...entrance(0.45)}
          >
            Only verified specialties are listed here. Select an area to see the conditions and procedures it covers.
          </motion.p>
        </div>
        <DrawLine immediate delay={0.5} duration={1.3} className="mt-12 bg-line-strong md:mt-16" />
      </section>

      {/* ── Index + sticky image panel ── */}
      <section aria-label="Areas of care" className="container-page pb-16 md:pb-24 lg:pb-32">
        <div className="grid gap-10 lg:grid-cols-12">
          <ol className="lg:col-span-7">
            {items.map((item, i) => {
              const isOpen = open === i
              const n = String(i + 1).padStart(2, '0')
              const panelId = `expertise-panel-${i}`
              return (
                <li
                  key={i}
                  className="relative"
                  onMouseEnter={() => setPreview(i)}
                  onFocus={() => setPreview(i)}
                >
                  {i > 0 && <DrawLine className="absolute inset-x-0 top-0 bg-line" delay={0.05 * i} />}
                  <h2>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-start gap-4 pt-7 text-left sm:grid-cols-[3.5rem_1fr_auto] md:pt-9"
                    >
                      <span
                        aria-hidden
                        className={`pt-1 font-serif text-lg tabular-nums transition-colors duration-300 sm:text-xl ${isOpen ? 'text-accent' : 'text-brass'}`}
                      >
                        {n}
                      </span>
                      <span
                        className={`min-w-0 pt-0.5 font-serif text-[clamp(1.625rem,1.35rem+1.2vw,2.5rem)] leading-[1.1] tracking-[-0.015em] transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5 group-hover:text-accent ${
                          isPlaceholder(item.title) ? 'text-fg/75' : ''
                        }`}
                      >
                        {item.title}
                      </span>
                      <span
                        aria-hidden
                        className={`relative mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                          isOpen ? 'border-accent bg-accent text-on-accent' : 'border-line-strong group-hover:border-accent group-hover:text-accent'
                        }`}
                      >
                        <span className="absolute h-px w-3.5 bg-current" />
                        <motion.span
                          className="absolute h-3.5 w-px bg-current"
                          animate={{ rotate: isOpen ? 90 : 0, opacity: isOpen ? 0 : 1 }}
                          transition={{ duration: 0.35, ease: EASE_IN_OUT }}
                        />
                      </span>
                    </button>
                  </h2>
                  <p
                    className={`measure pb-7 pl-[3.5rem] pr-14 pt-2 sm:pl-[4.5rem] md:pb-9 ${isPlaceholder(item.description) ? 'text-muted' : 'text-fg/85'}`}
                  >
                    {item.description}
                  </p>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-label={`${item.title}: conditions and procedures`}
                        className="overflow-hidden"
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0, transition: { duration: 0.3, ease: EASE_EXIT } }}
                        transition={{ duration: 0.5, ease: EASE_IN_OUT }}
                      >
                        <div className="pb-8 pl-[3.5rem] sm:pl-[4.5rem]">
                          <h3 className="label">Conditions and procedures</h3>
                          <ul className="mt-3 border-t border-line">
                            {item.details.map((d, j) => (
                              <motion.li
                                key={j}
                                className={`border-b border-line py-3 ${isPlaceholder(d) ? 'text-muted' : ''}`}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, ease: EASE, delay: 0.15 + j * 0.05 }}
                              >
                                {d}
                              </motion.li>
                            ))}
                          </ul>
                          {/* On smaller screens the image sits inside the open panel */}
                          <MedicalImage
                            src={item.image}
                            sizes="100vw"
                            alt={`${item.title}, illustrative image`}
                            placeholderLabel={`Expertise ${n}`}
                            className="mt-6 aspect-[4/3] w-full rounded-lg lg:hidden"
                            hoverZoom={false}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              )
            })}
            <li aria-hidden className="relative">
              <DrawLine className="absolute inset-x-0 top-0 bg-line" delay={0.05 * items.length} />
            </li>
          </ol>

          {/* Desktop: the selected or hovered area's image, changed with a mask wipe */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-2">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={shown}
                    className="absolute inset-0"
                    initial={animated ? { clipPath: 'inset(0% 0% 0% 100%)', zIndex: 1 } : false}
                    animate={{ clipPath: 'inset(0% 0% 0% 0%)', zIndex: 1 }}
                    // The previous image stays beneath until the new one has covered it.
                    exit={{ zIndex: 0, transition: { duration: 0, delay: 0.7 } }}
                    transition={{ duration: 0.7, ease: EASE_IN_OUT }}
                  >
                    <MedicalImage
                      src={items[shown].image}
                      sizes="38vw"
                      alt={`${items[shown].title}, illustrative image`}
                      placeholderLabel={`Expertise ${String(shown + 1).padStart(2, '0')}`}
                      className="h-full w-full"
                      priority
                      reveal={false}
                      hoverZoom={false}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              <p className="mt-4 flex items-baseline justify-between gap-4 text-sm text-muted" aria-hidden>
                <span className={isPlaceholder(items[shown].title) ? '' : 'text-fg'}>{items[shown].title}</span>
                <span className="tabular-nums">
                  {String(shown + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <BookingPrompt />
    </>
  )
}
