import type { ReactNode } from 'react'

export type CredentialIconName = 'education' | 'training' | 'experience' | 'languages' | 'memberships'

const paths: Record<CredentialIconName, ReactNode> = {
  // Graduation cap
  education: (
    <>
      <path d="M2 9l10-5 10 5-10 5-10-5z" />
      <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
      <path d="M22 9v5" />
    </>
  ),
  // Medal with ribbons
  training: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M8.6 12.7 7 21l5-3 5 3-1.6-8.3" />
    </>
  ),
  // Briefcase
  experience: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  // Speech bubble
  languages: <path d="M4 5h16v10H9l-5 4V5z" />,
  // Two members of a society
  memberships: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M16.5 14.1c2.7.3 4.5 2.6 4.5 5.4" />
    </>
  ),
}

/** Thin line icons for credentials and profile facts, drawn in the current text colour. */
export default function CredentialIcon({ name, className = '' }: { name: CredentialIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  )
}
