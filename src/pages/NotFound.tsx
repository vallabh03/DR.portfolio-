import { Link } from 'react-router'
import { BOOK_PATH, navRoutes } from '../data/navigation'
import RevealText from '../components/RevealText'
import Button, { ArrowRight } from '../components/Button'

/**
 * Shown for any address that is not part of the site. It is kept out of search
 * results (noindex), and on the live site the server answers these addresses
 * with a 404 status, so they are never treated as duplicate pages.
 */
export default function NotFound() {
  return (
    <section aria-labelledby="not-found-title" className="container-page section-y">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">Error 404</p>
      <RevealText as="h1" id="not-found-title" lines={['Page not found']} className="heading-1 mt-4" delay={0.1} immediate />
      <p className="lead measure mt-6">The page you were looking for does not exist or has moved. These pages may help.</p>
      <nav aria-label="Pages" className="mt-10">
        <ul className="flex flex-wrap gap-3">
          {navRoutes.map((r) => (
            <li key={r.path}>
              <Link to={r.path} className="inline-flex min-h-11 items-center rounded-full border border-line px-5 font-medium hover:border-accent hover:text-accent">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Button to={BOOK_PATH} className="mt-10">
        Book a consultation <ArrowRight />
      </Button>
    </section>
  )
}
