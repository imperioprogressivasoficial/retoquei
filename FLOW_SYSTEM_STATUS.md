# Flow System - Complete Implementation Status

## Overview
The flow automation system is now fully operational with:
- Complete UI builder for creating and editing flows
- Execution engine for evaluating triggers and executing steps
- BullMQ worker integration for background processing
- Scheduler integration for automatic trigger checks
- API endpoints for manual and external flow triggering

---

## 1. Flow Builder UI - COMPLETE

### Location
- Main page: `src/app/(app)/flows/page.tsx`
- Edit page: `src/app/(app)/flows/[id]/edit/page.tsx`
- Client component: `src/app/(app)/flows/FlowsClient.tsx`

### Features
- **Create flows** with custom name, description, and trigger type
- **7 pre-built flow templates** for common scenarios
- **Edit flows** with visual step builder
- **Add multiple step types**: Delay, Send Message, Condition, Update Customer
- **Reorder steps** with up/down buttons
- **Delete steps** individually
- **Toggle flows** active/inactive
- **View execution count** for each flow
- **Save/edit all flow metadata**

### Supported Trigger Types
1. `AFTER_APPOINTMENT` - Post-service automation (thank you messages, feedback requests)
2. `SEGMENT_ENTER` - Welcome/recovery campaigns when customer enters segment
3. `BIRTHDAY_MONTH` - Birthday month special offers
4. `DAYS_INACTIVE` - Win-back campaigns for dormant customers
5. `MANUAL` - Manually triggered flows

### Step Types Available
1. **DELAY** - Wait X hours/days before next step
2. **SEND_MESSAGE** - Send WhatsApp message via template
3. **CONDITION** - Evaluate customer lifecycle/risk/inactivity to branch execution
4. **UPDATE_CUSTOMER** - Modify customer attributes (e.g., WhatsApp opt-in)

---

## 2. Flow Execution Engine - COMPLETE

### Location
`src/lib/flows/engine.ts`

### Core Functionality

#### Trigger Evaluation
- **evaluateTrigger()**: Determines if a flow should execute for a customer
  - Checks conditions based on trigger type
  - Validates customer data (metrics, birthdate, etc.)
  - Returns boolean result

#### Condition Evaluation
- **evaluateCondition()**: Evaluates branching logic in condition steps
  - Supports operators: `equals`, `gt` (greater than), `lt` (less than)
  - Fields: lifecycle, risk level, days since visit
  - Controls whether next steps execute

#### Step Execution
- **executeStep()**: Runs individual flow steps
  - DELAY: Sleeps for configured duration
  - SEND_MESSAGE: Creates outbound message and queues for sending
  - CONDITION: Evaluates branching logic
  - UPDATE_CUSTOMER: Modifies customer data
  - All steps have error handling

#### Flow Triggers

**1. DAYS_INACTIVE (Customer At Risk)**
```typescript
triggerInactiveFlows(tenantId: string)
```
- Evaluates all DAYS_INACTIVE flows
- Gets customer metrics (last visit date)
- Calculates days since visit
- Executes flow if days >= configured threshold
- Automatically checks every 6 hours via scheduler

**2. AFTER_APPOINTMENT (Post-Service)**
```typescript
triggerPostServiceFlows(tenantId, customerId, appointmentId)
```
- Triggered when appointment is completed
- Can send thank you messages, feedback requests
- Accessed via `/api/flows/trigger` endpoint

**3. SEGMENT_ENTER (Segment Entry)**
```typescript
triggerSegmentFlows(tenantId, customerId, segmentId)
```
- Triggers when customer enters a segment
- Can welcome new customers or activate recovery campaigns
- Accessed via `/api/flows/trigger` endpoint

**4. BIRTHDAY_MONTH (Birthday Automation)**
```typescript
triggerBirthdayFlows(tenantId: string)
```
- Evaluates all BIRTHDAY_MONTH flows
- Filters customers with birthdays in current month
- Automatically checks daily via scheduler

**5. MANUAL (Manual Execution)**
```typescript
executeFlow(customerId, flow)
```
- Executed on-demand via API
- Called via `/api/flows/trigger` endpoint
- Returns immediately with job queued

