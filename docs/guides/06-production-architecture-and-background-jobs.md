# Production Architecture: Layered Separation and Resilient Background Jobs

Enterprise software architecture is evaluated by how effectively it isolates concerns, shields core workflows from failure, and maintains clean operational hygiene. In a billing engine, this means that high-frequency request routing, domain business logic, data persistence, and slow background processing must exist as separate, well-defined architectural layers.

This guide outlines the layered design principles, asynchronous background workers, and zero-trust logging practices implemented in MeterFlow.

---

## Layered Separation of Concerns

MeterFlow organizes backend code into four distinct tiers:

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. HTTP Gateway & Boundary Layer (src/routes, controllers)   │
│    - Parses incoming JSON and raw webhook buffers           │
│    - Zod boundary validation (returns clean 400s, never 500)│
│    - Maps internal domain exceptions to standard HTTP codes │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Domain Service Layer (src/services)                      │
│    - MeterService: Two-phase idempotency protocol           │
│    - QuotaService: Pre-action boundary checks (429 / 402)   │
│    - CostCalculator: BigInt integer money math              │
│    - AlertService: 80% and 100% threshold detection         │
│    - StripePaymentService: Dual-mode HMAC verification      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Asynchronous Worker Tier (src/jobs)                      │
│    - Hourly ReconciliationWorker (node-cron scheduler)      │
│    - Exponential backoff retries & critical failure alerts  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Persistence Tier (src/db, prisma)                        │
│    - Prisma ORM client with strict relationship constraints │
│    - PostgreSQL 16 (ACID transactions, composite indexing)  │
└─────────────────────────────────────────────────────────────┘
```

### Why Layer Separation Matters
- **Testability**: Domain services (such as `CostCalculator` or `QuotaService`) can be tested thoroughly in isolated unit suites without initializing HTTP servers or network listeners.
- **Transport Agnostic**: If the service needs to support gRPC or message queue consumers in the future, the core domain services can be invoked directly without rewriting billing logic.
- **Fail-Safe Boundaries**: Unhandled exceptions originating in application logic are intercepted by the global Express error boundary, preventing internal database connection strings or stack traces from leaking to end users.

---

## Offloading Work with Background Workers

In SaaS billing systems, some tasks are too compute-intensive or slow to execute synchronously inside the client request-response lifecycle. For example:
- Aggregating historical event counts across thousands of tenants.
- Comparing local database subscriptions against remote payment gateway states to identify missed webhook events.
- Emitting threshold notifications and audit summaries.

Placing these long-running tasks inside the HTTP request path increases API response latency and risks client-side timeouts.

### The Reconciliation Worker
MeterFlow includes a dedicated asynchronous worker (`src/jobs/reconciliation.ts`) configured to execute on an hourly schedule using `node-cron`:

```typescript
export class ReconciliationWorker {
  public static async executePass(retryCount: number = 0, maxRetries: number = 3): Promise<void> {
    // 1. Audit active subscriptions for un-renewed expirations
    // 2. Compute high-volume usage rollups across tenants
    // 3. Log audit summaries and notify on anomalies
  }
}
```

By decoupling maintenance routines from the request path, customer-facing API endpoints maintain sub-millisecond execution times regardless of aggregate database volume.

---

## Fault Tolerance and Exponential Backoff Retries

Background jobs must be resilient to transient network drops, database connection pool exhaustion, and temporary external service unavailability.

If a background reconciliation pass encounters an error, MeterFlow does not simply crash the process. Instead, it utilizes an **Exponential Backoff Retry Strategy**:
- **Attempt 1 Failure**: Waits $2^0 \times 1,000\text{ms} = 1\text{ second}$ before retrying.
- **Attempt 2 Failure**: Waits $2^1 \times 1,000\text{ms} = 2\text{ seconds}$ before retrying.
- **Attempt 3 Failure**: Waits $2^2 \times 1,000\text{ms} = 4\text{ seconds}$ before retrying.
- **Max Retries Exhausted**: The worker emits a critical alert log with structured error diagnostics, alerting on-call engineers while allowing the primary application server to continue serving user requests unimpeded.

---

## Zero-Trust Secret Hygiene and Structured Logging

In enterprise backends, accidental secret exposure in application logs or version control repositories is a severe security vulnerability.

MeterFlow enforces three layers of secret protection:

1. **Repository Cleanliness**: The `.env` file is excluded in `.gitignore` from project inception. Only a safe template (`.env.example`) containing sanitized placeholder keys is committed to git history.
2. **Structured Logging (Pino)**: Console and file logs are formatted as structured JSON rather than unstructured strings. This enables automated ingestion into centralized logging platforms like Datadog, Grafana Loki, or AWS CloudWatch.
3. **Automatic Secret Redaction**: The logger configuration automatically censors sensitive headers and object keys:
```typescript
export const logger = pino({
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers['stripe-signature']",
      "req.headers['x-api-key']",
      "*.secret",
      "*.key",
      "*.password",
    ],
    censor: "[REDACTED_SECRET]",
  },
});
```

Even if a developer accidentally logs an incoming request object during debugging, API tokens, webhook secrets, and database credentials are automatically redacted before reaching disk or console streams.
