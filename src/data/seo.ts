import { doctor, hasValue, QUALIFICATIONS } from './doctor.ts'
import { BOOK_PATH, documentTitle } from './navigation.ts'
import { visibleSections } from './gallery.ts'

/**
 * Search and sharing details for every page, built from the doctor's data so
 * nothing is stated here that the site does not already say. Used at build time
 * (one HTML file per page with its own head, plus the sitemap and robots.txt)
 * and in the browser as visitors move between pages.
 */

/**
 * The production address, without a trailing slash: the single place it is set.
 * It must match the domain the site is served from; canonical links, the
 * sitemap, robots.txt and social previews all derive from it.
 */
export const SITE_URL = 'https://www.drabhinavthaduri.com'

/** Shared preview image for links (1200 × 630). */
export const OG_IMAGE = { path: '/og-image.jpg', width: 1200, height: 630, alt: `${doctor.name}, ${doctor.title}` }

export type PageMeta = {
  path: string
  title: string
  description: string
  /** Kept out of search results (and out of the sitemap). */
  noindex?: boolean
  /** Schema.org type for this page's own WebPage entry. */
  schemaType?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'MedicalWebPage' | 'CollectionPage'
}

const { contact } = doctor
const city = 'Hyderabad'
const practice = hasValue(contact.clinic) ? contact.clinic : city
const role = doctor.title.toLowerCase()

/** "a, b and c" */
const listOf = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)

const areas = doctor.expertise.filter((e) => hasValue(e.title))
const roles = doctor.experience.filter((r) => hasValue(r.role))
const places = [...new Set(roles.map((r) => r.location).filter(hasValue))]
const since = roles.at(-1)?.year.match(/\d{4}/)?.[0]
const education = (doctor.credentials.find((g) => g.category === QUALIFICATIONS)?.items ?? []).filter((c) => hasValue(c.title))

export const pages: PageMeta[] = [
  {
    path: '/',
    title: `${doctor.name} | Head and Neck Surgical Oncologist, ${city}`,
    description: `${doctor.name}, ${role} at ${practice}, treating oral, thyroid, salivary gland and laryngeal cancers.`,
  },
  {
    path: '/about',
    title: documentTitle('/about'),
    description: `Background, training (${education.map((c) => c.title.split(' ')[0]).join(', ')}) and approach to care of ${doctor.name}, ${role} at ${practice}.`,
    schemaType: 'AboutPage',
  },
  {
    path: '/expertise',
    title: `Head and Neck Cancer Surgery in ${city} · ${doctor.name}`,
    description: `${doctor.name} in ${city}: ${listOf(areas.slice(0, 4).map((a) => a.title.toLowerCase()))}.`,
    schemaType: 'MedicalWebPage',
  },
  {
    path: '/experience',
    title: documentTitle('/experience'),
    description: `Clinical roles of ${doctor.name}${since ? ` since ${since}` : ''}, across ${roles.length} hospitals in ${listOf(places)}, including ${practice}.`,
  },
  {
    path: '/research',
    title: documentTitle('/research'),
    description: `Research and publications by ${doctor.name} on oral cancer staging, functional recovery and survivorship, with qualifications, training and professional memberships.`,
  },
  {
    path: '/gallery',
    title: documentTitle('/gallery'),
    description: `Conference presentations, academic meetings and surgical work of ${doctor.name}.`,
    schemaType: 'CollectionPage',
  },
  {
    path: '/contact',
    title: `Contact and Location · ${doctor.name}`,
    description: `Visit ${doctor.name} at ${[contact.clinic, contact.addressLine].filter(hasValue).join(', ')}. Address, map and working hours.`,
    schemaType: 'ContactPage',
  },
  {
    path: BOOK_PATH,
    title: documentTitle(BOOK_PATH),
    description: `Request a consultation with ${doctor.name}, ${role} at ${practice}.`,
  },
  // One page per gallery section that is switched on. Surgical images stay out of search results.
  ...visibleSections.map(
    (s): PageMeta => ({
      path: `/gallery/${s.slug}`,
      title: documentTitle(`/gallery/${s.slug}`),
      description: `${s.title}: ${s.intro.charAt(0).toLowerCase()}${s.intro.slice(1).replace(/\.$/, '')}. ${doctor.name}, ${city}.`,
      noindex: s.sensitive,
      schemaType: 'CollectionPage',
    }),
  ),
]

