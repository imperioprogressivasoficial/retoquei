# Message Tracking & Analytics System

## Overview

This document describes the complete message tracking and analytics implementation for the Retoquei platform. The system tracks WhatsApp messages from creation through delivery, reads, and responses.

## Architecture

### Data Models

#### OutboundMessage
```
- id: unique message identifier
- tenantId: workspace/tenant
- customerId: recipient customer
- templateId: message template used
- campaignId: campaign correlation
- flowId: automation flow correlation
- channel: WHATSAPP | SMS | EMAIL
- toNumber: E.164 formatted phone number
- bodyRendered: final message text with variables rendered
- status: PENDING | QUEUED | SENT | DELIVERED | READ | FAILED | OPTED_OUT
- providerMessageId: WhatsApp/provider message ID
- scheduledAt: when message should be sent
- sentAt: actual send time
- deliveredAt: delivery confirmation time
- readAt: read receipt time
- error: error message if failed
- retryCount: number of retry attempts
- createdAt: record creation time
- updatedAt: record update time
```

#### MessageEvent
Tracks every status change and event:
```
- id: unique event identifier
- messageId: reference to OutboundMessage
- eventType: sent | delivered | read | failed | click | bounce
- payload: event details from provider
- createdAt: event timestamp
```

#### InboundMessage
Tracks customer responses:
```
- id: unique message identifier
- tenantId: workspace
- fromNumber: customer phone number
- customerId: linked customer
- body: message text
- channel: WHATSAPP
- providerId: provider message ID
- receivedAt: reception time
```

### Status Lifecycle

```
PENDING → QUEUED → SENT → DELIVERED → READ
                ↓
              FAILED
              ↓
            RETRIED (up to 3 times)
                ↓
            FAILED (final)
              ↓
           OPTED_OUT (if customer opt-out)
```

### Message Sending Flow

1. **Message Creation** (`POST /api/outbound-messages`)
   - Validate customer opt-in status
   - Check quiet hours (22:00-08:00 Brazil time)
   - Set initial status to PENDING or QUEUED
   - Queue for background processing

2. **Background Processing** (BullMQ Worker)
   - Load message from database
   - Interpolate variables (customer_name, salon_name, etc.)
   - Validate opt-in status again
   - Send via WhatsApp Cloud API or Evolution API
   - Update status to SENT
   - Create MessageEvent record

3. **Webhook Processing** (WhatsApp Webhooks)
   - Receive delivery status updates from WhatsApp
   - Update message status (DELIVERED, READ, FAILED)
   - Create MessageEvent records for tracking
   - Process inbound customer responses

## Endpoints

### Message Management

#### Create/Send Message
```
POST /api/outbound-messages

Request:
{
  "customerId": "customer_id",
  "templateId": "template_id",
  "campaignId": "campaign_id",
  "toNumber": "5511999999999",
  "bodyRendered": "Hello {{first_name}}, your appointment...",
  "channel": "WHATSAPP",
  "scheduledAt": "2026-04-02T10:00:00Z"
}

Response:
{
  "message": { ...OutboundMessage },
  "ok": true
}
```

#### List Messages
```
GET /api/outbound-messages?campaignId=X&status=SENT&skip=0&take=20

Query Parameters:
- campaignId: filter by campaign
- customerId: filter by customer
- status: filter by status (PENDING, QUEUED, SENT, DELIVERED, READ, FAILED, OPTED_OUT)
- channel: filter by channel
- startDate: filter by creation date (ISO 8601)
- endDate: filter by creation date (ISO 8601)
- skip: pagination offset (default: 0)
- take: page size (default: 20, max: 100)

Response:
{
  "messages": [ ...OutboundMessage[] ],
  "pagination": {
    "skip": 0,
    "take": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Get Message Details
```
GET /api/outbound-messages/[id]

Response:
{
  "message": {
    ...OutboundMessage,
    "events": [ ...MessageEvent[] ],
    "customer": { id, fullName, phoneE164, email, whatsappOptIn },
    "template": { id, name, body },
    "campaign": { id, name, status }
  }
}
```

### Message Tracking

#### Get Message Tracking Status
```
GET /api/messages/tracking?messageId=X
or
GET /api/messages/tracking?providerId=wamid.X

