import PageSection from '../components/PageSection'
import SectionHeader from '../components/SectionHeader'
import Reveal from '../components/Reveal'
import { doctor, isPlaceholder } from '../data/doctor'

export default function Experience() {
  return (
    <PageSection id="experience">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <SectionHeader
          id="experience-title"
          label="Experience"
          title={['Track', <span className="em-serif">record</span>]}
          intro="A timeline of clinical roles and training."
          className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start"
        />

        <div className="lg:col-span-7">
          <ol className="relative border-l border-line-strong">
            {doctor.experience.map((item, i) => (
              <Reveal as="li" key={i} className="relative pb-10 pl-7 last:pb-0 sm:pl-10 md:pb-14">
                <span aria-hidden className="absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full border border-accent bg-bg" />
                <p className="font-serif text-lg tabular-nums text-brass">{item.year}</p>
                <h3 className={`heading-3 mt-1 ${isPlaceholder(item.role) ? 'text-fg/75' : ''}`}>{item.role}</h3>
                <p className="mt-1 text-muted">
                  {item.institution}
                  {item.location ? ` · ${item.location}` : ''}
                </p>
                <p className={`measure mt-4 ${isPlaceholder(item.description) ? 'text-muted' : 'text-fg/85'}`}>{item.description}</p>
                {item.highlights && item.highlights.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {item.highlights.map((h, j) => (
                      <li key={j} className="flex gap-3 text-muted">
                        <span aria-hidden className="mt-[0.8em] h-px w-3 shrink-0 bg-brass" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>
            ))}
          </ol>
          <p className="mt-10 text-sm text-muted">Dates, positions and institutions will be added once verified.</p>
        </div>
      </div>
    </PageSection>
  )
}
