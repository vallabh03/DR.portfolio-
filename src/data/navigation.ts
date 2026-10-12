import { doctor } from './doctor'
import { findSection } from './gallery'

/** Testimonials appear only once real, patient-approved testimonials exist. */
export const showTestimonials = doctor.testimonials.length > 0

export type NavRoute = {
  path: string
  label: string
  /** Used in the document title. */
  title: string
  /** One line for the Home page index. */
  blurb: string
}

/** Every page in the primary navigation, in order. Each is its own route. */
export const navRoutes: NavRoute[] = [
  { path: '/', label: 'Home', title: 'Home', blurb: '' },
  { path: '/about', label: 'About', title: 'About', blurb: 'Background, philosophy and approach to care.' },
  { path: '/expertise', label: 'Expertise', title: 'Expertise', blurb: 'Areas of clinical focus.' },
  { path: '/experience', label: 'Experience', title: 'Experience', blurb: 'Clinical roles and career timeline.' },
  { path: '/research', label: 'Research', title: 'Research', blurb: 'Publications, studies, academic work and professional credentials.' },
  { path: '/gallery', label: 'Gallery', title: 'Gallery', blurb: 'Awards and conferences, surgery images and surgery videos.' },
  { path: '/contact', label: 'Contact', title: 'Contact', blurb: 'Where to find the practice and how to get in touch.' },
]

export const BOOK_PATH = '/consultation'
export const BOOK_TITLE = 'Book a consultation'

/** Old chapter URLs whose content now lives on another page. */
export const legacyRedirects: Record<string, string> = {
  '/credentials': '/research',
  '/approach': '/about',
  '/testimonials': '/',
}

export const documentTitle = (pathname: string) => {
  if (pathname === BOOK_PATH) return `${BOOK_TITLE} · ${doctor.name}`
  const gallerySection = pathname.startsWith('/gallery/') ? findSection(pathname.slice('/gallery/'.length)) : undefined
  if (gallerySection) return `${gallerySection.title} · Gallery · ${doctor.name}`
  const route = navRoutes.find((r) => r.path === pathname)
  return !route || route.path === '/' ? doctor.name : `${route.title} · ${doctor.name}`
}
