# DESIGN DOCUMENT: MeterFlow Billing Engine

**Project**: Usage Metering & Billing Engine (`meterflow-billing-engine`)  
**Author**: Abubakar Ahmed (@abubakar-ahmed-dev)  
**Track**: Backend Track — Capstone Project  
**Status**: Implemented — v1.0 (all capstone phases complete)  

---

## 1. Problem Statement

SaaS applications require absolute precision when answering three core operational questions:
1. **How much has this tenant used?** (Tracking diverse consumption: standard API calls and non-uniform AI token types).
2. **How much should they pay?** (Converting usage units into currency without floating-point rounding errors).
3. **Have they reached their plan limits?** (Enforcing boundary quotas deterministically before executing billable operations, preventing over-consumption or double-counting under retries).

The challenge is real-world unreliability: network drops causing client retries that must not result in duplicate billing, Stripe webhooks arriving out of order or replaying, and concurrent requests at the exact boundary of a quota.

---

## 2. One Explicit Non-Goal

- **Live Production Credit Card Processing**: This system intentionally targets **Stripe Test Mode** (and an offline local cryptographic mock test adapter). It will **never** process real money or live payment cards, nor will it handle complex invoicing, tax computation, or multi-currency conversions in the core scope.

---

## 3. Data Model

The data layer uses **PostgreSQL** managed through **Prisma ORM**.

```text
┌─────────────────┐       1:1       ┌──────────────────────┐
│     Tenant      ├─────────────────┤     Subscription     │
│─────────────────│                 │──────────────────────│
│ id (UUID, PK)   │                 │ id (UUID, PK)        │
│ name (String)   │                 │ tenantId (FK, Unique)│
│ stripeCustomerId│                 │ planId (FK -> Plan)  │
│ createdAt       │                 │ stripeSubId (String) │
└────────┬────────┘                 │ status (ACTIVE, etc) │
         │                          │ currentPeriodStart   │
         │ 1:N                      │ currentPeriodEnd     │
         │                          └──────────┬───────────┘
         ▼                                     │ N:1
┌─────────────────────────┐                    ▼
│       UsageEvent        │         ┌──────────────────────┐
│─────────────────────────│         │         Plan         │
│ id (UUID, PK)           │         │──────────────────────│
│ tenantId (FK, Indexed)  │         │ id (String, PK)      │
│ eventType (String)      │         │ name (String)        │
│ apiCallsCount (Int)     │         │ maxApiCallsMonth(Int)│
│ tokensInputFresh (Int)  │         │ maxTokensMonth (Int) │
│ tokensInputCached (Int) │         │ priceCentsMonth (Int)│
│ tokensOutputStd (Int)   │         │ stripePriceId        │
│ tokensOutputReason (Int)│         └──────────────────────┘
│ costNanoDollars (BigInt)│
│ idempotencyKey (Unique) │
│ timestamp (Indexed)     │
└─────────────────────────┘

┌─────────────────────────┐         ┌──────────────────────┐
│    IdempotencyRecord    │         │ ProcessedWebhookEvent│
│─────────────────────────│         │──────────────────────│
│ idempotencyKey (PK)     │         │ stripeEventId (PK)   │
│ tenantId (String)       │         │ eventType (String)   │
│ requestHash (SHA256)    │         │ processedAt (DateTime│
│ status (IN_PROGRESS/...)│         │ status (SUCCESS/...) │
│ responseCode (Int)      │         └──────────────────────┘
│ responseBody (JSON)     │
│ expiresAt (DateTime)    │
└─────────────────────────┘

┌─────────────────────────┐         ┌──────────────────────┐
│      UsageAlert         │         │      JobRunLog       │
│─────────────────────────│         │──────────────────────│
│ id (UUID, PK)           │         │ id (UUID, PK)        │
│ tenantId (FK, Indexed)  │         │ jobName (Indexed)    │
│ thresholdPercent (80/100)│        │ status (SUCCESS/     │
│ metric (calls/tokens)   │         │   FAILED)            │
│ triggeredAt             │         │ detail (String?)     │
│ acknowledged            │         │ createdAt (Indexed)  │
└─────────────────────────┘         └──────────────────────┘
```

