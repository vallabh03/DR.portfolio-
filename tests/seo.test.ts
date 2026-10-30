/**
 * Tests for the search and sharing details in src/data/seo.ts.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blogPages, notFoundPage, pageMeta, pages, robotsTxt, SITE_URL, sitemapXml, structuredData } from '../src/data/seo.ts'

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
  const expertise = structuredData(pageMeta('/expertise'))?.['@graph'] as { '@type': string; breadcrumb?: { '@id': string }; itemListElement?: { name: string; item: string }[] }[]
  const pageNode = expertise.find((n) => n['@type'] === 'MedicalWebPage')
  assert.ok(pageNode)
  const crumbs = expertise.find((n) => n['@type'] === 'BreadcrumbList')
  assert.ok(crumbs && pageNode.breadcrumb)
  assert.deepEqual(crumbs.itemListElement?.map((c) => c.name), ['Home', 'Expertise'])
  assert.equal(crumbs.itemListElement?.[1].item, `${SITE_URL}/expertise`)
})

test('the home page has no breadcrumb trail; every other indexable page does', () => {
  for (const p of pages.filter((x) => !x.noindex)) assert.equal(!!p.crumbs?.length, p.path !== '/', p.path)
})

/* ── Blog indexing (with an article that exists only in this test) ───────── */

const sampleArticle = {
  slug: 'sample-test-article',
  title: 'Sample test article',
  date: '2026-11-02',
  summary: 'A sample summary used only by this test to check how the first published article is handled for search engines.',
  body: 'Test body.',
}

test('the empty blog is kept out of search results and the sitemap', () => {
  const [index, ...articles] = blogPages([])
  assert.equal(index.path, '/blog')
  assert.equal(index.noindex, true)
  assert.equal(articles.length, 0)
  assert.equal(structuredData(index), undefined)
  assert.ok(!sitemapXml('2026-01-01').includes(`${SITE_URL}/blog<`))
  assert.ok(pages.some((p) => p.path === '/blog'), 'the blog page still exists for visitors')
})

test('publishing the first article makes the blog indexable and gives the article its own page', () => {
  const list = blogPages([sampleArticle])
  const [index, article] = list
  assert.equal(index.noindex, false)
  assert.equal(article.path, '/blog/sample-test-article')
  assert.equal(article.title, 'Sample test article | Dr Abhinav Thaduri')
  assert.equal(article.description, sampleArticle.summary)
  assert.equal(article.noindex, undefined)

  const xml = sitemapXml('2026-11-02', [...pages.filter((p) => p.path !== '/blog'), ...list])
  assert.ok(xml.includes(`<loc>${SITE_URL}/blog</loc>`))
  assert.ok(xml.includes(`<loc>${SITE_URL}/blog/sample-test-article</loc>`))

  const graph = structuredData(article)?.['@graph'] as { '@type': string; headline?: string; datePublished?: string; author?: unknown; url?: string }[]
  const post = graph.find((n) => n['@type'] === 'BlogPosting')
  assert.ok(post)
  assert.equal(post.headline, 'Sample test article')
  assert.equal(post.datePublished, '2026-11-02')
  assert.deepEqual(post.author, { '@id': `${SITE_URL}/#person` })
  assert.equal(post.url, `${SITE_URL}/blog/sample-test-article`)
})

test('structured data places the practice in Hyderabad without inventing anything', () => {
  const graph = structuredData(pageMeta('/'))?.['@graph'] as Record<string, unknown>[]
  const physician = graph.find((n) => n['@type'] === 'Physician') as { address: Record<string, string>; areaServed: { name: string }; telephone?: string }
  assert.equal(physician.address.addressLocality, 'Hyderabad')
  assert.equal(physician.address.addressRegion, 'Telangana')
  assert.equal(physician.areaServed.name, 'Hyderabad')
  const json = JSON.stringify(graph)
  assert.doesNotMatch(json, /aggregateRating|"review"|award|yearsOfExperience|identifier/)
})
