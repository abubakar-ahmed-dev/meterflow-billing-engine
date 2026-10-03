# AI Usage Log (`BUILDLOG.md`)

This log honestly documents where AI assistance helped, where it made assumptions that needed correction, and the engineering refinements made throughout the project lifecycle.

---

## Phase 1: Planning, Problem Framing & Architecture

### What AI Helped With
1. **Capstone Brief Ingestion & Analysis**:
   - Extracted and analyzed the 10-page project specifications PDF (`Usage Metering Billing Engine Live Capstone.pdf`).
   - Mapped all 5 Acceptance Probes from Section 12 to concrete code design rules.
   - Designed the database ERD, API schema, and boundary enforcement rules.
2. **Pakistan & Stripe Sandbox Feasibility Research**:
   - Identified that Stripe merchant accounts cannot be created in Pakistan.
   - Identified that Stripe webhook verification is purely local HMAC-SHA256 cryptography and does not require an active Stripe account or external API calls.
   - Designed a dual-mode Stripe adapter (`MOCK_STRIPE=true` for local development/testing in Pakistan, and standard Stripe SDK for external evaluator grading).

### Where AI Was Wrong or Made Assumptions
1. **Initial Tech Stack Bias**:
   - The initial plan defaulted to Python + FastAPI. The user requested Node.js + TypeScript (Express with Prisma ORM), which aligns better with modern JavaScript full-stack workflows. The plan and architecture were immediately refactored.
2. **Missing Local Webhook Testing Tooling**:
   - Early plan assumed evaluator-only Stripe CLI execution. AI was prompted to ensure self-contained local testing in Pakistan without an account. We introduced `stripe.webhooks.generateTestHeaderString` and mock simulation test fixtures.

### Architectural Decisions & Changes Made
1. **Strict Integer Currency Units**:
   - Refined currency storage to `BigInt` micro-cents ($1 = 100,000,000$ micro-cents) to guarantee zero IEEE-754 floating-point errors.
2. **Two-Phase Idempotency Protocol**:
   - Added an `IN_PROGRESS` reservation step with SHA256 payload hashing to prevent race conditions during concurrent retries with identical keys.
3. **Phase 1 Gate Completed**:
   - Produced and committed `DESIGN.md` defining data models, API surface, layer sketch, explicit non-goals, and idempotency guarantees.

---

## Phase 2: Core Billing Logic & Idempotency

### What AI Helped With
1. **Prisma ORM Modeling**:
   - Authored PostgreSQL schema with multi-tenant isolation, composite indexes on `(tenantId, timestamp)`, and unique constraint on `(tenantId, idempotencyKey)`.
2. **Deterministic Pre-Seeding**:
   - Pre-seeded Boundary Tenant (`00000000-0000-0000-0000-000000000003`) at 999/1,000 calls to enable instant verification of 1,000th call success and 1,001st call `429 Too Many Requests`.
   - Pre-seeded Lapsed Tenant (`00000000-0000-0000-0000-000000000004`) with `PAST_DUE` subscription for `402 Payment Required` verification.

### Where AI Was Wrong or Made Assumptions
1. **Docker Container Selection**:
   - Initially specified `postgres:16-alpine` in `docker-compose.yml`. On Windows WSL2 with containerd snapshotter, `postgres:16-alpine` encountered an entrypoint execution error. AI identified the issue and switched to standard Debian-based `postgres:16`, which booted immediately without issues.

---

## Phase 3: Stripe Test Mode & Webhook Synchronization

### What AI Helped With
1. **Cryptographic HMAC Signature Verification**:
   - Implemented `StripePaymentService.constructWebhookEvent` using raw request buffer to ensure cryptographic signature integrity.
2. **Webhook Replay Idempotency**:
   - Added table `processed_webhook_events` tracking `stripeEventId` to prevent duplicate plan transitions on webhook retries.
3. **Local Testing Without Stripe Account**:
   - Created `scripts/simulate-webhook.ts` using `stripe.webhooks.generateTestHeaderString` allowing complete end-to-end testing in Pakistan without requiring a merchant account or Stripe CLI login.

---

## Phase 4: Token Pricing Engine, Background Jobs & Observability

### What AI Helped With
1. **BigInt Integer Arithmetic**:
   - Encoded non-linear pricing in nano-dollars ($10^{-9}$ USD): cached input discounted at 75%, reasoning tokens billed strictly as output tokens.
2. **Background Reconciliation Worker**:
   - Implemented `ReconciliationWorker` using `node-cron` with exponential backoff retries and alert logging, satisfying Shared Requirement #3 ($\ge 1$ background job).
3. **Developer Dashboard & Swagger UI**:
   - Created `/dashboard` web console and `/docs` OpenAPI 3.0 documentation.

---

## Phase 5: Verification & Quality Assurance

### What AI Helped With
1. **Vitest Automated Suite**:
   - Authored 11 automated unit and integration tests covering all 5 Acceptance Probes. All tests pass with zero failures.
2. **Evidence Documentation**:
   - Assembled `EVIDENCE.md` with verified terminal logs, test outputs, and cURL transcripts.
