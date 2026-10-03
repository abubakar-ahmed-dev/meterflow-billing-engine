import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Clean existing records in reverse order of FKs
  await prisma.usageAlert.deleteMany();
  await prisma.usageEvent.deleteMany();
  await prisma.idempotencyRecord.deleteMany();
  await prisma.processedWebhookEvent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.plan.deleteMany();

  // 2. Seed Plans
  const freePlan = await prisma.plan.create({
    data: {
      id: "free",
      name: "Free Tier",
      maxApiCallsPerMonth: 1000,
      maxTokensPerMonth: 100000,
      priceCentsMonthly: 0,
      stripePriceId: null,
    },
  });

  const proPlan = await prisma.plan.create({
    data: {
      id: "pro",
      name: "Pro Tier",
      maxApiCallsPerMonth: 50000,
      maxTokensPerMonth: 5000000,
      priceCentsMonthly: 2900,
      stripePriceId: "price_pro_monthly_test",
    },
  });

  console.log("✅ Seeded plans:", [freePlan.id, proPlan.id]);

  // Billing period dates (Current month window)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // 3. Tenant 1: Standard Free Tenant
  const tenantFree = await prisma.tenant.create({
    data: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Acme Corp (Free Plan)",
      stripeCustomerId: "cus_test_free_001",
      subscription: {
        create: {
          planId: "free",
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      },
    },
  });

  // 4. Tenant 2: Standard Pro Tenant
  const tenantPro = await prisma.tenant.create({
    data: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Globex Inc (Pro Plan)",
      stripeCustomerId: "cus_test_pro_002",
      subscription: {
        create: {
          planId: "pro",
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      },
    },
  });

  // 5. Tenant 3: Boundary Tenant (Seeded with 999 calls of 1,000 allowance)
  const tenantBoundary = await prisma.tenant.create({
    data: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Boundary Testing Org (999/1,000 used)",
      stripeCustomerId: "cus_test_boundary_003",
      subscription: {
        create: {
          planId: "free",
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      },
    },
  });

  // Pre-seed 999 usage events for boundary testing (bulk recorded as 1 event with 999 calls)
  await prisma.usageEvent.create({
    data: {
      tenantId: tenantBoundary.id,
      eventType: "api_call",
      apiCallsCount: 999,
      tokensInputFresh: 0,
      tokensInputCached: 0,
      tokensOutputStandard: 0,
      tokensOutputReasoning: 0,
      costMicrocents: BigInt(0),
      idempotencyKey: "seed-boundary-preload-999",
      timestamp: new Date(),
    },
  });

  // 6. Tenant 4: Lapsed Subscription Tenant (For testing HTTP 402 Payment Required)
  const tenantLapsed = await prisma.tenant.create({
    data: {
      id: "00000000-0000-0000-0000-000000000004",
      name: "Past Due Enterprise (Lapsed)",
      stripeCustomerId: "cus_test_lapsed_004",
      subscription: {
        create: {
          planId: "pro",
          status: "PAST_DUE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
      },
    },
  });

  console.log("✅ Seeded tenants:", [
    tenantFree.id,
    tenantPro.id,
    tenantBoundary.id,
    tenantLapsed.id,
  ]);
  console.log("🎉 Seeding completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
