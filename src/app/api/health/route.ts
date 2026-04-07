import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health check endpoint
 * Used by uptime monitors and load balancers
 *
 * GET /api/health
 * Returns: { status: 'healthy' | 'degraded' | 'unhealthy', timestamp, checks }
 */
export async function GET() {
  try {
    const startTime = performance.now()

    // Check database connection
    let dbHealthy = false
    try {
      await prisma.$queryRaw`SELECT 1`
      dbHealthy = true
    } catch (err) {
      console.error('[health] Database check failed:', err)
    }

    const duration = performance.now() - startTime

    // Determine overall health
    const status = dbHealthy ? 'healthy' : 'degraded'

    const health = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
      uptime: process.uptime(),
      responseTime: Math.round(duration),
      checks: {
        database: dbHealthy,
        api: true,
      },
    }

    return NextResponse.json(health, {
      status: dbHealthy ? 200 : 503,
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
  try {
    await prisma.$queryRaw`SELECT 1`
    return new Response(null, { status: 200 })
  } catch {
    return new Response(null, { status: 503 })
  }
}
