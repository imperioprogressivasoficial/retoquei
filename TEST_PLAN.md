# Retoquei — Complete Feature Test Plan

**Last Updated:** 2026-04-21  
**Version:** Production v1.1  
**Status:** MVP Ready for End-to-End Testing

---

## 📋 Test Execution Guide

### Phase 1: Core Authentication & Onboarding (15 min)

**Test 1.1: User Registration**
- [ ] Go to `/register`
- [ ] Fill in: Email, Password, Full Name
- [ ] Submit and verify redirect to `/onboarding`
- [ ] ✅ Expected: Email verified, user created in Supabase Auth

**Test 1.2: Onboarding Flow**
- [ ] Create salon: name "Salão Aurora", slug auto-generated
- [ ] Submit and verify creation
- [ ] Verify automatic redirect to `/dashboard`
- [ ] ✅ Expected: Salon created, Profile linked, SalonMember role=OWNER

**Test 1.3: Login/Logout**
- [ ] Logout from dashboard
- [ ] Login with registered credentials
- [ ] Verify redirect to dashboard
- [ ] ✅ Expected: Session restored, auth state preserved

---

### Phase 2: Customers Management (20 min)

**Test 2.1: Add Single Customer**
- [ ] Go to `/clients` → New Customer
- [ ] Fill: Name "João Silva", Phone "85987654321", Email "joao@example.com"
- [ ] Submit
- [ ] ✅ Expected: Customer created, appears in list with normalized phone

**Test 2.2: Verify Customers List**
- [ ] Check 8 required columns display:
  - [ ] Cliente (name)
  - [ ] Data de nascimento (birthDate)
  - [ ] Data de cadastro (createdAt)
  - [ ] Último atendimento (lastVisitAt)
  - [ ] Visitas (visitCount)
  - [ ] Serviços (services, if tracked)
  - [ ] Total (totalSpent)
  - [ ] Ticket Médio (averageTicket)
- [ ] ✅ Expected: All columns present with correct data types

**Test 2.3: Search & Filter**
- [ ] Search by name: "João" → Should find customer
- [ ] Search by phone: "987654321" → Should find customer
- [ ] Filter by lifecycle stage if available
- [ ] ✅ Expected: Search works, filters responsive

**Test 2.4: CSV Import**
- [ ] Go to `/integrations/csv`
- [ ] Create test CSV file:
  ```
  nome;telefone;email;total_gasto
  Maria Silva;85988776655;maria@example.com;250.00
  Carlos Santos;85999887766;carlos@example.com;450.00
  ```
- [ ] Upload and import
- [ ] ✅ Expected: 2 customers imported, appear in `/clients` list

---

### Phase 3: Templates Management (10 min)

**Test 3.1: Create Template**
- [ ] Go to `/templates` → New Template
- [ ] Fill:
  - [ ] Name: "Pós-Visita"
  - [ ] Category: "POST_VISIT"
  - [ ] Content: "Obrigado {{nome}} pela visita! 😊"
- [ ] Save
- [ ] ✅ Expected: Template created, appears in list

**Test 3.2: Create Second Template**
- [ ] Create: "Recuperação"
  - [ ] Category: "REACTIVATION"
  - [ ] Content: "{{nome}}, sentimos sua falta! Volte com 10% de desconto."
- [ ] ✅ Expected: Both templates available for campaigns

---

### Phase 4: Campaigns (Messaging) (15 min)

**Test 4.1: Create Campaign**
- [ ] Go to `/campaigns` → New Campaign
- [ ] Fill:
  - [ ] Name: "Campanha Pós-Visita"
  - [ ] Select Segment: (all customers if no segments exist)
  - [ ] Select Template: "Pós-Visita"
  - [ ] Save
- [ ] ✅ Expected: Campaign created with DRAFT status

