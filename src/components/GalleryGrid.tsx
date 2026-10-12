import type { GallerySection } from '../data/gallery'
import MedicalImage from './MedicalImage'

/** A section's photographs or videos in a grid, or a note when none have been added. */
export default function GalleryGrid({ section, limit }: { section: GallerySection; limit?: number }) {
  if (section.items.length === 0) {
    return (
      <p className="rounded-[2rem] border border-dashed border-line-strong px-6 py-12 text-center text-muted">
        No {section.kind === 'photos' ? 'photographs' : 'videos'} have been added to this section yet.
      </p>
    )
  }

  if (section.kind === 'videos') {
    const items = section.items.slice(0, limit)
    return (
      <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => (
          <li key={v.src}>
            <figure>
              <video
                controls
                preload="none"
                playsInline
                poster={v.poster}
                className="aspect-video w-full rounded-lg bg-surface-2"
                aria-label={v.title}
              >
                <source src={v.src} type="video/mp4" />
                {v.captions && <track kind="captions" src={v.captions} srcLang="en" label="English" default />}
                Your browser cannot play this video.
              </video>
              <figcaption className="mt-3">
                <span className="block font-semibold">{v.title}</span>
                {v.detail && <span className="mt-1 block text-sm text-muted">{v.detail}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    )
  }

  const items = section.items.slice(0, limit)
  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <li key={p.src}>
          <figure>
            <MedicalImage
              src={p.src}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              alt={p.caption}
              hoverZoom={false}
              className="aspect-[4/3] w-full rounded-lg"
              imgClassName={p.portrait ? 'object-[center_18%]' : ''}
            />
            <figcaption className="mt-3">
              <span className="block font-semibold">{p.caption}</span>
              {p.detail && <span className="mt-1 block text-sm text-muted">{p.detail}</span>}
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  )
}
