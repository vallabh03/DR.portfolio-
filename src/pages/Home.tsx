import { motion } from 'motion/react'
import { Link } from 'react-router'
import { doctor, isPlaceholder } from '../data/doctor'
import { BOOK_PATH, navRoutes, showTestimonials } from '../data/navigation'
import { useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import CropMarks from '../components/CropMarks'
import GridLines from '../components/GridLines'
import DrawLine from '../components/DrawLine'
import Button, { ArrowRight } from '../components/Button'
import Testimonials from '../components/Testimonials'
import BookingPrompt from '../components/BookingPrompt'

export default function Home() {
  const entrance = useEntrance()
  const facts = [
    { k: 'Specialty', v: doctor.title },
    { k: 'Practice', v: doctor.contact.clinic },
    { k: 'Languages', v: doctor.about.languages.join(', ') },
  ]
  const pages = navRoutes.filter((r) => r.path !== '/')

  return (
    <>
      {/* ── Hero. Primary motion: the name rises and the portrait opens.
          Supporting details (grid, crop marks) arrive faintly afterwards. ── */}
      <section aria-labelledby="home-title" className="relative isolate">
        <GridLines delay={1.1} />
        <div className="container-page pb-16 pt-10 md:pb-24 md:pt-16 lg:pb-28 lg:pt-20">
          <div className="grid items-end gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7 lg:pb-6">
              <RevealText as="h1" id="home-title" lines={[doctor.firstLine, doctor.lastLine]} className="display-hero" delay={0.1} immediate />
              {/* Supporting copy settles as one group once the name has landed */}
              <motion.div {...entrance(0.7)}>
                <p className={`mt-6 text-lg ${isPlaceholder(doctor.title) ? 'text-muted' : 'text-fg'}`}>{doctor.title}</p>
                <span aria-hidden className="mt-8 block h-px max-w-md bg-accent" />
                <p className="mt-8 font-serif text-[clamp(1.375rem,1.15rem+1vw,2rem)] leading-[1.3] tracking-[-0.01em] text-fg/85">
                  {doctor.statement.map((s, i) => (
                    <span key={i} className="block">
                      {s}
                    </span>
                  ))}
                </p>
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button to={BOOK_PATH}>
                    Book a consultation <ArrowRight />
                  </Button>
                  <Button to="/about" variant="secondary">
                    About Dr. Thaduri
                  </Button>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative mx-auto w-full max-w-[24rem] lg:mr-0 lg:max-w-none">
                <MedicalImage
                  src="/images/doctor-hero.jpg"
                  sizes="(min-width: 1024px) 38vw, min(24rem, 100vw)"
                  alt={`Portrait of ${doctor.name}`}
                  placeholderLabel="Portrait"
                  priority
                  hoverZoom={false}
                  delay={0.2}
                  className="aspect-[4/5] w-full rounded-b-lg rounded-t-full"
                />
                <CropMarks delay={1.4} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── At a glance ── */}
      <section aria-label="At a glance" className="container-page">
        <p className="measure text-muted">A digital portfolio of clinical practice: experience, credentials and approach to care.</p>
        <div className="relative mt-6">
          <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1.2} />
          <dl className="grid sm:grid-cols-3">
            {facts.map((f, i) => (
              <div key={f.k} className={`py-5 sm:py-7 ${i > 0 ? 'border-t border-line sm:border-l sm:border-t-0 sm:pl-6' : ''}`}>
                <dt className="label">{f.k}</dt>
                <dd className={`mt-2 ${isPlaceholder(f.v) ? 'text-muted' : ''}`}>{f.v}</dd>
              </div>
            ))}
          </dl>
          <DrawLine className="absolute inset-x-0 bottom-0 bg-line-strong" duration={1.2} delay={0.15} />
        </div>
      </section>

      {/* ── Index of pages ── */}
      <section aria-labelledby="index-title" className="container-page section-y">
        <div className="grid gap-10 lg:grid-cols-12">
          <RevealText as="h2" id="index-title" lines={['Inside the practice']} className="heading-2 lg:col-span-4" />
          <ol className="lg:col-span-8">
            {pages.map((p, i) => (
              <li key={p.path} className="relative">
                <DrawLine className="absolute inset-x-0 top-0 bg-line" delay={i * 0.06} />
                <Link
                  to={p.path}
                  className="group grid grid-cols-[2.25rem_1fr_auto] items-center gap-4 py-6 sm:grid-cols-[3rem_1fr_1fr_auto] sm:py-8"
                >
                  <span className="font-serif text-lg tabular-nums text-brass">0{i + 1}</span>
                  <span className="font-serif text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-none tracking-[-0.015em] transition-[transform,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 group-hover:text-accent">
                    {p.label}
                  </span>
                  <span className="hidden text-muted sm:block">{p.blurb}</span>
                  <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-line-strong transition-colors duration-300 group-hover:border-accent group-hover:text-accent">
                    <ArrowRight className="group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
            <li aria-hidden className="relative">
              <DrawLine className="absolute inset-x-0 top-0 bg-line" delay={pages.length * 0.06} />
            </li>
          </ol>
        </div>
      </section>

      {showTestimonials && <Testimonials />}

      <BookingPrompt />
    </>
  )
}