---

## 4. API Surface

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/meter/billable` | Record a billable event (API call or simulated AI tokens). Idempotent via `Idempotency-Key` header. | `200 OK`, `400 Bad Request`, `402 Payment Required`, `404 Not Found`, `409 Conflict`, `422 Unprocessable`, `429 Too Many Requests` |
| `POST` | `/v1/generate` | Billable AI generation dummy endpoint exercising the full metering & quota pipeline. | Same as `/v1/meter/billable` |
| `GET` | `/v1/usage` | Rollup tenant usage for active billing cycle: calls used, tokens used, limits, and cost breakdown. | `200 OK`, `401 Unauthorized`, `404 Not Found` |
| `POST` | `/v1/billing/checkout` | Create Stripe Checkout session to upgrade tenant from Free to Pro. | `200 OK`, `400 Bad Request` |
| `POST` | `/v1/webhooks/stripe` | Stripe signature-verified webhook handler for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. | `200 OK`, `400 Bad Request` (Forged signature) |
| `GET` | `/health` | Liveness and readiness health check probe (evaluates DB connection). | `200 OK`, `503 Service Unavailable` |
| `GET` | `/docs` | OpenAPI / Swagger interactive API documentation. | `200 OK` |
| `GET` | `/dashboard` | Developer & Evaluator visual console (meter progress bars, tenant switcher). | `200 OK` |

---

## 5. Plans & Quotas Definition

| Plan | Monthly Price | Monthly API Calls Limit | Monthly AI Tokens Limit | Stripe Price Identifier |
| :--- | :--- | :--- | :--- | :--- |
| **Free** | \$0.00 (`0` cents) | **1,000 calls** | **100,000 tokens** | N/A (Default tier) |
| **Pro** | \$29.00 (`2900` cents)| **50,000 calls** | **5,000,000 tokens** | `price_pro_monthly_test` |

---

## 6. Layer Sketch

```text
               HTTP Request (JSON / Headers)
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Express Layer                       │
│  - Raw Body Parser (for Webhook Signature verification) │
│  - Request Logging with Secret Redaction (Pino)         │
│  - Zod Input Validation Middleware                      │
│  - Global Error Handler (Clean 4xx, never 500 on inputs)│
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     Service Layer                       │
│  - MeterService: Atomically reserves idempotency keys   │
│  - QuotaService: Verifies quota before execution        │
│  - CostCalculator: Evaluates integer micro-cent costs   │
│  - PaymentService: Stripe Webhook HMAC & session logic  │
│  - AlertService: Emits threshold notifications (80/100%)│
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Data / Storage Layer                  │
│  - Prisma ORM Client                                    │
│  - PostgreSQL 16 (ACID transactions, indexed lookups)   │
└─────────────────────────────────────────────────────────┘
```

---

## 7. The Metering API Contract & Idempotency Strategy

### Contract
Clients invoke billable endpoints providing:
- Header `X-Tenant-Id: <tenant_uuid>` (or authenticated tenant token)
- Header `Idempotency-Key: <unique_string>`
- Body:
```json
{
  "action": "ai_generate",
  "tokens": {
    "freshInput": 1200,
    "cachedInput": 400,
    "standardOutput": 600,
    "reasoning": 250
  }
}
```

### Idempotency Strategy (atomic reservation protocol)
1. **Hash Verification**: Server computes SHA256 of the path and canonical body payload (`requestHash`).
2. **Atomic Key Reservation** — the key is claimed by a **single `INSERT`** into `idempotency_records` (primary key) with status `IN_PROGRESS`. There is no check-then-insert window.
   - On insert success: caller owns the reservation.
   - On unique-violation (`P2002`) the loser re-reads the record and resolves:
     - `COMPLETED` + matching `requestHash` → replay the stored `responseCode`/`responseBody` with header `X-Idempotent-Replayed: true`. **Zero new usage events.**
     - `COMPLETED` + different `requestHash` → `422 Unprocessable Entity` (key reuse with changed payload).
     - `IN_PROGRESS` within TTL → `409 Conflict` ("concurrent in-flight request").
     - `IN_PROGRESS` **past `expiresAt`** (crashed request) → reclaimed atomically via a conditional `UPDATE ... WHERE status = 'IN_PROGRESS' AND expiresAt < now()`; the reclaim winner proceeds as owner.
3. **Quota Pre-Check**:
   - Computes sum of usage events in the active monthly billing window.
   - If `currentUsage + requestedUsage > limit`:
     - If subscription is not `ACTIVE` (lapsed/canceled): **`402 Payment Required`**.
     - If plan is active: **`429 Too Many Requests`** with `Retry-After`.
     - Updates `IdempotencyRecord` to `COMPLETED` with the 4xx status so retries mirror the rejection.
     - **No usage event is written.**
4. **Execution & Commitment**:
   - Integer cost computation, then one atomic transaction:
     - Inserts `UsageEvent` (unique `(tenantId, idempotencyKey)` is the final backstop — a losing writer catches `P2002` and mirrors the owner's stored response).
     - Updates `IdempotencyRecord` to `COMPLETED` with status `200` and the result body.
   - Returns `200 OK`.

---

## 8. Pricing Formulas & Integer Precision

Token pricing rules (constants pinned in `src/config/pricing.ts`):
- **Fresh input**: \$2.00 / 1M tokens → 2,000 nano-dollars per token
- **Cached input**: \$0.50 / 1M tokens → 500 nano-dollars per token (75% discount)
- **Standard output**: \$8.00 / 1M tokens → 8,000 nano-dollars per token
- **Reasoning tokens**: billed at the output rate (8,000 nano) — never free
- **API calls**: \$10.00 / 1M calls → 10,000 nano-dollars per call

**Currency unit**: nano-dollars in computation ($1 = 10^9$ nano), stored per event as integer `costNanoDollars` (nano / 1000). All arithmetic is `BigInt`; display cents round up (never float).

$$\text{Cost}_{\text{nano}} = (T_{\text{fresh}} \times 2000) + (T_{\text{cached}} \times 500) + (T_{\text{output}} \times 8000) + (T_{\text{reasoning}} \times 8000)$$

---

## 9. Design Decisions (ADR summary)

| Decision | Choice | Rationale |
| :--- | :--- | :--- |
| Money unit | Integer nano-dollars, `BigInt`, stored as `costNanoDollars` | Sub-cent precision for per-token pricing with zero IEEE-754 drift; honest column name |
| Idempotency protocol | Single-INSERT reservation + `P2002` resolution + TTL reclaim | Check-then-insert races crashed under concurrent retries; database constraints are the final authority |
| Stripe mode | Dual-mode: signed local simulation (default) / real Stripe test SDK | Stripe has no merchant program in Pakistan; simulation uses Stripe's own signature generator so the verification path is identical. Real path works unchanged wherever an account exists |
| Secret handling | Fail closed (`ConfigurationError` → 500) | Placeholder-secret fallbacks would let forged webhooks verify against a public value |
| Schema management | Committed Prisma migrations + `migrate deploy` | Shared requirement: "schema as migrations"; `npm run up` boots a clean machine in one command |
| Background reconciliation | Hourly cron: expire lapsed subscriptions to `PAST_DUE`, audit rollups, persist run logs, alert on retry exhaustion | Turns 402 enforcement self-healing; satisfies "retries + failure alert" |
| Unknown tenant | `404`, not `429` | Status-code honesty at the boundary |
