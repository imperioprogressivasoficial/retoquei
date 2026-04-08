import { NextResponse } from 'next/server'

/**
 * Health check endpoint
 * Used by uptime monitors and load balancers
 *
 * GET /api/health
 * Returns: { status: 'healthy' | 'degraded' | 'unhealthy', timestamp, checks }
 */
export async function GET() {
  try {
    // TODO: Fix database connection and restore health checks
    // Temporarily return degraded status without checking database
    const health = {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      uptime: process.uptime(),
      responseTime: 0,
      checks: {
        database: false,
        api: true,
      },
    }

    return NextResponse.json(health, {
      status: 503,
    })
  } catch (err) {
    console.error('[health] Endpoint error:', err)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    )
  }
}

/**
 * HEAD request support for lightweight health checks
 * Same as GET but returns no body
 */
export async function HEAD() {
  return new Response(null, { status: 503 })
}
