# Retoquei

> Retention engine for salons — not a booking platform.

Retoquei helps hair salons and beauty studios bring clients back automatically. It ingests client visit history (via CSV, webhook, or direct integration with scheduling tools like Trinks), analyses recency and frequency, and sends personalised WhatsApp re-engagement messages at the right moment.

**Core idea:** A client who visited 6 weeks ago and hasn't returned is silently churning. Retoquei spots that gap and reaches out — so the salon owner doesn't have to.

---

## Table of Contents

- [Product Positioning](#product-positioning)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Connector Strategy](#connector-strategy)
- [Trinks Integration](#trinks-integration)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Product Positioning

| What Retoquei IS | What Retoquei is NOT |
|---|---|
| A client retention & re-engagement engine | A booking platform |
| An automation layer that sits on top of existing tools | A replacement for Trinks / Booksy / Agenda Edu |
| A WhatsApp CRM for salons | A general-purpose marketing tool |
| A churn-prevention dashboard | A POS or financial management system |

The salon owner keeps using whatever booking software they already have. Retoquei reads the visit data and handles the "bring them back" loop.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        RETOQUEI                             │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │   Next.js    │   │   BullMQ     │   │  PostgreSQL    │  │
│  │  App Router  │──▶│   Worker     │──▶│  (via Prisma)  │  │
│  │  (Vercel /   │   │  (Node.js)   │   │                │  │
│  │   Docker)    │   └──────┬───────┘   └────────────────┘  │
│  └──────┬───────┘          │                               │
│         │                  ▼                               │
│  ┌──────▼───────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  Supabase    │   │    Redis     │   │  WhatsApp      │  │
│  │  Auth + RLS  │   │  (BullMQ     │   │  Meta Cloud    │  │
│  │              │   │   queues)    │   │  API           │  │
│  └──────────────┘   └──────────────┘   └────────────────┘  │
│                                                             │
│  DATA CONNECTORS                                            │
│  ┌────────┐  ┌─────────┐  ┌──────────────────────────────┐ │
│  │  CSV   │  │Webhook  │  │  Trinks (official — TODO)    │ │
│  │ Upload │  │ Ingest  │  │  Direct API integration       │ │
│  └────────┘  └─────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:**

1. Client visit data arrives via a connector (CSV upload, webhook push, or Trinks API pull).
2. The Next.js API normalises and upserts records into PostgreSQL (Prisma ORM).
3. A scheduled BullMQ job runs daily, scoring clients by recency/frequency (RFM-lite).
4. Clients past their re-engagement threshold are enqueued for a WhatsApp message.
5. The worker sends the message via Meta Cloud API (or logs it in mock mode).
6. Delivery status webhooks update the message log in real time.
7. The salon owner sees the dashboard: active clients, at-risk clients, sent messages, revenue recovered.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions) |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Auth | Supabase Auth (magic link + email/password) |
| Database | PostgreSQL 15 via Prisma ORM |
| Queue / Jobs | BullMQ + Redis 7 |
| Rate Limiting | Upstash Ratelimit |
| WhatsApp | Meta Cloud API v19 |
| Email | Nodemailer (SMTP) |
| CSV Parsing | PapaParse |
| Phone Normalisation | libphonenumber-js |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Toasts | Sonner |
| Theming | next-themes (dark / light) |
| Containerisation | Docker + Docker Compose |
| Deployment | Vercel (app) + Supabase (auth/db) + Upstash (Redis) |

---

## Quick Start (Docker)

Prerequisites: Docker Desktop, a `.env.local` file (copy from `.env.example`).

```bash
# 1. Clone the repo
git clone https://github.com/your-org/retoquei.git
cd retoquei

# 2. Copy and fill in environment variables
cp .env.example .env.local

# 3. Start all services (postgres, redis, app, worker)
docker compose up --build

# 4. Run database migrations (first time only)
docker compose exec app npx prisma migrate deploy

# 5. Open the app
open http://localhost:3000

# Optional: open Redis Commander GUI
docker compose --profile tools up redis-commander
# Then visit http://localhost:8081
```

---

## Local Development Setup

### Prerequisites

- Node.js >= 20
- npm >= 10
- Docker Desktop (for Postgres + Redis)
- A Supabase project (free tier works)

### Step-by-step

```bash
# 1. Install dependencies
npm install

# 2. Start local Postgres and Redis only
docker compose up postgres redis -d

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local — at minimum fill in NEXT_PUBLIC_SUPABASE_URL
# and NEXT_PUBLIC_SUPABASE_ANON_KEY from your Supabase project.

# 4. Generate Prisma client
npm run prisma:generate

# 5. Run database migrations
npm run prisma:migrate
# When prompted, give the migration a name e.g. "init"

# 6. (Optional) Seed demo data
npm run seed

# 7. Start the Next.js dev server
npm run dev

# 8. In a separate terminal, start the BullMQ worker
npm run worker:dev
```

App runs at `http://localhost:3000`.
Prisma Studio runs at `http://localhost:5555` after `npm run prisma:studio`.

---

## Environment Variables

See `.env.example` for the full list with inline comments. Key groups:

| Group | Variables |
|---|---|
| App | `NEXT_PUBLIC_APP_URL`, `NODE_ENV` |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` |
| Database | `DATABASE_URL` |
| Redis | `REDIS_URL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| WhatsApp | `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_MOCK_MODE` |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |
| Admin | `ADMIN_SECRET_KEY` |
| Feature Flags | `ENABLE_REAL_WHATSAPP`, `ENABLE_TRINKS_CONNECTOR` |

**Never commit `.env.local` or any real secrets.**

---

## Database Setup

Retoquei uses Prisma ORM with PostgreSQL.

```bash
# Generate the Prisma client after any schema change
npm run prisma:generate

# Create a new migration after editing prisma/schema.prisma
npm run prisma:migrate
# Enter a migration name when prompted

# Apply migrations in production (CI / Docker deploy step)
npx prisma migrate deploy

# Open Prisma Studio (visual DB browser)
npm run prisma:studio

# Seed the database with demo data
npm run seed
```

### Key models (see `prisma/schema.prisma`)

- `Salon` — multi-tenant root entity
- `Client` — normalised client record (phone as canonical identifier)
- `Visit` — each appointment / service visit
- `Campaign` — re-engagement campaign definition
- `Message` — outbound WhatsApp message log
- `Connector` — data source configuration (CSV / webhook / Trinks)

---

## Connector Strategy

Retoquei is connector-agnostic. Visit data can arrive via three channels:

### 1. CSV Upload

The simplest connector. The salon owner exports clients from their existing software and uploads a `.csv` file. Retoquei parses it with PapaParse, normalises phone numbers with libphonenumber-js, deduplicates by phone, and upserts into the database.

**Expected columns (flexible, mapped on upload):**

| Column | Required | Notes |
|---|---|---|
| `name` | Yes | Client full name |
| `phone` | Yes | Any format — normalised to E.164 |
| `last_visit` | Yes | ISO date or common BR format (DD/MM/YYYY) |
| `email` | No | |
| `service` | No | Service name / category |
| `professional` | No | Stylist / professional name |

### 2. Webhook Ingest

Any system that can make HTTP POST requests can push visit events to Retoquei's webhook endpoint at `/api/connectors/webhook`. Protected by a shared secret.

```
POST /api/connectors/webhook
Authorization: Bearer <WHATSAPP_WEBHOOK_VERIFY_TOKEN>
Content-Type: application/json

{
  "event": "visit.completed",
  "salon_external_id": "abc123",
  "client": {
    "name": "Maria Silva",
    "phone": "+5511999990000"
  },
  "visit": {
    "completed_at": "2024-11-15T14:30:00Z",
    "service": "Corte + Escova",
    "professional": "Juliana"
  }
}
```

### 3. Trinks Direct Integration (see below)

---

## Trinks Integration

[Trinks](https://www.trinks.com.br) is a major Brazilian salon scheduling platform. A direct API integration would eliminate the manual CSV export step for salons already using Trinks.

### Current status: TODO — awaiting official API contract

To pursue an official integration:

1. Contact Trinks via the developer/partner portal (or business@trinks.com.br).
2. Request access to the Partner API program.
3. Negotiate the API contract and obtain credentials.

### Expected API contract (assumed, to be confirmed with Trinks)

```
# Authentication
POST /oauth/token
Body: { client_id, client_secret, grant_type: "client_credentials" }
Response: { access_token, expires_in }

# List establishments (salons)
GET /api/v1/establishments
Headers: Authorization: Bearer <access_token>

# List clients for an establishment
GET /api/v1/establishments/:id/clients
Query: page, per_page, updated_after

# List visits / appointments
GET /api/v1/establishments/:id/appointments
Query: page, per_page, status=completed, completed_after

# Webhook registration (if supported)
POST /api/v1/webhooks
Body: { url, events: ["appointment.completed"], secret }
```

### Implementation plan (once API access is granted)

1. Add `TRINKS_API_BASE_URL`, `TRINKS_API_KEY`, `TRINKS_ESTABLISHMENT_ID` to `.env`.
2. Create `src/lib/connectors/trinks.ts` — OAuth2 client + typed API wrappers.
3. Create a BullMQ repeatable job (`trinks-sync`) that polls `/appointments` every 15 minutes.
4. Map Trinks appointment objects to internal `Visit` records and upsert via Prisma.
5. Enable via `ENABLE_TRINKS_CONNECTOR=true` feature flag.

---

## Deployment

### Option A: Vercel + Supabase + Upstash (recommended for production)

```bash
# 1. Push to GitHub

# 2. Import project in Vercel
#    - Set all environment variables from .env.example
#    - Build command: npm run build
#    - Output directory: .next

# 3. Run migrations against your production DB
DATABASE_URL=<prod_url> npx prisma migrate deploy

# 4. Deploy the worker separately on Railway / Render / Fly.io
#    - Dockerfile: Dockerfile.worker
#    - Set DATABASE_URL and REDIS_URL env vars
```

### Option B: Docker (self-hosted / VPS)

```bash
# Build and push images
docker build -t retoquei-app:latest -f Dockerfile .
docker build -t retoquei-worker:latest -f Dockerfile.worker .

# On the server
docker compose -f docker-compose.yml up -d

# Run migrations on first deploy
docker compose exec app npx prisma migrate deploy
```

### Health check endpoint

`GET /api/health` — returns `{ status: "ok", timestamp: "..." }`. Used by Docker health checks and uptime monitors.

---

## Roadmap

### v0.1 — Foundation (current)
- [x] Project scaffold and configuration
- [ ] Prisma schema (Salon, Client, Visit, Campaign, Message)
- [ ] Supabase Auth integration (login / signup)
- [ ] CSV upload connector with column mapping UI
- [ ] Basic dashboard (client list, last visit, days since visit)

### v0.2 — Re-engagement Engine
- [ ] RFM scoring model (Recency, Frequency, Monetary)
- [ ] Campaign builder (trigger rules + WhatsApp template)
- [ ] BullMQ scheduler — daily churn scan
- [ ] WhatsApp send via Meta Cloud API (mock + real mode)
- [ ] Message delivery status webhook

### v0.3 — Multi-tenant SaaS
- [ ] Salon onboarding flow
- [ ] Subscription / billing (Stripe)
- [ ] Per-salon rate limits
- [ ] White-label branding option

### v0.4 — Trinks Integration
- [ ] Official API contract negotiation
- [ ] OAuth2 Trinks connector
- [ ] Real-time sync via webhook

### v0.5 — Analytics & Insights
- [ ] Revenue recovery attribution
- [ ] Message open/click rates (WhatsApp read receipts)
- [ ] Cohort analysis (client retention curves)
- [ ] Export reports to CSV / PDF

### Future
- [ ] AI-generated personalised message copy
- [ ] Instagram DM channel
- [ ] SMS fallback channel
- [ ] Mobile app (React Native / Expo)

---

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feat/my-feature`).
2. Make your changes with passing lint (`npm run lint`).
3. Open a pull request — describe the change and link any related issues.

## License

Proprietary — all rights reserved. Contact the maintainers for licensing inquiries.
