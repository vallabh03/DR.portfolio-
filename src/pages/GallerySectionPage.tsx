import { motion } from 'motion/react'
import { Link, Navigate, useParams } from 'react-router'
import { findSection } from '../data/gallery'
import { useEntrance } from '../lib/motion'
import RevealText from '../components/RevealText'
import ConsentGate from '../components/ConsentGate'
import GalleryGrid from '../components/GalleryGrid'

/** One gallery section in full ("View all"). Surgery sections keep their 18+ consent screen. */
export default function GallerySectionPage() {
  const { section: slug } = useParams()
  const section = findSection(slug)
  const entrance = useEntrance()
  if (!section) return <Navigate to="/gallery" replace />

  return (
    <>
      <section aria-labelledby="gallery-section-title" className="container-page pb-16 pt-10 md:pb-24 md:pt-16 lg:pt-20">
        <Link to="/gallery" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent hover:text-accent-hover">
          <span aria-hidden>&larr;</span>
          <span className="link-underline">Gallery</span>
        </Link>
        <div className="mt-4 grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <RevealText as="h1" id="gallery-section-title" lines={[section.title]} className="heading-1 lg:col-span-7" delay={0.1} immediate />
          <motion.p className="lead measure lg:col-span-5 lg:pb-2" {...entrance(0.35)}>
            {section.intro}
            {section.sensitive && ' For adults aged 18 and over.'}
          </motion.p>
        </div>

        <div className="mt-10 md:mt-14">
          {section.sensitive ? (
            <ConsentGate slug={section.slug} noun={section.kind === 'photos' ? 'images' : 'videos'}>
              <GalleryGrid section={section} />
            </ConsentGate>
          ) : (
            <GalleryGrid section={section} />
          )}
        </div>
      </section>
    </>
  )
}
