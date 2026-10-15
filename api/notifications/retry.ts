/**
 * POST /api/notifications/retry  (Vercel Function, staff only)
 * Sends a failed WhatsApp notification again, at most once. See api/_lib/staff.ts.
 */
import { handleRetry } from '../_lib/staff.ts'
import type { ServerEnv } from '../_lib/notify.ts'

export function POST(request: Request) {
  return handleRetry(request, { env: process.env as ServerEnv })
}
export { POST as GET, POST as PUT, POST as PATCH, POST as DELETE }