#### Run Counter
- Increments `runsCount` on AutomationFlow after each execution
- Tracks frequency of flow executions for analytics

---

## 3. Worker Integration - COMPLETE

### Flow Executor Processor
Location: `workers/src/processors/flow-executor.processor.ts`

**Handles 5 job types:**
1. `trigger_inactive` - DAYS_INACTIVE flows for entire tenant
2. `trigger_birthday` - BIRTHDAY_MONTH flows for entire tenant
3. `trigger_segment` - Flow when customer enters segment
4. `trigger_post_service` - Flow after appointment completion
5. `execute_manual` - Manual flow execution for customer

**Integration:**
- Added to BullMQ worker fleet in `workers/src/index.ts`
- Concurrency: 5 concurrent jobs
- Integrates with main flow execution engine
- Lazy-loads flow engine to avoid circular dependencies

### Queue Configuration
`workers/src/queues.ts`

Added `flowExecutorQueue`:
```typescript
export const flowExecutorQueue = new Queue('flow-executor', {
  connection: redis,
  defaultJobOptions: { ... }
})
```

---

## 4. Scheduler Integration - COMPLETE

### Location
`workers/src/scheduler.ts`

### Scheduled Jobs

**1. DAYS_INACTIVE Check - Every 6 hours**
- Job: `trigger_inactive`
- Pattern: `0 */6 * * *` (every 6 hours)
- Creates per-tenant jobs for all workspaces
- Evaluates all inactive customer flows

**2. BIRTHDAY_MONTH Check - Daily at 08:00 BRT**
- Job: `trigger_birthday`
- Pattern: `0 11 * * *` (8:00 AM BRT = 11:00 UTC)
- Creates per-tenant jobs for all workspaces
- Sends birthday messages

### Multi-Tenant Support
- Automatically creates jobs per tenant on startup
- Gracefully handles new tenants
- Uses Prisma to fetch all tenant IDs

---

## 5. API Endpoints - COMPLETE

### Flow CRUD Operations

**GET /api/flows**
- List all flows for tenant
- Includes steps array
- Ordered by creation date

**POST /api/flows**
- Create new flow
- Required: name, triggerType
- Optional: description, triggerConfig, activate flag
- Returns created flow with ID

**GET /api/flows/[id]**
- Retrieve specific flow with all steps
- Validates tenant ownership
- Returns full flow object

**PATCH /api/flows/[id]**
- Update flow metadata and steps
- Can modify name, description, trigger, steps
- Updates steps atomically with transaction
- Deletes old steps, creates new ones

**POST /api/flows/[id]/toggle**
- Toggle flow active/inactive status
- Returns updated flow

### Flow Triggering

**POST /api/flows/trigger**
- Manually trigger flows for customer
- Supports 3 trigger types:
  - `post_service` (requires appointmentId)
  - `segment_enter` (requires segmentId)
  - `manual` (no extra params)
- Queues job to flow-executor
- Returns success response

---

## 6. Data Models

### AutomationFlow (Prisma)
```prisma
model AutomationFlow {
  id            String          @id
  tenantId      String
  name          String
  description   String?
  triggerType   FlowTriggerType
  triggerConfig Json            // e.g., { days: 30 }
  isActive      Boolean
  isSystem      Boolean
  runsCount     Int
  createdAt     DateTime
  updatedAt     DateTime

  tenant        Tenant
  steps         AutomationFlowStep[]
  outboundMessages OutboundMessage[]
}

enum FlowTriggerType {
  AFTER_APPOINTMENT
  SEGMENT_ENTER
  BIRTHDAY_MONTH
  DAYS_INACTIVE
  MANUAL
}
```

### AutomationFlowStep (Prisma)
```prisma
model AutomationFlowStep {
  id        String
  flowId    String
  stepOrder Int
  type      FlowStepType
  config    Json
  createdAt DateTime

  flow      AutomationFlow
}

enum FlowStepType {
  DELAY
  SEND_MESSAGE
  CONDITION
  UPDATE_CUSTOMER
}
```

### Step Configurations

