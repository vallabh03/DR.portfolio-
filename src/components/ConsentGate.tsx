import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { giveConsent, hasConsent, withdrawConsent } from '../lib/consent'
import Button from './Button'

/**
 * Holds back sensitive gallery content until the visitor confirms they are 18
 * or older and agrees to view it. Nothing inside is rendered (so no image or
 * video is requested) until then. Consent lasts for the browser session and
 * can be withdrawn with "Hide" at any time.
 */
export default function ConsentGate({ slug, noun, children }: { slug: string; noun: 'images' | 'videos'; children: ReactNode }) {
  const [consented, setConsented] = useState(() => hasConsent(slug))
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const id = useId()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!checked) {
      setError(true)
      return
    }
    giveConsent(slug)
    setConsented(true)
    // Move focus to the revealed content so keyboard and screen-reader users land on it.
    requestAnimationFrame(() => contentRef.current?.focus())
  }

  const hide = () => {
    withdrawConsent(slug)
    setConsented(false)
    setChecked(false)
  }

  if (consented) {
    return (
      <div ref={contentRef} tabIndex={-1} className="focus:outline-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
          <span>Sensitive content shown. Viewer confirmed 18 or older.</span>
          <button type="button" onClick={hide} className="inline-flex min-h-11 items-center font-semibold text-accent hover:text-accent-hover">
            <span className="link-underline">Hide {noun}</span>
          </button>
        </div>
        {children}
      </div>
    )
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby={`${id}-title`}
      className="rounded-[2rem] border border-line-strong bg-surface p-6 sm:p-10"
    >
      <div className="flex items-start gap-4">
        <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-on-accent">
          18+
        </span>
        <div className="min-w-0">
          <h3 id={`${id}-title`} className="font-serif text-[clamp(1.5rem,1.3rem+0.8vw,2rem)] leading-tight">
            Sensitive medical content
          </h3>
          <p className="measure mt-3 leading-relaxed text-muted">
            These {noun} show real surgical procedures, including open tissue and blood, which some people may find distressing. They are
            intended for adults aged 18 and over, and are shared for educational purposes with the patients&rsquo; consent.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:pl-16">
        <label htmlFor={`${id}-confirm`} className="flex cursor-pointer items-start gap-3">
          <input
            id={`${id}-confirm`}
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              setChecked(e.target.checked)
              if (e.target.checked) setError(false)
            }}
            aria-invalid={error || undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--accent)]"
          />
          <span className="leading-relaxed">I confirm that I am 18 years of age or older and I agree to view surgical {noun}.</span>
        </label>
        {error && (
          <p id={`${id}-error`} role="alert" className="mt-3 text-sm font-semibold text-danger">
            Please confirm you are 18 or older to continue.
          </p>
        )}
        <Button type="submit" className="mt-6">
          View surgery {noun}
        </Button>
      </div>
    </form>
  )
}
