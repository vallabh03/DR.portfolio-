import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import PageSection from '../components/PageSection'
import SectionHeader from '../components/SectionHeader'
import MedicalImage from '../components/MedicalImage'
import { EASE } from '../components/Reveal'
import { doctor, isPlaceholder } from '../data/doctor'

export default function Credentials() {
  const [filter, setFilter] = useState<string>('All')
  const groups = doctor.credentials

  // Number every credential once, so numbers stay stable while filtering.
  const all = useMemo(
    () => groups.flatMap((g) => g.items.map((item) => ({ ...item, category: g.category }))).map((c, i) => ({ ...c, n: i + 1 })),
    [groups],
  )
  const visible = filter === 'All' ? all : all.filter((c) => c.category === filter)
  const filters = ['All', ...groups.map((g) => g.category)]

  return (
    <PageSection id="credentials">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <SectionHeader
          id="credentials-title"
          label="Credentials"
          title={['Verified', <span className="em-serif">credentials</span>]}
          intro="Qualifications, specialised training, certifications and professional memberships. Each entry is published only after it has been verified."
          className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start"
        >
          <div className="mt-10 hidden lg:block">
            <MedicalImage
              src="/images/credential-01.jpg"
              alt="Credential document"
              placeholderLabel="Credential"
              className="aspect-[16/10] w-full max-w-md rounded-lg"
              hoverZoom={false}
            />
          </div>
        </SectionHeader>

        <div className="min-w-0 lg:col-span-7">
          <div role="group" aria-label="Filter credentials by category" className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const on = f === filter
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f)}
                  className={`min-h-11 rounded-md border px-4 text-sm font-medium transition-colors duration-200 ${
                    on ? 'border-fg bg-fg text-bg' : 'border-line-strong text-muted hover:border-fg hover:text-fg'
                  }`}
                >
                  {f}
                </button>
              )
            })}
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((c) => (
                <motion.li
                  key={c.n}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex flex-col rounded-lg border border-line bg-surface p-6 transition-colors duration-300 hover:border-accent sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="label">{c.category}</span>
                    <span aria-hidden className="text-sm tabular-nums text-muted">
                      {String(c.n).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className={`heading-3 mt-8 ${isPlaceholder(c.title) ? 'text-fg/75' : ''}`}>{c.title}</h3>
                  <span aria-hidden className="mt-4 block h-px w-8 bg-brass" />
                  <p className="mt-4 flex flex-wrap gap-x-2 text-muted">
                    <span>{c.institution}</span>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">{c.year}</span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{c.description}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </div>
    </PageSection>
  )
}
