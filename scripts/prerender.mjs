/**
 * Build step after `vite build` and the server build of src/entry-server.tsx:
 * renders every page listed in src/data/seo.ts (and the 404 page) to HTML and
 * puts it inside <div id="root"> of the matching file in dist/, so the files
 * served to search engines contain the page's real headings, text, links and
 * images.
 *
 * The browser then starts the app as usual (src/main.tsx) and replaces this
 * markup. Run by `npm run build`.
 */
import { readFile, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

const { render } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href)
const { pages, notFoundPage } = await import(pathToFileURL(path.join(ssrDir, 'seo.js')).href)

const fileFor = (route) => (route === '/' ? 'index.html' : `${route.slice(1)}.html`)
const EMPTY_ROOT = '<div id="root"></div>'

let count = 0
for (const page of [...pages, notFoundPage]) {
  const file = path.join(dist, page === notFoundPage ? '404.html' : fileFor(page.path))
  const html = await readFile(file, 'utf8')
  if (!html.includes(EMPTY_ROOT)) throw new Error(`prerender: ${path.relative(root, file)} has no empty root to fill`)
  const markup = render(page === notFoundPage ? '/this-page-does-not-exist' : page.path)
  await writeFile(file, html.replace(EMPTY_ROOT, `<div id="root">${markup}</div>`))
  count++
}
await rm(ssrDir, { recursive: true, force: true })
console.log(`prerender: ${count} pages rendered to HTML`)
