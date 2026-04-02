# Monitoring & Analytics Status Report
**Generated:** April 2, 2026
**Project:** Retoquei — Customer Retention Platform
**Status:** Partial Implementation

---

## Executive Summary

The Retoquei platform has **basic analytics and business metric tracking** in place, but is **critically missing**:
- Error tracking and alerting (no Sentry, DataDog, or equivalent)
- Production monitoring dashboard
- API performance monitoring
- Database query performance tracking
- Real-time error notifications
- Uptime/health checks

**Risk Level:** HIGH — Production issues may go undetected

---

## 1. VERCEL ANALYTICS ✅ PARTIAL

### Status: IMPLEMENTED
- **Location:** `src/app/layout.tsx`
- **Implementation:** `<Analytics />` component from `@vercel/analytics/next`

### What's Working
- ✅ Vercel Analytics package installed (`@vercel/analytics@^2.0.1`)
- ✅ Component integrated in root layout
- ✅ Pageview tracking (automatic via Vercel)

### What's Missing
- ❌ Web Vitals tracking (Core Web Vitals - LCP, FID, CLS)
- ❌ Custom event tracking for key actions:
  - Customer signup/onboarding completion
  - Campaign creation/send
  - Message delivery success
  - Connector sync status
  - Payment transactions
- ❌ Error boundary event tracking
- ❌ Client-side error event reporting

### Gaps to Address
The Analytics component collects pageviews by default, but doesn't track:
- Custom business events
- Web performance metrics
- User interactions with key features

---

## 2. ERROR TRACKING & MONITORING ❌ MISSING

### Status: NOT IMPLEMENTED

### What Exists
- Basic error logging in API routes: `console.error()`
- Error responses in API handlers (500 status codes)
- Prisma logs in development: `['query', 'error', 'warn']`
- Try-catch blocks in key services

### What's Missing (CRITICAL)
- ❌ **No centralized error tracking** (Sentry, DataDog, etc.)
- ❌ **No error alerting system**
- ❌ **No stack trace collection**
- ❌ **No production error monitoring**
- ❌ **No error trend analysis**
- ❌ **No error notifications to team**

### Affected Areas
- `/src/app/api/**/*.ts` — Errors logged to stdout only
- `/src/services/**/*.ts` — Catch blocks with console.error()
- Prisma operations — No slow query logging
- Worker/Job failures — BullMQ queues track failures, but no alerting

