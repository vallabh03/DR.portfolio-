import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

type Loader = () => Promise<{ default: ComponentType }>

export type Chapter = {
  id: string
  path: string
  /** Short label used in navigation. */
  label: string
  /** Longer label used in the index menu and document title. */
  title: string
  load: Loader
  Component: LazyExoticComponent<ComponentType>
}

const def = (id: string, path: string, label: string, title: string, load: Loader): Chapter => ({
  id,
  path,
  label,
  title,
  load,
  Component: lazy(load),
})

/** The ordered chapters of the site. Left/right navigation follows this order. */
export const chapters: Chapter[] = [
  def('home', '/', 'Home', 'Home', () => import('../pages/Home')),
  def('about', '/about', 'About', 'About', () => import('../pages/About')),
  def('experience', '/experience', 'Experience', 'Experience', () => import('../pages/Experience')),
  def('credentials', '/credentials', 'Credentials', 'Credentials', () => import('../pages/Credentials')),
  def('expertise', '/expertise', 'Expertise', 'Expertise', () => import('../pages/Expertise')),
  def('approach', '/approach', 'Approach', 'Approach to care', () => import('../pages/Approach')),
  def('research', '/research', 'Research', 'Research', () => import('../pages/Research')),
  def('testimonials', '/testimonials', 'Testimonials', 'Testimonials', () => import('../pages/Testimonials')),
  def('contact', '/contact', 'Contact', 'Contact', () => import('../pages/Contact')),
  def('consultation', '/consultation', 'Book', 'Book a consultation', () => import('../pages/Consultation')),
]

export const chapterIndexByPath = (pathname: string) => {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return chapters.findIndex((c) => c.path === clean)
}

export const pad = (n: number) => String(n).padStart(2, '0')

export const preloadChapters = () => Promise.all(chapters.map((c) => c.load()))
