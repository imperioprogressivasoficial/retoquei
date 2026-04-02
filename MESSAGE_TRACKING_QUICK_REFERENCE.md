# Message Tracking Quick Reference

## Core Endpoints

### Messages
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/outbound-messages` | POST | Create/send message |
| `/api/outbound-messages` | GET | List messages (filtered) |
| `/api/outbound-messages/[id]` | GET | Message details |

### Tracking
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/messages/tracking` | GET | Real-time status |

### Analytics
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/analytics/messages` | GET | Message analytics |
| `/api/campaigns/[id]/analytics` | GET | Campaign analytics |
| `/api/dashboard/overview` | GET | Dashboard metrics |

## Status Values

```
PENDING    → Message created, waiting to send
QUEUED     → In job queue for sending
SENT       → Sent to provider
DELIVERED  → Delivered to WhatsApp
READ       → Read by customer
FAILED     → Send failed
OPTED_OUT  → Customer unsubscribed
```

## Create Message

```javascript
POST /api/outbound-messages
{
  "customerId": "string",        // optional
  "templateId": "string",        // optional
  "campaignId": "string",        // optional
  "flowId": "string",            // optional
  "toNumber": "5511999999999",   // required
  "bodyRendered": "string",      // required
  "channel": "WHATSAPP",         // WHATSAPP|SMS|EMAIL
  "scheduledAt": "ISO 8601"      // optional
}
```

## Filter Messages

```
?campaignId=X          → By campaign
?customerId=X          → By customer
?status=SENT           → By status
?channel=WHATSAPP      → By channel
?startDate=2026-04-01  → Date range
?endDate=2026-04-30
?skip=0                → Pagination
?take=20
```

## Track Status

```javascript
GET /api/messages/tracking?messageId=X
GET /api/messages/tracking?providerId=wamid.X

Response includes:
- Current status
- Timestamps (sent, delivered, read)
- Response count
- Event timeline
```

## Analytics Fields

```javascript
// messagesSent this month
// Delivery rate = (delivered / sent) * 100
// Read rate = (read / sent) * 100
// Failure rate = (failed / sent) * 100
// Response rate = (responses / sent) * 100
```

## Webhook Events

WhatsApp webhook payloads are automatically:
1. Stored in database
2. Processed synchronously for delivery updates
3. Processed asynchronously via BullMQ
4. Events created in MessageEvent table

## Status Timeline

```
Message Created
    ↓
PENDING (waiting)
    ↓
QUEUED (in job queue)
    ↓
SENT (sent to provider)
    ↓
DELIVERED (reached device)
    ↓
READ (opened by customer)
    ├─ Response possible
    └─ Event created in InboundMessage
```

## Database Schema Quick Look

```
OutboundMessage
├─ status: MessageStatus
├─ sentAt: DateTime
├─ deliveredAt: DateTime
├─ readAt: DateTime
├─ providerMessageId: String
├─ events: MessageEvent[]
└─ customer: Customer

MessageEvent
├─ messageId: String
├─ eventType: String
├─ payload: Json
└─ createdAt: DateTime

InboundMessage
├─ customerId: String
├─ body: String
└─ receivedAt: DateTime
```

## Common Queries

### Campaign Performance
```
GET /api/campaigns/camp_123/analytics
→ sentCount, deliveredCount, readCount, responseRate
```

### Message History
```
GET /api/outbound-messages?customerId=cust_123
→ All messages sent to customer
```

### Monthly Analytics
```
GET /api/analytics/messages
→ thisMonth: {delivered: X, read: Y, failed: Z}
```

### Check Message Status
```
GET /api/messages/tracking?messageId=msg_123
→ Current status + timeline + responses
```

## Integration Points

### Campaign Send
- Creates OutboundMessage records
- Links to Campaign
- Sets status = QUEUED

### Customer Detail Page
- Show message history: `GET /api/outbound-messages?customerId=X`
- Show responses: `GET /api/inbound-messages?customerId=X`

### Dashboard
- Use `/api/dashboard/overview` for metrics
- Shows deliveryRate, readRate, messagesSent

### Webhook Handler
- `/api/webhooks/whatsapp` receives updates
- Automatically updates message status
- Creates MessageEvent records

## Troubleshooting

### Messages Not Sending
- Check job queue: `GET /api/admin/jobs`
- Verify WhatsApp token: `WHATSAPP_ACCESS_TOKEN`
- Check quiet hours: 22:00-08:00 Brazil time

### Status Not Updating
- Verify webhook is received: `WebhookEvent` table
- Check `providerMessageId` matches
- See webhook processor logs

### Analytics Showing Zero
- Check message status is SENT or higher
- Ensure timestamp filters include messages
- Verify tenantId is correct

## Response Tracking

```
Customer sends reply
    ↓
WhatsApp webhook (messages array)
    ↓
InboundMessage created
    ↓
Linked to Customer
    ↓
Response count incremented in analytics
```

## Performance Tips

1. Use pagination for listing: `?take=50&skip=0`
2. Filter by date range for large datasets
3. Campaign analytics are quick (single query)
4. Message list scales with indexes

## File References

- Endpoints: `src/app/api/outbound-messages/**`
- Analytics: `src/app/api/analytics/**`
- Webhook: `workers/src/processors/webhook-process.processor.ts`
- Database: `prisma/schema.prisma` (OutboundMessage, MessageEvent, InboundMessage)
- Docs: `src/docs/MESSAGE_TRACKING.md`
