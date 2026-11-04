import { whatsappUrl } from '../data/doctor'

/** The WhatsApp glyph (speech bubble with handset), drawn in the current text colour. */
export function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className} fill="currentColor">
      <path d="M16 3.2C8.94 3.2 3.2 8.94 3.2 16c0 2.26.6 4.47 1.73 6.42L3.1 28.9l6.65-1.74A12.74 12.74 0 0 0 16 28.8c7.06 0 12.8-5.74 12.8-12.8S23.06 3.2 16 3.2Zm0 23.3c-1.95 0-3.86-.53-5.53-1.52l-.4-.24-3.95 1.03 1.05-3.84-.26-.4A10.47 10.47 0 0 1 5.5 16C5.5 10.2 10.2 5.5 16 5.5S26.5 10.2 26.5 16 21.8 26.5 16 26.5Zm5.76-7.86c-.32-.16-1.86-.92-2.15-1.02-.29-.11-.5-.16-.71.16-.21.31-.82 1.02-1 1.23-.18.21-.37.24-.68.08-.32-.16-1.34-.5-2.55-1.57-.94-.84-1.58-1.88-1.76-2.19-.18-.32-.02-.49.14-.64.14-.14.32-.37.47-.55.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.55.08-.84.4-.29.31-1.1 1.07-1.1 2.62s1.13 3.04 1.29 3.25c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.75.24 1.44.21 1.98.13.6-.09 1.86-.76 2.12-1.5.26-.73.26-1.36.18-1.5-.08-.13-.29-.21-.6-.37Z" />
    </svg>
  )
}

/**
 * An in-page "Chat on WhatsApp" button for the Contact and Consultation pages:
 * a pill in the site's secondary-button style with WhatsApp's green icon.
 */
export function WhatsAppChatLink({ className = '' }: { className?: string }) {
  if (!whatsappUrl) return null
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-line-strong bg-bg px-6 font-semibold text-fg transition-colors duration-300 hover:border-[#25d366] hover:bg-[#25d366]/10 ${className}`}
    >
      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25d366] text-white">
        <WhatsAppIcon className="h-5 w-5" />
      </span>
      Chat on WhatsApp
      <span className="sr-only"> (opens WhatsApp in a new tab)</span>
    </a>
  )
}
