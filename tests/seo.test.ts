/**
 * Tests for the search and sharing details in src/data/seo.ts.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { notFoundPage, pageMeta, pages, robotsTxt, SITE_URL, sitemapXml, structuredData } from '../src/data/seo.ts'

test('every page has its own path, title and description, within search-result lengths', () => {
  const paths = pages.map((p) => p.path)
  const titles = pages.map((p) => p.title)
  assert.equal(new Set(paths).size, paths.length, 'paths are unique')
  assert.equal(new Set(titles).size, titles.length, 'titles are unique')
  for (const p of pages) {
    assert.ok(p.title.length > 10 && p.title.length <= 65, `${p.path} title length ${p.title.length}`)
    assert.ok(p.description.length >= 70 && p.description.length <= 170, `${p.path} description length ${p.description.length}`)
    assert.doesNotMatch(p.title + p.description, /\[[A-Z ]+\]/, `${p.path} contains a placeholder`)
  }
})

test('unknown addresses get the not-found details, kept out of search', () => {
  assert.equal(pageMeta('/no-such-page'), notFoundPage)
  assert.equal(notFoundPage.noindex, true)
  assert.equal(pageMeta('/about').path, '/about')
})

test('the sitemap lists every indexable page and nothing kept out of search', () => {
  const xml = sitemapXml('2026-01-01')
  for (const p of pages) {
    const listed = xml.includes(`<loc>${SITE_URL}${p.path}</loc>`)
    assert.equal(listed, !p.noindex, `${p.path} ${p.noindex ? 'must not' : 'must'} be in the sitemap`)
  }
  assert.ok(!xml.includes('/404'))
})

test('the consent-gated surgery images are not indexed or crawled', () => {
  assert.equal(pageMeta('/gallery/surgery-images').noindex, true)
  assert.equal(structuredData(pageMeta('/gallery/surgery-images')), undefined)
  const robots = robotsTxt()
  assert.match(robots, /Disallow: \/images\/surgery-/)
  assert.match(robots, /Disallow: \/api\//)
  assert.match(robots, new RegExp(`Sitemap: ${SITE_URL}/sitemap.xml`))
})

test('structured data describes the doctor without ratings, reviews or placeholders', () => {
  const data = structuredData(pageMeta('/'))
  assert.ok(data)
  const json = JSON.stringify(data)
  assert.doesNotMatch(json, /aggregateRating|"review"|\[[A-Z ]+\]/)
  const types = data['@graph'].map((n: { '@type': string }) => n['@type'])
  assert.deepEqual(types.slice(0, 3), ['Person', 'Physician', 'WebSite'])
  assert.equal(structuredData(pageMeta('/expertise'))?.['@graph'].at(-1)?.['@type'], 'MedicalWebPage')
})
