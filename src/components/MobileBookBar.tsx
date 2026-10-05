import { AnimatePresence, motion } from 'motion/react'
import { useLocation } from 'react-router'
import { BOOK_PATH } from '../data/navigation'
import { useScrolledPast } from '../hooks/useScrolledPast'
import Button, { ArrowRight } from './Button'
import { EASE } from './Reveal'

/** Persistent booking action for phones, shown once the hero has scrolled away. */
export default function MobileBookBar() {
  const { pathname } = useLocation()
  const past = useScrolledPast(480)
  const show = past && pathname !== BOOK_PATH

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%', transition: { duration: 0.2 } }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <Button to={BOOK_PATH} className="w-full">
            Book a consultation <ArrowRight />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
