# Monitoring & Analytics Setup Guide

This guide explains how to set up and use the monitoring infrastructure for Retoquei.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install @sentry/nextjs
```

### 2. Configure Sentry

#### Get a Sentry DSN

1. Go to [sentry.io](https://sentry.io)
2. Create a free account
3. Create a new project for "Next.js"
4. Copy your DSN (looks like: `https://xxx@yyy.ingest.sentry.io/123`)

#### Set Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/123
NEXT_PUBLIC_APP_VERSION=0.1.0
ENABLE_MONITORING=true
```

### 3. Initialize Monitoring in Your App

In `src/app/layout.tsx`, add at the top of the file:

```typescript
import { initializeSentry } from '@/lib/monitoring'

// Initialize Sentry on app startup
if (typeof window === 'undefined') {
  initializeSentry()
}
```

### 4. Test Health Check

The health check endpoint is available at:

```
GET /api/health
```

Returns:

```json
{
  "status": "healthy",
  "timestamp": "2026-04-02T10:30:00Z",
  "version": "0.1.0",
  "uptime": 123.45,
  "responseTime": 5,
  "checks": {
    "database": true,
    "api": true
  }
}
```

### 5. Monitor in Sentry Dashboard

Visit your Sentry project dashboard to see:
- Error reports with stack traces
- Performance metrics
- Release tracking
- Custom breadcrumbs

---

## Features

### Error Tracking

All uncaught errors are automatically sent to Sentry. To manually capture errors:

```typescript
import { captureException, captureMessage } from '@/lib/monitoring'

try {
  // Your code here
} catch (error) {
  captureException(error, {
    userId: 'user123',
    tenantId: 'tenant456',
    endpoint: '/api/campaigns/send',
  })
}
```

### Performance Monitoring

Track operation timing:

```typescript
import { timeAsync, recordMetric } from '@/lib/monitoring'

// Async operation
const result = await timeAsync(
  'custom_operation',
  async () => {
    return await expensiveOperation()
  },
  { endpoint: '/api/custom' }
)

// Manual recording
recordMetric({
  name: 'database_query',
  duration: 245,
  endpoint: '/api/dashboard',
  status: 'success',
})
```

### Custom Events

Track business events for analytics:

```typescript
import { CampaignEvent, MessageEvent, PaymentEvent } from '@/services/events.service'

// Campaign creation
CampaignEvent.created(
  userId,
  tenantId,
  campaignId,
  'New Customers Segment',
  { templateId: 'template123' }
)

// Message sent
MessageEvent.sent(tenantId, messageId, 'whatsapp', {
  recipientCount: 150,
})

// Payment completed
PaymentEvent.completed(
  userId,
  tenantId,
  'Growth Plan',
  29900,
  'pi_1234567890'
)
```

### User Context

Set user context for better error tracking:

```typescript
import { setUserContext, clearUserContext } from '@/lib/monitoring'

// On login
setUserContext(userId, userEmail, {
  tenantId: tenant123,
  plan: 'growth',
})

// On logout
clearUserContext()
```

---

## Integration Points

### API Routes

Wrap API route handlers with monitoring:

```typescript
import { withMonitoring } from '@/lib/api-middleware'

async function handler(req: NextRequest) {
  // Your handler code
}

export const POST = withMonitoring(handler, {
  endpoint: '/api/campaigns/create',
})
```

### Services

Use timeAsync for service calls:

```typescript
import { timeAsync } from '@/lib/monitoring'

export async function syncConnector(tenantId: string) {
  return await timeAsync(
    'connector_sync',
    async () => {
      // Sync logic
    },
    { endpoint: 'connector-sync', tenantId }
  )
}
```

### Queue Jobs

Track job processing:

```typescript
import { recordQueueJob } from '@/lib/monitoring'

processor.on('completed', (job) => {
  recordQueueJob({
    queueName: 'campaign-schedule',
    jobId: job.id,
    status: 'completed',
    duration: job.processedOn - job.timestamp,
  })
})

processor.on('failed', (job, err) => {
  recordQueueJob({
    queueName: 'campaign-schedule',
    jobId: job.id,
    status: 'failed',
    error: err.message,
  })
})
```

### Database Queries

Record slow queries:

```typescript
import { recordDatabaseQuery } from '@/lib/monitoring'

const start = performance.now()
const result = await prisma.customer.findMany(...)
const duration = performance.now() - start

recordDatabaseQuery({
  query: 'SELECT * FROM customers WHERE tenantId = ?',
  duration,
  status: 'success',
})
```

---

## Monitoring Dashboard Recommendations

### Set Up Uptime Monitoring

1. **Uptime Robot** (free)
   - Go to [uptimerobot.com](https://uptimerobot.com)
   - Add monitor for: `https://your-app.com/api/health`
   - Check interval: 5 minutes
   - Get alerts if down > 5 minutes

2. **StatusPage** (optional)
   - Create a public status page
   - Integrate with Uptime Robot
   - Show system status to customers

