import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { prisma } from "../../src/db/prisma.js";

/**
 * Phase 3 gate: exact pinned-pricing proof (PROBE 5 with hard numbers) and the
 * token-quota boundary. State is controlled per-test: this suite only touches
 * rows whose idempotencyKey starts with "pq-", and resets them in beforeEach.
 */
describe("Phase 3 — Pinned Pricing Exactness & Token Quota Boundary", () => {
  const PRO_TENANT_ID = "00000000-0000-0000-0000-000000000002"; // Pro: 50,000 calls / 5,000,000 tokens

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.usageEvent.deleteMany({
      where: { tenantId: PRO_TENANT_ID, idempotencyKey: { startsWith: "pq-" } },
    });
    await prisma.idempotencyRecord.deleteMany({
      where: { tenantId: PRO_TENANT_ID, idempotencyKey: { startsWith: "pq-" } },
    });
  });

  afterAll(async () => {
    await prisma.usageEvent.deleteMany({
      where: { tenantId: PRO_TENANT_ID, idempotencyKey: { startsWith: "pq-" } },
    });
    await prisma.idempotencyRecord.deleteMany({
      where: { tenantId: PRO_TENANT_ID, idempotencyKey: { startsWith: "pq-" } },
    });
    await prisma.$disconnect();
  });

  it("prices the canonical vector exactly and GET /v1/usage reproduces the pinned math", async () => {
    // 1200*2000 + 400*500 + 600*8000 + 250*8000 = 9,400,000 nano ($0.0094)
    const post = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", PRO_TENANT_ID)
      .set("Idempotency-Key", "pq-exact-vector")
      .send({
        apiCallsCount: 0,
        tokens: { freshInput: 1200, cachedInput: 400, standardOutput: 600, reasoning: 250 },
      });

    expect(post.status).toBe(200);
    expect(post.body.data.tokensRecorded).toBe(2450);
    expect(post.body.data.cost.totalCostCents).toBe(1); // 0.94 cents rounded up to the cent
    expect(post.body.data.cost.formattedUsd).toBe("$0.009400");
    expect(post.body.data.cost.costNanoDollars).toBe("9400"); // stored micro-dollar integer

    const usage = await request(app).get(`/v1/usage?tenantId=${PRO_TENANT_ID}`);
    expect(usage.status).toBe(200);
    expect(usage.body.data.usage.aiTokens.used).toBe(2450);
    expect(usage.body.data.usage.aiTokens.breakdown).toEqual({
      freshInput: 1200,
      cachedInput: 400,
      standardOutput: 600,
      reasoning: 250,
    });
    // Rollup recomputation must equal the pinned per-category math, category by category.
    expect(usage.body.data.cost.itemizedTokensCost).toEqual({
      freshInputNano: "2400000",
      cachedInputNano: "200000",
      outputNano: "4800000",
      reasoningNano: "2000000",
    });
    expect(BigInt(usage.body.data.cost.totalCostNanoDollars)).toBe(9400n);
  });

  it("rejects the token request that crosses the plan limit with 429 ai_tokens", async () => {
    // Preload exactly the Pro token limit: 5,000,000 tokens.
    await prisma.usageEvent.create({
      data: {
        tenantId: PRO_TENANT_ID,
        eventType: "ai_token",
        apiCallsCount: 0,
        tokensInputFresh: 5_000_000,
        idempotencyKey: "pq-token-preload-limit",
      },
    });

    const res = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", PRO_TENANT_ID)
      .set("Idempotency-Key", "pq-token-over")
      .send({ apiCallsCount: 0, tokens: { freshInput: 1 } });

    expect(res.status).toBe(429);
    expect(res.body.error).toBe("quota_exceeded");
    expect(res.body.metric).toBe("ai_tokens");
    expect(res.body.limit).toBe(5_000_000);
    expect(res.headers["retry-after"]).toBeDefined();

    // The blocked request must not have recorded usage.
    const blocked = await prisma.usageEvent.findFirst({ where: { idempotencyKey: "pq-token-over" } });
    expect(blocked).toBeNull();
  });

  it("allows the request that lands exactly on the token limit, then blocks the next", async () => {
    // One token of headroom below the 5,000,000 limit.
    await prisma.usageEvent.create({
      data: {
        tenantId: PRO_TENANT_ID,
        eventType: "ai_token",
        apiCallsCount: 0,
        tokensInputFresh: 4_999_999,
        idempotencyKey: "pq-token-preload-edge",
      },
    });

    const atLimit = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", PRO_TENANT_ID)
      .set("Idempotency-Key", "pq-token-exact")
      .send({ apiCallsCount: 0, tokens: { freshInput: 1 } });

    expect(atLimit.status).toBe(200);

    const overLimit = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", PRO_TENANT_ID)
      .set("Idempotency-Key", "pq-token-past-edge")
      .send({ apiCallsCount: 0, tokens: { freshInput: 1 } });

    expect(overLimit.status).toBe(429);
    expect(overLimit.body.metric).toBe("ai_tokens");
  });

  it("answers 400 validation_error for negative counts (boundary validation, never 500)", async () => {
    const res = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", PRO_TENANT_ID)
      .set("Idempotency-Key", "pq-negative")
      .send({ apiCallsCount: -5 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("answers 400 with precise errors for missing tenant and missing idempotency headers", async () => {
    const noTenant = await request(app)
      .post("/v1/meter/billable")
      .set("Idempotency-Key", "pq-no-tenant")
      .send({ apiCallsCount: 1 });

    expect(noTenant.status).toBe(400);
    expect(noTenant.body.error).toBe("missing_tenant_id");

    const noKey = await request(app)
      .post("/v1/meter/billable")
      .set("X-Tenant-Id", PRO_TENANT_ID)
      .send({ apiCallsCount: 1 });

    expect(noKey.status).toBe(400);
    expect(noKey.body.error).toBe("missing_idempotency_key");
  });
});
