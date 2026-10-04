# Guaranteeing Exactly-Once Metering Under Network Retries

In distributed computer systems, network connections are inherently unreliable. When an HTTP client sends a request to record a billable event, the request travels across multiple hops: client network adapters, firewalls, load balancers, web application servers, and database pools.

If a network timeout occurs while the client is waiting for a response, the client cannot tell whether:
1. The request was dropped *before* reaching the server, meaning no work was done.
2. The server processed the request and recorded the usage event, but the HTTP response was lost on the return path.

When the client automatically retries the operation, a naive billing service will execute the logic a second time, recording two usage events and charging the customer twice. This guide explains how MeterFlow solves this problem using an atomic, two-phase idempotency protocol.

---

## The Concept and Mechanics of Idempotency

An operation is defined as **idempotent** if performing it multiple times yields the exact same state and result as performing it once. In HTTP APIs, `GET` and `DELETE` requests are typically idempotent by specification, whereas `POST` requests are not idempotent by default.

To make billable `POST` endpoints idempotent, clients generate and supply a unique header with every request:
```http
POST /v1/meter/billable HTTP/1.1
Host: api.example.com
X-Tenant-Id: 00000000-0000-0000-0000-000000000001
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Content-Type: application/json

{
  "action": "ai_generate",
  "tokens": { "freshInput": 1000, "standardOutput": 500 }
}
```

The `Idempotency-Key` serves as a contract: the client promises that any subsequent request carrying this identical key is an intentional retry of the original attempt.

---

## The Two-Phase Idempotency Protocol

A common flaw in simple idempotency implementations is writing the idempotency record only *after* the billable work is completed. If two identical requests arrive simultaneously due to aggressive client retry policies or race conditions, both requests might check for an existing record, find none, and proceed to execute concurrently.

MeterFlow addresses this concurrency race condition using an explicit **Two-Phase Reservation Protocol**:

```text
Client Request
      │
      ▼
┌──────────────────────────────────────────────┐
│ Phase 1: Key Reservation                     │
│ Query `idempotency_records` table            │
└──────┬───────────────────────────────────────┘
       │
       ├─► Status: COMPLETED ────────────► Return Cached Status & Body (0 new events)
       ├─► Status: IN_PROGRESS ──────────► Return HTTP 409 Conflict (Concurrent execution)
       │
       └─► Key Not Found:
           INSERT (status='IN_PROGRESS', requestHash, expiresAt)
                 │
                 ▼
┌──────────────────────────────────────────────┐
│ Phase 2: Execution & State Transition        │
│ Run Quota Check & Compute Integer Cost       │
│ Database Transaction:                        │
│   1. INSERT INTO usage_events                │
│   2. UPDATE idempotency_records              │
│      SET status='COMPLETED', responseBody    │
└────────────────┬─────────────────────────────┘
                 │
                 ▼
           HTTP 200 OK
```

### 1. The IN_PROGRESS State
When a new key is received, the server attempts to insert an `idempotency_records` row with `status = "IN_PROGRESS"`. If a concurrent request with the same key arrives while the first request is still processing, the database enforces the primary key constraint, preventing the second request from progressing and returning `HTTP 409 Conflict`.

### 2. The COMPLETED State
Once the billable event is verified and written to `usage_events`, the idempotency record is updated to `status = "COMPLETED"`, storing the exact HTTP response code and serialized JSON payload. Any subsequent retry bypasses the metering engine entirely and immediately returns the cached response with the response header `X-Idempotent-Replayed: true`.

---

## Preventing Payload Tampering with SHA-256 Fingerprinting

What happens if an errant or malicious client reuses an existing idempotency key, but transmits a completely different request body (for instance, requesting 50,000 tokens instead of 1,000 tokens)?

If the server simply returned the cached response of the earlier request, the client would receive a misleading response that does not correspond to the payload it sent.

To enforce cryptographic integrity, MeterFlow computes a SHA-256 hash of the canonical request path and serialized body upon arrival:
```typescript
const requestHash = crypto
  .createHash("sha256")
  .update(`${requestPath}:${JSON.stringify(requestPayload)}`)
  .digest("hex");
```

This hash is stored alongside the idempotency key. When a retried request arrives:
- If `requestHash === existing.requestHash`: The retry is legitimate. The server returns the cached response.
- If `requestHash !== existing.requestHash`: The client has improperly reused a key with differing parameters. The server rejects the request with **`HTTP 422 Unprocessable Entity`**, accompanied by an explicit error message explaining the payload mismatch.

---

## Storage Lifecycle and Key Expiration

Idempotency records cannot remain in transactional storage indefinitely without degrading database indexes over time. In real-world SaaS environments, network retries occur within seconds or minutes of the initial failure.

MeterFlow configures an automated Time-To-Live (TTL) on idempotency keys via the `expiresAt` timestamp (defaulting to 24 hours). Historical idempotency records older than the retention window can be purged safely during scheduled maintenance without impacting ongoing metering correctness.
