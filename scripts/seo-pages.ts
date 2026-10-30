import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'
import { doctor } from '../src/data/doctor.ts'
import { BOOK_PATH, BOOK_TITLE, navRoutes } from '../src/data/navigation.ts'
import { absoluteUrl, notFoundPage, OG_IMAGE, pageMeta, pages, robotsTxt, sitemapXml, structuredData, type PageMeta } from '../src/data/seo.ts'

/**
 * Static SEO for the single-page app, with no extra dependencies.
 *
 * - Every page's head (title, description, canonical link, Open Graph and
 *   Twitter tags, robots rule and JSON-LD) is written into index.html between
 *   the seo:start/seo:end markers: in development for the home page, and at
 *   build time once per route as its own file (about.html, gallery/x.html…),
 *   so crawlers and link previews see the right details without running JS.
 * - A plain <noscript> version of each page lists its heading, summary and
 *   links, so navigation is crawlable even without JavaScript.
 * - 404.html, sitemap.xml and robots.txt are generated from the same data.
 * - The two web fonts used above the fold are preloaded.
 *
 * vercel.json serves these files at clean URLs (cleanUrls) and answers unknown
 * addresses with 404.html and a 404 status.
 */

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function headTags(page: PageMeta) {
  const known = page !== notFoundPage
  const url = absoluteUrl(page.path)
  const image = absoluteUrl(OG_IMAGE.path)
  const json = structuredData(page)
  return [
    `<title>${escape(page.title)}</title>`,
    `<meta name="description" content="${escape(page.description)}" />`,
    `<meta name="robots" content="${page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    `<meta name="author" content="${escape(doctor.name)}" />`,
    // Optional Google Search Console HTML-tag verification, from the build environment (not a secret).
    process.env.GOOGLE_SITE_VERIFICATION && `<meta name="google-site-verification" content="${escape(process.env.GOOGLE_SITE_VERIFICATION)}" />`,
    known && `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${page.path === '/' ? 'profile' : 'website'}" />`,
    `<meta property="og:site_name" content="${escape(doctor.name)}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:title" content="${escape(page.title)}" />`,
    `<meta property="og:description" content="${escape(page.description)}" />`,
    known && `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${escape(OG_IMAGE.alt)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escape(page.title)}" />`,
    `<meta name="twitter:description" content="${escape(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    // "<" is escaped inside JSON so the script block can never be closed early.
    json && `<script type="application/ld+json">${JSON.stringify(json).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ')
}

/** A crawlable, script-free summary of the page with links to every page. */
function noscriptBody(page: PageMeta) {
  const links = [...navRoutes.map((r) => ({ path: r.path, label: r.label })), { path: BOOK_PATH, label: BOOK_TITLE }]
  return [
    `<div style="padding:2rem;font-family:sans-serif;max-width:48rem">`,
    // Not a heading: the prerendered page already has its own H1.
    `<p><strong>${escape(page.title)}</strong></p>`,
    `<p>${escape(page.description)}</p>`,
    `<nav aria-label="Pages"><ul>${links.map((l) => `<li><a href="${l.path}">${escape(l.label)}</a></li>`).join('')}</ul></nav>`,
    `<p>Please enable JavaScript to view the full website.</p>`,
    `</div>`,
  ].join('\n        ')
}

const between = (html: string, start: RegExp, end: RegExp, content: string) => {
  const s = html.search(start)
  const e = html.search(end)
  if (s < 0 || e < 0) throw new Error(`seo-pages: marker not found (${start})`)
  const afterStart = html.indexOf('-->', s) + 3
  return `${html.slice(0, afterStart)}\n    ${content}\n    ${html.slice(e)}`
}

const render = (html: string, page: PageMeta) =>
  between(between(html, /<!-- seo:start/, /<!-- seo:end -->/, headTags(page)), /<!-- seo:noscript:start/, /<!-- seo:noscript:end -->/, noscriptBody(page))

/** The output file for a route: "/" -> index.html, "/about" -> about.html, "/gallery/x" -> gallery/x.html */
const fileFor = (route: string) => (route === '/' ? 'index.html' : `${route.slice(1)}.html`)

export default function seoPages(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'seo-pages',
    configResolved: (c) => void (config = c),
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        // Home page details in development and as the template for the build.
        let out = render(html, pageMeta('/'))
        // Preload the two above-the-fold font files (built assets have hashed names).
        if (ctx.bundle) {
          const fonts = Object.keys(ctx.bundle).filter((f) => /(inter-latin-wght-normal|newsreader-latin-opsz-normal)-[\w-]+\.woff2$/.test(f))
          const links = fonts.map((f) => `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin />`).join('\n    ')
          if (links) out = out.replace('</head>', `  ${links}\n  </head>`)
        }
        return out
      },
    },
    async closeBundle() {
      // The server build (src/entry-server.tsx) writes no pages of its own.
      if (config.command !== 'build' || config.build.ssr) return
      const outDir = path.resolve(config.root, config.build.outDir)
      const template = await readFile(path.join(outDir, 'index.html'), 'utf8')
      for (const page of [...pages, notFoundPage]) {
        const file = path.join(outDir, page === notFoundPage ? '404.html' : fileFor(page.path))
        await mkdir(path.dirname(file), { recursive: true })
        await writeFile(file, render(template, page))
      }
      const today = new Date().toISOString().slice(0, 10)
      await writeFile(path.join(outDir, 'sitemap.xml'), sitemapXml(today))
      await writeFile(path.join(outDir, 'robots.txt'), robotsTxt())
      config.logger.info(`seo-pages: ${pages.length} pages, 404.html, sitemap.xml and robots.txt written`)
    },
  }
}