Response:
{
  "message": {
    "id": "...",
    "providerId": "...",
    "status": "DELIVERED",
    "channel": "WHATSAPP",
    "to": "5511999999999",
    "body": "Hello Maria, your appointment..."
  },
  "tracking": {
    "status": {
      "current": "DELIVERED",
      "sent": true,
      "delivered": true,
      "read": false,
      "failed": false
    },
    "timestamps": {
      "created": "2026-04-02T09:15:00Z",
      "sent": "2026-04-02T09:15:05Z",
      "delivered": "2026-04-02T09:15:10Z",
      "read": null
    },
    "response": {
      "hasResponse": true,
      "responseCount": 1
    },
    "linkTracking": {
      "hasTrackableLinks": false,
      "clickCount": 0
    }
  },
  "timeline": [
    { "type": "sent", "timestamp": "...", "payload": {} },
    { "type": "delivered", "timestamp": "...", "payload": {} }
  ]
}
```

### Analytics

#### Message Analytics
```
GET /api/analytics/messages

Response:
{
  "period": {
    "start": "2026-04-01T00:00:00Z",
    "end": "2026-04-30T23:59:59Z"
  },
  "allTime": {
    "total": 5000,
    "sent": 4500,
    "delivered": 4200,
    "deliveryRate": 93,
    "read": 2800,
    "readRate": 62,
    "failed": 100,
    "failureRate": 2,
    "queued": 200,
    "pending": 100,
    "optedOut": 100
  },
  "thisMonth": {
    "total": 1200,
    "sent": 1100,
    "delivered": 1050,
    "deliveryRate": 95,
    "read": 650,
    "readRate": 59,
    "failed": 20,
    "failureRate": 2,
    "queued": 50,
    "pending": 30,
    "optedOut": 20
  },
  "byTemplate": [
    {
      "templateId": "...",
      "templateName": "Birthday Reminder",
      "count": 450
    }
  ],
  "byChannel": [
    {
      "channel": "WHATSAPP",
      "count": 1200
    }
  ],
  "byCampaign": [
    {
      "campaignId": "...",
      "campaignName": "April Promotions",
      "status": "COMPLETED",
      "sentCount": 500,
      "deliveredCount": 480,
      "readCount": 300,
      "messageCount": 500
    }
  ]
}
```

#### Campaign Message Analytics
```
GET /api/campaigns/[id]/analytics

