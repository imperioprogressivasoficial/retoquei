# Monitoring Implementation Examples

This document shows practical examples of how to integrate monitoring into existing code.

---

## Example 1: Auth Signup Event Tracking

**File:** `src/app/api/auth/callback/route.ts`

### Current Code
```typescript
export async function GET(request: NextRequest) {
  // ... auth logic ...
  const newUser = await prisma.user.create({ ... })
  const newTenant = await prisma.tenant.create({ ... })
}
```

### Updated with Monitoring
```typescript
import { SignupEvent } from '@/services/events.service'
import { setUserContext } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  // ... auth logic ...

  const newUser = await prisma.user.create({ ... })
  const newTenant = await prisma.tenant.create({ ... })

  // Track signup event
  SignupEvent.track(newUser.id, {
    tenantId: newTenant.id,
    email: newUser.email,
    signupSource: 'landing',
  })

  // Set user context for error tracking
  setUserContext(newUser.id, newUser.email, {
    tenantId: newTenant.id,
  })

  return NextResponse.redirect(...)
}
```

---

## Example 2: Campaign Send Event Tracking

**File:** `src/app/api/campaigns/[id]/send/route.ts`

### Current Code
```typescript
export async function POST(req: NextRequest) {
  const campaign = await prisma.campaign.findUnique(...)
  const messages = await createMessagesForCampaign(campaign)

  for (const message of messages) {
    await messageSendQueue.add(...)
  }

  return NextResponse.json({ success: true })
}
```

### Updated with Monitoring
```typescript
import { CampaignEvent, MessageEvent } from '@/services/events.service'
import { timeAsync } from '@/lib/monitoring'
import { setTenantContext } from '@/lib/monitoring'

export async function POST(req: NextRequest) {
  const campaign = await prisma.campaign.findUnique(...)

  // Set tenant context for all subsequent errors
  setTenantContext(campaign.tenantId)

  // Track campaign send with timing
  const messages = await timeAsync(
    'campaign.send',
    async () => {
      return await createMessagesForCampaign(campaign)
    },
    { tenantId: campaign.tenantId }
  )

  // Queue messages
  for (const message of messages) {
    await messageSendQueue.add('send', { messageId: message.id })
  }

  // Track campaign sent event
  CampaignEvent.sent(
    campaign.tenantId,
    campaign.id,
    messages.length,
    {
      segmentId: campaign.segmentId,
      templateId: campaign.templateId,
    }
  )

  // Track individual message send events
  messages.forEach(msg => {
    MessageEvent.sent(campaign.tenantId, msg.id, 'whatsapp')
  })

  return NextResponse.json({
    success: true,
    messageCount: messages.length
  })
}
```

---

## Example 3: Payment Event Tracking

**File:** `src/app/api/billing/checkout/route.ts`

### Current Code
```typescript
export async function POST(req: NextRequest) {
  const session = await createCheckoutSession(tenantId, priceId)
  return NextResponse.json({ url: session.url })
}
```

### Updated with Monitoring
```typescript
import { PaymentEvent } from '@/services/events.service'
import { captureException } from '@/lib/monitoring'

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    const tenantId = await getTenantId(user.id)
    const { priceId } = await req.json()

    // Track payment initiation
    PaymentEvent.initiated(user.id, tenantId, planNameForPrice(priceId), priceForId(priceId))

    const session = await createCheckoutSession(tenantId, priceId)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    captureException(err, {
      userId: user?.id,
      tenantId,
      endpoint: '/api/billing/checkout',
      step: 'payment_initiation',
    })

    throw err
  }
}
```

---

## Example 4: Stripe Webhook Payment Success

**File:** `src/app/api/webhooks/stripe/route.ts`

