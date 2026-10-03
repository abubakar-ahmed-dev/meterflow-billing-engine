# EVALUATION EVIDENCE PACK (`EVIDENCE.md`)

This document contains pasted proof and verifiable terminal outputs for every requirement checkbox in **Section 6** of the Capstone Brief.

---

## 1. Metering & Idempotency

### [x] Requirement 1 & 2: A billable action creates exactly one usage event under retries; proof of no double-counting

**Evidence**: Automated test execution from `tests/integration/acceptance_probes.test.ts` (PROBE 1).

```text
✓ tests/integration/acceptance_probes.test.ts > Acceptance Probes Suite > PROBE 1 — Idempotent Metering > deduplicates retried requests and creates exactly one usage event (981ms)
[06:22:40 UTC] INFO: ⚡ Idempotent request replay detected; returning cached response with zero new usage events.
    tenantId: "00000000-0000-0000-0000-000000000001"
    idempotencyKey: "probe-1-key-1791008559062"
```

**cURL Verification Transcript**:
1. Initial Request (Created event):
```bash
curl -i -X POST http://localhost:3000/v1/meter/billable \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \
  -H "Idempotency-Key: manual-demo-key-001" \
  -d '{"action": "generate", "tokens": {"freshInput": 1000, "cachedInput": 400, "standardOutput": 500, "reasoning": 200}}'
```
Response:
```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "success": true,
  "data": {
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "eventType": "ai_token",
    "apiCallsRecorded": 1,
    "tokensRecorded": 2100,
    "breakdown": {
      "freshInput": 1000,
      "cachedInput": 400,
      "standardOutput": 500,
      "reasoning": 200
    },
    "cost": {
      "totalCostCents": 1,
      "formattedUsd": "$0.007800",
      "costMicrocents": "7800"
    },
    "planId": "free"
  }
}
```

2. Replay with identical `Idempotency-Key`:
```http
HTTP/1.1 200 OK
X-Idempotent-Replayed: true
Content-Type: application/json; charset=utf-8

{
  "success": true,
  "data": {
    "tenantId": "00000000-0000-0000-0000-000000000001",
    "eventType": "ai_token",
    "apiCallsRecorded": 1,
    "tokensRecorded": 2100,
    "cost": {
      "totalCostCents": 1,
      "formattedUsd": "$0.007800",
      "costMicrocents": "7800"
    }
  }
}
```
**Database Query Verification**:
```sql
SELECT count(*) FROM usage_events WHERE idempotency_key = 'manual-demo-key-001';
-- Returns: 1
```

---

## 2. Quota Enforcement & Boundary Honesty

### [x] Requirement 3 & 4: Requests over limit rejected with 429 / 402 and clear explanation

**Evidence**: Automated test execution from `tests/integration/acceptance_probes.test.ts` (PROBE 2).

```text
✓ tests/integration/acceptance_probes.test.ts > Acceptance Probes Suite > PROBE 2 — Quota Boundary Enforcement > allows request reaching exact boundary (1,000th call) and blocks 1,001st with 429 (388ms)
✓ tests/integration/acceptance_probes.test.ts > Acceptance Probes Suite > PROBE 2 — Quota Boundary Enforcement > returns 402 Payment Required for tenant with PAST_DUE subscription
```

**cURL Transcript for 1,001st call (Quota Exceeded -> 429)**:
```bash
curl -i -X POST http://localhost:3000/v1/meter/billable \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000003" \
  -H "Idempotency-Key: boundary-test-call-1001" \
  -d '{"apiCallsCount": 1}'
```
Response:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 2419200
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "error": "quota_exceeded",
  "message": "Monthly API call quota exceeded. Current: 1000, Requested: 1, Limit: 1000.",
  "metric": "api_calls",
  "currentUsage": 1000,
  "requestedUsage": 1,
  "limit": 1000,
  "retryAfterSeconds": 2419200
}
```

**cURL Transcript for Lapsed Subscription (Unpaid / Past Due -> 402)**:
```bash
curl -i -X POST http://localhost:3000/v1/meter/billable \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000004" \
  -H "Idempotency-Key: lapsed-test-01" \
  -d '{"apiCallsCount": 1}'
```
Response:
```http
HTTP/1.1 402 Payment Required
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "error": "payment_required",
  "message": "Tenant subscription is PAST_DUE. Payment or plan renewal required."
}
```

---

## 3. Cost Calculation & AI Token Pricing

### [x] Requirement 5, 6 & 7: Pinned pricing rules with cached discount and reasoning tokens

**Evidence**: Unit test execution from `tests/unit/pricing.test.ts` (PROBE 5).

```text
✓ tests/unit/pricing.test.ts (4 tests) 11ms
  ✓ bills cached input tokens at 25% of fresh input tokens (75% discount)
  ✓ bills reasoning tokens strictly at standard output token pricing
  ✓ combines categories correctly without loss of precision
  ✓ handles zero usage without errors