**Test 4.2: Send Campaign**
- [ ] Go to campaign detail page
- [ ] Click "Enviar campanha" (Send Campaign)
- [ ] Confirm in dialog
- [ ] ✅ Expected:
  - Status changes to RUNNING then COMPLETED
  - Messages created in database with status SENT (mock provider)
  - Toast shows: "X mensagem(ns) enviada(s)"

**Test 4.3: Verify Messages Sent**
- [ ] Open campaign detail
- [ ] Check "Destinatários" section
- [ ] Verify all recipients show:
  - [ ] Status: "Enviada" (SENT)
  - [ ] Sent timestamp
  - [ ] Client name and phone
- [ ] ✅ Expected: All messages marked as SENT

---

### Phase 5: Automations (10 min)

**Test 5.1: Create Automation**
- [ ] Go to `/automations` → New Automation
- [ ] Fill:
  - [ ] Name: "Recuperação Automática"
  - [ ] Trigger Type: "AT_RISK"
  - [ ] Select Template: "Recuperação"
  - [ ] Save
- [ ] ✅ Expected: Automation created with isActive=false

**Test 5.2: Activate Automation**
- [ ] In automations list, click "Inativa" badge
- [ ] ✅ Expected: Status changes to "Ativa"

**Test 5.3: Trigger Automation**
- [ ] Right-click automation row or click menu
- [ ] Select "Disparar agora" (Trigger Now)
- [ ] ✅ Expected:
  - Toast: "Automação disparada!"
  - Messages created for all opted-in customers
  - Status: "X enviada(s)"

**Test 5.4: Deactivate Automation**
- [ ] Click "Ativa" badge
- [ ] ✅ Expected:
  - Status changes to "Inativa"
  - "Disparar agora" button becomes disabled

---

### Phase 6: Segments (5 min)

**Test 6.1: Create Segment**
- [ ] Go to `/segments` → New Segment
- [ ] Fill:
  - [ ] Name: "Clientes VIP"
  - [ ] Description: "Total > R$500"
  - [ ] Type: DYNAMIC or MANUAL
  - [ ] Save
- [ ] ✅ Expected: Segment created, shows member count

**Test 6.2: Use Segment in Campaign**
- [ ] Create new campaign
- [ ] Select segment: "Clientes VIP"
- [ ] Target count should show filtered customers
- [ ] Send campaign
- [ ] ✅ Expected: Only segment members receive messages

---

### Phase 7: Dashboard (5 min)

**Test 7.1: Verify Real Metrics**
- [ ] Go to `/dashboard`
- [ ] Check KPI cards display:
  - [ ] Total Customers (from database count)
  - [ ] New Customers
  - [ ] Recurring Customers
  - [ ] Messages Sent (from messages table)
  - [ ] Campaign Overview (from campaigns table)
- [ ] ✅ Expected: All metrics show real data, not mocks

**Test 7.2: Check Charts**
- [ ] Verify visible charts (if configured):
  - [ ] Customer evolution chart
  - [ ] Retention chart
  - [ ] Segment distribution
- [ ] ✅ Expected: Charts render without errors

---

### Phase 8: Data Integrity (10 min)

**Test 8.1: Tenant Isolation**
- [ ] Create second user account and login
- [ ] Complete onboarding for second tenant
- [ ] Go to `/clients`
- [ ] Verify: ONLY see customers from second tenant
- [ ] ✅ Expected: No cross-tenant data leakage

**Test 8.2: Campaign Isolation**
- [ ] Login with first user
- [ ] Go to `/campaigns`
- [ ] Verify: ONLY see campaigns from first tenant
- [ ] ✅ Expected: Campaigns properly scoped

**Test 8.3: Template Isolation**
- [ ] Go to `/templates`
- [ ] Verify: ONLY see templates from current tenant
- [ ] ✅ Expected: Templates properly scoped

---

### Phase 9: Error Handling (5 min)

**Test 9.1: Invalid Data**
- [ ] Try to create customer with empty name → Error toast
- [ ] Try to create campaign without template → Error message
- [ ] Try to send campaign to 0 customers → Error
- [ ] ✅ Expected: All errors handled gracefully with clear messages

