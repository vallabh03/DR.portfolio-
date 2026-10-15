/**
 * POST /api/appointments/status  (Vercel Function, staff only)
 * Confirm, reschedule or reject a booking, then message the patient on WhatsApp.
 * See api/_lib/staff.ts.
 */
import { handleStatusChange } from '../_lib/staff.ts'
import type { ServerEnv } from '../_lib/notify.ts'

export function POST(request: Request) {
  return handleStatusChange(request, { env: process.env as ServerEnv })
}
export { POST as GET, POST as PUT, POST as PATCH, POST as DELETE }
