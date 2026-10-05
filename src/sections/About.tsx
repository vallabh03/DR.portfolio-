import PageSection from '../components/PageSection'
import SectionHeader from '../components/SectionHeader'
import MedicalImage from '../components/MedicalImage'
import Reveal from '../components/Reveal'
import { doctor, isPlaceholder } from '../data/doctor'

export default function About() {
  const { about } = doctor

  const blocks = [
    { title: 'Professional journey', body: about.journey },
    { title: 'Clinical philosophy', body: about.philosophy },
    { title: 'Patient-centred approach', body: about.patientCentered },
  ]

  const facts = [
    { title: 'Education', items: about.education },
    { title: 'Training', items: about.training },
    { title: 'Experience', items: about.experience },
    { title: 'Languages', items: about.languages },
  ]

  return (
    <PageSection id="about">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <SectionHeader
          id="about-title"
          label="About"
          title={['About Dr.', <>Abhinav <span className="em-serif">Thaduri</span></>]}
          intro={<span className={isPlaceholder(doctor.biography) ? 'placeholder-text' : 'text-fg/85'}>{doctor.biography}</span>}
          className="lg:col-span-5"
        />

        <div className="grid grid-cols-5 gap-4 sm:gap-5 lg:col-span-7">
          <div className="col-span-3">
            <MedicalImage
              src="/images/doctor-about.jpg"
              alt={`${doctor.name} in clinic`}
              placeholderLabel="About portrait"
              className="aspect-[4/5] w-full rounded-lg"
              hoverZoom={false}
            />
          </div>
          <div className="col-span-2 flex flex-col justify-end">
            <MedicalImage
              src="/images/clinic.jpg"
              alt="The clinic"
              placeholderLabel="Clinic"
              className="aspect-square w-full rounded-lg"
              hoverZoom={false}
              delay={0.1}
            />
          </div>
        </div>
      </div>

      <div className="mt-16 border-t border-line md:mt-24">
        {blocks.map((b, i) => (
          <Reveal
            as="article"
            key={b.title}
            className="grid gap-3 border-b border-line py-8 md:grid-cols-12 md:gap-10 md:py-12"
          >
            <div className="flex items-baseline gap-3 md:col-span-4 lg:col-span-5">
              <span className="font-serif text-lg tabular-nums text-brass">0{i + 1}</span>
              <h3 className="label !text-fg">{b.title}</h3>
            </div>
            <p
              className={`font-serif text-[clamp(1.25rem,1.1rem+0.6vw,1.625rem)] leading-[1.45] md:col-span-8 lg:col-span-7 ${
                isPlaceholder(b.body) ? 'text-muted' : ''
              }`}
            >
              {b.body}
            </p>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 md:mt-16">
        <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div key={f.title} className="bg-surface p-6 sm:p-8">
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
      </Reveal>
    </PageSection>
  )
}
