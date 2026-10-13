/**
 * Tests for the gallery sections and the 18+ viewer consent used by the
 * surgery sections. A small in-memory store stands in for sessionStorage.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { giveConsent, hasConsent, withdrawConsent } from '../src/lib/consent.ts'
import { findSection, gallerySections, visibleSections } from '../src/data/gallery.ts'

const memoryStore = (initial?: string) => {
  const data = new Map<string, string>(initial === undefined ? [] : [['at-gallery-consent', initial]])
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
}

test('the gallery has the three sections in order, with both surgery sections marked sensitive', () => {
  assert.deepEqual(
    gallerySections.map((s) => [s.title, s.sensitive]),
    [
      ['Awards and conferences', false],
      ['Surgery images', true],
      ['Surgery videos', true],
    ],
  )
})

test('only enabled sections are shown; surgery images and videos are disabled for now', () => {
  assert.deepEqual(
    visibleSections.map((s) => s.slug),
    ['awards-and-conferences'],
  )
  assert.equal(findSection('surgery-images'), undefined, 'a disabled section has no page')
  assert.equal(findSection('surgery-videos'), undefined, 'a disabled section has no page')
})

test('sections are found by slug, and an unknown slug finds nothing', () => {
  assert.equal(findSection('awards-and-conferences')?.kind, 'photos')
  assert.equal(findSection('not-a-section'), undefined)
  assert.equal(findSection(undefined), undefined)
})

test('consent starts withheld and is remembered per section once given', () => {
  const store = memoryStore()
  assert.equal(hasConsent('surgery-images', store), false)
  giveConsent('surgery-images', store)
  assert.equal(hasConsent('surgery-images', store), true)
  assert.equal(hasConsent('surgery-videos', store), false, 'consent for images does not unlock videos')
})

test('consent can be withdrawn without affecting other sections', () => {
  const store = memoryStore()
  giveConsent('surgery-images', store)
  giveConsent('surgery-videos', store)
  withdrawConsent('surgery-images', store)
  assert.equal(hasConsent('surgery-images', store), false)
  assert.equal(hasConsent('surgery-videos', store), true)
})

test('corrupt or tampered storage is treated as no consent', () => {
  assert.equal(hasConsent('surgery-images', memoryStore('not json')), false)
  assert.equal(hasConsent('surgery-images', memoryStore('{"surgery-images":true}')), false)
  assert.equal(hasConsent('surgery-images', memoryStore('[1, null]')), false)
})

test('without any storage (blocked), consent is simply not remembered', () => {
  giveConsent('surgery-images', undefined)
  assert.equal(hasConsent('surgery-images', undefined), false)
})
