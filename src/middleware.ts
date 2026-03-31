import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// ─────────────────────────────────────────────
// Route groups
// ─────────────────────────────────────────────

/** Routes that require the user to be authenticated (app shell routes) */
const PROTECTED_APP_ROUTES = [
  '/dashboard', '/customers', '/segments', '/flows', '/campaigns',
  '/templates', '/integrations', '/settings', '/team', '/billing', '/audit-logs',
]
/** Routes that require platform admin access */
const PROTECTED_ADMIN_PATTERN = /^\/admin(\/.*)?$/
/** Routes that authenticated users should not be able to reach */
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
/** Onboarding route prefix */
const ONBOARDING_PREFIX = '/onboarding'

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Refresh Supabase auth session and get current user
  const { response, user, supabase } = await updateSession(request)

  const isAuthenticated = !!user

  // ── 2. Redirect authenticated users away from auth pages ──────────────────
  if (isAuthenticated && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ── 3. Protect app shell routes ───────────────────────────────────────────
  const isProtectedAppRoute = PROTECTED_APP_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  )

  if (isProtectedAppRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const hasConnector = user.user_metadata?.has_connector === true ||
      user.app_metadata?.has_connector === true

    if (!hasConnector) {
      return NextResponse.redirect(new URL('/onboarding/3', request.url))
    }
  }

  // ── 4. Protect /admin/* routes ────────────────────────────────────────────
  if (PROTECTED_ADMIN_PATTERN.test(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Platform admins are identified by app_metadata.is_platform_admin = true.
    // This flag is set via Supabase service role and cannot be spoofed by the client.
    const isPlatformAdmin = user.app_metadata?.is_platform_admin === true

    if (!isPlatformAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── 5. Onboarding flow guard ──────────────────────────────────────────────
  if (pathname.startsWith(ONBOARDING_PREFIX)) {
    if (!isAuthenticated) {
      // Unauthenticated users must log in before onboarding
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If the user has already completed onboarding, redirect to app
    const onboardingComplete = user.user_metadata?.onboarding_complete === true ||
      user.app_metadata?.onboarding_complete === true

    if (onboardingComplete && pathname === ONBOARDING_PREFIX) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // ── 6. Void unused supabase variable (linting) ───────────────────────────
  if (supabase) void supabase

  // Return the response with refreshed session cookies
  return response
}

// ─────────────────────────────────────────────
// Matcher — apply middleware only to relevant paths
// ─────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets (png, svg, jpg, etc.)
     * - api/webhooks (webhook endpoints must be public)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)',
  ],
}
