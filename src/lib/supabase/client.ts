import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Safe to use in Client Components ('use client').
 * Call this function inside a component or hook — do NOT instantiate at module level
 * to avoid sharing state across requests in server contexts.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
