import { motion } from 'framer-motion'
import Section from '../components/Section'
import MedicalImage from '../components/MedicalImage'
import RevealText from '../components/RevealText'
import { doctor, isPlaceholder } from '../data/doctor'

const EASE = [0.16, 1, 0.3, 1] as const

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
    <Section
      number={2}
      label="About"
      title={['About Dr.', <>Abhinav <span className="serif-accent">Thaduri</span></>]}
      intro={doctor.biography}
    >
      <div className="grid gap-5 sm:grid-cols-5">
        <div className="group sm:col-span-3">
          <MedicalImage
            src="/images/doctor-about.jpg"
            alt={`${doctor.name} in clinic`}
            placeholderLabel="About portrait"
            className="aspect-[4/5] w-full rounded-[2rem]"
          />
        </div>
        <div className="flex flex-col justify-end gap-5 sm:col-span-2">
          <div className="group">
            <MedicalImage
              src="/images/clinic.jpg"
              alt="The clinic"
              placeholderLabel="Clinic"
              className="aspect-square w-full rounded-[2rem]"
              delay={0.15}
            />
          </div>
          <p className="eyebrow leading-relaxed">Who I am</p>
        </div>
      </div>

      <div className="mt-20 space-y-0 border-t border-line md:mt-28">
        {blocks.map((b, i) => (
          <motion.article
            key={b.title}
            className="grid gap-4 border-b border-line py-10 md:grid-cols-[10rem_1fr] md:gap-10 md:py-14"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
            transition={{ duration: 1, ease: EASE }}
          >
            <div className="flex items-baseline gap-3 md:flex-col md:gap-2">
              <span className="font-display text-sm tabular-nums text-accent">0{i + 1}</span>
              <h2 className="eyebrow !text-fg">{b.title}</h2>
            </div>
            <RevealText
              text={b.body}
              className={`font-display text-[clamp(1.25rem,2vw,1.85rem)] font-light leading-[1.3] tracking-[-0.02em] ${
                isPlaceholder(b.body) ? 'text-muted' : ''
              }`}
            />
          </motion.article>
        ))}
      </div>

      <div className="mt-20 grid gap-px overflow-hidden rounded-[2rem] border border-line bg-line sm:grid-cols-2 md:mt-28">
        {facts.map((f, i) => (
          <motion.div
            key={f.title}
            className="bg-bg p-7 sm:p-9"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.08 }}
          >
            <h3 className="eyebrow">{f.title}</h3>
            <ul className="mt-5 space-y-2">
              {f.items.map((item, j) => (
                <li key={j} className={`text-lg ${isPlaceholder(item) ? 'text-muted' : ''}`}>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
