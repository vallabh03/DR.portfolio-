import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The browser's Supabase client, used only by the staff dashboard (/staff) to
 * sign staff in and read bookings. It uses the project's public "anon" key,
 * which is safe to publish: Row Level Security (supabase/migrations) lets it
 * read bookings only for signed-in accounts on the staff list, and it can
 * never write. The service-role key is never used in the browser.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null
