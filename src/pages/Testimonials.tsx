import { motion } from 'framer-motion'
import Section from '../components/Section'
import RevealText from '../components/RevealText'
import { doctor } from '../data/doctor'

const EASE = [0.16, 1, 0.3, 1] as const

export default function Testimonials() {
  const items = doctor.testimonials

  return (
    <Section
      number={8}
      label="Testimonials"
      layout="stacked"
      title={['In their', <span className="serif-accent">own words</span>]}
    >
      {items.length === 0 ? (
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="relative pt-16 sm:pt-20 lg:col-span-8">
            <span
              aria-hidden
              className="serif-accent pointer-events-none absolute -left-2 -top-4 select-none text-[clamp(8rem,18vw,16rem)] leading-none text-accent/20 sm:-top-8"
            >
              “
            </span>
            <RevealText
              as="p"
              text="Patient testimonials will be added after approval."
              mode="mask"
              className="relative font-display text-[clamp(2rem,4.6vw,4.5rem)] font-light leading-[1.05] tracking-[-0.04em]"
            />
            <p className="lead mt-8 max-w-xl">
              Testimonials are published only with the patient’s explicit consent. None have been added yet.
            </p>
          </div>

          {/* Ghosted layout preview of how approved testimonials will appear */}
          <ul aria-hidden className="grid gap-4 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <motion.li
                key={i}
                className="rounded-[1.75rem] border border-dashed border-line-strong p-7"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: EASE, delay: i * 0.1 }}
              >
                <span className="serif-accent text-4xl text-fg/20">“</span>
                <div className="mt-4 space-y-2.5">
                  <span className="block h-2 w-full rounded-full bg-fg/[0.07]" />
                  <span className="block h-2 w-11/12 rounded-full bg-fg/[0.07]" />
                  <span className="block h-2 w-3/4 rounded-full bg-fg/[0.07]" />
                </div>
                <p className="eyebrow mt-8 !text-[0.625rem]">Awaiting approval</p>
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((t, i) => (
            <motion.li
              key={i}
              className="trace-card flex flex-col rounded-[2rem] border border-line bg-surface p-8 sm:p-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE, delay: (i % 2) * 0.1 }}
            >
              <figure>
                <blockquote className="font-display text-[clamp(1.25rem,2vw,1.75rem)] font-light leading-snug tracking-[-0.02em]">
                  <span className="serif-accent text-accent">“</span>
                  {t.quote}
                  <span className="serif-accent text-accent">”</span>
                </blockquote>
                <figcaption className="mt-8 border-t border-line pt-5 text-sm">
                  <span className="font-medium">{t.attribution}</span>
                  {t.context && <span className="text-muted"> · {t.context}</span>}
                </figcaption>
              </figure>
            </motion.li>
          ))}
        </ul>
      )}
    </Section>
  )
}
