# ⚡ MeterFlow Billing Engine

[![CI Pipeline](https://github.com/abubakar-ahmed-dev/meterflow-billing-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/abubakar-ahmed-dev/meterflow-billing-engine/actions)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-v22-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-teal?logo=prisma)
![License](https://img.shields.io/badge/License-MIT-purple)

> Production-grade multi-tenant usage metering and billing service built with **Node.js, TypeScript, Express, PostgreSQL, and Prisma**. Features **atomic idempotency guarantees**, **boundary quota enforcement**, **real-world AI token pricing math** (cached input discounts & reasoning token rates), and **resilient Stripe test-mode webhook synchronization**.

---

## 📌 Features & Architecture

- **Exactly-Once Metering**: Guaranteed zero double-counting on network retries using database-level unique constraints and SHA256 payload verification.
- **Honest Quota Boundaries**: Enforces monthly limits before executing billable actions:
  - `429 Too Many Requests`: When an active plan quota is exhausted (paired with `Retry-After`).
  - `402 Payment Required`: When a tenant subscription has lapsed (`PAST_DUE`).
- **AI Token Pricing Math**: Pure `BigInt` integer arithmetic in nano-dollars ($1 = 1,000,000,000\text{ nano-units}$) to eliminate floating-point drift:
  - Fresh Input: \$2.00 / 1M tokens ($2,000$ nano-dollars / token)
  - Cached Input: \$0.50 / 1M tokens ($500$ nano-dollars / token — 75% discount)
  - Standard Output: \$8.00 / 1M tokens ($8,000$ nano-dollars / token)
  - Reasoning ("Thinking") Tokens: Billed identically to output tokens ($8,000$ nano-dollars / token)
- **Stripe Dual-Mode Webhooks**: Cryptographic HMAC-SHA256 signature verification (`whsec_...`) and event deduplication. Supports both live Stripe CLI forwarding and local mock simulation without needing a merchant account.
- **Background Jobs & Observability**: Hourly background reconciliation worker with exponential backoff retries, structured JSON logging with secret redaction (Pino), and 80%/100% usage threshold alerts.
- **Homepage, Visual Console & Architecture Hub**: Dedicated explanatory product homepage at `/`, interactive developer testing sandbox at `/dashboard`, engineering knowledge base at `/guides`, and OpenAPI 3.0 documentation at `/docs`.

```text
                                  CLIENT REQUEST
                                        │
                         [Idempotency-Key & X-Tenant-Id]
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │   Express API Gateway       │
                         │   - Secret-redacted logging │
                         │   - Zod schema validator    │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                         ┌─────────────────────────────┐
                         │      Idempotency Check      │
                         │  - Key exists & completed?  │──► [Yes] ──► Return Cached JSON (0 new events)
                         │  - Payload altered? (422)   │
                         │  - In progress? (409)       │
                         └──────────────┬──────────────┘
                                        │ [New Key]
                                        ▼
                         ┌─────────────────────────────┐
                         │      Quota Pre-Check        │
                         │  - Status past_due? (402)   │
                         │  - Quota exceeded? (429)    │──► [Exceeded] ──► Reject & Return 429 / 402
                         └──────────────┬──────────────┘
                                        │ [Allowed]
                                        ▼
                         ┌─────────────────────────────┐
                         │   Atomic Transaction        │
                         │   - Record UsageEvent       │
                         │   - Mark Key COMPLETED      │
                         │   - Compute integer cost    │
                         └──────────────┬──────────────┘
                                        │
                                        ▼
                                 HTTP 200 OK
```

---

## 🚀 Quickstart & Setup

### Prerequisites
- Node.js $\ge$ 20 (v22 recommended)
- Docker Desktop (or local PostgreSQL 16)

### One-Command Bootstrap
```bash
git clone https://github.com/abubakar-ahmed-dev/meterflow-billing-engine.git
cd meterflow-billing-engine
cp .env.example .env
npm install
npm run up
```

`npm run up` starts PostgreSQL via Docker Compose, waits for it to accept connections, applies migrations (`prisma migrate deploy`), seeds demo data, builds, and starts the server on port 3000.

### Manual Setup (step by step)
```bash
git clone https://github.com/abubakar-ahmed-dev/meterflow-billing-engine.git
cd meterflow-billing-engine

# Copy placeholder environment variables
cp .env.example .env

# Start PostgreSQL Container
docker compose up -d

# Install Dependencies, Migrate & Seed Database
npm install
npx prisma migrate deploy
npm run seed

# Start Server
# Production mode
npm run build
npm start

# Or development mode with auto-reload
npm run dev
```

The service will boot at **`http://localhost:3000`**:
- **Product Homepage & Architectural Overview**: [http://localhost:3000/](http://localhost:3000/)
- **Interactive Testing Console**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Architecture & System Guides**: [http://localhost:3000/guides](http://localhost:3000/guides) (or browse markdown in [`docs/guides/`](./docs/guides/README.md))
- **OpenAPI Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

---

## 🧪 Running Automated Tests

Run the complete test suite verifying all 5 Section 12 Acceptance Probes:
```bash
npm test
```

Run test suite with code coverage:
```bash
npm run test:coverage
```

Execute background reconciliation worker manually:
```bash
npm run job:reconcile
```

---

## 📡 API Reference & cURL Recipes

### Pre-Seeded Test Tenants

| Tenant Name | Tenant UUID | Plan | Pre-Seeded Condition |
| :--- | :--- | :--- | :--- |
| **Acme Corp** | `00000000-0000-0000-0000-000000000001` | Free (1,000 calls / 100k tokens) | Clean slate |
| **Globex Inc** | `00000000-0000-0000-0000-000000000002` | Pro (50,000 calls / 5M tokens) | Clean slate |
| **Boundary Org** | `00000000-0000-0000-0000-000000000003` | Free | **999 / 1,000 calls used** (Ready for boundary test) |
| **Lapsed LLC** | `00000000-0000-0000-0000-000000000004` | Pro | Subscription `PAST_DUE` (Ready for 402 test) |

---

### 1. Record Billable Action (Idempotency Demo)
```bash
curl -i -X POST http://localhost:3000/v1/meter/billable \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \
  -H "Idempotency-Key: my-unique-request-001" \
  -d '{
    "action": "ai_generate",
    "tokens": {
      "freshInput": 1200,
      "cachedInput": 400,
      "standardOutput": 600,
      "reasoning": 250
    }
  }'
```
*Note: Retrying this command with the same `Idempotency-Key` returns `X-Idempotent-Replayed: true` and creates 0 new database rows.*

### 2. Quota Boundary Test
```bash
# 1,000th call succeeds (HTTP 200)
curl -i -X POST http://localhost:3000/v1/meter/billable \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000003" \
  -H "Idempotency-Key: call-1000" \
  -d '{"apiCallsCount": 1}'

# 1,001st call returns HTTP 429 Too Many Requests
curl -i -X POST http://localhost:3000/v1/meter/billable \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000003" \
  -H "Idempotency-Key: call-1001" \
  -d '{"apiCallsCount": 1}'
```

### 3. Usage Rollup & Itemized Token Breakdown
```bash
curl -s http://localhost:3000/v1/usage?tenantId=00000000-0000-0000-0000-000000000001
```

### 4. Simulate Stripe Webhook Locally (Free $\to$ Pro Upgrade)
```bash
npm run simulate:webhook
```

---

## ⚖️ Limitations & Scope

Per the capstone guidelines, the system maintains intentional scope boundaries:
1. **Test Mode Exclusivity**: Operates strictly with Stripe Test Mode and local mock fixtures. Does not process live cards or real money.
2. **Invoicing & Taxes**: Core engine manages quotas, metering, and Stripe subscriptions. Automated invoice PDF generation and regional tax calculations are omitted.
3. **Simulated AI Processing**: The service measures and prices real AI token counts via HTTP payload parameters; it does not invoke external LLM APIs (OpenAI/Anthropic).

---

## 📄 License
MIT License. Created by [Abubakar Ahmed](https://github.com/abubakar-ahmed-dev).