### With Monitoring
```typescript
import { PaymentEvent } from '@/services/events.service'
import { recordMetric, captureMessage } from '@/lib/monitoring'

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  const tenantId = session.metadata?.tenantId
  const userId = session.metadata?.userId

  try {
    // Record payment completed event
    PaymentEvent.completed(
      userId,
      tenantId,
      session.metadata?.planName,
      Math.round(session.amount_total || 0) / 100,
      session.payment_intent as string
    )

    // Record metrics
    recordMetric({
      name: 'payment.successful',
      value: Math.round(session.amount_total || 0) / 100,
      unit: 'currency',
    })

    // Update subscription in DB
    await updateTenantSubscription(tenantId, session.metadata?.planId)

    // Success message
    captureMessage(
      `Payment successful for ${tenantId}`,
      'info',
      {
        amount: session.amount_total,
        planId: session.metadata?.planId,
      }
    )
  } catch (error) {
    // Track payment failure
    PaymentEvent.failed(
      userId,
      tenantId,
      session.metadata?.planName,
      error instanceof Error ? error.message : 'Unknown error'
    )

    throw error
  }
}
```

---

## Example 5: API Route with Monitoring Wrapper

**File:** Any API route handler

### Before
```typescript
async function handler(req: NextRequest) {
  const user = await getUser()
  const data = await processRequest(req)
  return NextResponse.json(data)
}

export const POST = handler
```

### After
```typescript
import { withMonitoring } from '@/lib/api-middleware'

async function handler(req: NextRequest) {
  const user = await getUser()
  const data = await processRequest(req)
  return NextResponse.json(data)
}

export const POST = withMonitoring(handler, {
  endpoint: '/api/campaigns/create',
})
```

---

## Example 6: Database Query Monitoring

**File:** Any service file

### Before
```typescript
export async function getCustomerMetrics(customerId: string) {
  const metrics = await prisma.customerMetrics.findUnique({
    where: { customerId }
  })
  return metrics
}
```

### After
```typescript
import { recordDatabaseQuery } from '@/lib/monitoring'

export async function getCustomerMetrics(customerId: string) {
  const start = performance.now()

  try {
    const metrics = await prisma.customerMetrics.findUnique({
      where: { customerId }
    })

    const duration = performance.now() - start
    recordDatabaseQuery({
      query: 'SELECT * FROM customer_metrics WHERE customerId = ?',
      duration,
      status: 'success',
    })

    return metrics
  } catch (error) {
    const duration = performance.now() - start
    recordDatabaseQuery({
      query: 'SELECT * FROM customer_metrics WHERE customerId = ?',
      duration,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}
```

---

## Example 7: Job Queue Monitoring

**File:** Worker queue processor

### Before
```typescript
export async function setupMessageSendProcessor() {
  return messageProcessor.process(async (job) => {
    const message = await getMessage(job.data.messageId)
    await sendViaWhatsApp(message)
  })
}
```

### After
```typescript
import { recordQueueJob } from '@/lib/monitoring'
import { MessageEvent } from '@/services/events.service'

export async function setupMessageSendProcessor() {
  messageProcessor.on('completed', (job) => {
    const duration = job.finishedOn - job.timestamp

    recordQueueJob({
      queueName: 'message-send',
      jobId: job.id,
      status: 'completed',
      duration,
    })

    // Track message sent event
    if (job.data.messageId) {
      MessageEvent.sent(job.data.tenantId, job.data.messageId, 'whatsapp')
    }
  })

  messageProcessor.on('failed', (job, error) => {
    recordQueueJob({
      queueName: 'message-send',
      jobId: job.id,
      status: 'failed',
      error: error.message,
    })

    // Track message failure
    if (job.data.messageId) {
      MessageEvent.failed(
        job.data.tenantId,
        job.data.messageId,
        error.message
      )
    }
  })

  return messageProcessor.process(async (job) => {
    const message = await getMessage(job.data.messageId)
    await sendViaWhatsApp(message)
  })
}
```

---

## Example 8: Connector Sync Monitoring

**File:** Connector sync service

### Before
```typescript
export async function syncConnector(tenantId: string, connectorId: string) {
  const connector = await getConnector(connectorId)
  const data = await connector.sync()

  await importCustomersAndAppointments(tenantId, data)

  return { success: true }
}
```

