import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

export type LegalDoc = 'privacy' | 'terms'

const CONTENT: Record<LegalDoc, { title: string; body: string[] }> = {
  privacy: {
    title: 'Privacy',
    body: [
      '[PRIVACY POLICY] — The practice’s privacy policy will be published here once it has been prepared and approved.',
      'It should explain what information is collected through this website (for example, consultation requests), how it is stored, who can access it, how long it is kept, and how to request its deletion.',
    ],
  },
  terms: {
    title: 'Terms',
    body: [
      '[TERMS OF USE] — The website terms of use will be published here once approved.',
      'Content on this website is for general information only and does not constitute medical advice or establish a doctor–patient relationship.',
    ],
  },
}

export default function LegalDialog({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!doc) return
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [doc, onClose])

  return createPortal(
    <AnimatePresence>
      {doc && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-modal-open
        >
          <button type="button" aria-label="Close" className="absolute inset-0 bg-bg/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-title"
            className="relative max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-surface p-7 shadow-[var(--shadow)] sm:p-10"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between gap-6">
              <h2 id="legal-title" className="display-md">
                {CONTENT[doc].title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong hover:border-fg"
              >
                <span className="absolute h-px w-4 rotate-45 bg-current" />
                <span className="absolute h-px w-4 -rotate-45 bg-current" />
              </button>
            </div>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
              {CONTENT[doc].body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
