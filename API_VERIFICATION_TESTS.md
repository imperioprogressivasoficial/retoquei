# Customer API Verification Tests

## Test Suite for Customer Dashboard APIs

These tests verify that all customer endpoints are functional and properly data-driven.

---

## Pre-requisites

1. Server running on localhost:3000
2. Authentication token available (Supabase Auth)
3. Valid tenant setup

---

## Test Cases

### Test 1: Create Customer (POST /api/customers)

**Purpose**: Verify new customer creation with validation

```bash
# Create a new customer
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]" \
  -d '{
    "fullName": "Maria Silva",
    "phoneE164": "+5511987654321",
    "email": "maria@example.com",
    "birthdate": "1990-05-15",
    "lifecycleStage": "NEW",
    "riskLevel": "LOW",
    "tags": ["referência", "premium"]
  }'
```

**Expected Response** (201):
```json
{
  "customer": {
    "id": "cuid-here",
    "tenantId": "tenant-id",
    "fullName": "Maria Silva",
    "phoneE164": "+5511987654321",
    "email": "maria@example.com",
    "lifecycleStage": "NEW",
    "riskLevel": "LOW",
    "tags": ["referência", "premium"],
    "createdAt": "2026-04-02T...",
    "metrics": {
      "id": "cuid-here",
      "customerId": "customer-id",
      "totalAppointments": 0,
      "ltv": 0
    }
  }
}
```

**Validation Checks**:
- ✓ Returns 201 Created
- ✓ Customer created in database
- ✓ Metrics record auto-created
- ✓ Data matches input
- ✓ CreatedAt timestamp present

---

### Test 2: List Customers (GET /api/customers)

**Purpose**: Verify paginated listing with filters

```bash
# Get all customers (page 1, 50 per page)
curl "http://localhost:3000/api/customers?page=1&pageSize=50"

# Filter by lifecycle stage
curl "http://localhost:3000/api/customers?lifecycle=ACTIVE&page=1"

# Search by name or phone
curl "http://localhost:3000/api/customers?search=maria"
curl "http://localhost:3000/api/customers?search=5511987654321"

# Combined filters
curl "http://localhost:3000/api/customers?lifecycle=AT_RISK&search=silva&page=1&pageSize=25"
```

**Expected Response** (200):
```json
{
  "customers": [
    {
      "id": "...",
      "fullName": "Maria Silva",
      "phoneE164": "+5511987654321",
      "lifecycleStage": "ACTIVE",
      "riskLevel": "LOW",
      "metrics": {
        "totalAppointments": 5,
        "ltv": 250.50,
        "avgTicket": 50.10,
        "lastVisitAt": "2026-04-01T14:30:00Z"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pageSize": 50,
    "totalPages": 3
  }
}
```

**Validation Checks**:
- ✓ Returns customers array
- ✓ Pagination metadata correct
- ✓ Lifecycle filter works
- ✓ Search by name works
- ✓ Search by phone works
- ✓ Metrics included

---

### Test 3: Get Customer Details (GET /api/customers/[id])

**Purpose**: Verify single customer retrieval with relations

```bash
curl "http://localhost:3000/api/customers/[customer-id]"
```

**Expected Response** (200):
```json
{
  "customer": {
    "id": "customer-id",
    "fullName": "Maria Silva",
    "phoneE164": "+5511987654321",
    "lifecycleStage": "ACTIVE",
    "riskLevel": "LOW",
    "metrics": { ... },
    "appointments": [
      {
        "id": "appt-1",
        "scheduledAt": "2026-03-28T10:00:00Z",
        "service": { "name": "Haircut" },
        "professional": { "name": "Ana" },
        "price": 100,
        "status": "COMPLETED"
      }
    ],
    "segmentMemberships": [
      {
        "segment": { "name": "VIP Customers" }
      }
    ],
    "outboundMessages": [
      {
        "id": "msg-1",
        "content": "...",
        "status": "DELIVERED",
        "createdAt": "2026-03-30T..."
      }
    ]
  }
}
```

**Validation Checks**:
- ✓ Returns 200 OK
- ✓ Full customer details
- ✓ Metrics included
- ✓ Last 100 appointments
- ✓ Segment memberships
- ✓ Last 50 messages
- ✓ Relationships properly loaded

**Error Cases**:
```bash
# Non-existent customer
curl "http://localhost:3000/api/customers/invalid-id"
# Expected: 404 Not Found

# Missing auth
curl "http://localhost:3000/api/customers/[id]" -H "Cookie: "
# Expected: 401 Unauthorized
```

---

