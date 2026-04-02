# Monitoring Implementation Recommendations

## Priority 1: Critical (This Week)

### 1.1 Install and Configure Sentry
**Why:** Without error tracking, production issues go undetected
**Effort:** 30 minutes
**Impact:** CRITICAL

```bash
npm install @sentry/nextjs
```

Setup:
1. Create free Sentry account
2. Get DSN from Sentry dashboard
3. Add to `.env.local`: `NEXT_PUBLIC_SENTRY_DSN=https://...`
4. Initialize in `src/app/layout.tsx`

### 1.2 Add Health Check Endpoint
**Status:** ✅ Already created at `/src/app/api/health/route.ts`
**Next:** Set up monitoring for this endpoint

Add to `.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
ENABLE_MONITORING=true
```

### 1.3 Set Up Uptime Monitoring
**Why:** Detect outages immediately
**Effort:** 15 minutes
**Impact:** HIGH

1. Sign up at https://uptimerobot.com (free)
2. Add monitor for `https://your-app.com/api/health`
3. Set check interval to 5 minutes
4. Configure Slack/email alerts

---

## Priority 2: High (Next Week)

### 2.1 Add Event Tracking to Key Flows
**Why:** Understand user behavior and find bottlenecks
**Effort:** 2-3 hours
**Impact:** HIGH

Start with these critical flows:

**Signup/Authentication:**
```typescript
// In auth routes
import { SignupEvent } from '@/services/events.service'

SignupEvent.track(userId, {
  tenantId: newTenant.id,
  signupSource: 'landing',
})
```

**Campaign Sending:**
```typescript
// In /src/app/api/campaigns/[id]/send/route.ts
import { CampaignEvent, MessageEvent } from '@/services/events.service'

CampaignEvent.sent(tenantId, campaignId, recipientCount)
MessageEvent.sent(tenantId, messageId, 'whatsapp')
```

**Payments:**
```typescript
// In billing routes
import { PaymentEvent } from '@/services/events.service'

PaymentEvent.completed(userId, tenantId, planName, amount, paymentId)
```

### 2.2 Create Monitoring Dashboard
**Why:** Visualize system health at a glance
**Effort:** 4-6 hours
**Impact:** HIGH

Create `/src/app/(app)/monitoring/page.tsx` with:
- API uptime graph
- Error rate trending
- Response time percentiles (p50, p95, p99)
- Database health status
- Queue metrics (depth, failure rate)
- Message delivery rates

Use existing chart components:
- `CustomerEvolutionChart` → for trends
- `KPICard` → for metrics
- Add `AreaChart`, `LineChart` from recharts

### 2.3 Configure Sentry Alert Rules
**Why:** Get notified of problems immediately
**Effort:** 30 minutes
**Impact:** HIGH

In Sentry dashboard, create alerts for:
- Error frequency > 10/5min → Slack
- Status code >= 500 → Slack
- Response time p95 > 2000ms → Slack
- New issue detected → Slack

---

## Priority 3: Medium (Later)

### 3.1 Database Query Monitoring
**Why:** Identify slow queries causing performance issues
**Effort:** 2 hours
**Impact:** MEDIUM

Add to `src/lib/prisma.ts`:
```typescript
import { recordDatabaseQuery } from '@/lib/monitoring'

// Add middleware to track queries
const originalExecute = prisma.$executeRaw
prisma.$executeRaw = function(...args) {
  const start = performance.now()
  return originalExecute.call(this, ...args).then(result => {
    const duration = performance.now() - start
    recordDatabaseQuery({
      query: String(args[0]).substring(0, 200),
      duration,
      status: 'success',
    })
    return result
  })
}
```

### 3.2 API Request Logging Middleware
**Why:** Track all API calls for debugging
**Effort:** 3 hours
**Impact:** MEDIUM

Add logging middleware to all routes:
```typescript
// In each api route
import { withMonitoring } from '@/lib/api-middleware'

export const POST = withMonitoring(handler, {
  endpoint: '/api/campaigns/create',
})
```

### 3.3 Queue Job Monitoring
**Why:** Detect stuck jobs and failures
**Effort:** 2 hours
**Impact:** MEDIUM

