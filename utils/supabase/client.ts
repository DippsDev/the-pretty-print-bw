import { createBrowserClient } from '@supabase/ssr'

// Booking pages construct this client while the module loads. A missing
// project URL must not throw during `next build`; auth calls fail later.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:9'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'local-dev-placeholder'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}
