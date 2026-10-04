# Boundary Honesty: Enforcing Quotas Before Execution

A subscription plan is defined by contractual boundaries. On a Free tier, a customer might be granted 1,000 API calls and 100,000 AI tokens per billing cycle. On a Pro tier, those allowances may expand to 50,000 calls and 5,000,000 tokens.

Enforcing these limits requires strict discipline at the service boundary. The metering system must evaluate customer standing, calculate aggregate consumption, and make an unambiguous allow-or-reject determination before any billable computation occurs.

---

## Pre-Action vs Post-Action Validation

In software design, there are two opposing paradigms for quota checks:

1. **Post-Action Metering (Optimistic)**:  
   The application fulfills the client request, generates output or executes compute, and subsequently writes a usage event to the database. If the database indicates that the customer has exceeded their quota, the system flags the account for future requests.

2. **Pre-Action Enforcement (Pessimistic & Honest)**:  
   Before dispatching any work to underlying systems, the application validates current billing period consumption against plan limits. If the requested increment exceeds the boundary, the request is immediately rejected.

MeterFlow strictly implements **Pre-Action Enforcement**. Post-action metering creates significant financial and operational hazards:
- Generating compute (such as invoking large frontier language models) prior to quota validation allows malicious or runaway clients to incur substantial infrastructure costs that the SaaS provider cannot recover.
- In multi-tenant environments, a customer who discovers an overage loop could consume shared server bandwidth, degrading quality of service for paying tenants.

By evaluating `currentUsage + requestedUsage <= planLimit` prior to execution, MeterFlow ensures that unentitled requests never trigger backend compute.

---

## The Boundary Lifecycle: Call 999, 1,000, and 1,001

A critical requirement in billing engine design is **boundary honesty**: defining clear mathematical behavior when an account reaches the exact threshold of its plan.

Consider a tenant on a Free Plan with an allowance of 1,000 calls per month:

### Call 999 of 1,000
- **Evaluation**: The tenant has used 998 calls. Requesting 1 call brings the projected total to 999.
- **Result**: `999 <= 1000` is true. The request is authorized and processed.
- **HTTP Status**: `200 OK`.

### Call 1,000 of 1,000 (The Boundary Call)
- **Evaluation**: The tenant has used 999 calls. Requesting 1 call brings the projected total to exactly 1,000.
- **Result**: `1000 <= 1000` is true. The limit is inclusive; the customer has paid for or is entitled to exactly 1,000 calls.
- **HTTP Status**: `200 OK`. The final entitled call completes successfully, and total usage reaches 1,000.

### Call 1,001 of 1,000 (The Boundary Violation)
- **Evaluation**: The tenant has already used 1,000 calls. Requesting 1 call brings the projected total to 1,001.
- **Result**: `1001 <= 1000` is false. The quota has been exhausted.
- **Action**: The request is aborted before executing billable work. Crucially, **zero new rows are written to `usage_events`**.
- **HTTP Status**: `429 Too Many Requests`.

---

## Distinguishing 429 Too Many Requests from 402 Payment Required

Automated API clients rely on standard HTTP response codes to make programmatic decisions. If a server returns an generic `400 Bad Request` or an incorrect status code when a quota is reached, client applications cannot determine whether their request payload was malformed, their network credentials expired, or their billing limit was reached.

MeterFlow enforces a clean semantic distinction between **HTTP 429** and **HTTP 402**:

### 1. HTTP 429 Too Many Requests
Returned when a customer has an **ACTIVE subscription**, but their consumption has reached the maximum allowance permitted for the current billing cycle.
```json
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

### 2. HTTP 402 Payment Required
Returned when a customer's subscription is in an unentitled payment status—such as **`PAST_DUE`**, **`CANCELED`**, or **`INCOMPLETE`**—or when an account attempts to access a tier feature not included in their current plan.
```json
{
  "success": false,
  "error": "payment_required",
  "message": "Tenant subscription is PAST_DUE. Payment or plan renewal required."
}
```

This semantic separation allows client software to present the correct user interface: an HTTP 429 informs the user that their monthly volume is exhausted until the next billing date, whereas an HTTP 402 directs the customer to update their payment method in the billing portal.

---

## Assisting Client Recovery with RFC 6585 Retry-After Headers

When an API client receives an HTTP 429 response, a common engineering mistake is for the client to immediately retry the request in a tight loop. Because the monthly quota cannot reset until the start of the next billing cycle, immediate retries waste bandwidth and CPU cycles.

Per the RFC 6585 specification, MeterFlow calculates the precise number of seconds remaining until the active billing cycle ends (`currentPeriodEnd - now`) and transmits this duration in the response header:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 2419200
Content-Type: application/json
```

Compliant API gateways, SDKs, and automated agents parse the `Retry-After` header to pause outgoing dispatches until the quota reset timestamp.
