import type { Logger } from './http.ts'

/**
 * Sends one approved template message through the Meta WhatsApp Cloud API.
 * Server-side only: the access token comes from environment variables and is
 * never returned or logged. Errors are reduced to codes, because Meta's error
 * text can echo the values that were sent.
 */

const META_TIMEOUT_MS = 10_000
const DEFAULT_API_VERSION = 'v23.0'
/** Template parameter values cannot contain line breaks, tabs or runs of four spaces, and cannot be empty. */
const flat = (s: string) => s.replace(/\s+/g, ' ').trim() || '-'

export type WhatsAppConfig = {
  accessToken: string
  phoneNumberId: string
  language: string
  apiVersion?: string
}

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string }

export async function sendTemplate(
  config: WhatsAppConfig,
  message: { to: string; template: string; params: Record<string, string> },
  fetchImpl: typeof fetch,
  log: Logger,
): Promise<SendResult> {
  const version = config.apiVersion && /^v\d+\.\d+$/.test(config.apiVersion) ? config.apiVersion : DEFAULT_API_VERSION
  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(config.phoneNumberId)}/messages`

  let res: Response
  try {
    res = await fetchImpl(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: message.to.replace(/\D/g, ''),
        type: 'template',
        template: {
          name: message.template,
          language: { code: config.language || 'en' },
          components: [
            {
              type: 'body',
              parameters: Object.entries(message.params).map(([parameter_name, text]) => ({ type: 'text', parameter_name, text: flat(text) })),
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(META_TIMEOUT_MS),
    })
  } catch (err) {
    const timeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    log.error(`whatsapp: request ${timeout ? 'timed out' : 'could not connect'}`)
    return { ok: false, error: timeout ? 'timeout' : 'network' }
  }

  const data = (await res.json().catch(() => null)) as {
    messages?: { id?: unknown }[]
    error?: { code?: unknown; error_subcode?: unknown; fbtrace_id?: unknown }
  } | null

  const id = data?.messages?.[0]?.id
  if (res.ok && typeof id === 'string') return { ok: true, messageId: id }

  const e = data?.error
  const error = `meta status ${res.status}, code ${String(e?.code ?? 'none')}, subcode ${String(e?.error_subcode ?? 'none')}, trace ${String(e?.fbtrace_id ?? 'none')}`
  log.error(`whatsapp: message rejected (${error})`)
  return { ok: false, error }
}
