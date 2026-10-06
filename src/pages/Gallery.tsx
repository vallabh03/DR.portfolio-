import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { gallery, galleryId, type GalleryEntry } from '../data/gallery'
import { isPlaceholder } from '../data/doctor'
import { EASE, EASE_IN_OUT, useDecorativeMotion, useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import MedicalImage from '../components/MedicalImage'
import DrawLine from '../components/DrawLine'
import { ArrowRight } from '../components/Button'
import BookingPrompt from '../components/BookingPrompt'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Gallery: a photographic record. Every image slot the site uses, catalogued
 * by number and by the page it appears on, set at deliberate scales on a strict
 * grid. Captions are the existing alt text; no lightbox.
 */
export default function Gallery() {
  const featured = gallery[0]
  const groups = Array.from(new Set(gallery.slice(1).map((g) => g.group)))

  return (
    <>
      <Opening />
      <Featured entry={featured} />
      <Index />
      {groups.map((group) => (
        <RecordGroup key={group} group={group} entries={gallery.filter((g) => g.group === group)} />
      ))}
      <BookingPrompt />
    </>
  )
}

/* ── Shared: the catalogue line under every image ───────────────────────── */

function CatalogueLine({ entry }: { entry: GalleryEntry }) {
  return (
    <figcaption className="relative mt-4 pt-3">
      <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={0.8} />
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-serif tabular-nums text-brass">No. {pad(entry.no)}</span>
        <span className={`min-w-0 ${isPlaceholder(entry.caption) ? 'text-muted' : 'text-fg/85'}`}>{entry.caption}</span>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted">
        <span>Appears on</span>
        {entry.appearsOn.map((p) => (
          <Link key={p.path} to={p.path} className="inline-flex min-h-11 items-center text-accent hover:text-accent-hover">
            <span className="link-underline">{p.label}</span>
          </Link>
        ))}
      </p>
    </figcaption>
  )
}

/** One catalogued image. The figure is the focus target for index navigation. */
function Plate({ entry, aspect, sizes, priority }: { entry: GalleryEntry; aspect: string; sizes: string; priority?: boolean }) {
  return (
    <figure id={galleryId(entry.no)} tabIndex={-1} className="min-w-0 scroll-mt-28 focus:outline-none">
      <MedicalImage
        src={entry.src}
        sizes={sizes}
        alt={entry.caption}
        placeholderLabel={`No. ${pad(entry.no)}`}
        priority={priority}
        hoverZoom={false}
        className={`w-full rounded-lg ${aspect}`}
      />
      <CatalogueLine entry={entry} />
    </figure>
  )
}

/* ── 1. Opening ──────────────────────────────────────────────────────────── */

function Opening() {
  const entrance = useEntrance()
  return (
    <section aria-labelledby="gallery-title" className="container-page pb-10 pt-10 md:pb-12 md:pt-16 lg:pt-24">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
        <RevealText as="h1" id="gallery-title" lines={['Gallery']} className="display-hero lg:col-span-7" delay={0.1} immediate />
        <motion.p className="lead measure lg:col-span-5 lg:pb-3" {...entrance(0.4)}>
          Photographs used across this website, catalogued by the page they appear on.
        </motion.p>
      </div>
    </section>
  )
}

/* ── 2. Featured image: opens outward from a horizontal line ────────────── */

function Featured({ entry }: { entry: GalleryEntry }) {
  const animated = useDecorativeMotion()
  return (
    <section aria-label="Featured image" className="container-page pb-12 md:pb-16">
      <figure id={galleryId(entry.no)} tabIndex={-1} className="scroll-mt-28 focus:outline-none">
        <motion.div
          className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-2 sm:aspect-[16/9]"
          initial={animated ? { clipPath: 'inset(50% 0% 50% 0%)' } : false}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1.3, ease: EASE_IN_OUT, delay: 0.3 }}
        >
          <motion.div
            className="absolute inset-0"
            initial={animated ? { scale: 1.04 } : false}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, ease: EASE, delay: 0.3 }}
          >
            <MedicalImage
              src={entry.src}
              sizes="(min-width: 1360px) 1248px, 100vw"
              alt={entry.caption}
              placeholderLabel={`No. ${pad(entry.no)}`}
              priority
              reveal={false}
              hoverZoom={false}
              className="h-full w-full"
            />
          </motion.div>
        </motion.div>
        <CatalogueLine entry={entry} />
      </figure>
    </section>
  )
}

/* ── 3. Index: a ruled, numbered list linking to each image ──────────────── */

