/**
 * Tests for the blog: the article text reader and the rules every article must follow.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseInline, parseMarkdown } from '../src/lib/markdown.ts'
import { formatPostDate, posts, publishedPosts, readingMinutes } from '../src/data/blog.ts'
import { pageMeta } from '../src/data/seo.ts'

test('headings, paragraphs, lists and quotes are recognised', () => {
  const blocks = parseMarkdown('## Title\n\nFirst line\nsame paragraph.\n\n- one\n- two\n\n1. first\n2. second\n\n> Quoted\n\n### Sub')
  assert.deepEqual(
    blocks.map((b) => b.type + (b.type === 'heading' ? b.level : b.type === 'list' ? (b.ordered ? 'ol' : 'ul') : '')),
    ['heading2', 'paragraph', 'listul', 'listol', 'quote', 'heading3'],
  )
  assert.deepEqual(blocks[1], { type: 'paragraph', children: [{ type: 'text', text: 'First line same paragraph.' }] })
})

test('bold, italic and links are read inside text', () => {
  assert.deepEqual(parseInline('a **b** *c* [d](https://e.org)'), [
    { type: 'text', text: 'a ' },
    { type: 'strong', children: [{ type: 'text', text: 'b' }] },
    { type: 'text', text: ' ' },
    { type: 'em', children: [{ type: 'text', text: 'c' }] },
    { type: 'text', text: ' ' },
    { type: 'link', href: 'https://e.org', children: [{ type: 'text', text: 'd' }] },
  ])
})

test('unsafe links are shown as plain text, never as links', () => {
  for (const bad of ['[x](javascript:alert(1))', '[x](data:text/html,hi)', '[x](vbscript:y)']) {
    const parts = parseInline(bad)
    assert.ok(parts.every((p) => p.type === 'text'), bad)
    assert.equal(parts.map((p) => (p.type === 'text' ? p.text : '')).join(''), bad)
  }
  assert.equal(parseInline('[x](/contact)')[0].type, 'link')
})

test('dates and reading time', () => {
  assert.equal(formatPostDate('2026-10-14'), '14 October 2026')
  assert.equal(readingMinutes('word'), 1)
  assert.equal(readingMinutes('word '.repeat(1000)), 5)
})

test('every article has a unique address, a real date and a search-length summary', () => {
  const slugs = posts.map((p) => p.slug)
  assert.equal(new Set(slugs).size, slugs.length, 'slugs are unique')
  for (const p of posts) {
    assert.match(p.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${p.slug}: lower-case words joined by hyphens`)
    assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, `${p.slug}: date is YYYY-MM-DD`)
    assert.ok(!Number.isNaN(Date.parse(p.date)), `${p.slug}: date is real`)
    assert.ok(p.summary.length >= 70 && p.summary.length <= 170, `${p.slug}: summary length ${p.summary.length}`)
    assert.ok(p.title.trim() && p.body.trim(), `${p.slug}: title and body are filled in`)
  }
  for (const p of publishedPosts) assert.equal(pageMeta(`/blog/${p.slug}`).path, `/blog/${p.slug}`, `${p.slug} has its own page`)
  assert.equal(pageMeta('/blog').path, '/blog')
})
