# 📚 MeterFlow Architecture & System Guides

Welcome to the comprehensive technical documentation and system guides for the **MeterFlow Billing Engine**. 

These guides provide in-depth explanations of the core mechanics, mathematical foundations, cryptographic security, and architectural decisions behind the system. They are written in clear, semi-formal English to be equally accessible to technical evaluators, senior backend engineers, and product stakeholders.

---

## Guide Index

| # | Guide Title | Topic Area | Read Time | Direct Link |
| :-: | :--- | :--- | :-: | :--- |
| **01** | **The Mechanics of SaaS Metering: Tracking Consumption at Scale** | Architecture & Multi-Tenancy | 6 min | [Read Guide 01](./01-saas-metering-fundamentals.md) |
| **02** | **Guaranteeing Exactly-Once Metering Under Network Retries** | Concurrency & Idempotency | 7 min | [Read Guide 02](./02-exactly-once-metering-and-idempotency.md) |
| **03** | **Boundary Honesty: Enforcing Quotas Before Execution** | Quota Enforcement & HTTP 429/402 | 6 min | [Read Guide 03](./03-quota-enforcement-and-http-boundaries.md) |
| **04** | **AI Token Economics and Pure Integer Financial Math** | Money Math & AI Pricing Rules | 8 min | [Read Guide 04](./04-ai-token-pricing-and-integer-math.md) |
| **05** | **Stripe Webhook Synchronization: Cryptographic Verification and Replay Defense** | Payments & HMAC Security | 8 min | [Read Guide 05](./05-stripe-webhooks-and-cryptographic-security.md) |
| **06** | **Production Architecture: Layered Separation and Resilient Background Jobs** | System Design & Background Workers | 7 min | [Read Guide 06](./06-production-architecture-and-background-jobs.md) |

---

## Interactive Web Version

All guides are also directly accessible within the running application via a dedicated blog-style web reader:
- **Guides Archive Hub**: `http://localhost:3000/guides`
- **Interactive Testing Console**: `http://localhost:3000/dashboard` (with contextual tooltips linking directly into corresponding guide articles)
- **OpenAPI / Swagger Documentation**: `http://localhost:3000/docs`
