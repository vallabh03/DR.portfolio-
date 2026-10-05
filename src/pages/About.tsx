import { useRef } from 'react'
import { motion } from 'motion/react'
import { doctor, isPlaceholder } from '../data/doctor'
import { useEntrance } from '../lib/motion'
import { useScrollTrack } from '../hooks/useScrollTrack'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import BookingPrompt from '../components/BookingPrompt'

export default function About() {
  const entrance = useEntrance()
  const { about } = doctor
  const facts = [
    { title: 'Education', items: about.education },
    { title: 'Training', items: about.training },
    { title: 'Experience', items: about.experience },
    { title: 'Languages', items: about.languages },
  ]

  return (
    <>
      {/* ── Hero: the headline rises while two photographs open in sequence ── */}
      <section aria-labelledby="about-title" className="container-page pb-16 pt-10 md:pb-24 md:pt-16 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6 lg:pt-8">
            <RevealText as="h1" id="about-title" lines={['About Dr.', 'Abhinav Thaduri']} className="heading-1" delay={0.1} immediate />
            <motion.p
              className={`lead measure mt-8 ${isPlaceholder(doctor.biography) ? '' : 'text-fg/85'}`}
              {...entrance(0.4)}
            >
              {doctor.biography}
            </motion.p>
          </div>

          {/* Layered images: portrait first, clinic overlapping below it */}
          <div className="relative lg:col-span-6">
            <div className="ml-auto w-[78%] lg:w-[72%]">
              <MedicalImage
                src="/images/doctor-about.jpg"
                sizes="(min-width: 1024px) 36vw, 78vw"
                alt={`${doctor.name} in clinic`}
                placeholderLabel="About portrait"
                priority
                hoverZoom={false}
                delay={0.2}
                className="aspect-[4/5] w-full rounded-lg"
              />
            </div>
            <div className="absolute bottom-0 left-0 w-[46%] translate-y-1/4 border-[6px] border-bg lg:w-[42%]">
              <MedicalImage
                src="/images/clinic.jpg"
                sizes="(min-width: 1024px) 21vw, 46vw"
                alt="The clinic"
                placeholderLabel="Clinic"
                priority
                hoverZoom={false}
                delay={0.55}
                className="aspect-square w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Journey, philosophy (as a pull quote) and patient-centred care ── */}
      <section aria-label="Background" className="container-page pb-16 pt-12 md:pb-24 md:pt-20">
        <div className="grid gap-12 md:grid-cols-2 md:gap-10">
          {[
            { title: 'Professional journey', body: about.journey },
            { title: 'Patient-centred approach', body: about.patientCentered },
          ].map((b, i) => (
            <article key={b.title} className="relative pt-6">
              <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={i * 0.1} />
              <h2 className="heading-3">{b.title}</h2>
              <p className={`measure mt-4 ${isPlaceholder(b.body) ? 'text-muted' : 'text-fg/85'}`}>{b.body}</p>
            </article>
          ))}
        </div>

        <figure className="mx-auto mt-16 max-w-4xl text-center md:mt-24">
          <h2 className="sr-only">Clinical philosophy</h2>
          <blockquote className={`font-serif text-[clamp(1.625rem,1.3rem+1.4vw,2.5rem)] leading-[1.3] tracking-[-0.01em] ${isPlaceholder(about.philosophy) ? 'text-muted' : ''}`}>
            {about.philosophy}
          </blockquote>
          <figcaption className="mt-8 flex flex-col items-center gap-4">
            <DrawLine className="w-24 bg-brass" duration={0.8} fromCenter />
            <span className="label">Clinical philosophy</span>
          </figcaption>
        </figure>

        <dl className="mt-16 grid gap-x-6 sm:grid-cols-2 md:mt-24 lg:grid-cols-4">
          {facts.map((f, i) => (
            <div key={f.title} className="relative py-6">
              <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" delay={i * 0.08} />
              <dt className="label">{f.title}</dt>
              <dd className="mt-3">
                <ul className="space-y-1.5">
                  {f.items.map((item, j) => (
                    <li key={j} className={isPlaceholder(item) ? 'text-muted' : ''}>
                      {item}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <ApproachToCare />

      <BookingPrompt />
    </>
  )
}

/** The five stages of a consultation, joined by a line that fills as you read. */
function ApproachToCare() {
  const stages = doctor.approach
  const listRef = useRef<HTMLOListElement>(null)
  const { progress, reached } = useScrollTrack(listRef, stages.length)

  return (
    <section aria-labelledby="approach-title" className="border-y border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
            <RevealText as="h2" id="approach-title" lines={['Approach to care']} className="heading-2" />
            <p className="lead measure mt-6">
              What to expect, from the first conversation to follow-up. Every patient is different. This describes the general
              process, not a promise of any particular outcome.
            </p>
            {/* Stage counter */}
            <p className="mt-10 hidden font-serif text-2xl tabular-nums lg:block" aria-hidden>
              <span className="text-brass">0{Math.max(reached, 1)}</span>
              <span className="text-muted"> / 0{stages.length}</span>
            </p>
          </div>

          <ol ref={listRef} className="relative lg:col-span-7">
            {/* Track and progress */}
            <span aria-hidden className="absolute bottom-6 left-[1.1875rem] top-6 w-px bg-line" />
            <motion.span aria-hidden className="absolute bottom-6 left-[1.1875rem] top-6 w-px origin-top bg-accent" style={{ scaleY: progress }} />

            {stages.map((s, i) => {
              const passed = i < reached
              return (
                <li key={s.title} className="relative grid grid-cols-[2.5rem_1fr] gap-5 pb-12 last:pb-0 sm:gap-8">
                  <span
                    aria-hidden
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border font-serif text-base tabular-nums transition-colors duration-500 ${
                      passed ? 'border-accent bg-accent text-on-accent' : 'border-line-strong bg-surface text-muted'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="font-serif text-[clamp(1.5rem,1.3rem+0.9vw,2.125rem)] leading-[1.15] tracking-[-0.015em]">
                      <span className="sr-only">Stage {i + 1}: </span>
                      {s.title}
                    </h3>
                    <p className="measure mt-3 text-fg/85">{s.description}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <p className="measure mt-16 rounded-lg border border-line bg-bg p-6 leading-relaxed text-muted sm:p-8">
          <span className="mb-2 block font-medium text-fg">Please note</span>
          Treatment decisions depend on each person’s circumstances and are made together after a full clinical assessment. No
          specific result can be guaranteed.
        </p>
      </div>
    </section>
  )
}
