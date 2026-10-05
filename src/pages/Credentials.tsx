import { useMemo, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import Section from '../components/Section'
import MedicalImage from '../components/MedicalImage'
import { doctor, isPlaceholder } from '../data/doctor'

const EASE = [0.16, 1, 0.3, 1] as const

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
    <Section
      number={4}
      label="Credentials"
      title={['Verified', <span className="serif-accent">credentials</span>]}
      intro="Qualifications, specialised training, certifications and professional memberships. Each entry is published only after it has been verified."
      headerExtra={
        <div className="group mt-10 hidden lg:block">
          <MedicalImage
            src="/images/credential-01.jpg"
            alt="Credential document"
            placeholderLabel="Credential"
            className="aspect-[16/10] w-full max-w-md rounded-[1.75rem]"
            delay={0.3}
          />
        </div>
      }
    >
      <LayoutGroup>
        <div
          role="group"
          aria-label="Filter credentials by category"
          data-swipe-ignore
          className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {filters.map((f) => {
            const on = f === filter
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f)}
                className={`relative shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition-colors duration-300 ${
                  on ? 'text-bg' : 'text-muted hover:text-fg'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="cred-filter"
                    className="absolute inset-0 rounded-full bg-fg"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{f}</span>
              </button>
            )
          })}
        </div>

        <motion.ul layout className="mt-10 grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((c) => (
              <motion.li
                key={c.n}
                layout
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="trace-card group flex min-h-[17rem] flex-col rounded-[1.75rem] border border-line bg-surface p-7 transition-transform duration-500 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-display text-5xl font-extralight leading-none tracking-[-0.05em] text-fg/25 transition-colors duration-500 group-hover:text-accent">
                    {String(c.n).padStart(2, '0')}
                  </span>
                  <span className="eyebrow text-right !text-[0.625rem]">{c.category}</span>
                </div>
                <h2 className={`mt-auto pt-10 font-display text-2xl font-normal leading-tight tracking-[-0.03em] ${isPlaceholder(c.title) ? 'text-fg/70' : ''}`}>
                  {c.title}
                </h2>
                <p className="mt-2 flex flex-wrap gap-x-3 text-sm text-muted">
                  <span>{c.institution}</span>
                  <span aria-hidden>·</span>
                  <span className="tabular-nums">{c.year}</span>
                </p>
                <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-muted">{c.description}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </LayoutGroup>
    </Section>
  )
}
