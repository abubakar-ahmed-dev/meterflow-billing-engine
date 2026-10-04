# The Mechanics of SaaS Metering: Tracking Consumption at Scale

Usage-based pricing has become the standard economic model for cloud infrastructure, API platforms, and artificial intelligence services. In a traditional subscription model, a customer pays a fixed recurring fee regardless of their activity. In a usage-based or hybrid model, revenue directly reflects consumption: compute cycles used, API requests dispatched, or machine learning tokens generated.

While the conceptual model is simple, implementing the backend infrastructure to track usage accurately is one of the most demanding engineering problems in software development. This guide examines how the MeterFlow engine structures usage metering, isolates multi-tenant data, and ensures billing integrity.

---

## The Three Essential SaaS Billing Questions

Every operational billing engine must provide real-time, mathematically provable answers to three questions:

1. **How much has a customer used?**  
   The system must record high-velocity activity across multiple consumption dimensions (standard API calls, fresh input tokens, cached prompt tokens, output tokens, and reasoning tokens) without dropping events.

2. **How much should they pay?**  
   Raw consumption metrics must be converted into monetary values using precise, non-linear pricing rules without accumulating floating-point rounding errors.

3. **Have they reached their plan limits?**  
   The system must evaluate account standing and remaining quota allowances *before* any billable work begins, protecting infrastructure from unpaid over-consumption.

A failure in any of these three areas directly harms the business. Under-counting usage or failing to enforce quotas results in unrecoverable compute expenses and lost revenue. Over-counting usage or miscalculating costs damages customer trust and leads to dispute handling overhead.

---

## Multi-Tenant Data Isolation and Schema Partitioning

In a multi-tenant SaaS architecture, data from thousands of independent customer organizations resides within shared database infrastructure. The primary engineering mandate is strict isolation: no tenant must ever view, mutate, or be impacted by another tenant's activity or rate limits.

MeterFlow enforces tenant isolation at both the database schema layer and the application boundary:

- **Universal Tenant Partitioning**: Every primary record (`subscriptions`, `usage_events`, `idempotency_records`, and `usage_alerts`) requires an explicit foreign key reference to `tenants.id`.
- **Compound Database Indexing**: The `usage_events` table maintains a composite index on `(tenantId, timestamp)`. This ensures that monthly quota aggregation queries only scan the rows belonging to the requesting tenant within the current billing cycle, eliminating cross-tenant query overhead.
- **Unique Constraint Guarantees**: Idempotency keys are scoped uniquely per tenant: `UNIQUE(tenantId, idempotencyKey)`. This design allows two distinct tenants to independently use identical client-generated identifiers (such as common UUID schemes) without causing collision conflicts.

---

## Decoupling Metering from Core Application Logic

A frequent architectural anti-pattern in early-stage backends is embedding metering logic directly inside feature handlers. For example, placing database update calls inside an image processing route or an LLM streaming handler tightly couples infrastructure accounting with domain functionality.

This tight coupling creates multiple operational hazards:
- If a database query fails midway through request processing, it is difficult to determine whether the user received their service or if they were billed prematurely.
- Changing pricing tiers, discount percentages, or quota thresholds requires modifying and redeploying core feature code.
- Tracking usage across diverse services (REST APIs, asynchronous queues, batch jobs) results in duplicated, inconsistent metering implementations.

MeterFlow avoids this by treating **Metering as a Dedicated Pipeline Service**. The core domain routes accept client requests, delegate to the atomic `MeterService`, and inspect the returned decision. If the quota check succeeds, the usage event and its calculated integer cost are committed in an isolated database transaction, completely separate from external service dependencies.

---

## Pitfalls of Ad-Hoc Billing Queries

In naive implementations, developers often attempt to calculate usage by running continuous `SELECT SUM(...)` queries across unindexed tables directly on the primary transactional database. As usage event tables grow into millions of rows, these ad-hoc queries degrade database read performance and cause lock contention.

To prevent performance degradation at scale:
1. **Indexed Billing Windows**: Queries filter strictly on bounded timestamp ranges (`currentPeriodStart` to `currentPeriodEnd`), allowing PostgreSQL index scans to prune historical data rapidly.
2. **Scheduled Rollup Workers**: Rather than scanning historical events repeatedly, background workers aggregate older events into periodic summary caches.
3. **Pre-Computed Quota Metadata**: Plan definitions (`maxApiCallsPerMonth`, `maxTokensPerMonth`) remain normalized in the `plans` table, providing fast indexed lookups when calculating remaining allowances.
