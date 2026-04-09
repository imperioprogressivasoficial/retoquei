import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Health check endpoint
 * Used by uptime monitors and load balancers
 *
 * GET /api/health
 * Returns: { status: 'healthy' | 'degraded' | 'unhealthy', timestamp, checks }
 */
export async function GET() {
  const start = Date.now()
  let dbOk = false

  try {
    await prisma.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    dbOk = false
  }

  const health = {
    status: dbOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    uptime: process.uptime(),
    responseTime: Date.now() - start,
    checks: {
      database: dbOk,
      api: true,
    },
  }

  return NextResponse.json(health, {
    status: dbOk ? 200 : 503,
  })
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