### After
```typescript
import { ConnectorEvent } from '@/services/events.service'
import { timeAsync, recordMetric } from '@/lib/monitoring'

export async function syncConnector(tenantId: string, connectorId: string, syncType: 'full' | 'incremental' = 'incremental') {
  // Track sync start
  ConnectorEvent.syncStarted(tenantId, connectorId, syncType)

  const result = await timeAsync(
    'connector.sync',
    async () => {
      const connector = await getConnector(connectorId)

      try {
        const data = await connector.sync()

        // Import with timing
        const importStart = performance.now()
        const { customersImported, appointmentsImported } =
          await importCustomersAndAppointments(tenantId, data)
        const importDuration = performance.now() - importStart

        recordMetric({
          name: 'connector.import',
          duration: importDuration,
          value: customersImported + appointmentsImported,
        })

        // Track success
        ConnectorEvent.syncCompleted(
          tenantId,
          connectorId,
          customersImported,
          appointmentsImported,
          {
            syncType,
            duration: performance.now() - importStart,
          }
        )

        return {
          success: true,
          customersImported,
          appointmentsImported
        }
      } catch (error) {
        // Track failure
        ConnectorEvent.syncFailed(
          tenantId,
          connectorId,
          error instanceof Error ? error.message : 'Unknown error',
          { syncType }
        )

        throw error
      }
    },
    { tenantId, connectorId }
  )

  return result
}
```

---

## Example 9: Error Handling with Context

**File:** Any service or route

### Before
```typescript
export async function createCampaign(data) {
  try {
    const campaign = await prisma.campaign.create({ data })
    return campaign
  } catch (error) {
    console.error('Campaign creation failed:', error)
    throw new Error('Failed to create campaign')
  }
}
```

### After
```typescript
import { captureException, setTenantContext } from '@/lib/monitoring'
import { CampaignEvent } from '@/services/events.service'

export async function createCampaign(userId: string, tenantId: string, data) {
  setTenantContext(tenantId)

  try {
    const campaign = await prisma.campaign.create({ data })

    // Track event
    CampaignEvent.created(
      userId,
      tenantId,
      campaign.id,
      data.segmentName
    )

    return campaign
  } catch (error) {
    // Capture with full context
    captureException(error, {
      userId,
      tenantId,
      endpoint: 'createCampaign',
      data: {
        segmentId: data.segmentId,
        templateId: data.templateId,
      },
    })

    // Re-throw or return error
    throw error
  }
}
```

---

## Example 10: Health Check Integration

**File:** Monitoring dashboard component

### React Component
```typescript
import { useEffect, useState } from 'react'

export function HealthStatus() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setHealth)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className={`p-4 rounded ${health.status === 'healthy' ? 'bg-green-900' : 'bg-red-900'}`}>
      <h3>System Status: {health.status}</h3>
      <p>API: {health.checks.api ? '✅' : '❌'}</p>
      <p>Database: {health.checks.database ? '✅' : '❌'}</p>
      <p>Response Time: {health.responseTime}ms</p>
      <p>Last Updated: {new Date(health.timestamp).toLocaleTimeString()}</p>
    </div>
  )
}
```

---

## Quick Integration Checklist

When adding monitoring to a file:

- [ ] Import necessary functions from `/src/lib/monitoring`
- [ ] Import event classes from `/src/services/events.service`
- [ ] Set user/tenant context at entry point
- [ ] Wrap async operations with `timeAsync`
- [ ] Track business events at key points
- [ ] Capture exceptions with context
- [ ] Record metrics for important values
- [ ] Test that events appear in Sentry
- [ ] Verify timing metrics make sense

---

## Testing Monitoring

### Test Error Capture
```typescript
// In a test route or script
import { captureException } from '@/lib/monitoring'

throw new Error('Test error for monitoring')
// Should appear in Sentry within seconds
```

### Test Event Tracking
```typescript
// In a test route
import { CampaignEvent } from '@/services/events.service'

CampaignEvent.created('user123', 'tenant456', 'campaign789', 'Test Segment')
// Should appear in Sentry breadcrumbs
```

### Test Health Check
```bash
curl https://your-app.com/api/health
# Should return:
# {
#   "status": "healthy",
#   "checks": { "database": true, "api": true },
#   ...
# }
```

