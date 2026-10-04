export interface GuideArticle {
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  readTime: string;
  icon: string;
  summary: string;
  contentHtml: string;
}

export const GUIDES: GuideArticle[] = [
  {
    slug: "saas-metering-fundamentals",
    title: "The Mechanics of SaaS Metering: Tracking Consumption at Scale",
    subtitle: "How modern platforms answer the three essential SaaS billing questions without performance degradation.",
    category: "Architecture & Multi-Tenancy",
    readTime: "6 min read",
    icon: "fa-solid fa-server text-cyan-400",
    summary:
      "An in-depth look at how usage-based software platforms track consumption across multi-tenant databases, isolate customer data with compound indexes, and decouple metering from application feature logic.",
    contentHtml: `
      <p class="text-slate-300 leading-relaxed text-sm">
        Usage-based pricing has become the standard economic model for cloud infrastructure, API platforms, and artificial intelligence services. In a traditional subscription model, a customer pays a fixed recurring fee regardless of their activity. In a usage-based or hybrid model, revenue directly reflects consumption: compute cycles used, API requests dispatched, or machine learning tokens generated.
      </p>

      <div class="my-6 p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200">
        <strong class="font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
          <i class="fa-solid fa-circle-info"></i> Core Principle
        </strong>
        Every operational billing engine must answer three questions in real-time: <strong>How much has this customer used?</strong>, <strong>How much should they pay?</strong>, and <strong>Have they reached their plan limits?</strong>
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Multi-Tenant Data Isolation and Schema Partitioning</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        In a multi-tenant SaaS architecture, data from thousands of independent customer organizations resides within shared database infrastructure. The primary engineering mandate is strict isolation: no tenant must ever view, mutate, or be impacted by another tenant's activity or rate limits.
      </p>
      <ul class="list-disc list-inside space-y-2 text-xs text-slate-300 ml-2 mb-6">
        <li><strong>Universal Tenant Partitioning:</strong> Every primary record (<code class="text-cyan-300">subscriptions</code>, <code class="text-cyan-300">usage_events</code>, <code class="text-cyan-300">idempotency_records</code>) requires an explicit foreign key reference to <code class="text-cyan-300">tenants.id</code>.</li>
        <li><strong>Compound Database Indexing:</strong> The <code class="text-cyan-300">usage_events</code> table maintains a composite index on <code class="text-cyan-300">(tenantId, timestamp)</code>. This ensures that monthly quota aggregation queries only scan the rows belonging to the requesting tenant within the current billing cycle.</li>
        <li><strong>Unique Constraint Scoping:</strong> Idempotency keys are scoped uniquely per tenant: <code class="text-cyan-300">UNIQUE(tenantId, idempotencyKey)</code>. Two distinct tenants can independently use identical client-generated identifiers without collision conflicts.</li>
      </ul>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Decoupling Metering from Core Application Logic</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        A frequent architectural anti-pattern in early-stage backends is embedding metering logic directly inside feature handlers. MeterFlow treats <strong>Metering as a Dedicated Pipeline Service</strong>. The core domain routes accept client requests, delegate to the atomic <code class="text-cyan-300">MeterService</code>, and inspect the returned decision. If the quota check succeeds, the usage event and its calculated integer cost are committed in an isolated database transaction, completely separate from external service dependencies.
      </p>
    `,
  },
  {
    slug: "exactly-once-metering-and-idempotency",
    title: "Guaranteeing Exactly-Once Metering Under Network Retries",
    subtitle: "Eliminating accidental double-charges and race conditions using a two-phase idempotency protocol.",
    category: "Idempotency & Concurrency",
    readTime: "7 min read",
    icon: "fa-solid fa-arrows-rotate text-emerald-400",
    summary:
      "A technical walkthrough of how network timeouts cause client retries, how atomic IN_PROGRESS reservations stop concurrency conflicts, and how SHA-256 request fingerprinting prevents payload tampering.",
    contentHtml: `
      <p class="text-slate-300 leading-relaxed text-sm">
        In distributed computer systems, network connections are inherently unreliable. When an HTTP client sends a request to record a billable event, intermittent timeouts can cause the client to retry. Without robust safeguards, a retried request will execute a second time, recording two usage events and charging the customer twice.
      </p>

      <div class="my-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200">
        <strong class="font-bold text-emerald-300 flex items-center gap-1.5 mb-1">
          <i class="fa-solid fa-shield-halved"></i> Idempotency Guarantee
        </strong>
        An operation is idempotent if performing it multiple times yields the exact same state and result as performing it once. Retried requests must return the original response without recording extra usage.
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">The Two-Phase Idempotency Protocol</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        Writing an idempotency record only <em>after</em> billable work finishes exposes the system to race conditions. If two identical requests arrive simultaneously, both might check for an existing record, find none, and proceed concurrently. MeterFlow resolves this with a two-phase reservation protocol:
      </p>
      
      <div class="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 my-4 space-y-2">
        <div class="text-emerald-400 font-bold">1. Key Reservation (IN_PROGRESS)</div>
        <div>Attempt to insert idempotency_records with status='IN_PROGRESS'. If another concurrent request holds this key, the database rejects the second attempt with HTTP 409 Conflict.</div>
        <div class="text-cyan-400 font-bold pt-2">2. Execution & Finalization (COMPLETED)</div>
        <div>Upon transaction commit, the record is updated to status='COMPLETED' with the exact HTTP code and response body. Subsequent retries return this cached response with header X-Idempotent-Replayed: true.</div>
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Preventing Payload Tampering with SHA-256 Fingerprinting</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        If a client reuses an idempotency key with a completely different payload, returning the old cached response would be deceptive. MeterFlow computes a SHA-256 hash of the canonical request path and serialized body upon arrival:
      </p>
      <pre class="bg-slate-900 p-3 rounded-lg border border-slate-800 text-cyan-300 text-xs font-mono overflow-x-auto">const requestHash = crypto.createHash("sha256").update(\`\${requestPath}:\${JSON.stringify(requestPayload)}\`).digest("hex");</pre>
      <p class="text-slate-300 leading-relaxed text-sm mt-3">
        If a retried request's hash matches the stored hash, the cached result is returned. If the hash differs, the server rejects the request with <code class="text-amber-400">HTTP 422 Unprocessable Entity</code>.
      </p>
    `,
  },
  {
    slug: "quota-enforcement-and-http-boundaries",
    title: "Boundary Honesty: Enforcing Quotas Before Execution",
    subtitle: "Why quotas must be checked before work begins, and the semantic distinction between HTTP 429 and 402.",
    category: "Quotas & HTTP Boundaries",
    readTime: "6 min read",
    icon: "fa-solid fa-traffic-light text-amber-400",
    summary:
      "Examines the pre-action quota validation pattern, explores exact boundary behavior at call 999 vs 1,000 vs 1,001, and explains why machines require clear 429 vs 402 status codes with RFC 6585 Retry-After headers.",
    contentHtml: `
      <p class="text-slate-300 leading-relaxed text-sm">
        A subscription plan is defined by contractual boundaries. Enforcing these limits requires strict discipline at the service boundary. The metering system must evaluate customer standing, calculate aggregate consumption, and make an allow-or-reject determination before any billable computation occurs.
      </p>

      <div class="my-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
        <strong class="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
          <i class="fa-solid fa-triangle-exclamation"></i> Pre-Action vs Post-Action Checks
        </strong>
        Post-action metering (running compute first and checking quotas after) leaks infrastructure resources. Running a costly LLM call and discovering the client exceeded their quota allows unrecoverable expenses. MeterFlow strictly validates quotas <em>before</em> execution.
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">The Boundary Lifecycle: Call 999, 1,000, and 1,001</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        Consider a customer on a Free Plan with an allowance of 1,000 calls per month:
      </p>
      <div class="space-y-3 text-xs font-mono">
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span class="text-emerald-400 font-bold">Call 999 of 1,000:</span> 999 &le; 1000 is True. Authorized. HTTP 200 OK.
        </div>
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span class="text-cyan-400 font-bold">Call 1,000 of 1,000 (Boundary Call):</span> 1000 &le; 1000 is True. Limit is inclusive. Authorized. HTTP 200 OK.
        </div>
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span class="text-red-400 font-bold">Call 1,001 of 1,000 (Boundary Violation):</span> 1001 &le; 1000 is False. Rejected. HTTP 429 Too Many Requests. Zero new usage rows recorded.
        </div>
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Distinguishing HTTP 429 from HTTP 402</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        Automated clients rely on standard HTTP response codes to make programmatic decisions:
      </p>
      <ul class="list-disc list-inside space-y-2 text-xs text-slate-300 ml-2 mb-6">
        <li><strong>HTTP 429 Too Many Requests:</strong> Returned when a customer has an active subscription, but their consumption has exhausted the monthly limit. Accompanied by an RFC 6585 <code class="text-cyan-300">Retry-After</code> header informing the client when the quota resets.</li>
        <li><strong>HTTP 402 Payment Required:</strong> Returned when a customer's subscription is in an unentitled payment status—such as <code class="text-red-400">PAST_DUE</code>, <code class="text-red-400">CANCELED</code>, or <code class="text-red-400">INCOMPLETE</code>.</li>
      </ul>
    `,
  },
  {
    slug: "ai-token-pricing-and-integer-math",
    title: "AI Token Economics and Pure Integer Financial Math",
    subtitle: "Preventing floating-point rounding drift and encoding real-world frontier LLM token pricing models.",
    category: "Financial Math & AI Pricing",
    readTime: "8 min read",
    icon: "fa-solid fa-coins text-purple-400",
    summary:
      "Explains why floating-point numbers fail in financial systems (IEEE 754 precision loss), how nano-dollar integer scaling eliminates rounding drift, and the economic rationale for the 75% prompt caching discount and reasoning token rates.",
    contentHtml: `
      <p class="text-slate-300 leading-relaxed text-sm">
        Modern AI platforms measure workload in tokens. As language models have evolved from simple completion engines into multi-step reasoning systems, pricing has grown increasingly sophisticated. Token categories cannot simply be added together, and calculating fractional costs per token exposes software systems to binary arithmetic errors.
      </p>

      <div class="my-6 p-4 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs text-purple-200">
        <strong class="font-bold text-purple-300 flex items-center gap-1.5 mb-1">
          <i class="fa-solid fa-calculator"></i> The Integer Arithmetic Rule
        </strong>
        In IEEE 754 binary floating-point arithmetic, fractions like 0.1 cannot be represented exactly. Over millions of transactions, tiny rounding inaccuracies accumulate into discrepancies that fail financial audits. MeterFlow strictly bans floating-point numbers for money, using 64-bit integer nano-dollars ($1 = 1,000,000,000 nano-units).
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Frontier Token Pricing Multipliers</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 my-4 text-xs font-mono">
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
          <div class="text-white font-bold">Fresh Input Tokens</div>
          <div class="text-slate-400">$2.00 / 1M ($0.000002000 per token)</div>
          <div class="text-cyan-400">Scale: 2,000 nano-dollars / token</div>
        </div>
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
          <div class="text-emerald-400 font-bold">Cached Input Tokens (75% Off)</div>
          <div class="text-slate-400">$0.50 / 1M ($0.000000500 per token)</div>
          <div class="text-emerald-400">Scale: 500 nano-dollars / token</div>
        </div>
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
          <div class="text-white font-bold">Standard Output Tokens</div>
          <div class="text-slate-400">$8.00 / 1M ($0.000008000 per token)</div>
          <div class="text-cyan-400">Scale: 8,000 nano-dollars / token</div>
        </div>
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
          <div class="text-purple-400 font-bold">Reasoning Tokens (Thinking)</div>
          <div class="text-slate-400">$8.00 / 1M (Billed as Output rate)</div>
          <div class="text-purple-400">Scale: 8,000 nano-dollars / token</div>
        </div>
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Why Reasoning Tokens Are Billed as Output</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        Advanced reasoning models produce internal chain-of-thought tokens to plan before presenting an answer. Although these tokens are often hidden from the user interface, generating them consumes identical GPU compute cycles as standard output tokens. They are accounted for and billed strictly at the output rate.
      </p>
    `,
  },
  {
    slug: "stripe-webhooks-and-cryptographic-security",
    title: "Stripe Webhook Synchronization: Cryptographic Verification and Replay Defense",
    subtitle: "Protecting billing systems against forged payment confirmations and asynchronous retransmissions.",
    category: "Stripe & HMAC Security",
    readTime: "8 min read",
    icon: "fa-brands fa-stripe text-indigo-400",
    summary:
      "A deep dive into Stripe webhook security: why raw body buffers are mandatory for HMAC-SHA256 signature verification, how database deduplication stops replay attacks, and how the dual-mode adapter runs offline in regions without Stripe support.",
    contentHtml: `
      <p class="text-slate-300 leading-relaxed text-sm">
        Because payment lifecycle events occur on third-party infrastructure (hosted checkout, card updates, bank renewals), the payment processor communicates changes to the SaaS backend via asynchronous HTTP POST notifications known as webhooks.
      </p>

      <div class="my-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200">
        <strong class="font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
          <i class="fa-solid fa-lock"></i> Authoritative Source of Truth
        </strong>
        Stripe is the authoritative source of truth for payment status. The local database mirrors this state only through cryptographically verified events, ensuring no malicious user can forge a plan upgrade.
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">HMAC-SHA256 Signature Verification</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        Every webhook carries a <code class="text-cyan-300">Stripe-Signature</code> header with a timestamp and an HMAC digest computed with your private signing secret (<code class="text-cyan-300">whsec_...</code>).
      </p>
      <div class="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs text-slate-300 my-4">
        <div class="text-amber-300 font-bold flex items-center gap-1.5">
          <i class="fa-solid fa-triangle-exclamation"></i> The Raw Body Parser Requirement
        </div>
        <div>
          If an application mounts a standard JSON parser (<code class="text-cyan-300">express.json()</code>) before the webhook route, the deserialization alters whitespace or key order. Even a single changed space completely alters the resulting SHA-256 hash. In MeterFlow, the webhook route is bound to <code class="text-cyan-300">express.raw({ type: "application/json" })</code> prior to global JSON parsing, preserving raw byte fidelity.
        </div>
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Defending Against Replay Attacks</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        Stripe guarantees at-least-once webhook delivery. If an acknowledgment is delayed by network latency, Stripe retries the event. MeterFlow records the unique event ID in <code class="text-cyan-300">processed_webhook_events</code>. Replayed events are recognized immediately and acknowledged with <code class="text-emerald-400">HTTP 200 duplicate_ignored</code>, avoiding redundant state mutations.
      </p>
    `,
  },
  {
    slug: "production-architecture-and-background-jobs",
    title: "Production Architecture: Layered Separation and Resilient Background Jobs",
    subtitle: "Structuring backend tiers, scheduling maintenance workers, and practicing zero-trust secret logging.",
    category: "Infrastructure & Observability",
    readTime: "7 min read",
    icon: "fa-solid fa-layer-group text-blue-400",
    summary:
      "Details the separation of HTTP boundaries, domain services, and database persistence; explains the hourly reconciliation background worker with exponential backoff retries; and reviews secret-redacted structured logging.",
    contentHtml: `
      <p class="text-slate-300 leading-relaxed text-sm">
        Enterprise billing engines are evaluated by how cleanly they isolate concerns, shield critical paths from failure, and maintain operational hygiene. Request routing, domain business logic, data persistence, and slow background processing must exist as separate, well-defined architectural layers.
      </p>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Tiered Separation of Concerns</h2>
      <div class="space-y-3 text-xs font-mono my-4">
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span class="text-cyan-400 font-bold">1. HTTP Boundary:</span> Express controllers and Zod schema validators ensure malformed inputs return clean 400s and never crash into 500s.
        </div>
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span class="text-emerald-400 font-bold">2. Domain Services:</span> Isolated pure logic (MeterService, QuotaService, CostCalculator) that can be unit-tested without network listeners.
        </div>
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span class="text-purple-400 font-bold">3. Background Tier:</span> Scheduled hourly workers that handle heavy aggregation rollups and audits off the client request path.
        </div>
        <div class="p-3 bg-slate-900 border border-slate-800 rounded-lg">
          <span class="text-amber-400 font-bold">4. Persistence Tier:</span> Prisma ORM and PostgreSQL 16 enforcing strict relational constraints and composite indexes.
        </div>
      </div>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Resilient Background Workers with Exponential Backoff</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        Tasks like subscription reconciliation or high-volume rollups must never block the client request path. MeterFlow schedules an hourly reconciliation worker using <code class="text-cyan-300">node-cron</code>. If a transient database drop occurs, the worker retries using exponential backoff (1s, 2s, 4s). If max retries are exhausted, it triggers an alert log while allowing normal client API requests to continue without interruption.
      </p>

      <h2 class="text-lg font-bold text-white mt-8 mb-3">Structured Logging with Secret Redaction</h2>
      <p class="text-slate-300 leading-relaxed text-sm mb-4">
        Using Pino, MeterFlow produces structured JSON logs while automatically redacting sensitive headers (<code class="text-cyan-300">Stripe-Signature</code>, <code class="text-cyan-300">Authorization</code>, <code class="text-cyan-300">X-Api-Key</code>) and any object keys named <code class="text-cyan-300">secret</code>, <code class="text-cyan-300">token</code>, or <code class="text-cyan-300">password</code>, preventing accidental credential leaks to log monitoring tools.
      </p>
    `,
  },
];
