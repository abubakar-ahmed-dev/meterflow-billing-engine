import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";
import { StripePaymentService } from "../../src/services/StripePaymentService.js";
import { ReconciliationWorker } from "../../src/jobs/reconciliation.js";

/**
 * Phase 4 gate: full subscription lifecycle over signed webhooks (checkout ->
 * update -> delete), Stripe-shaped period handling, mock checkout path, and the
 * reconciliation worker's real PAST_DUE transition with persisted run logs.
 * Uses an ephemeral tenant so parallel suites never collide on shared seed data.
 */
describe("Phase 4 — Subscription Lifecycle, Reconciliation & Job Run Logs", () => {
  const TENANT_ID = "00000000-0000-0000-0000-0000000000e4";
  const WEBHOOK_SECRET = "whsec_phase4_lifecycle_suite";
  let subId: string;

  const signedEvent = (type: string, object: Record<string, unknown>) => {
    const payloadStr = JSON.stringify({
      id: `evt_p4_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      object: "event",
      api_version: "2025-02-24.acacia",
      type,
      data: { object },
    });
    return { payloadStr, signature: StripePaymentService.generateTestSignature(payloadStr, WEBHOOK_SECRET) };
  };

  const deliver = async (type: string, object: Record<string, unknown>) => {
    const { payloadStr, signature } = signedEvent(type, object);
    return request(app)
      .post("/v1/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", signature)
      .send(payloadStr);
  };

  beforeAll(async () => {
    await prisma.$connect();
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    await prisma.tenant.create({
      data: {
        id: TENANT_ID,
        name: "Phase4 Lifecycle Tenant",
        subscription: {
          create: {
            planId: "free",
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: TENANT_ID } });
    await prisma.jobRunLog.deleteMany({ where: { jobName: "reconciliation-phase4-test" } });
    await prisma.$disconnect();
  });

  it("checkout.session.completed upgrades Free -> Pro using the expanded subscription period", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const endSec = nowSec + 45 * 24 * 3600;
    const res = await deliver("checkout.session.completed", {
      id: `cs_p4_${nowSec}`,
      object: "checkout.session",
      status: "complete",
      payment_status: "paid",
      client_reference_id: TENANT_ID,
      customer: "cus_p4_001",
      subscription: {
        id: "sub_p4_lifecycle",
        object: "subscription",
        current_period_start: nowSec,
        current_period_end: endSec,
      },
      mode: "subscription",
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("processed");

    const sub = await prisma.subscription.findUnique({ where: { tenantId: TENANT_ID } });
    expect(sub?.planId).toBe("pro");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.stripeSubscriptionId).toBe("sub_p4_lifecycle");
    // Period truth taken from the Stripe payload, not a calendar guess.
    expect(Math.abs((sub!.currentPeriodEnd.getTime() - endSec * 1000) / 1000)).toBeLessThan(2);
    subId = sub!.id;
  });

  it("customer.subscription.updated maps past_due -> PAST_DUE (402 enforcement)", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const res = await deliver("customer.subscription.updated", {
      id: "sub_p4_lifecycle",
      object: "subscription",
      status: "past_due",
      customer: "cus_p4_001",
      current_period_start: nowSec,
      current_period_end: nowSec + 30 * 24 * 3600,
    });

    expect(res.status).toBe(200);
    const sub = await prisma.subscription.findUnique({ where: { tenantId: TENANT_ID } });
    expect(sub?.status).toBe("PAST_DUE");
  });

  it("billable request on the PAST_DUE tenant answers 402 Payment Required", async () => {
    const res = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", TENANT_ID)
      .set("Idempotency-Key", `p4-402-${Date.now()}`)
      .send({ apiCallsCount: 1 });

    expect(res.status).toBe(402);
    expect(res.body.error).toBe("payment_required");
  });

  it("customer.subscription.deleted downgrades to Free with no dangling Stripe ids", async () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const res = await deliver("customer.subscription.deleted", {
      id: "sub_p4_lifecycle",
      object: "subscription",
      status: "canceled",
      customer: "cus_p4_001",
      current_period_start: nowSec,
      current_period_end: nowSec + 5,
    });

    expect(res.status).toBe(200);
    const sub = await prisma.subscription.findUnique({ where: { tenantId: TENANT_ID } });
    expect(sub?.planId).toBe("free");
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.stripeSubscriptionId).toBeNull();
  });

  it("mock checkout creates a local session without any Stripe account", async () => {
    const res = await request(app)
      .post("/v1/billing/checkout")
      .send({ tenantId: "00000000-0000-0000-0000-000000000001" });

    expect(res.status).toBe(200);
    expect(res.body.data.sessionId).toMatch(/^cs_test_mock_/);
  });

  it("reconciliation transitions expired ACTIVE subscriptions to PAST_DUE and logs the run", async () => {
    const expired = new Date(Date.now() - 24 * 3600 * 1000);
    await prisma.subscription.update({
      where: { tenantId: TENANT_ID },
      data: { planId: "pro", status: "ACTIVE", currentPeriodEnd: expired },
    });

    await ReconciliationWorker.executePass();

    const sub = await prisma.subscription.findUnique({ where: { tenantId: TENANT_ID } });
    expect(sub?.status).toBe("PAST_DUE");

    const runLog = await prisma.jobRunLog.findFirst({
      where: { jobName: "reconciliation", status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
    });
    expect(runLog).not.toBeNull();
    const detail = JSON.parse(runLog!.detail || "{}");
    expect(detail.subscriptionsMovedToPastDue).toBeGreaterThanOrEqual(1);
  });
});