**DELAY**
```json
{
  "value": 24,
  "unit": "days"  // or "hours"
}
```

**SEND_MESSAGE**
```json
{
  "templateId": "tpl_abc123",
  "channel": "WHATSAPP"
}
```

**CONDITION**
```json
{
  "field": "lifecycle",  // or "risk", "days_since_visit"
  "operator": "equals",  // or "gt", "lt"
  "value": "active"
}
```

**UPDATE_CUSTOMER**
```json
{
  "field": "whatsappOptIn",
  "value": true
}
```

---

## 7. Execution Flow Examples

### Example 1: DAYS_INACTIVE Flow
User creates flow:
- Name: "Win-Back Campaign"
- Trigger: DAYS_INACTIVE, days: 30
- Steps:
  1. DELAY: 2 days
  2. SEND_MESSAGE: Template "recovery_message"
  3. CONDITION: if lifecycle == "inactive"
  4. SEND_MESSAGE: Template "special_offer"

Execution:
1. Scheduler triggers every 6 hours
2. Evaluates all customers with lastVisitAt > 30 days ago
3. For each customer:
   - Waits 2 days before proceeding
   - Sends recovery message via WhatsApp
   - Checks if customer lifecycle is "inactive"
   - If yes, sends special offer
4. Increments flow runCount

### Example 2: POST_SERVICE Flow
User creates flow:
- Name: "Thank You & Feedback"
- Trigger: AFTER_APPOINTMENT
- Steps:
  1. DELAY: 1 hour
  2. SEND_MESSAGE: Template "thank_you"
  3. SEND_MESSAGE: Template "request_feedback"

Execution via API:
1. Appointment marked complete
2. Call: `POST /api/flows/trigger`
3. Body: `{ customerId, triggerType: "post_service", appointmentId }`
4. Job queued to flow-executor
5. Worker executes:
   - Waits 1 hour
   - Sends thank you message
   - Sends feedback request
6. Flow runCount incremented

### Example 3: SEGMENT_ENTER Flow
User creates flow:
- Name: "New Customer Welcome"
- Trigger: SEGMENT_ENTER
- Steps:
  1. UPDATE_CUSTOMER: Set whatsappOptIn = true
  2. SEND_MESSAGE: Template "welcome_new_customer"

Execution:
1. Customer matches segment criteria
2. Segment recompute detects entry
3. Triggers: `POST /api/flows/trigger`
4. Body: `{ customerId, triggerType: "segment_enter", segmentId }`
5. Worker executes:
   - Sets customer whatsappOptIn = true
   - Sends welcome message
6. Customer now opted in to future communications

---

## 8. Key Features

### Error Handling
- All steps wrapped in try-catch
- Failed steps log errors but don't stop flow
- CONDITION steps control execution continuation
- Queue retries with exponential backoff (3 attempts)

### Message Integration
- SEND_MESSAGE steps create OutboundMessage records
- Messages queued to `message-send` processor
- Checks customer WhatsApp opt-in status
- Interpolates customer variables in message body

### Variable Interpolation
Supported template variables:
- `{{customer_name}}` - Full name
- `{{first_name}}` - First name only
- `{{salon_name}}` - Tenant name
- `{{days_since_last_visit}}` - Days inactive
- `{{last_visit_date}}` - Last appointment date
- `{{predicted_return_date}}` - Expected return date
- `{{preferred_service}}` - Customer's main service
- `{{last_service}}` - Last completed service

### Performance Optimizations
- Scheduler creates per-tenant jobs (avoids thundering herd)
- Flow execution deferred to background workers
- Condition steps evaluated before message queuing
- Database transactions for step updates
- Indexes on tenantId, flowId, triggertType

### Multi-Tenant Isolation
- All flows filtered by tenantId
- Customer ownership validated before execution
- Tenant membership checked in all APIs
- Cross-tenant data leakage prevented

---

## 9. Testing Checklist

### CRUD Operations
- [x] Create flow via POST /api/flows
- [x] List flows via GET /api/flows
- [x] Get single flow via GET /api/flows/[id]
- [x] Update flow via PATCH /api/flows/[id]
- [x] Toggle flow via POST /api/flows/[id]/toggle
- [x] Delete steps atomically when updating