### Current Error Handling Code
```typescript
// Example from /src/app/api/billing/checkout/route.ts
catch (err) {
  console.error('[billing/checkout] Error:', err)  // Lost in logs
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

---

## 3. BUSINESS METRICS ⚠️ PARTIAL

### Status: PARTIALLY IMPLEMENTED

### Metrics Being Tracked
✅ **Available in Dashboard/API:**
- Total customers by lifecycle stage
- New customers per month
- Recurring/VIP/At-Risk/Lost customers
- Retention rate
- Average ticket value
- Messages sent/delivered/read
- Delivery rates
- Revenue (total spent)
- Customer evolution trends
- RFM scores
- Customer lifetime value (LTV)

### Implementation
- **Dashboard API:** `/src/app/api/dashboard/overview/route.ts`
- **Analytics Service:** `/src/services/customer-analytics.service.ts`
- **Types:** `/src/types/analytics.types.ts`
- **Worker Queues:** Customer recompute, segment refresh, campaign scheduling

### What's Missing
- ❌ **Signups per day tracking** — Only new customers counted, no signup funnel
- ❌ **Campaign analytics detail** — Sent, delivered, read rates available but not in main dashboard
- ❌ **Message cost tracking** — No WhatsApp/SMS cost attribution
- ❌ **Test transaction tracking** — No Stripe test transaction metrics
- ❌ **Real-time metrics** — All metrics calculated on-demand, no caching
- ❌ **Historical trend alerts** — No automatic detection of metric anomalies
- ❌ **Cohort analysis** — Basic retention cohorts exist but limited

### Key Services
```typescript
// /src/services/customer-analytics.service.ts
- calculateLifecycleStage()
- calculateRiskLevel()
- calculateRFMScore()
- calculateLTV()
- computeRetentionCohort()
- recomputeCustomer()
```

---

## 4. DATABASE MONITORING ❌ MISSING

### Status: MINIMAL

### What Exists
- Prisma query logging in development: `['query', 'error', 'warn']`
- Prisma error format: 'minimal'
- Connection pooling setup: `DATABASE_URL` and `DIRECT_URL` in env
- Prisma Studio available: `prisma studio` command

### What's Missing (CRITICAL)
- ❌ **No slow query logging in production**
- ❌ **No query performance monitoring**
- ❌ **No connection pool health metrics**
- ❌ **No database size tracking**
- ❌ **No replication lag monitoring**
- ❌ **No index usage analysis**
- ❌ **No query cost analysis**
- ❌ **No automated query optimization alerts**

### Configuration
```typescript
// /src/lib/prisma.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],  // Only errors in production!
  errorFormat: 'minimal',
})
```

### Database Infrastructure
- PostgreSQL via Supabase
- Connection pooler available via `DIRECT_URL`
- No monitoring integrations configured

---

## 5. MONITORING DASHBOARD ❌ MISSING

### Status: NOT IMPLEMENTED

### What Exists
- **Customer Dashboard:** `/src/app/(app)/dashboard/page.tsx` — Shows business metrics
- **Admin Jobs Dashboard:** `/src/app/admin/jobs/page.tsx` — Shows queue status
- **Audit Logs:** Basic audit logging table in database

### What's Missing (CRITICAL)
- ❌ **API Uptime Dashboard**
- ❌ **Error Rate Trending**
- ❌ **Response Time Metrics**
- ❌ **Database Health Status**
- ❌ **Queue/Worker Health**
- ❌ **System Resource Usage** (CPU, memory, disk)
- ❌ **Authentication/Security Events**
- ❌ **Third-party API Health** (WhatsApp, Stripe, Supabase)

### Dashboard Components Available
- `KPICard` — for metric display
- `CustomerEvolutionChart` — for trends
- `SegmentDistributionChart` — for distribution
- No system monitoring components

---

## 6. QUEUE & WORKER MONITORING ⚠️ PARTIAL

### Status: BASIC IMPLEMENTATION

### What's Being Tracked
- **Queues:** 7 BullMQ queues defined with retry logic
  - connector-sync
  - customer-recompute
  - segment-refresh
  - message-send
  - webhook-process
  - campaign-schedule
  - retry-failed-messages

### Job Configuration
```typescript
// All queues have:
- Retry attempts: 3 with exponential backoff
- Remove on complete: 24h age
- Remove on fail: 7 days age
- Connection via Redis (Upstash or local)
```

### What's Missing
- ❌ **No real-time queue metrics** in admin panel
- ❌ **No job failure alerting**
- ❌ **No stuck job detection**
- ❌ **No queue depth monitoring**
- ❌ **No job processing time tracking**
- ❌ **No dead-letter queue management**
- ❌ **No worker health checks**

### Implementation
- **Admin API:** `/src/app/api/admin/jobs/route.ts`
- **Admin Page:** `/src/app/admin/jobs/page.tsx`
- **Workers:** `/workers/src/queues.ts`

---

## 7. API MONITORING ❌ MISSING

### Current State
- Basic error handling in all route handlers
- No middleware for request/response logging
- No performance timing
- No rate limit metrics
- No endpoint usage tracking

### What's Missing
- ❌ Request duration tracking
- ❌ Status code distribution
- ❌ Endpoint popularity metrics
- ❌ Rate limit violations alerting
- ❌ Slow endpoint detection
- ❌ API error rate trending

---

## Summary of Gaps

| Category | Status | Priority | Effort |
|----------|--------|----------|--------|
| Vercel Analytics (basic) | ✅ | - | - |
| Custom event tracking | ❌ | HIGH | Medium |
| Error tracking/Sentry | ❌ | CRITICAL | High |
| Error alerting | ❌ | CRITICAL | High |
| DB performance monitoring | ❌ | CRITICAL | High |
| System monitoring dashboard | ❌ | HIGH | High |
| API performance tracking | ❌ | HIGH | Medium |
| Queue health monitoring | ⚠️ | MEDIUM | Medium |
| Business metrics tracking | ✅ | - | - |
| Uptime monitoring | ❌ | CRITICAL | Medium |

---

## Recommended Implementation Order

### Phase 1: CRITICAL (Week 1-2)
1. **Implement Sentry** for error tracking and alerting
   - Capture all exceptions with stack traces
   - Set up error notifications (Slack/email)
   - Configure release tracking

2. **Add API monitoring** middleware
   - Request/response logging
   - Performance timing
   - Status code tracking

3. **Implement uptime checks**
   - Health check endpoint `/api/health`
   - External uptime monitoring (Uptime Robot)

### Phase 2: HIGH (Week 2-3)
4. **Create system monitoring dashboard**
   - API uptime trends
   - Error rate graph
   - Response time distribution
   - Database health status
   - Queue metrics

5. **Add database monitoring**
   - Slow query logging
   - Connection pool metrics
   - Query execution plans

6. **Enhance custom event tracking**
   - Signup/onboarding events
   - Campaign events
   - Payment events

### Phase 3: MEDIUM (Week 3-4)
7. **Improve queue monitoring**
   - Real-time queue depth in admin dashboard
   - Job failure alerts
   - Processing time metrics

8. **Set up alerts and thresholds**
   - Error rate thresholds
   - Response time SLAs
   - Database size warnings
   - Queue stuck job detection

---

## Recommended Tools Stack

### Error Tracking
- **Sentry** (recommended) — Best React/Node integration
- Alternative: DataDog (more comprehensive but expensive)

### APM & Performance
- **Vercel Analytics** (already have basic)
- Add: Custom metrics collection
- Optional: Axiom.co for log aggregation

### Uptime Monitoring
- **Uptime Robot** (free tier available)
- **StatusPage.io** (if you need public status page)

### Database
- **Supabase Dashboard** (already have)
- Add: pg_stat_statements for slow query tracking

### Infrastructure
- **Vercel Dashboard** (deployment monitoring)
- **Redis monitoring** via Upstash (if using managed Redis)

---

## Files to Create/Modify

### New Files Needed
1. `/src/lib/sentry.ts` — Sentry configuration
2. `/src/lib/monitoring.ts` — Custom monitoring helpers
3. `/src/middleware/logging.ts` — Request/response logging
4. `/src/app/api/health/route.ts` — Health check endpoint
5. `/src/components/monitoring/SystemMetrics.tsx` — Monitoring dashboard
6. `/src/services/monitoring.service.ts` — Metrics collection

### Files to Update
1. `/src/app/layout.tsx` — Add Sentry initialization
2. `/src/middleware.ts` — Add performance tracking
3. `/src/app/api/[...].ts` — All route files for error tracking
4. `next.config.ts` — Add monitoring configurations
5. `package.json` — Add monitoring dependencies

---

## Key Metrics to Track

### Business Metrics (Already Tracked)
- Daily active users
- New signups
- Customer lifetime value
- Retention rate
- Message delivery rate
- Revenue

### System Metrics (Missing)
- API response time (p50, p95, p99)
- Error rate (5xx errors)
- API uptime (availability %)
- Database connection pool usage
- Worker queue depth
- Job success rate
- Job processing time

### Custom Events (Missing)
- User signup completed
- Campaign created
- Campaign sent
- Message sent
- Connector synced
- Payment processed
- Integration connected

---

## Implementation Notes

1. **Don't break existing functionality** — All monitoring should be additive
2. **Use environment flags** — Allow disabling monitoring in dev/test
3. **Implement graceful degradation** — If monitoring service is down, app continues
4. **Sample data in production** — Don't capture every event (use sampling)
5. **Set up alerting early** — Monitoring is useless without notifications
6. **Document thresholds** — Define what "normal" looks like for each metric

---

## Related Configuration Files
- `.env.example` — No monitoring env vars defined yet
- `package.json` — No Sentry/DataDog dependencies
- `next.config.ts` — No monitoring config
- `tsconfig.json` — No monitoring type definitions