### Test 4: Update Customer (PATCH /api/customers/[id])

**Purpose**: Verify selective customer updates

```bash
# Update lifecycle stage and risk level
curl -X PATCH http://localhost:3000/api/customers/[customer-id] \
  -H "Content-Type: application/json" \
  -d '{
    "lifecycleStage": "VIP",
    "riskLevel": "MEDIUM",
    "notes": "Promote to VIP due to high LTV"
  }'

# Update contact info
curl -X PATCH http://localhost:3000/api/customers/[customer-id] \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Maria Silva Santos",
    "email": "maria.silva@newdomain.com"
  }'

# Add tags
curl -X PATCH http://localhost:3000/api/customers/[customer-id] \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["premium", "loyal", "referral"]
  }'
```

**Expected Response** (200):
```json
{
  "customer": {
    "id": "customer-id",
    "lifecycleStage": "VIP",
    "riskLevel": "MEDIUM",
    "notes": "Promote to VIP due to high LTV",
    "metrics": { ... },
    "appointments": [ ... ],
    "segmentMemberships": [ ... ]
  }
}
```

**Validation Checks**:
- ✓ Returns 200 OK
- ✓ Only specified fields updated
- ✓ Unchanged fields preserved
- ✓ Updated timestamp modified
- ✓ Relations loaded in response

---

### Test 5: Delete Customer (DELETE /api/customers/[id])

**Purpose**: Verify soft delete functionality

```bash
curl -X DELETE http://localhost:3000/api/customers/[customer-id]
```

**Expected Response** (200):
```json
{
  "message": "Customer deleted",
  "customer": {
    "id": "customer-id",
    "deletedAt": "2026-04-02T12:30:45Z"
  }
}
```

**Validation Checks**:
- ✓ Returns 200 OK
- ✓ deletedAt timestamp set
- ✓ Customer not in GET /api/customers
- ✓ Customer not in searches
- ✓ Hard copy preserved in database

**Verify Deletion**:
```bash
# This should not return the deleted customer
curl "http://localhost:3000/api/customers?search=maria"
# Customer should be excluded
```

---

### Test 6: Dashboard Overview (GET /api/dashboard/overview)

**Purpose**: Verify KPI calculations

```bash
curl "http://localhost:3000/api/dashboard/overview"
```

**Expected Response** (200):
```json
{
  "totalCustomers": 150,
  "newCustomersThisMonth": 12,
  "newCustomers": 8,
  "activeCustomers": 95,
  "recurringCustomers": 45,
  "vipCustomers": 12,
  "atRiskCustomers": 23,
  "atRiskPercentage": 15,
  "lostCustomers": 8,
  "dormantCustomers": 7,
  "retentionRate": 38,
  "avgTicket": 75.50,
  "avgDaysBetweenVisits": 28.5,
  "avgLTV": 1250.75,
  "totalRevenue": 187500.00,
  "messaging": {
    "messagesSent": 450,
    "messagesDelivered": 425,
    "messagesRead": 380,
    "messagesFailed": 25,
    "deliveryRate": 94,
    "readRate": 84,
    "failureRate": 6
  }
}
```

**Validation Checks**:
- ✓ totalCustomers = sum of all lifecycle stages
- ✓ newCustomersThisMonth > 0 and filtered by current month
- ✓ atRiskPercentage = (atRiskCustomers / totalCustomers) * 100
- ✓ retentionRate = ((recurringCustomers + vipCustomers) / totalCustomers) * 100
- ✓ avgLTV calculated correctly
- ✓ Messaging metrics sum correctly
- ✓ deliveryRate = (delivered / sent) * 100

---

## Frontend Component Tests

### Test 7: Customer List Page Display

**Scenario**: User navigates to /customers

**Validation Checks**:
- ✓ All customers display in table
- ✓ Lifecycle stage shows as color-coded badge
- ✓ Phone number visible
- ✓ Last visit date displays correctly
- ✓ Metrics (visits, ticket, LTV) show correct format
- ✓ Table is sortable on click

### Test 8: Customer List Filters

**Scenario**: User applies filters on /customers

```javascript
// Search by name
Input "maria" in search box
// Expected: Only customers with "maria" in name appear

// Filter by lifecycle
Click "Em Risco" filter
// Expected: Only AT_RISK customers appear

// Clear filters
Click "Todos" button
// Expected: All customers return
```

**Validation Checks**:
- ✓ Search filters by name
- ✓ Search filters by phone
- ✓ Lifecycle filters work (Active, At Risk, Lost, VIP)
- ✓ Filters combine properly
- ✓ Result counter updates
- ✓ Clear button resets search

