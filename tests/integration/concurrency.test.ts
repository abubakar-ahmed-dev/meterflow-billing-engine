import crypto from "crypto";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import { StripePaymentService } from "../../src/services/StripePaymentService.js";

/**
 * Phase 1 gate: concurrency and edge-case hardening.
 * - A parallel flood of identical requests must yield exactly one usage event
 *   and must never crash the server (the historical P2002 unhandled-rejection bug).
 * - Stale IN_PROGRESS reservations (crashed requests) must be reclaimable.
 * - Previously FAILED webhook events must be reprocessed on Stripe retry.
 * - Unknown tenants get an honest 404, not a 429.
 */
describe("Phase 1 — Concurrency & Edge-Case Hardening", () => {
  const PRO_TENANT_ID = "00000000-0000-0000-0000-000000000002"; // Pro plan: no quota pressure
  const WEBHOOK_SECRET = "whsec_phase1_concurrency_suite";

  beforeAll(async () => {
    await prisma.$connect();
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  afterAll(async () => {
    // Clean up every row this suite created.
    await prisma.usageEvent.deleteMany({ where: { idempotencyKey: { startsWith: "conc-" } } });
    await prisma.idempotencyRecord.deleteMany({ where: { idempotencyKey: { startsWith: "conc-" } } });
    await prisma.processedWebhookEvent.deleteMany({ where: { stripeEventId: { startsWith: "evt_conc_" } } });
    await prisma.$disconnect();
  });

  it("12 parallel identical requests create exactly one usage event and never crash the server", async () => {
    const key = `conc-flood-${Date.now()}`;
    const payload = { apiCallsCount: 1 };

    const results = await Promise.all(
      Array.from({ length: 12 }, () =>
        request(app)
          .post("/v1/meter/billable")
          .set("X-Tenant-Id", PRO_TENANT_ID)
          .set("Idempotency-Key", key)
          .send(payload)
      )
    );

    const statuses = results.map((r) => r.status);
    const okCount = statuses.filter((s) => s === 200).length;
    const conflictCount = statuses.filter((s) => s === 409).length;

    // Every request gets a clean, intentional answer — no 500s.
    expect(statuses.every((s) => s === 200 || s === 409)).toBe(true);
    expect(okCount).toBeGreaterThanOrEqual(1);
    expect(okCount + conflictCount).toBe(12);

    // Exactly-once: a single usage event exists for the key.
    const events = await prisma.usageEvent.findMany({ where: { idempotencyKey: key } });
    expect(events.length).toBe(1);

    // Every 200 response carries an identical body (owner + replays agree).
    const bodies = results.filter((r) => r.status === 200).map((r) => JSON.stringify(r.body));
    expect(new Set(bodies).size).toBe(1);

    // The server survived the flood.
    const health = await request(app).get("/health");
    expect(health.status).toBe(200);
  });

  it("reclaims a stale IN_PROGRESS reservation past its TTL instead of answering 409 forever", async () => {
    const key = `conc-stale-${Date.now()}`;
    const payload = { apiCallsCount: 1 };
    const requestHash = crypto
      .createHash("sha256")
      .update(`/v1/meter/billable:${JSON.stringify(payload)}`)
      .digest("hex");

    // Simulate a crashed request: reservation left IN_PROGRESS, TTL already expired.
    await prisma.idempotencyRecord.create({
      data: {
        idempotencyKey: key,
        tenantId: PRO_TENANT_ID,
        requestHash,
        status: "IN_PROGRESS",
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const res = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", PRO_TENANT_ID)
      .set("Idempotency-Key", key)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const events = await prisma.usageEvent.findMany({ where: { idempotencyKey: key } });
    expect(events.length).toBe(1);
  });

  it("answers 409 (not a hang) for a live IN_PROGRESS reservation within its TTL", async () => {
    const key = `conc-live-${Date.now()}`;
    await prisma.idempotencyRecord.create({
      data: {
        idempotencyKey: key,
        tenantId: PRO_TENANT_ID,
        requestHash: "unrelated-hash",
        status: "IN_PROGRESS",
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const res = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", PRO_TENANT_ID)
      .set("Idempotency-Key", key)
      .send({ apiCallsCount: 1 });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe("concurrent_request");
  });

  it("returns 404 (not 429) when the tenant does not exist", async () => {
    const res = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", "99999999-9999-9999-9999-999999999999")
      .set("Idempotency-Key", `conc-unknown-tenant-${Date.now()}`)
      .send({ apiCallsCount: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("tenant_not_found");
  });

  it("reprocesses a previously FAILED webhook event on retry instead of ignoring it", async () => {
    const eventId = `evt_conc_failed_${Date.now()}`;
    const payloadObj = {
      id: eventId,
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_conc_${Date.now()}`,
          client_reference_id: PRO_TENANT_ID,
          subscription: `sub_conc_${Date.now()}`,
          customer: `cus_conc_${Date.now()}`,
        },
      },
    };
    const payloadStr = JSON.stringify(payloadObj);
    const signature = StripePaymentService.generateTestSignature(payloadStr, WEBHOOK_SECRET);

    // Pre-poison the ledger: event marked FAILED (simulates a partial processing crash).
    await prisma.processedWebhookEvent.create({
      data: { stripeEventId: eventId, eventType: payloadObj.type, status: "FAILED" },
    });

    const res = await request(app)
      .post("/v1/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", signature)
      .send(payloadStr);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("processed");

    const ledger = await prisma.processedWebhookEvent.findUnique({ where: { stripeEventId: eventId } });
    expect(ledger?.status).toBe("SUCCESS");
  });

  it("deduplicates two parallel deliveries of the same signed webhook event", async () => {
    const eventId = `evt_conc_parallel_${Date.now()}`;
    const payloadObj = {
      id: eventId,
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: `cs_conc_par_${Date.now()}`,
          client_reference_id: PRO_TENANT_ID,
          subscription: `sub_conc_par_${Date.now()}`,
          customer: `cus_conc_par_${Date.now()}`,
        },
      },
    };
    const payloadStr = JSON.stringify(payloadObj);
    const signature = StripePaymentService.generateTestSignature(payloadStr, WEBHOOK_SECRET);

    const [res1, res2] = await Promise.all([
      request(app)
        .post("/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .set("Stripe-Signature", signature)
        .send(payloadStr),
      request(app)
        .post("/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .set("Stripe-Signature", signature)
        .send(payloadStr),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 200]);
    const outcomes = [res1.body.status, res2.body.status].sort();
    expect(outcomes).toEqual(["duplicate_ignored", "processed"]);
  });
});
