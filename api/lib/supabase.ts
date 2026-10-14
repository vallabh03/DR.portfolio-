/**
 * Server-only Supabase client.
 *
 * This module is only imported by server-side code (api/consultation.ts).
 * It reads credentials from server environment variables and never exposes
 * them to the browser bundle.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type Env = {
  SUPABASE_URL?: string
  SUPABASE_SECRET_KEY?: string
}

let cached: SupabaseClient | null = null

export function createSupabaseServerClient(env: Env): SupabaseClient {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error('Supabase credentials not configured: set SUPABASE_URL and SUPABASE_SECRET_KEY')
  }

  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: 'public' },
    })
  }
  return cached
}

export function getSupabaseClient(env: Env): SupabaseClient {
  return createSupabaseServerClient(env)
}