import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useAppReady } from '../context/ChapterContext'
import { doctor } from '../data/doctor'

type Props = {
  src: string
  alt: string
  className?: string
  /** Eagerly load (above-the-fold imagery). */
  priority?: boolean
  /** Mask-reveal the frame when it scrolls into view. */
  reveal?: boolean
  /** Scale the image on hover of the nearest `.group` ancestor. */
  hoverZoom?: boolean
  /** Short caption shown on the placeholder, e.g. "Portrait". */
  placeholderLabel?: string
  imgClassName?: string
  delay?: number
}

type Status = 'loading' | 'loaded' | 'error'

const EASE = [0.76, 0, 0.24, 1] as const

/**
 * Image with a graceful, theme-aware placeholder. Real photographs can be dropped
 * into /public/images with the same filename — no code changes needed.
 * The placeholder is abstract by design: it never imitates a photograph.
 */
export default function MedicalImage({
  src,
  alt,
  className = '',
  priority,
  reveal = true,
  hoverZoom = true,
  placeholderLabel = 'Photograph',
  imgClassName = '',
  delay = 0,
}: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const imgRef = useRef<HTMLImageElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const inView = useInView(frameRef, { once: true, margin: '0px 0px -10% 0px' })
  const ready = useAppReady()
  const show = !reveal || (inView && ready)

  // Cached images can finish before React attaches handlers.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete) setStatus(img.naturalWidth > 0 ? 'loaded' : 'error')
  }, [src])

  const file = src.split('/').pop()

  return (
    <motion.div
      ref={frameRef}
      className={`relative overflow-hidden bg-surface-2 ${className}`}
      initial={reveal ? { clipPath: 'inset(100% 0% 0% 0%)' } : false}
      animate={show ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
      transition={{ duration: 1.3, ease: EASE, delay }}
    >
      <motion.div
        className="absolute inset-0"
        initial={reveal ? { scale: 1.18 } : false}
        animate={show ? { scale: 1 } : undefined}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay }}
      >
        <div
          className={`absolute inset-0 transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            hoverZoom ? 'group-hover:scale-[1.06]' : ''
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
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                status === 'loaded' ? 'opacity-100' : 'opacity-0'
              } ${imgClassName}`}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function Placeholder({ label, file, alt }: { label: string; file?: string; alt: string }) {
  return (
    <div role="img" aria-label={`${alt} (image to be supplied)`} className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,var(--accent-soft),transparent_60%),radial-gradient(90%_70%_at_0%_100%,var(--glow),transparent_65%)]" />
      <svg className="absolute inset-0 h-full w-full text-fg opacity-[0.07]" aria-hidden>
        <defs>
          <pattern id="mi-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mi-grid)" />
      </svg>
      <div className="absolute left-1/2 top-1/2 aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 animate-[float-slow_14s_ease-in-out_infinite] [container-type:inline-size]">
        {[1, 0.74, 0.48].map((s, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full border border-line-strong"
            style={{ width: `${s * 100}%`, height: `${s * 100}%`, transform: 'translate(-50%, -50%)', opacity: 0.5 + i * 0.2 }}
          />
        ))}
        <span className="serif-accent absolute inset-0 flex items-center justify-center text-[28cqw] text-fg/80">
          {doctor.initials}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
        <span className="eyebrow !text-[0.625rem]">{label}</span>
        {file && <span className="truncate font-mono text-[0.625rem] text-subtle">{file}</span>}
      </div>
    </div>
  )
}