### Trigger Types
- [x] DAYS_INACTIVE evaluates correctly
- [x] AFTER_APPOINTMENT executes on demand
- [x] SEGMENT_ENTER executes on demand
- [x] BIRTHDAY_MONTH finds correct customers
- [x] MANUAL executes without trigger check

### Step Execution
- [x] DELAY waits correct duration
- [x] SEND_MESSAGE creates message records
- [x] SEND_MESSAGE queues to message-send
- [x] CONDITION evaluates correctly
- [x] CONDITION stops execution on failure
- [x] UPDATE_CUSTOMER modifies data
- [x] Step errors logged but don't crash flow

### Integration
- [x] Scheduler creates recurring jobs
- [x] Worker processes flow-executor jobs
- [x] API triggers queue jobs
- [x] Multiple flows execute sequentially for customer
- [x] RunCount increments after execution

### UI Testing
- [x] Pre-built flows can be activated
- [x] Custom flows can be created
- [x] Steps can be added/removed/reordered
- [x] Step configs persist correctly
- [x] Flow active status toggles
- [x] Flow editor saves changes

---

## 10. Deployment Notes

### Environment Variables Required
- `REDIS_URL` - Redis connection string
- `DATABASE_URL` - Postgres database URL
- `WHATSAPP_ACCESS_TOKEN` - For message sending

### Services Required
- Redis instance running
- Postgres database with schema
- Worker process running (`workers/src/index.ts`)
- Next.js API routes accessible

### Migration Steps
1. Update Prisma schema (already in schema.prisma)
2. Run: `npx prisma migrate deploy`
3. Start worker: `npm run start:worker`
4. Start web app: `npm run dev`
5. Monitor worker logs for scheduler startup

### Monitoring
- Worker logs show job completions/failures
- Check Redis for queue depth: `redis-cli KEYS flow-executor:*`
- Monitor database for OutboundMessage creation
- Check flow runCount increments
- Verify tenant isolation in logs

---

## 11. Future Enhancements

Possible additions:
- Webhook action type (POST to external service)
- Task creation action (integration with task management)
- A/B test action (split customer into variants)
- Email sending action (beyond WhatsApp)
- Delay until (absolute time-based delays)
- Customer attribute conditions (not just lifecycle)
- Flow analytics dashboard
- Flow version history/rollback
- Flow templates/cloning
- Execution logs per customer
- Real-time flow execution monitoring

---

## Files Created/Modified

### New Files
- `src/lib/flows/engine.ts` - Flow execution engine
- `src/lib/flows/types.ts` - Shared type definitions
- `workers/src/processors/flow-executor.processor.ts` - Worker processor
- `src/app/api/flows/trigger/route.ts` - Trigger API endpoint
- `FLOW_SYSTEM_STATUS.md` - This document

### Modified Files
- `workers/src/queues.ts` - Added flowExecutorQueue
- `workers/src/index.ts` - Added flow executor worker
- `workers/src/scheduler.ts` - Added flow trigger scheduling

### Existing Files (No Changes)
- `src/app/(app)/flows/page.tsx` - UI complete
- `src/app/(app)/flows/FlowsClient.tsx` - UI complete
- `src/app/(app)/flows/[id]/edit/page.tsx` - UI complete
- `src/app/api/flows/route.ts` - API complete
- `src/app/api/flows/[id]/route.ts` - API complete
- `src/app/api/flows/[id]/toggle/route.ts` - API complete

---

## Summary

The flow automation system is **fully operational** with:

1. ✅ Complete flow builder UI for creating/editing flows
2. ✅ Execution engine with 5 trigger types
3. ✅ 4 step types (Delay, Message, Condition, Update)
4. ✅ BullMQ worker integration
5. ✅ Automatic scheduler for recurring triggers
6. ✅ API endpoints for CRUD and manual triggering
7. ✅ Multi-tenant isolation
8. ✅ Error handling and retries
9. ✅ Variable interpolation in messages
10. ✅ Run count tracking

All core features are implemented and ready for production use.
