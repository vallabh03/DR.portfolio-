import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createStore, handleConsultation, type Env } from './api/consultation.ts'
import seoPages from './scripts/seo-pages.ts'

/**
 * Serves api/consultation.ts during `npm run dev` and `npm run preview`, so the
 * form works locally exactly as it does on Vercel. Server variables come from
 * .env.local (never exposed to the browser: only VITE_ variables are).
 *
 * WHATSAPP_DEV_MOCK=sent|failed replaces the call to Meta with a local stand-in,
 * so the success and failure paths can be tried without Meta credentials. It is
 * read only here, and this plugin never runs in a production deployment.
 * Supabase persistence remains real so database operations and idempotency
 * can be verified honestly against the configured database.
 */
export function createConsultationMiddleware(
  mode: string,
  options?: { store?: ReturnType<typeof createStore>; supabaseClient?: unknown; env?: Env },
): Connect.NextHandleFunction {
  const store = options?.store ?? createStore()

  return async (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/consultation') return next()

    // Reload env dynamically so changes to .env.local take effect immediately
    const loadedEnv = loadEnv(mode, process.cwd(), '')
    const env = { ...loadedEnv, ...options?.env }
    const mock = env.WHATSAPP_DEV_MOCK

    // When WHATSAPP_DEV_MOCK is active, supply mock WhatsApp credentials if missing
    // so local testing works without Meta setup. Preserve real Supabase credentials.
    const effectiveEnv: Env = {
      ...env,
      WHATSAPP_ACCESS_TOKEN: env.WHATSAPP_ACCESS_TOKEN || (mock ? 'dev-mock-token' : ''),
      WHATSAPP_PHONE_NUMBER_ID: env.WHATSAPP_PHONE_NUMBER_ID || (mock ? '0' : ''),
      WHATSAPP_RECIPIENT_NUMBER: env.WHATSAPP_RECIPIENT_NUMBER || (mock ? '0' : ''),
      WHATSAPP_TEMPLATE_NAME: env.WHATSAPP_TEMPLATE_NAME || (mock ? 'dev_mock' : ''),
      WHATSAPP_DEV_MOCK: mock,
    }

    const mockFetch: typeof fetch = async (url, init) => {
      const urlStr = typeof url === 'string' ? url : url instanceof Request ? url.url : String(url)
      if (urlStr.includes('graph.facebook.com')) {
        return mock === 'sent'
          ? Response.json({ messages: [{ id: 'dev-mock' }] })
          : Response.json({ error: { code: 0, fbtrace_id: 'dev-mock' } }, { status: 400 })
      }
      return fetch(url, init)
    }

    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: Object.entries(req.headers).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)] as [string, string]])),
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
    })

    const response = await handleConsultation(request, {
      env: effectiveEnv,
      fetch: mock ? mockFetch : undefined,
      store,
      clientIp: req.socket.remoteAddress,
      // Supabase is not stubbed here: real Supabase credentials from .env.local are used
    })
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(await response.text())
  }
}

function consultationApi(mode: string): Plugin {
  const middleware = createConsultationMiddleware(mode)
  return {
    name: 'consultation-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), consultationApi(mode), seoPages()],
  build: {
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\/]node_modules[\/](motion|framer-motion|motion-dom|motion-utils)[\/]/.test(id)) return 'motion'
            if (id.includes('react')) return 'react'
          }
        },
      },
    },
  },
}))
