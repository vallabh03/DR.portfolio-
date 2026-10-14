/**
 * The doctor's blog. To publish an article, add an entry to `posts` below
 * (newest anywhere: the list is sorted by date) and deploy. docs/BLOG.md
 * explains each field and the formatting the body supports.
 *
 * Write only what the doctor has written or approved. Articles are general
 * information; each one is shown with a note that it is not personal medical
 * advice.
 */

export type BlogPost = {
  /** The address of the article: /blog/<slug>. Lower-case words joined by hyphens. */
  slug: string
  title: string
  /** Publication date, YYYY-MM-DD. */
  date: string
  /** One or two sentences shown in the list and in search results (about 70–160 characters). */
  summary: string
  /**
   * The article. Paragraphs are separated by a blank line. Supported:
   * "## Heading", "### Subheading", "- item" lists, "1. item" lists,
   * "> quotation", **bold**, *italic* and [link text](https://…).
   */
  body: string
  /** Set to true to keep an article off the site while it is being written. */
  draft?: boolean
}

export const posts: BlogPost[] = [
  // {
  //   slug: 'example-article',
  //   title: 'Example article title',
  //   date: '2026-10-14',
  //   summary: 'One or two sentences describing the article.',
  //   body: `First paragraph.
  //
  // ## A heading
  //
  // Another paragraph with **bold** text and a [link](https://example.org).`,
  // },
]

/** Published articles, newest first. */
export const publishedPosts = posts.filter((p) => !p.draft).sort((a, b) => b.date.localeCompare(a.date))

export const findPost = (slug: string | undefined) => publishedPosts.find((p) => p.slug === slug)

export const postPath = (p: BlogPost) => `/blog/${p.slug}`

/** "14 October 2026" */
export function formatPostDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${d} ${months[m - 1]} ${y}`
}

/** Approximate reading time in whole minutes (at least one). */
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200))