Update worker processors to record metrics:
```typescript
// In worker processor
import { recordQueueJob } from '@/lib/monitoring'

processor.on('completed', (job) => {
  recordQueueJob({
    queueName: 'message-send',
    jobId: job.id,
    status: 'completed',
    duration: job.finishedOn - job.timestamp,
  })
})
```

---

## Priority 4: Nice to Have

### 4.1 Third-Party API Monitoring
**Why:** Detect issues with WhatsApp, Stripe, Supabase
**Effort:** 4 hours

Monitor:
- WhatsApp API latency
- Stripe webhook delivery
- Supabase connection health
- Rate limit usage

### 4.2 Custom Dashboards
**Why:** Better insights into business metrics
**Effort:** 6-8 hours

Create:
- Customer acquisition trend
- Revenue forecast
- Campaign performance comparison
- Segment health scores

### 4.3 Automated Alerts
**Why:** Proactive issue detection
**Effort:** 8 hours

Implement:
- Anomaly detection for metrics
- Threshold-based alerts
- Performance degradation warnings
- Resource usage alerts

---

## Implementation Checklist

### Week 1
- [ ] Install Sentry package
- [ ] Get Sentry DSN and configure
- [ ] Test health check endpoint
- [ ] Set up Uptime Robot
- [ ] Configure Sentry Slack integration

### Week 2
- [ ] Add event tracking to auth flows
- [ ] Add event tracking to campaign sending
- [ ] Add event tracking to payment flows
- [ ] Test events appear in Sentry
- [ ] Set up alert rules in Sentry

### Week 3
- [ ] Create monitoring dashboard
- [ ] Add API metrics to dashboard
- [ ] Add database health status
- [ ] Add queue metrics
- [ ] Test dashboard displays real data

### Week 4
- [ ] Add database query monitoring
- [ ] Add API request logging
- [ ] Add queue job monitoring
- [ ] Review dashboard with team
- [ ] Document for team

---

## Files Already Created

✅ `/src/lib/monitoring.ts` — Core monitoring utilities
✅ `/src/lib/api-middleware.ts` — API request monitoring
✅ `/src/app/api/health/route.ts` — Health check endpoint
✅ `/src/services/events.service.ts` — Event tracking service
✅ `MONITORING_STATUS.md` — Status and analysis
✅ `MONITORING_SETUP.md` — Setup guide
✅ `RECOMMENDATIONS.md` — This file

## Files to Create

- [ ] `/src/app/(app)/monitoring/page.tsx` — Monitoring dashboard
- [ ] `/src/components/monitoring/SystemMetrics.tsx` — Metrics components
- [ ] `/src/services/dashboard-monitoring.service.ts` — Data aggregation

## Files to Update

- [ ] `src/app/layout.tsx` — Initialize Sentry
- [ ] `src/app/api/auth/callback/route.ts` — Track signups
- [ ] `src/app/api/campaigns/[id]/send/route.ts` — Track campaign sends
- [ ] `src/app/api/billing/checkout/route.ts` — Track payments
- [ ] All API routes — Wrap with monitoring middleware
- [ ] `package.json` — Add @sentry/nextjs dependency

---

## Estimated Costs

| Service | Free Tier | Starter | Notes |
|---------|-----------|---------|-------|
| Sentry | 5k errors/mo | $29/mo | Most useful for MVP |
| Uptime Robot | 50 monitors | $99/mo | Use free tier |
| StatusPage | - | $29/mo | Optional, for public status |
| **Total** | **$0** | **$58+** | Scale with growth |

---

## Success Metrics

After implementing monitoring, you should be able to:

- ✅ Know when the app goes down (within 5 minutes)
- ✅ See all errors with stack traces in Sentry
- ✅ Identify slow API endpoints
- ✅ Track user conversion funnel (signup → payment)
- ✅ Get alerts for critical issues
- ✅ See message delivery rates
- ✅ Monitor campaign success
- ✅ Detect database performance issues

---

## Questions?

Refer to:
1. `MONITORING_STATUS.md` — Current state and gaps
2. `MONITORING_SETUP.md` — Setup instructions
3. Sentry docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
4. Vercel docs: https://vercel.com/docs/analytics