/** Shown for addresses that are not part of the site. */
export const notFoundPage: PageMeta = {
  path: '/404',
  title: `Page not found · ${doctor.name}`,
  description: `This page could not be found. Visit the home page of ${doctor.name}, ${role} at ${practice}.`,
  noindex: true,
}

/** The details for a path; anything unknown is the not-found page. */
export const pageMeta = (pathname: string): PageMeta => pages.find((p) => p.path === pathname) ?? notFoundPage

export const absoluteUrl = (path: string) => `${SITE_URL}${path}`

/** The sitemap: indexable pages only. */
export function sitemapXml(lastmod: string) {
  const urls = pages
    .filter((p) => !p.noindex)
    .map((p) => `  <url>\n    <loc>${absoluteUrl(p.path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** robots.txt: everything public is crawlable except the API and the consent-gated surgical photographs. */
export const robotsTxt = () =>
  [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /images/surgery-',
    'Disallow: /images/optimized/surgery-',
    '',
    `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
    '',
  ].join('\n')

/* ── Structured data (schema.org) ─────────────────────────────────────────── */

const ids = { person: `${SITE_URL}/#person`, physician: `${SITE_URL}/#physician`, website: `${SITE_URL}/#website` }

function siteGraph() {
  const address = {
    '@type': 'PostalAddress',
    ...(hasValue(contact.addressLine) && { streetAddress: contact.addressLine }),
    ...(hasValue(contact.locality) && { addressLocality: contact.locality }),
    ...(hasValue(contact.postcode) && { postalCode: contact.postcode }),
    addressCountry: 'IN',
  }
  const hospital = hasValue(contact.clinic) ? { '@type': 'Hospital', name: contact.clinic.replace(/,\s*Hyderabad$/, ''), address } : undefined
  const memberships = (doctor.credentials.find((g) => g.category === 'Professional Memberships')?.items ?? []).map((c) => c.title).filter(hasValue)
  const alumniOf = [...new Set(education.map((c) => c.institution).filter(hasValue))].map((name) => ({ '@type': 'CollegeOrUniversity', name }))
  const image = absoluteUrl('/images/doctor-hero.jpg')

  return [
    {
      '@type': 'Person',
      '@id': ids.person,
      name: doctor.name,
      url: absoluteUrl('/'),
      image,
      jobTitle: doctor.title,
      ...(hasValue(doctor.qualifications) && { honorificSuffix: doctor.qualifications }),
      ...(hasValue(doctor.bioShort) && { description: doctor.bioShort }),
      ...(hospital && { worksFor: hospital }),
      ...(alumniOf.length > 0 && { alumniOf }),
      ...(memberships.length > 0 && { memberOf: memberships.map((name) => ({ '@type': 'Organization', name })) }),
      knowsAbout: areas.map((a) => a.title),
    },
    {
      '@type': 'Physician',
      '@id': ids.physician,
      name: doctor.name,
      url: absoluteUrl('/'),
      image,
      medicalSpecialty: ['Oncologic', 'Otolaryngologic'],
      address,
      ...(hospital && { hospitalAffiliation: hospital }),
    },
    {
      '@type': 'WebSite',
      '@id': ids.website,
      name: doctor.name,
      url: absoluteUrl('/'),
      inLanguage: 'en-IN',
      publisher: { '@id': ids.person },
    },
  ]
}

/** The JSON-LD for a page: the site entities plus the page itself. None for pages kept out of search. */
export function structuredData(page: PageMeta) {
  if (page.noindex) return undefined
  const webPage = {
    '@type': page.schemaType ?? 'WebPage',
    '@id': `${absoluteUrl(page.path)}#webpage`,
    url: absoluteUrl(page.path),
    name: page.title,
    description: page.description,
    isPartOf: { '@id': ids.website },
    about: { '@id': ids.person },
    inLanguage: 'en-IN',
    ...(page.schemaType === 'MedicalWebPage' && { specialty: 'Oncologic', audience: { '@type': 'Patient' } }),
  }
  return { '@context': 'https://schema.org', '@graph': [...siteGraph(), webPage] }
}
