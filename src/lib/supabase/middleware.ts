import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase client scoped to the middleware request/response cycle
 * and refreshes the user session cookie.
 *
 * Returns both the updated response and the authenticated user (or null).
 *
 * Usage:
 *   const { response, user } = await updateSession(request)
 */
const IS_DEV_MODE = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')

export async function updateSession(request: NextRequest) {
  // Start with a plain pass-through response so we can mutate cookies on it.
  let supabaseResponse = NextResponse.next({ request })

  // Dev mode: skip Supabase entirely when using placeholder credentials
  if (IS_DEV_MODE) {
    try {
      const raw = request.cookies.get('dev_user')?.value
      const devUser = raw ? JSON.parse(decodeURIComponent(raw)) : null
      return { response: supabaseResponse, user: devUser, supabase: null }
    } catch {
      return { response: supabaseResponse, user: null, supabase: null }
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mirror cookies onto the request (for SSR rendering)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          // Re-create the response with the mutated request cookies
          supabaseResponse = NextResponse.next({ request })
          // And also set them on the response so the browser persists them
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: calling getUser() refreshes the auth token if it has expired.
  // Do NOT call supabase.auth.getSession() here — it won't refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response: supabaseResponse, user, supabase }
}
