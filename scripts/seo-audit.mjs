/**
 * Checks the built site (dist/) the way a crawler without JavaScript sees it:
 * per page title, description, canonical, robots, H1/H2/H3 counts, word count,
 * images (with and without alt text), internal links, and JSON-LD validity.
 * Exits with an error when a check fails. Run after `npm run build`:
 *   node scripts/seo-audit.mjs
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const dist = path.resolve(import.meta.dirname, '..', 'dist')
const files = []
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory() && !['assets', 'images', 'logos', 'videos'].includes(e.name)) await walk(p)
    else if (e.name.endsWith('.html')) files.push(p)
  }
}
await walk(dist)

const all = (html, re) => [...html.matchAll(re)].map((m) => m[1])
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim()
const routes = new Set(files.map((f) => '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/(index)?\.html$/, '')).map((r) => (r !== '/' ? r.replace(/\/$/, '') : r)))

const problems = []
const warnings = []
const titles = new Map()
const descriptions = new Map()
const rows = []
for (const f of files.sort()) {
  const rel = path.relative(dist, f).replace(/\\/g, '/')
  const html = await readFile(f, 'utf8')
  const body = html.slice(html.indexOf('<div id="root">'), html.lastIndexOf('</body>'))
  const main = body.replace(/<noscript>[\s\S]*?<\/noscript>/g, '')
  const title = all(html, /<title>([^<]*)<\/title>/g)
  const desc = all(html, /<meta name="description" content="([^"]*)"/g)
  const canon = all(html, /<link rel="canonical" href="([^"]*)"/g)
  const robots = all(html, /<meta name="robots" content="([^"]*)"/g)[0] ?? ''
  const h1 = all(main, /<h1[^>]*>([\s\S]*?)<\/h1>/g).map(text)
  const h2 = all(main, /<h2[^>]*>([\s\S]*?)<\/h2>/g).map(text)
  const h3 = all(main, /<h3[^>]*>([\s\S]*?)<\/h3>/g).length
  const words = text(main.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '')).split(' ').filter((w) => /[a-z]/i.test(w)).length
  const imgs = all(main, /<img\b([^>]*)>/g)
  const noAlt = imgs.filter((a) => !/\balt="[^"]+"/.test(a) && !/\balt=""/.test(a)).length
  const decorative = imgs.filter((a) => /\balt=""/.test(a)).length
  const links = [...new Set(all(main, /<a\b[^>]*href="(\/[^"#?]*)/g))]
  const broken = links.filter((l) => !routes.has(l.replace(/\/$/, '') || '/') && !/\.(jpg|png|webp|avif|pdf|xml|txt)$/.test(l))
  const ld = all(html, /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
  for (const j of ld) {
    try {
      JSON.parse(j)
    } catch {
      problems.push(`${rel}: JSON-LD does not parse`)
    }
  }
  const noindex = robots.includes('noindex')
  if (title.length !== 1) problems.push(`${rel}: ${title.length} titles`)
  if (desc.length !== 1) problems.push(`${rel}: ${desc.length} descriptions`)
  if (!noindex && canon.length !== 1) problems.push(`${rel}: ${canon.length} canonicals`)
  if (h1.length !== 1) problems.push(`${rel}: ${h1.length} H1 (${h1.join(' | ')})`)
  if (!noindex && words < 150) warnings.push(`${rel}: only ${words} words of content`)
  if (noAlt) problems.push(`${rel}: ${noAlt} images without alt`)
  if (broken.length) problems.push(`${rel}: links to unknown pages ${broken.join(', ')}`)
  if (!noindex) {
    if (titles.has(title[0])) problems.push(`duplicate title: ${rel} and ${titles.get(title[0])}`)
    if (descriptions.has(desc[0])) problems.push(`duplicate description: ${rel} and ${descriptions.get(desc[0])}`)
    titles.set(title[0], rel)
    descriptions.set(desc[0], rel)
  }
  rows.push({ rel, robots: noindex ? 'noindex' : 'index', title: title[0], tlen: title[0]?.length, dlen: desc[0]?.length, h1: h1[0], h2: h2.length, h3, words, imgs: imgs.length, decorative, links: links.length, ld: ld.length })
}

for (const r of rows) {
  console.log(`${r.rel.padEnd(34)} ${r.robots.padEnd(7)} words ${String(r.words).padStart(5)}  h2 ${String(r.h2).padStart(2)}  h3 ${String(r.h3).padStart(2)}  img ${String(r.imgs).padStart(2)} (decorative ${r.decorative})  links ${String(r.links).padStart(2)}  json-ld ${r.ld}`)
  console.log(`  title (${r.tlen}): ${r.title}`)
  console.log(`  desc  (${r.dlen})   h1: ${r.h1}`)
}
if (warnings.length) console.log(`\nWARNINGS (${warnings.length}):\n- ${warnings.join('\n- ')}`)
console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n- ${problems.join('\n- ')}` : '\nNo problems found.')
process.exitCode = problems.length ? 1 : 0
