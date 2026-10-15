/**
 * Tests for the WhatsApp click-to-chat link.
 * Run with: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WHATSAPP_MESSAGE, whatsappUrl } from '../src/data/doctor.ts'

test('the WhatsApp link is the official wa.me click-to-chat address for the practice number', () => {
  assert.ok(whatsappUrl)
  const url = new URL(whatsappUrl)
  assert.equal(url.origin, 'https://wa.me')
  assert.equal(url.pathname, '/917780161363')
})

test('the chat opens with the enquiry message filled in', () => {
  const url = new URL(whatsappUrl!)
  assert.equal(url.searchParams.get('text'), WHATSAPP_MESSAGE)
  assert.equal(WHATSAPP_MESSAGE, 'Hello, I would like to enquire about a consultation with Dr. Abhinav Thaduri.')
})
