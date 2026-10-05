import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { doctor } from '../data/doctor'
import imageManifest from '../data/image-manifest.json'
import { EASE, EASE_IN_OUT, ONCE, useDecorativeMotion } from '../lib/motion'

type Props = {
  src: string
  alt: string
  className?: string
  /** Eagerly load and reveal on mount (above-the-fold imagery). */
  priority?: boolean
  /** Scale the image slightly on hover of the nearest `.group` ancestor. */
  hoverZoom?: boolean
  /** Short caption shown on the placeholder, e.g. "Portrait". */
  placeholderLabel?: string
  imgClassName?: string
  delay?: number
  /** Set false when a parent already animates the frame. */
  reveal?: boolean
  /** Rendered width hint for responsive images, e.g. "(min-width: 1024px) 40vw, 100vw". */
  sizes?: string
}

type Status = 'loading' | 'loaded' | 'error'

/** Written by `npm run images` (scripts/optimize-images.mjs). Empty until photos are supplied. */
type ManifestEntry = { width: number; height: number; widths: number[]; formats: string[]; base: string }
const manifest = imageManifest as Record<string, ManifestEntry>

const MIME: Record<string, string> = { avif: 'image/avif', webp: 'image/webp' }

/**
 * Image with a masked reveal: the frame opens upward while the picture settles
 * from a slight scale. Real photographs can be dropped into /public/images with
 * the same filename; until then a quiet, abstract placeholder is shown.
 */
export default function MedicalImage({
  src,
  alt,
  className = '',
  priority,
  hoverZoom = true,
  placeholderLabel = 'Photograph',
  imgClassName = '',
  delay = 0,
  reveal = true,
  sizes = '100vw',
}: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const imgRef = useRef<HTMLImageElement>(null)
  const animated = useDecorativeMotion() && reveal

  // Cached images can finish before React attaches handlers.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete) setStatus(img.naturalWidth > 0 ? 'loaded' : 'error')
  }, [src])

  const file = src.split('/').pop()
  const optimized = manifest[src]
  const open = { clipPath: 'inset(0% 0% 0% 0%)' }
  const settle = { scale: 1 }
  const frameTrigger = priority ? { animate: open } : { whileInView: open, viewport: ONCE }
  const imageTrigger = priority ? { animate: settle } : { whileInView: settle, viewport: ONCE }

  return (
    <motion.div
      className={`relative overflow-hidden bg-surface-2 ${className}`}
      initial={animated ? { clipPath: 'inset(100% 0% 0% 0%)' } : false}
      {...frameTrigger}
      transition={{ duration: 1.1, ease: EASE_IN_OUT, delay }}
    >
      <motion.div
        className="absolute inset-0"
        initial={animated ? { scale: 1.08 } : false}
        {...imageTrigger}
        transition={{ duration: 1.6, ease: EASE, delay }}
      >
        <div
          className={`absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            hoverZoom ? 'group-hover:scale-[1.02]' : ''
          }`}
        >
          {status !== 'loaded' && <Placeholder label={placeholderLabel} file={file} alt={alt} />}
          {status !== 'error' && (
            <picture>
              {/* AVIF, then WebP, then the original, only for images the optimiser has processed */}
              {optimized?.formats.map((format) => (
                <source
                  key={format}
                  type={MIME[format]}
                  sizes={sizes}
                  srcSet={optimized.widths.map((w) => `${optimized.base}-${w}.${format} ${w}w`).join(', ')}
                />
              ))}
              <img
                ref={imgRef}
                src={src}
                alt={alt}
                // Intrinsic size (when known) lets the browser reserve the aspect ratio before load.
                {...(optimized ? { width: optimized.width, height: optimized.height } : {})}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                {...(priority ? { fetchPriority: 'high' as const } : {})}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  status === 'loaded' ? 'opacity-100' : 'opacity-0'
                } ${imgClassName}`}
              />
            </picture>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Placeholder({ label, file, alt }: { label: string; file?: string; alt: string }) {
  return (
    <div role="img" aria-label={`${alt} (image to be supplied)`} className="absolute inset-0 [container-type:size]">
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center font-serif text-[min(26cqw,26cqh)] leading-none text-fg/15"
      >
        {doctor.initials}
      </span>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 border-t border-line p-4">
        <span className="label">{label}</span>
        {file && <span className="truncate text-xs text-muted">{file}</span>}
      </div>
    </div>
  )
}
