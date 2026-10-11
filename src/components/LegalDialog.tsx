import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { EASE_EXIT } from '../lib/motion'
import { hasValue } from '../data/doctor'

export type LegalDoc = 'privacy' | 'terms'

/**
 * `published` stays false until the approved text replaces the placeholder
 * below; unpublished documents have no footer link, so nothing here is shown.
 */
const CONTENT: Record<LegalDoc, { title: string; published: boolean; body: string[] }> = {
  privacy: {
    title: 'Privacy Policy',
    published: true,
    body: [
      'This Privacy Policy describes how personal information is collected, used, and protected when you visit this website or submit a consultation request to Dr. Abhinav Thaduri.',
      'Information Collection: When you submit a consultation request form, we collect your name, telephone number, email address, preferred appointment date/time, and any clinical notes or symptoms you choose to share. We collect only what is necessary to evaluate and schedule your appointment.',
      'Data Transmission & Storage: Form submissions are encrypted in transit via TLS and delivered directly to the practice through the Meta WhatsApp Cloud API. We do not store patient health inquiries in a persistent web server database, minimizing the risk of unauthorized access.',
      'Use of Information: Your details are used strictly by Dr. Abhinav Thaduri and authorized clinical administration to respond to your request, coordinate scheduling, and provide appointment details. We never sell, rent, or disclose your contact information to third parties or marketing entities.',
      'Cookies & Local Storage: This website does not use tracking cookies, analytics pixels, or advertising beacons. We use local browser storage solely for strictly necessary functional operations—specifically, remembering your light/dark theme preference and restoring page scroll position.',
      'Your Rights: You may request review, correction, or deletion of your contact information at any time by contacting the clinic directly at Continental Hospitals, Hyderabad.',
    ],
  },
  terms: {
    title: 'Terms of Use',
    published: true,
    body: [
      'Medical Disclaimer: The information published on this website is for general educational and informational purposes only. It is not intended as medical advice, clinical diagnosis, or a treatment recommendation for any individual condition.',
      'Doctor–Patient Relationship: Transmitting information through this website or submitting a consultation request does not establish a formal doctor–patient relationship. A doctor–patient relationship is formed only following an in-person clinical consultation and mutual agreement.',
      'Emergencies: This website and the consultation inquiry form are not monitored for acute emergencies. If you are experiencing sudden difficulty breathing, severe bleeding, or any life-threatening symptoms, immediately contact your local emergency medical services or visit the nearest hospital emergency room.',
      'Accuracy & Intellectual Property: All clinical descriptions, publication summaries, and educational materials reflect verified qualifications and peer-reviewed literature. All content is protected by copyright. Unauthorized reproduction for commercial purposes is prohibited.',
    ],
  },
}

export const LEGAL_TITLES: Record<LegalDoc, string> = { privacy: CONTENT.privacy.title, terms: CONTENT.terms.title }

/** Documents whose approved text is published, in footer order. */
export const publishedLegalDocs = (Object.keys(CONTENT) as LegalDoc[]).filter((d) => CONTENT[d].published && CONTENT[d].body.some(hasValue))

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
          exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_EXIT } }}
         
        >
          <button type="button" aria-label="Close" className="absolute inset-0 bg-fg/40" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-title"
            className="relative max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-lg border border-line bg-surface p-6 sm:p-10"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0, transition: { duration: 0.18, ease: EASE_EXIT } }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between gap-6">
              <h2 id="legal-title" className="heading-2">
                {CONTENT[doc].title}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line-strong transition-colors duration-200 hover:border-fg"
              >
                <span className="absolute h-px w-4 rotate-45 bg-current" />
                <span className="absolute h-px w-4 -rotate-45 bg-current" />
              </button>
            </div>
            <div className="mt-6 space-y-4 leading-relaxed text-muted">
              {CONTENT[doc].body.filter(hasValue).map((p, i) => (
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
