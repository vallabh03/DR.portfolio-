import { doctor } from '../data/doctor'
import RevealText from './RevealText'
import DrawLine from './DrawLine'

/** Shown on Home only when patient-approved testimonials exist (see data/navigation.ts). */
export default function Testimonials() {
  const items = doctor.testimonials

  return (
    <section aria-labelledby="testimonials-title" className="container-page section-y border-t border-line">
      <RevealText as="h2" id="testimonials-title" lines={['In their own words']} className="heading-2" />
      <ul className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2">
        {items.map((t, i) => (
          <li key={i} className="relative flex flex-col rounded-lg border border-line bg-surface p-6 sm:p-10">
            <figure>
              <blockquote className="font-serif text-[clamp(1.25rem,1.1rem+0.6vw,1.625rem)] leading-[1.45]">
                <span className="text-brass">“</span>
                {t.quote}
                <span className="text-brass">”</span>
              </blockquote>
              <figcaption className="relative mt-8 pt-5 text-sm">
                <DrawLine className="absolute inset-x-0 top-0 bg-line" delay={i * 0.08} />
                <span className="font-medium">{t.attribution}</span>
                {t.context && <span className="text-muted">, {t.context}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