```

**Formula Verification**:
- Fresh input rate: \$2.00 / 1M ($2,000$ nano-dollars / token)
- Cached input rate: \$0.50 / 1M ($500$ nano-dollars / token — strictly 25% of fresh rate)
- Output token rate: \$8.00 / 1M ($8,000$ nano-dollars / token)
- Reasoning token rate: \$8.00 / 1M ($8,000$ nano-dollars / token — strictly billed as output rate)

```text
Test Vector:
- Fresh Input: 1,000,000 tokens    -> $2.000000
- Cached Input: 1,000,000 tokens   -> $0.500000
- Standard Output: 500,000 tokens  -> $4.000000
- Reasoning: 250,000 tokens        -> $2.000000
-----------------------------------------------
Total Expected Cost:               -> $8.500000 (8,500,000,000 nano-dollars = 850 cents)
Calculator Result:                 -> 8,500,000,000 nano-dollars ($8.500000 / 850 cents)
MATCH: EXACT
```

**cURL Transcript from `GET /v1/usage`**:
```bash
curl -s http://localhost:3000/v1/usage?tenantId=00000000-0000-0000-0000-000000000001
```
Output:
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": "free",
      "name": "Free Tier",
      "maxApiCallsPerMonth": 1000,
      "maxTokensPerMonth": 100000
    },
    "cost": {
      "totalCostCents": 1,
      "totalCostMicrocents": "7800",
      "formattedUsd": "$0.007800",
      "itemizedTokensCost": {
        "freshInputNano": "2000000",
        "cachedInputNano": "200000",
        "outputNano": "4000000",
        "reasoningNano": "1600000"
      }
    }
  }
}
```

---

## 4. Stripe Subscription Integration

### [x] Requirement 8 & 9: Test mode checkout, signature verification, and event deduplication

**Evidence**: Automated test execution from `tests/integration/acceptance_probes.test.ts` (PROBE 3 & 4).

```text
[06:22:40 UTC] WARN: 🚫 Forged or invalid webhook signature rejected with 400
✓ PROBE 4: rejects forged or invalid webhook signatures with 400 Bad Request
[06:22:41 UTC] INFO: 🚀 Upgraded tenant to PRO tier via verified webhook
✓ PROBE 3 & 4: processes valid webhook, upgrades tenant Free -> Pro, and deduplicates replays
[06:22:41 UTC] INFO: ⚡ Replayed webhook event ignored (idempotent deduplication)
```

**Forged Signature Rejection Transcript**:
```bash
curl -i -X POST http://localhost:3000/v1/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=12345,v1=tampered_signature_hex" \
  -d '{"id": "evt_tampered_001", "type": "checkout.session.completed"}'
```
Response:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json; charset=utf-8

{
  "success": false,
  "error": "invalid_signature",
  "message": "Webhook signature verification failed: No signatures found matching the expected signature for payload."
}
```

**Replay Event Transcript**:
```text
Event 'evt_test_checkout_1791008560848' sent twice:
1st Delivery: HTTP 200 {"received": true, "status": "processed"} -> Tenant upgraded to PRO
2nd Delivery: HTTP 200 {"received": true, "status": "duplicate_ignored"} -> 0 duplicate updates
```

---

## 5. Background Jobs & Resilience

### [x] Requirement 10: $\ge 1$ background job off request path with retries and failure alerts

**Evidence**: Standalone execution of `npm run job:reconcile` and hourly background cron scheduler (`ReconciliationWorker`).

```text
> npm run job:reconcile
> tsx scripts/run-job.ts

[06:23:57 UTC] INFO: ⚙️ [Background Worker] Starting Usage Rollup & Subscription Reconciliation pass...
[06:23:58 UTC] INFO: ✅ [Background Worker] Reconciliation & usage rollup audit completed successfully.
    durationMs: 725
    auditedSubscriptions: 3
    flaggedExpiries: 0
    totalUsageEventsRecorded: 4
    totalApiCallsSum: 1002
```

---

## 6. Summary of Acceptance Probes Result

| Acceptance Probe | Test Name | Status | Verified Behavior |
| :--- | :--- | :--- | :--- |
| **PROBE 1** | `deduplicates retried requests` | **PASS** | Same request sent twice records 1 usage event; second mirrors first. |
| **PROBE 2** | `allows boundary call (1,000) and blocks 1,001` | **PASS** | 1,000th call succeeds; 1,001st returns 429 with `Retry-After`. |
| **PROBE 2 (402)** | `returns 402 Payment Required` | **PASS** | Lapsed tenant subscription returns 402 with clear reason. |
| **PROBE 3** | `upgrades tenant Free -> Pro via webhook` | **PASS** | Signed Stripe checkout webhook flips plan to Pro (50,000 calls limit). |
| **PROBE 4** | `rejects forged signature (400) & ignores replay` | **PASS** | Bad HMAC signature rejected with 400; replayed event ignored with 200. |
| **PROBE 5** | `matches pinned pricing rules in GET /usage` | **PASS** | Cached input discounted 75%; reasoning billed as output; integer precision. |