Response:
{
  "campaign": {
    "id": "...",
    "name": "April Promotions",
    "status": "COMPLETED",
    "createdAt": "...",
    "startedAt": "...",
    "completedAt": "...",
    "template": { "id": "...", "name": "Promo Message" },
    "segment": { "id": "...", "name": "Active Customers" }
  },
  "messageTracking": {
    "total": 500,
    "sent": 480,
    "delivered": 450,
    "deliveryRate": 94,
    "read": 300,
    "readRate": 62,
    "failed": 20,
    "failureRate": 4,
    "optedOut": 0
  },
  "responseTracking": {
    "responses": 45,
    "responseRate": 10,
    "customersWhoResponded": 45
  },
  "timeline": {
    "createdAt": "...",
    "startedAt": "...",
    "completedAt": "...",
    "duration": 45
  },
  "messages": [ ...limited to 10... ]
}
```

## Webhook Integration

### WhatsApp Cloud API Webhooks

Messages are received at `POST /api/webhooks/whatsapp` with format:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "...",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "phone_number_id": "...",
              "display_phone_number": "..."
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.xxx",
                "timestamp": "1234567890",
                "type": "text",
                "text": { "body": "Customer response" }
              }
            ],
            "statuses": [
              {
                "id": "wamid.xxx",
                "status": "delivered",
                "timestamp": "1234567890",
                "recipient_id": "5511999999999"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

Processing:
1. Webhook is stored in `webhookEvent` table with idempotency key
2. Synchronously processed via `provider.processInboundWebhook()`
3. Asynchronously processed via BullMQ `webhook-process` job
4. Delivery status updates matched to `OutboundMessage` records
5. Inbound messages stored in `InboundMessage` table
6. Events tracked in `MessageEvent` table

## Status Tracking Implementation

### Delivery Status Updates
When WhatsApp sends a status update webhook:

```typescript
// providers/whatsapp-cloud.provider.ts
events.push({
  type: 'delivery_status',
  providerMessageId: status.id,
  status: status.status, // 'sent', 'delivered', 'read', 'failed'
  timestamp: new Date(parseInt(status.timestamp) * 1000),
})
```

### Webhook Processing
```typescript
// workers/processors/webhook-process.processor.ts
if (payload.type === 'delivery_status') {
  // Find message by providerMessageId
  const message = await prisma.outboundMessage.findFirst({
    where: { providerMessageId: payload.providerMessageId }
  })

  // Update status with timestamp
  await prisma.outboundMessage.update({
    where: { id: message.id },
    data: {
      status: statusMap[payload.status],
      deliveredAt: new Date(),
      readAt: new Date()
    }
  })

  // Create event record
  await prisma.messageEvent.create({
    data: {
      messageId: message.id,
      eventType: payload.status,
      payload: payload
    }
  })
}
```

## Read Receipt Handling

When a customer opens a message in WhatsApp, the webhook contains:
```json
{
  "statuses": [{
    "id": "wamid.xxx",
    "status": "read",
    "timestamp": "1234567890"
  }]
}
```

This updates the message status to "READ" and sets `readAt` timestamp.

## Response Tracking

Customer responses are tracked via inbound messages:

1. Customer replies to message
2. WhatsApp sends message webhook with `messages` array
3. System stores in `InboundMessage` table
4. Links to customer if phone matches
5. Response count calculated from `InboundMessage` where `createdAt >= message.sentAt`

## Analytics Calculations

### Delivery Rate
```
deliveryRate = (delivered + read) / sent * 100
```

### Read Rate
```
readRate = read / sent * 100
```

### Response Rate
```
responseRate = inbound_messages_from_customer_after_send / sent * 100
```

### Campaign ROI (Future)
```
roi = (responses * avg_booking_value - campaign_cost) / campaign_cost * 100
```

## Error Handling & Retries

### Retry Logic
- Messages can retry up to 3 times (MAX_RETRIES = 3)
- Retry triggered on:
  - Network errors
  - Provider rate limits
  - Temporary failures
- Final failure after 3 retries sets status to FAILED

### Quiet Hours
- Messages sent during 22:00-08:00 Brazil time are deferred
- Job is retried automatically
- Respects customer sleep time

### Opt-in Validation
- Checked at send time
- If customer has unsubscribed, message marked as OPTED_OUT
- No retry attempted

## Database Indexes

For optimal query performance:

```sql
-- Message queries
CREATE INDEX idx_outbound_messages_tenant_status
  ON outbound_messages(tenant_id, status);

CREATE INDEX idx_outbound_messages_campaign
  ON outbound_messages(campaign_id);

CREATE INDEX idx_outbound_messages_customer
  ON outbound_messages(customer_id);

CREATE INDEX idx_outbound_messages_provider_id
  ON outbound_messages(provider_message_id);

-- Event queries
CREATE INDEX idx_message_events_message
  ON message_events(message_id, event_type);

-- Inbound queries
CREATE INDEX idx_inbound_messages_customer
  ON inbound_messages(customer_id, received_at);
```

## Configuration

### Environment Variables
```
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=xxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxxxx
WHATSAPP_API_VERSION=v19.0
WHATSAPP_MOCK_MODE=false (development only)
```

## Testing

### Test Message Endpoint
```
POST /api/templates/[id]/test

Request:
{
  "phone": "5511999999999"
}

Response:
{
  "ok": true,
  "rendered": "Hello Maria, your appointment...",
  "mode": "mock|meta|evolution",
  "charCount": 150,
  "warnings": []
}
```

Mock mode logs to console instead of sending.

## Troubleshooting

### Messages Stuck in QUEUED
- Check job queue in Redis
- Verify WHATSAPP_ACCESS_TOKEN is correct
- Check webhook verification token

### Delivery Status Not Updating
- Verify webhook is being received (check webhookEvent table)
- Ensure providerMessageId matches
- Check webhook processor job status

### High Failure Rate
- Verify phone numbers are E.164 format
- Check WhatsApp business account approval
- Monitor API rate limits

## Future Enhancements

- [ ] URL click tracking with short links
- [ ] A/B test variant tracking
- [ ] Template performance analytics
- [ ] Customer engagement scoring
- [ ] Predictive delivery optimization
- [ ] SMS and Email channel support
