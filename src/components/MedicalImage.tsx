import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { doctor } from '../data/doctor'
import { EASE } from './Reveal'

type Props = {
  src: string
  alt: string
  className?: string
  /** Eagerly load (above-the-fold imagery). */
  priority?: boolean
  /** Scale the image on hover of the nearest `.group` ancestor. */
  hoverZoom?: boolean
  /** Short caption shown on the placeholder, e.g. "Portrait". */
  placeholderLabel?: string
  imgClassName?: string
  delay?: number
}

type Status = 'loading' | 'loaded' | 'error'

/**
 * Image with a quiet, theme-aware placeholder. Real photographs can be dropped
 * into /public/images with the same filename — no code changes needed.
 * The placeholder is abstract by design: it never imitates a photograph.
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
}: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const imgRef = useRef<HTMLImageElement>(null)

  // Cached images can finish before React attaches handlers.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete) setStatus(img.naturalWidth > 0 ? 'loaded' : 'error')
  }, [src])

  const file = src.split('/').pop()
  const reveal = { opacity: 1, scale: 1 }

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.04 }}
        {...(priority ? { animate: reveal } : { whileInView: reveal, viewport: { once: true, margin: '0px 0px -8% 0px' } })}
        transition={{ duration: 0.7, ease: EASE, delay }}
      >
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            hoverZoom ? 'group-hover:scale-[1.03]' : ''
          }`}
        >
          {status !== 'loaded' && <Placeholder label={placeholderLabel} file={file} alt={alt} />}
          {status !== 'error' && (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              loading={priority ? 'eager' : 'lazy'}
              decoding="async"
              {...(priority ? { fetchPriority: 'high' as const } : {})}
              onLoad={() => setStatus('loaded')}
              onError={() => setStatus('error')}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                status === 'loaded' ? 'opacity-100' : 'opacity-0'
              } ${imgClassName}`}
            />
          )}
        </div>
      </motion.div>
    </div>
  )
}

function Placeholder({ label, file, alt }: { label: string; file?: string; alt: string }) {
  return (
    <div role="img" aria-label={`${alt} (image to be supplied)`} className="absolute inset-0 [container-type:size]">
      <span
        aria-hidden
        className="em-serif absolute inset-0 flex items-center justify-center text-[min(28cqw,28cqh)] leading-none text-fg/15"
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
