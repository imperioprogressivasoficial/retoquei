/**
 * Monitoring and observability utilities
 * Provides consistent logging, metrics collection, and error tracking
 */

import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// Environment Configuration
// ─────────────────────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

// ─────────────────────────────────────────────────────────────────────────────
// Sentry Initialization
// ─────────────────────────────────────────────────────────────────────────────

export function initializeSentry() {
  if (!SENTRY_DSN || isDev) {
    if (isDev) {
      console.log('[Monitoring] Sentry disabled in development')
    } else {
      console.warn('[Monitoring] NEXT_PUBLIC_SENTRY_DSN not configured')
    }
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Tracking
// ─────────────────────────────────────────────────────────────────────────────

export interface ErrorContext {
  userId?: string
  tenantId?: string
  endpoint?: string
  method?: string
  statusCode?: number
  [key: string]: any
}

/**
 * Capture an exception with context
 */
export function captureException(error: unknown, context?: ErrorContext) {
  const err = error instanceof Error ? error : new Error(String(error))

  if (context) {
    Sentry.captureException(err, {
      contexts: {
        custom: context,
      },
    })
  } else {
    Sentry.captureException(err)
  }

  // Also log to console in development
  if (isDev) {
    console.error('[Error]', err.message, context)
  }
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  Sentry.captureMessage(message, level)
  if (isDev && context) {
    console.log(`[${level.toUpperCase()}] ${message}`, context)
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, attributes?: Record<string, any>) {
  Sentry.setUser({
    id: userId,
    email,
    ...attributes,
  })
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null)
}

/**
 * Set tenant context
 */
export function setTenantContext(tenantId: string) {
  Sentry.setContext('tenant', {
    id: tenantId,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Performance Monitoring
// ─────────────────────────────────────────────────────────────────────────────

interface PerformanceMetric {
  name: string
  duration: number
  value?: number
  unit?: string
  endpoint?: string
  status?: string
}

const metrics: PerformanceMetric[] = []

/**
 * Record a performance metric
 */
export function recordMetric(metric: PerformanceMetric) {
  metrics.push(metric)

  // Send to Sentry as gauge
  if (isProduction && SENTRY_DSN) {
    Sentry.metrics.gauge(
      metric.name,
      metric.value ?? metric.duration,
      {
        unit: metric.unit || 'milliseconds',
        tags: {
          endpoint: metric.endpoint,
          status: metric.status,
        },
      }
    )
  }

  // Log slow operations
  if (metric.duration > 1000) {
    console.warn(
      `[Slow Operation] ${metric.name} took ${metric.duration}ms`,
      { endpoint: metric.endpoint }
    )
  }
}

/**
 * Time an async operation and record metric
 */
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  context?: { endpoint?: string; [key: string]: any }
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    recordMetric({
      name,
      duration,
      endpoint: context?.endpoint,
      status: 'success',
      ...context,
    })
    return result
  } catch (err) {
    const duration = performance.now() - start
    recordMetric({
      name,
      duration,
      endpoint: context?.endpoint,
      status: 'error',
      ...context,
    })
    throw err
  }
}

/**
 * Time a sync operation and record metric
 */
export function timeSync<T>(
  name: string,
  fn: () => T,
  context?: { endpoint?: string; [key: string]: any }
): T {
  const start = performance.now()
  try {
    const result = fn()
    const duration = performance.now() - start
    recordMetric({
      name,
      duration,
      endpoint: context?.endpoint,
      status: 'success',
      ...context,
    })
    return result
  } catch (err) {
    const duration = performance.now() - start
    recordMetric({
      name,
      duration,
      endpoint: context?.endpoint,
      status: 'error',
      ...context,
    })
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Events
// ─────────────────────────────────────────────────────────────────────────────

export interface BusinessEvent {
  name: string
  userId?: string
  tenantId?: string
  properties?: Record<string, any>
  timestamp?: Date
}

const pendingEvents: BusinessEvent[] = []

/**
 * Track a business event
 */
export function trackEvent(event: BusinessEvent) {
  const eventData = {
    ...event,
    timestamp: event.timestamp || new Date(),
  }

  pendingEvents.push(eventData)

  // Send to Sentry as breadcrumb
  Sentry.captureMessage(event.name, 'info', {
    contexts: {
      event: event.properties,
    },
  })

  // Batch send events if in production
  if (pendingEvents.length >= 10) {
    flushEvents()
  }
}

/**
 * Flush pending events
 */
export function flushEvents() {
  if (pendingEvents.length === 0) return

  // In a real implementation, send to analytics backend
  // For now, just clear the buffer
  if (isDev) {
    console.log(`[Events] Flushed ${pendingEvents.length} events`)
  }
  pendingEvents.length = 0
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Monitoring
// ─────────────────────────────────────────────────────────────────────────────

export interface DatabaseQueryMetric {
  query: string
  duration: number
  status: 'success' | 'error'
  error?: string
}

const slowQueryThreshold = 1000 // 1 second

/**
 * Record a database query metric
 */
export function recordDatabaseQuery(metric: DatabaseQueryMetric) {
  if (metric.duration > slowQueryThreshold) {
    captureMessage(
      `Slow query detected: ${metric.duration}ms`,
      'warning',
      {
        query: metric.query.substring(0, 200),
        duration: metric.duration,
      }
    )
  }

  recordMetric({
    name: 'db.query',
    duration: metric.duration,
    status: metric.status,
    value: metric.duration,
    unit: 'milliseconds',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue Monitoring
// ─────────────────────────────────────────────────────────────────────────────

export interface QueueMetric {
  queueName: string
  jobId?: string
  status: 'started' | 'completed' | 'failed'
  duration?: number
  error?: string
}

/**
 * Record a queue job metric
 */
export function recordQueueJob(metric: QueueMetric) {
  if (metric.status === 'failed') {
    captureMessage(
      `Queue job failed: ${metric.queueName}`,
      'error',
      {
        queueName: metric.queueName,
        jobId: metric.jobId,
        error: metric.error,
      }
    )
  }

  if (metric.duration && metric.duration > 5000) {
    captureMessage(
      `Slow queue job: ${metric.queueName} took ${metric.duration}ms`,
      'warning',
      {
        queueName: metric.queueName,
        duration: metric.duration,
      }
    )
  }

  recordMetric({
    name: `queue.${metric.queueName}`,
    duration: metric.duration || 0,
    status: metric.status,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Check Utilities
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  checks: {
    database: boolean
    redis: boolean
    supabase: boolean
  }
  message?: string
}

export async function checkHealth(): Promise<HealthStatus> {
  const now = new Date()

  // Basic health checks
  // More detailed checks should be implemented based on actual infrastructure
  return {
    status: 'healthy',
    timestamp: now,
    checks: {
      database: true,
      redis: true,
      supabase: true,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export default {
  initializeSentry,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  setTenantContext,
  recordMetric,
  timeAsync,
  timeSync,
  trackEvent,
  flushEvents,
  recordDatabaseQuery,
  recordQueueJob,
  checkHealth,
}
