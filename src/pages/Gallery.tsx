import { Link } from 'react-router'
import { PREVIEW_COUNT, visibleSections, type GallerySection } from '../data/gallery'
import RevealText from '../components/RevealText'
import DrawLine from '../components/DrawLine'
import { ArrowRight } from '../components/Button'
import ConsentGate from '../components/ConsentGate'
import GalleryGrid from '../components/GalleryGrid'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Gallery: three sections (awards and conferences, surgery images, surgery
 * videos), each showing its first few items with a link to view them all.
 * The two surgery sections are held behind an 18+ consent screen.
 */
export default function Gallery() {
  return (
    <>
      <Opening />
      {visibleSections.map((section, i) => (
        <SectionPreview key={section.slug} section={section} index={i} />
      ))}
    </>
  )
}

function Opening() {
  return (
    <section aria-labelledby="gallery-title" className="container-page pb-6 pt-10 md:pt-16 lg:pt-24">
      <RevealText as="h1" id="gallery-title" lines={['Gallery']} className="display-hero" delay={0.1} immediate />
    </section>
  )
}

/** "View all", with the number of items when there are any. */
export function ViewAllLink({ section }: { section: GallerySection }) {
  const count = section.items.length
  return (
    <Link to={`/gallery/${section.slug}`} className="group/btn inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-accent hover:text-accent-hover">
      <span className="link-underline">
        View all
        <span className="sr-only"> {section.title.toLowerCase()}</span>
        {count > 0 && ` (${count})`}
      </span>
      <ArrowRight />
    </Link>
  )
}

function SectionPreview({ section, index }: { section: GallerySection; index: number }) {
  const titleId = `gallery-${section.slug}`
  const limit = PREVIEW_COUNT[section.kind]
  return (
    <section aria-labelledby={titleId} className="container-page py-12 md:py-16">
      <div className="relative pt-8">
        <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1.1} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif tabular-nums text-brass">{pad(index + 1)}</p>
            <h2 id={titleId} className="heading-2 mt-2 flex flex-wrap items-center gap-3">
              {section.title}
              {section.sensitive && (
                <>
                  <span aria-hidden className="rounded-full border border-line-strong px-3 py-1 font-sans text-sm font-semibold tracking-normal text-muted">
                    18+
                  </span>
                  <span className="sr-only">(adults 18 and over)</span>
                </>
              )}
            </h2>
            <p className="measure mt-3 text-muted">{section.intro}</p>
          </div>
          <ViewAllLink section={section} />
        </div>
      </div>

      <div className="mt-8 md:mt-10">
        {section.sensitive ? (
          <ConsentGate slug={section.slug} noun={section.kind === 'photos' ? 'images' : 'videos'}>
            <GalleryGrid section={section} limit={limit} />
          </ConsentGate>
        ) : (
          <GalleryGrid section={section} limit={limit} />
        )}
      </div>
    </section>
  )
}
