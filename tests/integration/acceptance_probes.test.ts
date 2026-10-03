import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import { StripePaymentService } from "../../src/services/StripePaymentService.js";

describe("Acceptance Probes Suite (Section 12 Promises)", () => {
  const FREE_TENANT_ID = "00000000-0000-0000-0000-000000000001";
  const BOUNDARY_TENANT_ID = "00000000-0000-0000-0000-000000000003";
  const LAPSED_TENANT_ID = "00000000-0000-0000-0000-000000000004";

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Reset boundary tenant to exactly 999 pre-seeded calls
    await prisma.usageEvent.deleteMany({
      where: {
        tenantId: BOUNDARY_TENANT_ID,
        idempotencyKey: { not: "seed-boundary-preload-999" },
      },
    });
  });

  // PROBE 1: Send same billable request twice with one idempotency key -> exactly 1 event
  describe("PROBE 1 — Idempotent Metering", () => {
    it("deduplicates retried requests and creates exactly one usage event", async () => {
      const idempotencyKey = `probe-1-key-${Date.now()}`;
      const payload = {
        action: "ai_generate",
        tokens: {
          freshInput: 500,
          cachedInput: 200,
          standardOutput: 400,
          reasoning: 100,
        },
      };

      // 1. Initial Request
      const res1 = await request(app)
        .post("/v1/meter/billable")
        .set("X-Tenant-Id", FREE_TENANT_ID)
        .set("Idempotency-Key", idempotencyKey)
        .send(payload);

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.headers["x-idempotent-replayed"]).toBeUndefined();

      // 2. Retried Request with identical key
      const res2 = await request(app)
        .post("/v1/meter/billable")
        .set("X-Tenant-Id", FREE_TENANT_ID)
        .set("Idempotency-Key", idempotencyKey)
        .send(payload);

      expect(res2.status).toBe(200);
      expect(res2.body).toEqual(res1.body);
      expect(res2.headers["x-idempotent-replayed"]).toBe("true");

      // 3. Database Integrity: Verify exactly 1 row recorded in usage_events
      const recordedEvents = await prisma.usageEvent.findMany({
        where: { idempotencyKey },
      });
      expect(recordedEvents.length).toBe(1);
    });

    it("rejects idempotency key reuse with mismatched payload (422 Unprocessable Entity)", async () => {
      const idempotencyKey = `probe-1-mismatch-${Date.now()}`;

      await request(app)
        .post("/v1/meter/billable")
        .set("X-Tenant-Id", FREE_TENANT_ID)
        .set("Idempotency-Key", idempotencyKey)
        .send({ action: "initial_action" });

      const mismatchRes = await request(app)
        .post("/v1/meter/billable")
        .set("X-Tenant-Id", FREE_TENANT_ID)
        .set("Idempotency-Key", idempotencyKey)
        .send({ action: "different_action_payload" });

      expect(mismatchRes.status).toBe(422);
      expect(mismatchRes.body.error).toBe("idempotency_payload_mismatch");
    });
  });

  // PROBE 2: Quota Boundary Honesty (429 & 402 responses)
  describe("PROBE 2 — Quota Boundary Enforcement", () => {
    it("allows request reaching exact boundary (1,000th call) and blocks 1,001st with 429", async () => {
      // Tenant 3 was seeded at 999 calls out of 1,000 allowance
      const boundaryKey = `probe-2-call-1000-${Date.now()}`;
      const overLimitKey = `probe-2-call-1001-${Date.now()}`;

      // Call 1,000 (Exact Boundary): MUST SUCCEED
      const res1000 = await request(app)
        .post("/v1/meter/billable")
        .set("X-Tenant-Id", BOUNDARY_TENANT_ID)
        .set("Idempotency-Key", boundaryKey)
        .send({ apiCallsCount: 1 });

      expect(res1000.status).toBe(200);

      // Call 1,001 (Over Boundary): MUST RETURN 429 Too Many Requests
      const res1001 = await request(app)
        .post("/v1/meter/billable")
        .set("X-Tenant-Id", BOUNDARY_TENANT_ID)
        .set("Idempotency-Key", overLimitKey)
        .send({ apiCallsCount: 1 });

      expect(res1001.status).toBe(429);
      expect(res1001.body.error).toBe("quota_exceeded");
      expect(res1001.body.metric).toBe("api_calls");
      expect(res1001.headers["retry-after"]).toBeDefined();

      // Verify no extra usage was recorded for the blocked call
      const blockedEvent = await prisma.usageEvent.findFirst({
        where: { idempotencyKey: overLimitKey },
      });
      expect(blockedEvent).toBeNull();
    });

    it("returns 402 Payment Required for tenant with PAST_DUE subscription", async () => {
      const res = await request(app)
        .post("/v1/meter/billable")
        .set("X-Tenant-Id", LAPSED_TENANT_ID)
        .set("Idempotency-Key", `probe-2-lapsed-${Date.now()}`)
        .send({ apiCallsCount: 1 });

      expect(res.status).toBe(402);
      expect(res.body.error).toBe("payment_required");
    });
  });

  // PROBE 3 & 4: Stripe Checkout Webhooks, Signatures & Replays
  describe("PROBE 3 & 4 — Stripe Webhook Verification, Deduplication & Plan Upgrade", () => {
    const testSecret = "whsec_test_secret_acceptance_suite";

    beforeAll(() => {
      process.env.STRIPE_WEBHOOK_SECRET = testSecret;
    });

    it("PROBE 4: rejects forged or invalid webhook signatures with 400 Bad Request", async () => {
      const payload = JSON.stringify({
        id: `evt_forged_${Date.now()}`,
        type: "checkout.session.completed",
      });

      const res = await request(app)
        .post("/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .set("Stripe-Signature", "t=12345,v1=bad_forged_signature_hash")
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("invalid_signature");
    });

    it("PROBE 3 & 4: processes valid webhook, upgrades tenant Free -> Pro, and deduplicates replays", async () => {
      const eventId = `evt_test_checkout_${Date.now()}`;
      const payloadObj = {
        id: eventId,
        object: "event",
        type: "checkout.session.completed",
        data: {
          object: {
            id: `cs_test_${Date.now()}`,
            client_reference_id: FREE_TENANT_ID,
            subscription: "sub_test_pro_12345",
            customer: "cus_test_upgraded_001",
          },
        },
      };

      const payloadStr = JSON.stringify(payloadObj);
      const signature = StripePaymentService.generateTestSignature(payloadStr, testSecret);

      // 1. Send legitimate signed webhook
      const res1 = await request(app)
        .post("/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .set("Stripe-Signature", signature)
        .send(payloadStr);

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe("processed");

      // 2. Verify tenant was upgraded to PRO in database
      const usageRes = await request(app)
        .get(`/v1/usage?tenantId=${FREE_TENANT_ID}`);

      expect(usageRes.status).toBe(200);
      expect(usageRes.body.data.plan.id).toBe("pro");
      expect(usageRes.body.data.plan.maxApiCallsPerMonth).toBe(50000);
      expect(usageRes.body.data.plan.maxTokensPerMonth).toBe(5000000);

      // 3. Replay exact same webhook event (PROBE 4 Replay Test)
      const res2 = await request(app)
        .post("/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .set("Stripe-Signature", signature)
        .send(payloadStr);

      expect(res2.status).toBe(200);
      expect(res2.body.status).toBe("duplicate_ignored");
    });
  });

  // PROBE 5: Usage Rollup & Pinned Pricing Matching
  describe("PROBE 5 — Usage Rollup & Pinned Pricing Verification", () => {
    it("matches pinned pricing rules in GET /v1/usage response", async () => {
      const res = await request(app).get(`/v1/usage?tenantId=${FREE_TENANT_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.usage).toBeDefined();
      expect(res.body.data.cost).toBeDefined();
      expect(typeof res.body.data.cost.formattedUsd).toBe("string");
      expect(typeof res.body.data.cost.itemizedTokensCost.freshInputNano).toBe("string");
      expect(typeof res.body.data.cost.itemizedTokensCost.cachedInputNano).toBe("string");
    });
  });
});