### Configure Sentry Alerts

In Sentry dashboard:

1. **Error Alert Rule**
   - Event frequency > 10 in 5 minutes → Slack notification
   - Status code >= 500 → Slack notification

2. **Performance Alert**
   - Response time p95 > 2000ms → Slack notification
   - Database query > 1000ms → Slack notification

### Key Metrics to Monitor

**Business Metrics:**
- Signups per day
- Campaign send success rate
- Message delivery rate
- Payment success rate

**System Metrics:**
- API response time (p50, p95, p99)
- Error rate (5xx errors)
- Database query time
- Queue job failure rate
- Worker uptime

---

## Event Tracking Implementation Checklist

Track these events in your application:

### Authentication
- [ ] User signup completed
- [ ] User login
- [ ] User logout
- [ ] Password reset

### Onboarding
- [ ] Onboarding started
- [ ] Onboarding completed
- [ ] First connector connected

### Data Sync
- [ ] Connector sync started
- [ ] Connector sync completed
- [ ] Sync failed

### Campaigns
- [ ] Campaign created
- [ ] Campaign scheduled
- [ ] Campaign sent
- [ ] Campaign cancelled

### Messages
- [ ] Message sent
- [ ] Message delivered
- [ ] Message read
- [ ] Message failed

### Billing
- [ ] Payment initiated
- [ ] Payment completed
- [ ] Payment failed
- [ ] Subscription changed

### Team
- [ ] Team member invited
- [ ] Team member removed

---

## Debugging Monitoring

### Local Development

Monitoring is disabled in development by default. To enable:

```env
NEXT_PUBLIC_SENTRY_DSN=your-test-dsn
NODE_ENV=development
```

Check logs in your terminal for monitoring activity.

### Production Debugging

To debug production issues:

1. Check Sentry dashboard for errors
2. Look for error context: userId, tenantId, endpoint
3. Review breadcrumbs leading up to error
4. Check performance metrics for slow operations

### Common Issues

**Events not showing in Sentry:**
- Check `NEXT_PUBLIC_SENTRY_DSN` is set correctly
- Verify `ENABLE_MONITORING=true`
- Check browser console for errors
- Ensure Sentry DSN is accessible from client

**Missing API metrics:**
- Confirm endpoints are wrapped with `withMonitoring`
- Check response times in Sentry transactions
- Verify database connection is healthy

**Health check failing:**
- Ensure database is accessible: `prisma db push`
- Check database connection string in `.env.local`
- Verify Supabase is up and running

---

## Advanced Configuration

### Custom Sentry Configuration

Edit `src/lib/monitoring.ts`:

```typescript
Sentry.init({
  // Increase trace sample rate in production
  tracesSampleRate: 0.5,  // 50% instead of 10%

  // Add custom integrations
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Set release version
  release: process.env.NEXT_PUBLIC_APP_VERSION,
})
```

### Custom Metrics

Create custom metrics for business logic:

```typescript
import { recordMetric } from '@/lib/monitoring'

// Custom business metric
recordMetric({
  name: 'customer_ltv_calculated',
  duration: calculationTime,
  value: ltv,
  unit: 'currency',
  endpoint: '/api/dashboard',
})
```

### Offline Fallback

Monitoring is designed to fail gracefully:

```typescript
import { captureException } from '@/lib/monitoring'

// If Sentry is down, this still works
captureException(err, {
  userId: '123',
})

// App continues normally - monitoring is optional
```

---

## Migrating to Production

### Before Going Live

1. [ ] Create Sentry account and project
2. [ ] Add `NEXT_PUBLIC_SENTRY_DSN` to production env vars
3. [ ] Set `NEXT_PUBLIC_APP_VERSION` to current version
4. [ ] Enable Uptime Robot monitoring
5. [ ] Configure Sentry alert rules
6. [ ] Test health check endpoint
7. [ ] Verify events are being tracked

### Ongoing Maintenance

- Review Sentry dashboard weekly for errors
- Check Uptime Robot status page
- Monitor slow queries and fix as needed
- Review custom events for actionable insights
- Update thresholds based on actual performance

---

## Cost Considerations

### Sentry Pricing
- Free tier: 5k errors/month (sufficient for MVP)
- Pro: $29/month per 50k errors
- Scale as needed

### Infrastructure
- Health check endpoint: ~1 request/5 minutes = ~9k/month (negligible)
- Uptime Robot: Free for up to 50 monitors
- No additional costs for metrics collection

---

## Support

For issues with monitoring setup:

1. Check Sentry documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/
2. Review `/src/lib/monitoring.ts` for available functions
3. Check console logs for initialization errors
4. Verify environment variables are set correctly

---

## Next Steps

1. **Immediate:** Install Sentry and set DSN
2. **Week 1:** Implement event tracking for key user actions
3. **Week 2:** Set up uptime monitoring and Sentry alerts
4. **Week 3:** Create monitoring dashboard showing key metrics
5. **Ongoing:** Review metrics weekly and optimize based on findings

