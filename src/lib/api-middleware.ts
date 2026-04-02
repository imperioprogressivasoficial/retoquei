/**
 * API monitoring middleware
 * Tracks request duration, status codes, and errors
 */

import { NextRequest, NextResponse } from 'next/server'
import { recordMetric, captureException } from './monitoring'

interface RequestMetrics {
  method: string
  endpoint: string
  statusCode: number
  duration: number
  timestamp: Date
  error?: string
}

const metrics: RequestMetrics[] = []

/**
 * Middleware wrapper for API routes
 * Tracks request timing and error status
 */
export function withMonitoring<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options?: {
    endpoint?: string
  }
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const startTime = performance.now()
    const endpoint = options?.endpoint || request.nextUrl.pathname
    const method = request.method

    try {
      const response = await handler(request, ...args)
      const duration = performance.now() - startTime

      recordMetric({
        name: `api.${method.toLowerCase()}`,
        duration,
        endpoint,
        status: `${response.status}`,
        value: response.status,
      })

      // Log metrics
      metrics.push({
        method,
        endpoint,
        statusCode: response.status,
        duration,
        timestamp: new Date(),
      })

      // Clean old metrics (keep last 1000)
      if (metrics.length > 1000) {
        metrics.shift()
      }

      return response
    } catch (error) {
      const duration = performance.now() - startTime

      captureException(error, {
        endpoint,
        method,
        duration,
      })

      recordMetric({
        name: `api.${method.toLowerCase()}`,
        duration,
        endpoint,
        status: '500',
      })

      metrics.push({
        method,
        endpoint,
        statusCode: 500,
        duration,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      })

      // Return error response
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }) as T
}

/**
 * Get recent API metrics
 */
export function getRecentMetrics(limit: number = 100): RequestMetrics[] {
  return metrics.slice(-limit)
}

/**
 * Get API metrics summary
 */
export function getMetricsSummary() {
  if (metrics.length === 0) {
    return {
      totalRequests: 0,
      avgDuration: 0,
      errorRate: 0,
      statusCodeDistribution: {},
    }
  }

  const totalRequests = metrics.length
  const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests
  const errorCount = metrics.filter((m) => m.statusCode >= 400).length
  const errorRate = (errorCount / totalRequests) * 100

  const statusCodeDistribution: Record<number, number> = {}
  metrics.forEach((m) => {
    statusCodeDistribution[m.statusCode] = (statusCodeDistribution[m.statusCode] || 0) + 1
  })

  return {
    totalRequests,
    avgDuration: Math.round(avgDuration),
    errorRate: Math.round(errorRate * 100) / 100,
    statusCodeDistribution,
    lastRequest: metrics[metrics.length - 1]?.timestamp,
  }
}

/**
 * Clear metrics (for testing)
 */
export function clearMetrics() {
  metrics.length = 0
}
