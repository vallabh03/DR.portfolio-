import { defineConfig, loadEnv, type Connect, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createStore, handleConsultation, type Env } from './api/consultation.ts'

/**
 * Serves api/consultation.ts during `npm run dev` and `npm run preview`, so the
 * form works locally exactly as it does on Vercel. Server variables come from
 * .env.local (never exposed to the browser: only VITE_ variables are).
 *
 * WHATSAPP_DEV_MOCK=sent|failed replaces the call to Meta with a local stand-in,
 * so the success and failure paths can be tried without Meta credentials. It is
 * read only here, and this plugin never runs in a production deployment.
 */
function consultationApi(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const mock = env.WHATSAPP_DEV_MOCK
  const store = createStore()

  const mockEnv: Env = {
    WHATSAPP_ACCESS_TOKEN: 'dev-mock',
    WHATSAPP_PHONE_NUMBER_ID: '0',
    WHATSAPP_RECIPIENT_NUMBER: '0',
    WHATSAPP_TEMPLATE_NAME: 'dev_mock',
  }
  const mockFetch: typeof fetch = async () =>
    mock === 'sent'
      ? Response.json({ messages: [{ id: 'dev-mock' }] })
      : Response.json({ error: { code: 0, fbtrace_id: 'dev-mock' } }, { status: 400 })

  const middleware: Connect.NextHandleFunction = async (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/consultation') return next()
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: Object.entries(req.headers).flatMap(([k, v]) => (v === undefined ? [] : [[k, String(v)] as [string, string]])),
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
    })
    const response = await handleConsultation(request, {
      env: mock ? { ...env, ...mockEnv } : env,
      fetch: mock ? mockFetch : undefined,
      store,
      clientIp: req.socket.remoteAddress,
    })
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(await response.text())
  }

  return {
    name: 'consultation-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), consultationApi(mode)],
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
