import PageSection from '../components/PageSection'
import SectionHeader from '../components/SectionHeader'
import Reveal from '../components/Reveal'
import { doctor } from '../data/doctor'

/** Rendered only when patient-approved testimonials exist (see data/navigation.ts). */
export default function Testimonials() {
  const items = doctor.testimonials

  return (
    <PageSection id="testimonials">
      <SectionHeader id="testimonials-title" label="Testimonials" title={['In their', <span className="em-serif">own words</span>]} />

      <ul className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2">
        {items.map((t, i) => (
          <Reveal as="li" key={i} delay={(i % 2) * 0.06} className="flex flex-col rounded-lg border border-line bg-surface p-6 sm:p-10">
            <figure>
              <blockquote className="font-serif text-[clamp(1.25rem,1.1rem+0.6vw,1.625rem)] leading-[1.45]">
                <span className="text-brass">“</span>
                {t.quote}
                <span className="text-brass">”</span>
              </blockquote>
              <figcaption className="mt-8 border-t border-line pt-5 text-sm">
                <span className="font-medium">{t.attribution}</span>
                {t.context && <span className="text-muted"> · {t.context}</span>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </PageSection>
  )
}
