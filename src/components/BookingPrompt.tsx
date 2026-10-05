import { BOOK_PATH } from '../data/navigation'
import RevealText from './RevealText'
import DrawLine from './DrawLine'
import Button, { ArrowRight } from './Button'

/** Closing invitation to book, set on ink at the end of a page. */
export default function BookingPrompt() {
  return (
    <section aria-labelledby="booking-prompt-title" className="container-page pb-16 md:pb-24 lg:pb-32">
      <div className="relative overflow-hidden rounded-lg bg-fg px-6 py-12 text-bg sm:px-12 md:py-16">
        <DrawLine className="absolute inset-x-6 top-0 bg-accent sm:inset-x-12" duration={1.2} />
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <RevealText as="h2" id="booking-prompt-title" lines={['Book a consultation']} className="heading-2" />
            <p className="measure mt-4 text-bg/80">Share a few details and the practice will be in touch to arrange a suitable time.</p>
          </div>
          <Button to={BOOK_PATH} variant="inverse" className="shrink-0">
            Request a consultation <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  )
}
