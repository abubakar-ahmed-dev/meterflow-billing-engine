import { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { StripePaymentService } from "../services/StripePaymentService.js";
import { CostCalculator } from "../services/CostCalculator.js";
import { logger } from "../utils/logger.js";

export class DashboardApiController {
  /**
   * GET /v1/dashboard/overview
   * Returns rich aggregated state across all tenants for dashboard hydration.
   */
  public static async getOverview(_req: Request, res: Response): Promise<void> {
    try {
      const tenants = await prisma.tenant.findMany({
        include: {
          subscription: {
            include: { plan: true },
          },
          usageAlerts: {
            orderBy: { triggeredAt: "desc" },
            take: 5,
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const tenantOverviews = await Promise.all(
        tenants.map(async (t) => {
          const sub = t.subscription;
          const plan = sub?.plan;
          const periodStart = sub?.currentPeriodStart || new Date();
          const periodEnd = sub?.currentPeriodEnd || new Date();

          const aggregate = await prisma.usageEvent.aggregate({
            where: {
              tenantId: t.id,
              timestamp: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
            _sum: {
              apiCallsCount: true,
              tokensInputFresh: true,
              tokensInputCached: true,
              tokensOutputStandard: true,
              tokensOutputReasoning: true,
              costMicrocents: true,
            },
          });

          const callsUsed = aggregate._sum.apiCallsCount || 0;
          const fresh = aggregate._sum.tokensInputFresh || 0;
          const cached = aggregate._sum.tokensInputCached || 0;
          const output = aggregate._sum.tokensOutputStandard || 0;
          const reasoning = aggregate._sum.tokensOutputReasoning || 0;
          const tokensUsed = fresh + cached + output + reasoning;

          const maxCalls = plan?.maxApiCallsPerMonth || 1000;
          const maxTokens = plan?.maxTokensPerMonth || 100000;

          const costBreakdown = CostCalculator.calculateTokenCost({
            freshInput: fresh,
            cachedInput: cached,
            standardOutput: output,
            reasoning,
          });

          return {
            id: t.id,
            name: t.name,
            stripeCustomerId: t.stripeCustomerId,
            plan: {
              id: plan?.id || "free",
              name: plan?.name || "Free Tier",
              maxApiCalls: maxCalls,
              maxTokens,
              priceCentsMonthly: plan?.priceCentsMonthly || 0,
            },
            subscription: {
              status: sub?.status || "INACTIVE",
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
            },
            usage: {
              apiCalls: {
                used: callsUsed,
                limit: maxCalls,
                remaining: Math.max(0, maxCalls - callsUsed),
                percentage: Math.min(100, Math.round((callsUsed / maxCalls) * 100)),
              },
              tokens: {
                used: tokensUsed,
                limit: maxTokens,
                remaining: Math.max(0, maxTokens - tokensUsed),
                percentage: Math.min(100, Math.round((tokensUsed / maxTokens) * 100)),
                breakdown: {
                  fresh,
                  cached,
                  output,
                  reasoning,
                },
              },
            },
            cost: {
              totalCostCents: costBreakdown.totalCostCents,
              formattedUsd: costBreakdown.formattedUsd,
              costMicrocents: (aggregate._sum.costMicrocents || 0n).toString(),
            },
            alerts: t.usageAlerts,
          };
        })
      );

      // Recent global usage events
      const recentUsageEvents = await prisma.usageEvent.findMany({
        take: 10,
        orderBy: { timestamp: "desc" },
        include: { tenant: { select: { name: true } } },
      });

      // Recent processed webhook events
      const recentWebhooks = await prisma.processedWebhookEvent.findMany({
        take: 10,
        orderBy: { processedAt: "desc" },
      });

      res.status(200).json({
        success: true,
        data: {
          tenants: tenantOverviews,
          recentUsageEvents: recentUsageEvents.map((e) => ({
            id: e.id,
            tenantId: e.tenantId,
            tenantName: e.tenant.name,
            eventType: e.eventType,
            apiCallsCount: e.apiCallsCount,
            totalTokens:
              e.tokensInputFresh + e.tokensInputCached + e.tokensOutputStandard + e.tokensOutputReasoning,
            tokensInputFresh: e.tokensInputFresh,
            tokensInputCached: e.tokensInputCached,
            tokensOutputStandard: e.tokensOutputStandard,
            tokensOutputReasoning: e.tokensOutputReasoning,
            costMicrocents: e.costMicrocents.toString(),
            idempotencyKey: e.idempotencyKey,
            timestamp: e.timestamp,
          })),
          recentWebhooks,
        },
      });
    } catch (err) {
      logger.error({ err }, "Failed fetching dashboard overview data");
      res.status(500).json({
        success: false,
        error: "dashboard_data_error",
        message: (err as Error).message,
      });
    }
  }

  /**
   * POST /v1/dashboard/simulate-webhook
   * Allows triggering valid, forged, or replayed Stripe webhooks from the UI.
   */
  public static async simulateWebhook(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId = "00000000-0000-0000-0000-000000000001",
        type = "checkout.session.completed",
        isDuplicate = false,
        isForged = false,
        reusedEventId,
      } = req.body;

      const eventId = isDuplicate && reusedEventId ? reusedEventId : `evt_dash_sim_${Date.now()}`;

      const payload = {
        id: eventId,
        object: "event",
        type,
        data: {
          object: {
            id: `cs_sim_${Date.now()}`,
            client_reference_id: tenantId,
            subscription: `sub_sim_pro_${Date.now()}`,
            customer: `cus_sim_${Date.now()}`,
          },
        },
      };

      const payloadStr = JSON.stringify(payload);
      let signature = StripePaymentService.generateTestSignature(payloadStr);

      if (isForged) {
        signature = "t=12345,v1=bad_forged_signature_hash_simulation";
      }

      // Execute internal call to the webhook handler logic
      let verifiedEvent;
      try {
        verifiedEvent = StripePaymentService.constructWebhookEvent(payloadStr, signature);
      } catch (signErr) {
        res.status(400).json({
          success: false,
          error: "invalid_signature",
          message: `Webhook signature verification rejected with 400: ${(signErr as Error).message}`,
          eventId,
        });
        return;
      }

      const result = await StripePaymentService.processWebhookEvent(verifiedEvent);

      res.status(200).json({
        success: true,
        eventId,
        status: result.status,
        message:
          result.status === "duplicate_ignored"
            ? "Duplicate event detected and safely ignored (idempotent)."
            : "Webhook processed successfully: tenant upgraded to Pro.",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: "simulation_error",
        message: (err as Error).message,
      });
    }
  }

  /**
   * POST /v1/dashboard/reset-boundary
   * Resets Boundary Tenant (or all tenants) back to initial seed state for repeatability.
   */
  public static async resetBoundary(_req: Request, res: Response): Promise<void> {
    try {
      const boundaryTenantId = "00000000-0000-0000-0000-000000000003";
      const freeTenantId = "00000000-0000-0000-0000-000000000001";

      // Reset Boundary Tenant
      await prisma.usageEvent.deleteMany({
        where: {
          tenantId: boundaryTenantId,
          idempotencyKey: { not: "seed-boundary-preload-999" },
        },
      });

      await prisma.subscription.updateMany({
        where: { tenantId: boundaryTenantId },
        data: { planId: "free", status: "ACTIVE" },
      });

      // Reset Free Tenant back to free if upgraded
      await prisma.subscription.updateMany({
        where: { tenantId: freeTenantId },
        data: { planId: "free", status: "ACTIVE" },
      });

      res.status(200).json({
        success: true,
        message: "Boundary tenant reset back to exactly 999 calls. Free tenant reset to Free plan.",
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: "reset_error",
        message: (err as Error).message,
      });
    }
  }
}
