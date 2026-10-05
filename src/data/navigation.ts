import { doctor } from './doctor'

/** Testimonials appear only once real, patient-approved testimonials exist. */
export const showTestimonials = doctor.testimonials.length > 0

/** Home-page sections, in page order. `id` is the anchor (e.g. /#about). */
export const sections = [
  { id: 'about', label: 'About' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'approach', label: 'Approach' },
  { id: 'experience', label: 'Experience' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'research', label: 'Research' },
  ...(showTestimonials ? [{ id: 'testimonials', label: 'Testimonials' }] : []),
  { id: 'contact', label: 'Contact' },
] as const satisfies readonly { id: string; label: string }[]

export type SectionId = (typeof sections)[number]['id']

/** Links in the primary navigation. */
export const primaryNav: { id: SectionId; label: string }[] = [
  { id: 'about', label: 'About' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'experience', label: 'Experience' },
  { id: 'research', label: 'Research' },
  { id: 'contact', label: 'Contact' },
]

export const BOOK_PATH = '/consultation'
