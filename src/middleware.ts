import { type NextRequest, NextResponse } from 'next/server'

// ─────────────────────────────────────────────
// Middleware - Simplified version
// ─────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  // For now, just pass through all requests
  // Session management is handled client-side via Supabase SDK
  return NextResponse.next()
}

// ─────────────────────────────────────────────
// Matcher
// ─────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static assets
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
