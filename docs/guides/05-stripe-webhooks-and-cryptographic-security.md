# Stripe Webhook Synchronization: Cryptographic Verification and Replay Defense

In subscription-based SaaS applications, payment processing does not occur synchronously within the application backend. Customers enter credit card details on secure hosted checkout pages, banks approve or decline charges asynchronously, and recurring invoices renewal attempts occur automatically on payment schedules.

Because payment state transitions happen on third-party infrastructure, the payment processor (such as Stripe) communicates changes to the SaaS backend via **webhooks**—asynchronous HTTP `POST` notifications.

Processing webhooks safely requires addressing two critical security vulnerabilities:
1. **Webhook Forgery**: Preventing malicious third parties from sending fake payment confirmations to upgrade accounts without paying.
2. **Replay Attacks and Duplicate Events**: Ensuring that network retransmissions do not cause duplicate state updates or erratic plan flips.

This guide details the cryptographic validation and deduplication mechanisms used by MeterFlow to mirror payment truth securely.

---

## Source of Truth in Distributed Billing

A core architectural principle in financial engineering is establishing a single, authoritative **Source of Truth**:
- **Stripe** serves as the authoritative source of truth for payment methods, subscription periods, customer dispute statuses, and recurring renewal events.
- **MeterFlow's Database** acts as a read-optimized local replica that mirrors this state to enforce real-time API quotas without introducing network latency to external payment gateways during client requests.

The local database must only be updated when an event is cryptographically verified to have originated from Stripe.

---

## Cryptographic Verification with HMAC-SHA256

When Stripe dispatches a webhook event to the endpoint `/v1/webhooks/stripe`, it attaches a security header:
```http
Stripe-Signature: t=1711800000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

This header contains two critical values:
- `t`: The UNIX timestamp when the event was dispatched.
- `v1`: The Hash-based Message Authentication Code (**HMAC**) calculated using the SHA-256 cryptographic hash function.

### How the HMAC Verification Works
1. The server retrieves the raw binary request body buffer before any JSON parsing takes place.
2. The server concatenates the timestamp, a literal period (`.`), and the raw payload: `${t}.${rawBody}`.
3. The server computes the HMAC-SHA256 digest using the private webhook signing secret (`whsec_...`) configured in `.env`.
4. The server compares its computed signature against the signature transmitted in the header using a **constant-time comparison** algorithm (`crypto.timingSafeEqual`). Constant-time comparison is essential to protect against timing attacks that attempt to guess secret keys by measuring response latency.

### The Raw Body Buffer Pitfall
A common pitfall when integrating webhooks in Node.js frameworks like Express is mounting a global JSON body parser (`app.use(express.json())`) before the webhook route.

When a JSON parser deserializes a payload and reconstructs it, whitespace, key ordering, and character escapes frequently change:
```text
Original Stripe payload: {"id":"evt_123","type":"charge.succeeded"}
Parsed and re-serialized: { "id": "evt_123", "type": "charge.succeeded" }
```
Even a single altered byte or space alters the resulting SHA-256 hash completely. In MeterFlow, the webhook route is explicitly bound to `express.raw({ type: "application/json" })` *before* the application JSON parser, preserving the raw byte stream for exact cryptographic verification.

If the signature fails or has been forged, the server terminates the request immediately with **`HTTP 400 Bad Request`**, and zero state changes are committed to the database.

---

## Defending Against Webhook Replay Attacks

In real-world networks, webhooks can be delivered more than once. If an intermittent network drop prevents Stripe from receiving an immediate `200 OK` acknowledgment, Stripe's infrastructure will retry the delivery at exponential intervals over the next 72 hours.

If an application does not deduplicate webhook events, handling the same event multiple times can lead to inconsistent state transitions or redundant customer notifications.

MeterFlow prevents duplicate processing using the `processed_webhook_events` table:

```text
Incoming Webhook
       │
       ▼
HMAC Signature Valid? ──► [No] ──► Return HTTP 400 Bad Request
       │
       ├─► [Yes]
       ▼
Query `processed_webhook_events` WHERE stripeEventId = event.id
       │
       ├─► Event Already Exists? ──► Return HTTP 200 { status: "duplicate_ignored" }
       │
       └─► New Event:
           1. Record in `processed_webhook_events` (status='PROCESSING')
           2. Execute State Transition:
              - checkout.session.completed ──► Upgrade Tenant to Pro
              - customer.subscription.updated ──► Sync Period & Status
              - customer.subscription.deleted ──► Downgrade to Free
           3. Mark `processed_webhook_events` status='SUCCESS'
           4. Return HTTP 200 { status: "processed" }
```

By recording the unique `event.id` (e.g. `evt_1Qxyz...`) inside a database transaction, duplicate deliveries are recognized instantly, returning `HTTP 200 OK` to satisfy Stripe's retry mechanism while ensuring state transitions execute strictly once.

---

## Local Sandbox Testing Without a Live Merchant Account

In many global regions (such as Pakistan), creating a live Stripe merchant account with direct bank payouts is not natively supported. Developers often worry that this prevents them from learning or building production-grade billing systems.

However, Stripe's webhook architecture is governed by open cryptographic standards:
1. **Offline Cryptography**: Signature verification uses pure HMAC-SHA256 calculations executed locally on your server. It does not contact external Stripe servers to verify a signature.
2. **Local Test Signatures**: Using `stripe.webhooks.generateTestHeaderString`, developers can generate authentic, cryptographically valid headers for mock event payloads locally.
3. **Dual-Mode Adapter**: MeterFlow includes a configuration flag (`MOCK_STRIPE=true`). When set, the system generates simulated checkout sessions and processes local test webhooks with complete cryptographic verification, enabling 100% test coverage and full demonstration capabilities without requiring external credit cards or restricted merchant registrations.
