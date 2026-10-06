import { doctor } from './doctor'

/**
 * The photographic record: every image slot the website already uses,
 * catalogued by the page it appears on. Captions are the existing alt text
 * from those pages; nothing here is new information. Image files are supplied
 * later in /public/images (see the README there); until then each slot shows
 * the standard placeholder.
 */

export type PageRef = { label: string; path: string }

export type GalleryEntry = {
  /** Catalogue number, 1-based. */
  no: number
  src: string
  /** The image's existing alt text, reused as its caption. */
  caption: string
  /** Pages where this image is used on the site. */
  appearsOn: PageRef[]
  /** The record group, named after the page the image belongs to. */
  group: string
  /** Portrait-format slot (4:5) rather than landscape. */
  portrait?: boolean
}

const page = {
  home: { label: 'Home', path: '/' },
  about: { label: 'About', path: '/about' },
  expertise: { label: 'Expertise', path: '/expertise' },
  experience: { label: 'Experience', path: '/experience' },
  research: { label: 'Research', path: '/research' },
  contact: { label: 'Contact', path: '/contact' },
} satisfies Record<string, PageRef>

/** Adds Expertise to a slot's pages when doctor.expertise also uses that image. */
const withExpertise = (src: string, pages: PageRef[]) =>
  doctor.expertise.some((e) => e.image === src) ? [...pages, page.expertise] : pages

const CLINIC = '/images/clinic.jpg'

const entries: Omit<GalleryEntry, 'no'>[] = [
  { src: '/images/doctor-hero.jpg', caption: `Portrait of ${doctor.name}`, appearsOn: [page.home], group: 'Home', portrait: true },
  { src: '/images/doctor-about.jpg', caption: `Portrait of ${doctor.name}`, appearsOn: [page.about], group: 'About', portrait: true },
  { src: CLINIC, caption: 'The clinic', appearsOn: withExpertise(CLINIC, [page.about, page.contact]), group: 'About' },
  // Expertise images, except any already catalogued above (area 04 uses the clinic photograph).
  ...doctor.expertise
    .filter((e) => e.image !== CLINIC)
    .map((e) => ({ src: e.image, caption: `${e.title}, illustrative image`, appearsOn: [page.expertise], group: 'Expertise' })),
  { src: '/images/credential-01.jpg', caption: 'Credential document', appearsOn: [page.experience], group: 'Experience and Research', portrait: true },
  { src: '/images/research.jpg', caption: 'Research and academic work', appearsOn: [page.research], group: 'Experience and Research' },
]

export const gallery: GalleryEntry[] = entries.map((e, i) => ({ ...e, no: i + 1 }))

export const galleryId = (no: number) => `gallery-${String(no).padStart(2, '0')}`