function Index() {
  const reduce = useReducedMotion()

  // A real in-page link; handled here so it scrolls to the image without changing the route.
  const jump = (e: React.MouseEvent<HTMLAnchorElement>, no: number) => {
    e.preventDefault()
    const el = document.getElementById(galleryId(no))
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 112, behavior: reduce ? 'instant' : 'smooth' })
    el.focus({ preventScroll: true })
  }

  return (
    <section aria-labelledby="index-title" className="border-y border-line bg-surface">
      <div className="container-page section-y">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <RevealText as="h2" id="index-title" lines={['Index']} className="heading-2 lg:col-span-4" />
          <ol className="relative lg:col-span-8">
            <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1.1} />
            {gallery.map((g) => (
              <li key={g.no} className="border-b border-line">
                <a
                  href={`#${galleryId(g.no)}`}
                  onClick={(e) => jump(e, g.no)}
                  className="group grid min-h-14 grid-cols-[3rem_1fr_auto] items-center gap-x-4 gap-y-1 py-3 sm:grid-cols-[4rem_1fr_12rem_auto]"
                >
                  <span className="font-serif tabular-nums text-brass transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 group-focus-visible:translate-x-1">
                    {pad(g.no)}
                  </span>
                  <span className={`min-w-0 ${isPlaceholder(g.caption) ? 'text-muted' : 'text-fg'}`}>
                    {g.caption}
                    {/* Pages, below the caption on phones */}
                    <span className="mt-0.5 block text-sm text-muted sm:hidden">{g.appearsOn.map((p) => p.label).join(', ')}</span>
                  </span>
                  <span className="hidden text-sm text-muted sm:block">{g.appearsOn.map((p) => p.label).join(', ')}</span>
                  <span aria-hidden className="text-accent transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1">
                    <ArrowRight />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/* ── 4. The record: one composition per page group ───────────────────────── */

function RecordGroup({ group, entries }: { group: string; entries: GalleryEntry[] }) {
  const id = `group-${group.toLowerCase().replace(/[^a-z]+/g, '-')}`
  return (
    <section aria-labelledby={id} className="container-page section-y">
      <div className="relative pt-6">
        <DrawLine className="absolute inset-x-0 top-0 bg-line-strong" duration={1.1} />
        <RevealText as="h2" id={id} lines={[group]} className="heading-3" />
      </div>
      <div className="mt-8 md:mt-10">
        <Composition group={group} entries={entries} />
      </div>
    </section>
  )
}

/** Each group has its own arrangement on the 12-column grid; phones get a single column. */
function Composition({ group, entries }: { group: string; entries: GalleryEntry[] }) {
  if (group === 'About' && entries.length === 2) {
    const [portrait, clinic] = entries
    return (
      <div className="grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-12 lg:items-end lg:gap-10">
        <div className="lg:col-span-7">
          <Plate entry={portrait} aspect="aspect-[4/5]" sizes="(min-width: 1024px) 55vw, (min-width: 768px) 50vw, 100vw" />
        </div>
        <div className="lg:col-span-5">
          <Plate entry={clinic} aspect="aspect-[4/3]" sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw" />
        </div>
      </div>
    )
  }

  if (group === 'Expertise' && entries.length === 3) {
    const [large, ...small] = entries
    return (
      <div className="grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="md:col-span-2 lg:col-span-7">
          <Plate entry={large} aspect="aspect-[4/3]" sizes="(min-width: 1024px) 55vw, 100vw" />
        </div>
        <div className="grid gap-10 md:col-span-2 md:grid-cols-2 md:gap-8 lg:col-span-5 lg:grid-cols-1 lg:gap-10">
          {small.map((e) => (
            <Plate key={e.no} entry={e} aspect="aspect-[4/3]" sizes="(min-width: 1024px) 38vw, (min-width: 768px) 50vw, 100vw" />
          ))}
        </div>
      </div>
    )
  }

  if (group === 'Experience and Research' && entries.length === 2) {
    const [credential, research] = entries
    return (
      <div className="grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
        <div className="lg:col-span-4">
          <Plate entry={credential} aspect="aspect-[4/5]" sizes="(min-width: 1024px) 30vw, (min-width: 768px) 50vw, 100vw" />
        </div>
        <div className="lg:col-span-8">
          <Plate entry={research} aspect="aspect-[4/3] lg:aspect-[3/2]" sizes="(min-width: 1024px) 62vw, (min-width: 768px) 50vw, 100vw" />
        </div>
      </div>
    )
  }

  // Fallback for any future group: an even two-column record.
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-8">
      {entries.map((e) => (
        <Plate key={e.no} entry={e} aspect={e.portrait ? 'aspect-[4/5]' : 'aspect-[4/3]'} sizes="(min-width: 768px) 50vw, 100vw" />
      ))}
    </div>
  )
}

