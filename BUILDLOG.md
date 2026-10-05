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

---

## Phase 6: Interactive Testing Console & Frontend Dashboard

### What AI Helped With
1. **Interactive Single-Page Application**:
   - Engineered an interactive testing console served at `/dashboard` and `/`, eliminating the need for a separate frontend server.
   - Built a dynamic multi-tenant switcher with real-time animated quota consumption gauges.
   - Added interactive testing labs for all 5 acceptance probes:
     - Token pricing calculator with real-time sliders for fresh input, cached input (75% discount), output, and reasoning tokens.
     - Boundary tester with 1-click execution for 1,000th call success and 1,001st call `429 Too Many Requests`.
     - Stripe webhook simulation panel with signed upgrade execution, duplicate event replay (`200 duplicate_ignored`), and forged signature rejection (`400 Bad Request`).
2. **Dashboard Helper APIs**:
   - Added `GET /v1/dashboard/overview`, `POST /v1/dashboard/simulate-webhook`, and `POST /v1/dashboard/reset-boundary`.

---

## Phase 8: Homepage Experience, Progressive Disclosure & Unique Theme Redesign

### What AI & User Collaboration Refined
1. **De-cluttering & Separation of Concerns**:
   - The user identified that immediately redirecting `/` to the dense interactive dashboard caused cognitive overload and visual clutter on initial page load.
   - Designed and implemented a dedicated Product Homepage at `GET /` (`HomeController.renderHome`) presenting a spacious, high-level architectural overview, explaining what MeterFlow is, what problems it solves, user pathways for distinct personas (evaluators, architects, API consumers), and foundational guarantees.
2. **Unique Luxury Fintech Color Palette**:
   - Strictly adhered to user constraints eliminating generic blue, green, purple, and dark orange palettes.
   - Introduced an editorial **Obsidian & Champagne Gold / Sand / Titanium** aesthetic (`#08090b` matte obsidian, `#111317` surface cards, `#d4af37` / `#e5c378` champagne gold accents, `#e6e4df` titanium sand typography).
3. **Progressive Disclosure on Interactive Console (`/dashboard`)**:
   - Refactored the dashboard layout into clear, sequential steps:
     - Step 1: Active Test Tenant Scenario selector (cards with clear scenario labels: Free tier, Pro tier, Section 12 999-call boundary probe, and 402 delinquent subscription probe).
     - Step 2: Real-time Quota & Spend Gauges with subtle gold/ochre progress bars.
     - Step 3: Acceptance Probe Laboratories in a clean tabbed container with live response inspection.
     - Step 4: Refined, toggleable Activity & Audit Ledger avoiding viewport clutter.
4. **Unified Visual Identity Across All Views**:
   - Propagated the Obsidian & Champagne Gold design system to `/` (Homepage), `/dashboard` (Testing Console), `/guides` (Documentation Hub), and `/guides/:slug` (Individual Article Pages).

## Phase 4b: Hardening, Migrations & Simulation Fidelity (post-audit)

### Where AI Was Wrong / What the Audit Caught
1. **Concurrency crash (P0)**: concurrent same-idempotency-key requests raced past the check-then-upsert reservation and crashed the server on Prisma `P2002` (Express 4 does not catch async rejections). Rebuilt as a single-INSERT reservation with race resolution and TTL-based reclaim of stale `IN_PROGRESS` keys; proven by a 12-request parallel flood test (exactly 1 event, zero 500s).
2. **Unit mislabel**: the `costMicrocents` column actually stored micro-dollars (nano/1000). Renamed to `costNanoDollars` across schema, code, and UI inside the initial migration.
3. **No migrations**: schema was managed with `db:push`. Now on real `prisma/migrations` + `migrate deploy`; `npm run up` boots a clean machine in one command.
4. **Placeholder-secret fallback**: missing Stripe env silently used public placeholder secrets. Now fails closed (`ConfigurationError` -> 500).

### Pakistan & Stripe Reality
Stripe offers no merchant program in Pakistan, so no account can be created. The integration is dual-mode by design:
- **Default (documented)**: local signed simulation using Stripe's own `generateTestHeaderString` — the verification path is cryptographically identical to a real forwarded webhook. `npm run stripe:trigger` mirrors `stripe trigger` semantics for all three webhook types plus a forged-signature case.
- **Available**: the real Stripe SDK path (Checkout Session creation, `constructEvent`) is unchanged and works wherever an evaluator has test keys.
Honest limitation, not a workaround pretending to be test mode.

### Reconciliation Worker Made Real
The worker previously only logged warnings. It now: transitions expired ACTIVE subscriptions to `PAST_DUE` (activating 402 enforcement), audits rollup totals, persists every run to `job_run_logs`, and records a persisted FAILED alert when the retry budget is exhausted (Shared Requirement #3: retries + failure alert).

### What AI Helped With
1. **Semi-Formal Knowledge Base Authoring**:
   - Authored 6 comprehensive architectural guides in `docs/guides/` and embedded them in web controllers (`/guides` archive and `/guides/:slug` individual article pages).
   - Employed natural, varied section headings tailored directly to each technical domain without repetitive formulas.
   - Maintained an accessible, semi-formal technical voice suitable for non-technical stakeholders, product leads, and senior backend evaluators.
2. **Contextual In-App Guidance**:
   - Integrated contextual tooltips and direct guide links into the Interactive Testing Console (`/dashboard`), connecting UI elements (idempotency keys, token sliders, quota gauges, webhook verification) directly to their corresponding architectural deep dives.

---
