import { absoluteUrl, OG_IMAGE, pageMeta, structuredData } from '../data/seo'

/** Finds a head tag, creating it when the page lacks one. */
function tag<K extends 'meta' | 'link'>(name: K, selector: string, init: Record<string, string>) {
  let el = document.head.querySelector<HTMLElementTagNameMap[K]>(selector)
  if (!el) {
    el = document.createElement(name)
    for (const [k, v] of Object.entries(init)) el.setAttribute(k, v)
    document.head.appendChild(el)
  }
  return el
}

const setMeta = (key: 'name' | 'property', value: string, content: string) =>
  tag('meta', `meta[${key}="${value}"]`, { [key]: value }).setAttribute('content', content)

/**
 * Keeps the document head in step with the page on screen: title, description,
 * canonical link, social preview tags and the robots rule. The built HTML for
 * each page already carries the same values for crawlers; this keeps them right
 * as visitors move around without reloading.
 */
export function applyPageMeta(pathname: string) {
  const page = pageMeta(pathname)
  const known = page.path === pathname
  const url = absoluteUrl(page.path)

  document.title = page.title
  setMeta('name', 'description', page.description)
  setMeta('name', 'robots', page.noindex ? 'noindex, follow' : 'index, follow')
  setMeta('property', 'og:title', page.title)
  setMeta('property', 'og:description', page.description)
  setMeta('property', 'og:image', absoluteUrl(OG_IMAGE.path))
  setMeta('name', 'twitter:title', page.title)
  setMeta('name', 'twitter:description', page.description)

  // Unknown addresses have no canonical page of their own.
  const canonical = document.head.querySelector('link[rel="canonical"]')
  if (known) {
    tag('link', 'link[rel="canonical"]', { rel: 'canonical' }).setAttribute('href', url)
    setMeta('property', 'og:url', url)
  } else canonical?.remove()

  // Structured data for the page on screen; none for pages kept out of search.
  const data = structuredData(page)
  const script = document.head.querySelector('script[type="application/ld+json"]')
  if (!data) script?.remove()
  else {
    const el = script ?? document.head.appendChild(Object.assign(document.createElement('script'), { type: 'application/ld+json' }))
    el.textContent = JSON.stringify(data)
  }
}
