import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { EASE_EXIT } from '../lib/motion'

const COOKIE_STORAGE_KEY = 'at-cookie-notice-dismissed'

export default function CookieBanner({ onOpenPrivacy }: { onOpenPrivacy: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(COOKIE_STORAGE_KEY)
      if (!dismissed) {
        setVisible(true)
      }
    } catch {
      // If local storage is disabled, don't show or block
    }
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, 'true')
    } catch {
      // Storage unavailable
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          aria-label="Privacy and cookies"
          className="fixed bottom-20 left-4 right-4 z-40 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12, transition: { duration: 0.2, ease: EASE_EXIT } }}
          transition={{ duration: 0.3 }}
        >
          <div className="rounded-lg border border-line bg-surface/95 p-4 shadow-lg backdrop-blur-md sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs leading-relaxed text-muted sm:text-sm">
                This website uses strictly necessary functional storage for theme and navigation preferences. We do not use tracking or advertising cookies.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-xs font-medium text-muted hover:text-fg underline underline-offset-4 transition-colors"
              >
                Privacy policy
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded bg-fg px-3 py-1.5 text-xs font-medium text-bg transition-opacity hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
