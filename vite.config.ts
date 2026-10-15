import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createLimiter, handleConsultation, type Env } from './api/consultation.ts'
import { memoryDb } from './api/_lib/db.ts'
import seoPages from './scripts/seo-pages.ts'

/**
 * Serves the api/ functions during `npm run dev` and `npm run preview`, so the
 * booking form works locally as it does on Vercel. Server
 * variables come from .env.local (never exposed to the browser: only VITE_
 * variables are).
 *
 * BOOKING_DEV_MOCK=sent|failed runs everything without Supabase or Meta: bookings
 * are kept in memory and WhatsApp messages are replaced by a stand-in that
 * succeeds or fails. It is read only here, and this plugin never runs in a
 * production deployment.
 */
function bookingApi(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '') as Env & { BOOKING_DEV_MOCK?: string }
  const mock = env.BOOKING_DEV_MOCK
  const limiter = createLimiter()
  const db = mock ? memoryDb() : undefined

  const mockEnv: Env = {
    WHATSAPP_ACCESS_TOKEN: 'dev-mock',
    WHATSAPP_PHONE_NUMBER_ID: '0',
    WHATSAPP_RECIPIENT_NUMBER: '0',
    WHATSAPP_TEMPLATE_NAME: 'dev_mock',
  }
  let mockMessages = 0
  const mockFetch: typeof fetch = async () =>
    mock === 'sent'
      ? Response.json({ messages: [{ id: `wamid.dev-mock-${++mockMessages}` }] })
      : Response.json({ error: { code: 0, fbtrace_id: 'dev-mock' } }, { status: 400 })

  const routes: Record<string, (request: Request, ip?: string) => Promise<Response>> = {
    '/api/consultation': (request, ip) =>
      handleConsultation(request, { env: mock ? { ...env, ...mockEnv } : env, db, fetch: mock ? mockFetch : undefined, limiter, clientIp: ip }),
  }

  const middleware: Connect.NextHandleFunction = async (req, res, next) => {
    const route = routes[req.url?.split('?')[0] ?? '']
    if (!route) return next()
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: Object.entries(req.headers).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)] as [string, string]])),
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
    })
    const response = await route(request, req.socket.remoteAddress)
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(await response.text())
  }

  return {
    name: 'booking-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), bookingApi(mode), seoPages()],
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
