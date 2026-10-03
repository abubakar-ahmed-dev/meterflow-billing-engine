# DESIGN DOCUMENT: MeterFlow Billing Engine

**Project**: Usage Metering & Billing Engine (`meterflow-billing-engine`)  
**Author**: Abubakar Ahmed (@abubakar-ahmed-dev)  
**Track**: Backend Track — Capstone Project  
**Status**: Approved & In Progress (Phase 1 Gate)  

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
│ costMicrocents (BigInt) │
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
```

---

## 4. API Surface

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/meter/billable` | Record a billable event (API call or simulated AI tokens). Idempotent via `Idempotency-Key` header. | `200 OK`, `400 Bad Request`, `402 Payment Required`, `409 Conflict`, `422 Unprocessable`, `429 Too Many Requests` |
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

### Idempotency Strategy
1. **Hash Verification**: Server computes SHA256 of the path and canonical body payload (`requestHash`).
2. **Atomic Key Reservation**:
   - Queries `IdempotencyRecord` for `(tenantId, idempotencyKey)`.
   - If found with `COMPLETED`:
     - If stored `requestHash` matches: Returns cached `responseCode` and `responseBody` with header `X-Idempotent-Replayed: true`. **Zero new usage events recorded.**
     - If stored `requestHash` differs: Rejects with `422 Unprocessable Entity` ("Idempotency key reused with mismatched payload").
   - If found with `IN_PROGRESS`: Returns `409 Conflict` ("Concurrent in-flight request").
   - If not found: Inserts record with status `IN_PROGRESS`.
3. **Quota Pre-Check**:
   - Computes sum of usage events in the active monthly billing window.
   - If `currentUsage + requestedUsage > limit`:
     - If plan is expired/canceled/past_due: Returns **`402 Payment Required`**.
     - If plan is active: Returns **`429 Too Many Requests`**.
     - Updates `IdempotencyRecord` to `COMPLETED` with the 4xx status.
     - **No usage event is written to `UsageEvent`.**
4. **Execution & Commitment**:
   - Runs billable logic and integer cost computation.
   - Within an atomic transaction:
     - Inserts `UsageEvent`.
     - Updates `IdempotencyRecord` status to `COMPLETED` with status `200` and result body.
   - Returns `200 OK`.

---

## 8. Pricing Formulas & Integer Precision

Token pricing rules:
- **Cached Input Tokens**: Billed at 25% of fresh input rate (75% discount).
- **Reasoning Tokens**: Billed at 100% of standard output rate (not free).
- **Currency Unit**: Micro-cents (\$1.00 = $100,000,000$ micro-cents).

$$\text{Cost} = (T_{\text{fresh}} \times 250) + (T_{\text{cached}} \times 62.5) + ((T_{\text{output}} + T_{\text{reasoning}}) \times 1000)\text{ micro-cents}$$