**Test 9.2: Authentication**
- [ ] Try to access `/dashboard` without login → Redirect to `/login`
- [ ] Try to access other user's salon via direct URL → 404 or Redirect
- [ ] ✅ Expected: Auth properly enforced

---

## 📊 Features Status Matrix

| Feature | Status | Test Result | Notes |
|---------|--------|-------------|-------|
| **Sign Up** | ✅ Ready | Pending | Email/password + validation |
| **Login** | ✅ Ready | Pending | Session via Supabase |
| **Onboarding** | ✅ Ready | Pending | Creates single tenant |
| **Customers List** | ✅ Ready | Pending | 8 columns complete |
| **Add Customer** | ✅ Ready | Pending | Single + bulk via CSV |
| **Customer Search** | ✅ Ready | Pending | Name + phone |
| **CSV Import** | ✅ Ready | Pending | Auto-detect separator |
| **Templates CRUD** | ✅ Ready | Pending | Create/view/delete |
| **Campaigns CRUD** | ✅ Ready | Pending | Draft → Send → Complete |
| **Campaign Send** | ✅ Ready | Pending | Uses mock provider |
| **Message Tracking** | ✅ Ready | Pending | PENDING → SENT → DELIVERED |
| **Automations CRUD** | ✅ Ready | Pending | Create/toggle/trigger |
| **Automation Trigger** | ✅ Ready | Pending | Manual via API endpoint |
| **Segments CRUD** | ✅ Ready | Pending | List/create/use in campaigns |
| **Dashboard KPIs** | ✅ Ready | Pending | Real data from DB |
| **WhatsApp Mock** | ✅ Ready | Pending | Enabled by default |
| **Tenant Isolation** | ✅ Ready | Pending | RLS + code validation |
| **Health Check** | ✅ Ready | Pending | `/api/health` endpoint |

---

## 🚀 Test Environment Setup

### Prerequisites
```bash
# 1. Clone repository
git clone <repo-url>
cd retoquei

# 2. Install dependencies
npm install

# 3. Set up .env.local (already configured)
# DATABASE_URL should point to Supabase PostgreSQL:5432
# REDIS_URL for local Redis (optional for BullMQ)

# 4. Run Prisma migrations
npx prisma migrate deploy

# 5. Start development server
npm run dev

# Server runs at http://localhost:3000
```

### Test Data
- **Demo Salon:** Auto-created on first user's onboarding
- **Demo Customers:** Added via CSV import or manual creation
- **Demo Templates:** Create during Phase 3
- **Demo Campaigns:** Create during Phase 4

---

## ✅ Sign-Off Checklist

When all tests pass:
- [ ] All 9 phases completed
- [ ] No errors in console
- [ ] No data leakage between tenants
- [ ] All messages sent successfully (mock provider)
- [ ] Build passes (`npm run build`)
- [ ] Deployment ready (`vercel deploy`)

---

## 🔍 Known Limitations

1. **WhatsApp Integration**
   - Currently using mock provider (logs to console)
   - To enable real WhatsApp: Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`
   - Messages will be created in DB but not sent to actual WhatsApp until configured

2. **Automations**
   - Supports manual triggering (this test plan)
   - Automatic triggering on events (e.g., appointment completion) not yet implemented
   - Can be triggered manually via `/api/automations/[id]/trigger`

3. **Background Jobs (BullMQ)**
   - Campaign send supports BullMQ if Redis available
   - Falls back to synchronous dispatch if no Redis
   - This test plan uses synchronous mode (works either way)

---

## 📞 Support

If tests fail:
1. Check console for errors
2. Check `/api/health` endpoint for database connectivity
3. Check database: `SELECT COUNT(*) FROM clients WHERE salon_id = '...'`
4. Review logs: `git log --oneline -10`

---

**Ready for full end-to-end testing! 🎯**
