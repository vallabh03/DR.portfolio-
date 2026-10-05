import { motion } from 'motion/react'
import { doctor, isPlaceholder } from '../data/doctor'
import { BOOK_PATH } from '../data/navigation'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import Button, { ArrowRight } from '../components/Button'
import { EASE } from '../components/Reveal'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay },
})

export default function Hero() {
  const facts = [
    { k: 'Specialty', v: doctor.title },
    { k: 'Practice', v: doctor.contact.clinic },
    { k: 'Languages', v: doctor.about.languages.join(', ') },
  ]

  return (
    <section aria-labelledby="hero-title">
      <div className="container-page pb-16 pt-8 md:pb-24 md:pt-14 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Text */}
          <div className="lg:col-span-7">
            <motion.p className="label flex items-center gap-3" {...fadeUp(0.05)}>
              <span aria-hidden className="h-px w-6 bg-brass" />
              <span className={isPlaceholder(doctor.title) ? 'text-muted' : ''}>{doctor.title}</span>
            </motion.p>

            <RevealText
              as="h1"
              id="hero-title"
              lines={[doctor.firstLine, doctor.lastLine]}
              className="display-hero mt-6"
              delay={0.1}
              immediate
            />

            <motion.p
              className="mt-8 font-serif text-[clamp(1.375rem,1.15rem+1vw,2rem)] leading-[1.3] tracking-[-0.01em] text-fg/80"
              {...fadeUp(0.35)}
            >
              {doctor.statement.map((s, i) => (
                <span key={i} className={`block ${i === 1 ? 'em-serif text-accent' : ''}`}>
                  {s}
                </span>
              ))}
            </motion.p>

            <motion.div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap" {...fadeUp(0.5)}>
              <Button to={BOOK_PATH}>
                Book a consultation <ArrowRight />
              </Button>
              <Button to="/#about" variant="secondary">
                About Dr. Thaduri
              </Button>
            </motion.div>
          </div>

          {/* Portrait */}
          <div className="lg:col-span-5">
            <div className="mx-auto w-full max-w-[26rem] lg:mr-0 lg:max-w-none">
              <MedicalImage
                src="/images/doctor-hero.jpg"
                alt={`Portrait of ${doctor.name}`}
                placeholderLabel="Portrait"
                priority
                hoverZoom={false}
                delay={0.15}
                className="aspect-[4/5] w-full rounded-b-lg rounded-t-full"
              />
            </div>
          </div>
        </div>

        {/* At a glance */}
        <motion.div className="mt-16 md:mt-24" {...fadeUp(0.6)}>
          <p className="measure text-muted">
            A digital portfolio of clinical practice — experience, credentials and approach to care.
          </p>
          <dl className="mt-6 grid border-y border-line sm:grid-cols-3">
            {facts.map((f, i) => (
              <div key={f.k} className={`py-5 sm:px-6 sm:py-6 ${i > 0 ? 'border-t border-line sm:border-l sm:border-t-0' : 'sm:pl-0'}`}>
                <dt className="label">{f.k}</dt>
                <dd className={`mt-2 ${isPlaceholder(f.v) ? 'text-muted' : ''}`}>{f.v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  )
}