### Test 9: Customer Detail Page

**Scenario**: User clicks customer row

**Validation Checks**:
- ✓ Customer name displays
- ✓ Lifecycle stage badge shows
- ✓ Contact info displays (phone, email, birthdate)
- ✓ Metrics display correctly (visits, spending, LTV)
- ✓ Appointments list shows (latest first)
- ✓ Segments display
- ✓ Risk assessment panel present
- ✓ Edit button visible

### Test 10: Edit Customer Form

**Scenario**: User clicks "Editar Cliente" button

**Validation Checks**:
- ✓ Modal opens with form
- ✓ Current values pre-filled
- ✓ All fields present (name, phone, email, etc.)
- ✓ Lifecycle stage dropdown works
- ✓ Risk level dropdown works
- ✓ Save button submits form
- ✓ API PATCH request sent
- ✓ Page reloads with new data on success
- ✓ Error message displays on failure

### Test 11: Risk Assessment Component

**Scenario**: User views customer detail page

**Validation Checks**:
- ✓ Risk level badge displays (Low/Medium/High)
- ✓ Risk factors list appears if applicable
- ✓ Severity indicators correct (colors)
- ✓ Predicted return date displays (if available)
- ✓ Recommendations appear based on risk level

---

## Data Integrity Tests

### Test 12: Tenant Isolation

**Purpose**: Ensure no cross-tenant data access

```javascript
// Use customer A's auth token to access customer B from different tenant
const customerBId = "customer-from-other-tenant"
fetch(`/api/customers/${customerBId}`)
// Expected: 404 Not Found (customer not in user's tenant)
```

### Test 13: Soft Delete Verification

**Purpose**: Verify deleted customers are truly soft-deleted

```javascript
// Create customer
POST /api/customers
// Response: { customer: { id: "cuid1", ... } }

// Delete customer
DELETE /api/customers/cuid1
// Response: deletedAt timestamp set

// Verify not in list
GET /api/customers
// Expected: cuid1 NOT in results

// Direct database check
SELECT * FROM customers WHERE id = 'cuid1'
// Expected: Row exists with deletedAt = timestamp
```

---

## Performance Tests

### Test 14: Pagination Performance

```bash
# Test large page size
curl "http://localhost:3000/api/customers?page=1&pageSize=1000"
# Should respond in < 2 seconds

# Test deep pagination
curl "http://localhost:3000/api/customers?page=100&pageSize=50"
# Should respond in < 2 seconds
```

### Test 15: Search Performance

```bash
# Search with many results
curl "http://localhost:3000/api/customers?search=a"
# Should respond in < 2 seconds

# Search with specific result
curl "http://localhost:3000/api/customers?search=%2B5511999999999"
# Should respond instantly
```

---

## Error Handling Tests

### Test 16: Invalid Requests

```bash
# Missing required field
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{ "phoneE164": "+5511999999999" }'
# Expected: 400 Bad Request

# Duplicate phone number
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "New Person",
    "phoneE164": "+5511987654321"  // Already exists
  }'
# Expected: 409 Conflict

# Invalid date format
curl -X PATCH http://localhost:3000/api/customers/[id] \
  -H "Content-Type: application/json" \
  -d '{ "birthdate": "invalid-date" }'
# Expected: 400 Bad Request
```

---

## Summary Checklist

- [ ] All 5 endpoint types working (GET list, GET detail, POST, PATCH, DELETE)
- [ ] Pagination working correctly
- [ ] Search functionality operational
- [ ] Lifecycle filters working
- [ ] Customer detail page displays all data
- [ ] Edit form validates and saves
- [ ] Risk assessment calculates correctly
- [ ] Dashboard KPIs match expected values
- [ ] Tenant isolation verified
- [ ] Soft deletes working
- [ ] Error handling appropriate
- [ ] Performance acceptable (<2s for all queries)

---

## Debugging Tips

### Check API Response
```javascript
const response = await fetch('/api/customers')
const data = await response.json()
console.log(data) // Verify structure
```

### Verify Database Data
```sql
-- Check customer count
SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL AND tenant_id = '[id]'

-- Check metrics
SELECT * FROM customer_metrics WHERE tenant_id = '[id]' LIMIT 5

-- Check appointments
SELECT * FROM appointments WHERE customer_id = '[id]' ORDER BY scheduled_at DESC LIMIT 10
```

### Monitor Network Requests
Open browser DevTools → Network tab
- Check request/response headers
- Verify authorization token included
- Confirm JSON structure

---

**All tests documented. Execute against staging environment before production deployment.**
