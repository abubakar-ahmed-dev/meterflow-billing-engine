import { Request, Response } from "express";
import { MeterService } from "../services/MeterService.js";
import { CostCalculator } from "../services/CostCalculator.js";
import { prisma } from "../db/prisma.js";

export class MeterController {
  /**
   * Handles POST /v1/meter/billable and POST /v1/generate
   */
  public static async handleBillable(req: Request, res: Response): Promise<void> {
    const tenantId =
      (req.headers["x-tenant-id"] as string) ||
      (req.query.tenantId as string) ||
      (req.body.tenantId as string);

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: "missing_tenant_id",
        message: "Header 'X-Tenant-Id' or parameter 'tenantId' is required for billable requests.",
      });
      return;
    }

    const idempotencyKey =
      (req.headers["idempotency-key"] as string) ||
      (req.headers["x-idempotency-key"] as string);

    if (!idempotencyKey) {
      res.status(400).json({
        success: false,
        error: "missing_idempotency_key",
        message: "Header 'Idempotency-Key' is required to ensure exactly-once metering.",
      });
      return;
    }

    const { eventType, apiCallsCount, tokens } = req.body;

    const result = await MeterService.recordUsage({
      tenantId,
      idempotencyKey,
      requestPath: req.originalUrl || req.path,
      requestPayload: req.body,
      eventType: eventType || (tokens && Object.keys(tokens).length > 0 ? "ai_token" : "api_call"),
      apiCallsCount: apiCallsCount !== undefined ? apiCallsCount : 1,
      tokens: tokens || {},
    });

    if (result.isReplay) {
      res.setHeader("X-Idempotent-Replayed", "true");
    }

    if (result.statusCode === 429 && result.body.retryAfterSeconds) {
      res.setHeader("Retry-After", String(result.body.retryAfterSeconds));
    }

    res.status(result.statusCode).json(result.body);
  }

  /**
   * Handles GET /v1/usage
   * Returns current billing period rollup: used, limits, and cost breakdown
   */
  public static async handleGetUsage(req: Request, res: Response): Promise<void> {
    const tenantId =
      (req.headers["x-tenant-id"] as string) ||
      (req.query.tenantId as string);

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: "missing_tenant_id",
        message: "Header 'X-Tenant-Id' or query 'tenantId' is required.",
      });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: "tenant_not_found",
        message: `Tenant ${tenantId} not found.`,
      });
      return;
    }

    const sub = tenant.subscription;
    if (!sub || !sub.plan) {
      res.status(402).json({
        success: false,
        error: "no_active_subscription",
        message: "Tenant has no active subscription.",
      });
      return;
    }

    const plan = sub.plan;
    const periodStart = sub.currentPeriodStart;
    const periodEnd = sub.currentPeriodEnd;

    // Aggregate monthly usage
    const aggregate = await prisma.usageEvent.aggregate({
      where: {
        tenantId,
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
        costNanoDollars: true,
      },
    });

    const callsUsed = aggregate._sum.apiCallsCount || 0;
    const freshInput = aggregate._sum.tokensInputFresh || 0;
    const cachedInput = aggregate._sum.tokensInputCached || 0;
    const standardOutput = aggregate._sum.tokensOutputStandard || 0;
    const reasoning = aggregate._sum.tokensOutputReasoning || 0;
    const totalTokensUsed = freshInput + cachedInput + standardOutput + reasoning;

    const tokenCostBreakdown = CostCalculator.calculateTokenCost({
      freshInput,
      cachedInput,
      standardOutput,
      reasoning,
    });

    const callsRemaining = Math.max(0, plan.maxApiCallsPerMonth - callsUsed);
    const tokensRemaining = Math.max(0, plan.maxTokensPerMonth - totalTokensUsed);

    res.status(200).json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          stripeCustomerId: tenant.stripeCustomerId,
        },
        plan: {
          id: plan.id,
          name: plan.name,
          maxApiCallsPerMonth: plan.maxApiCallsPerMonth,
          maxTokensPerMonth: plan.maxTokensPerMonth,
          priceCentsMonthly: plan.priceCentsMonthly,
        },
        subscription: {
          status: sub.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        },
        usage: {
          apiCalls: {
            used: callsUsed,
            limit: plan.maxApiCallsPerMonth,
            remaining: callsRemaining,
            percentUsed: Math.min(100, Math.round((callsUsed / plan.maxApiCallsPerMonth) * 100)),
          },
          aiTokens: {
            used: totalTokensUsed,
            limit: plan.maxTokensPerMonth,
            remaining: tokensRemaining,
            percentUsed: Math.min(100, Math.round((totalTokensUsed / plan.maxTokensPerMonth) * 100)),
            breakdown: {
              freshInput,
              cachedInput,
              standardOutput,
              reasoning,
            },
          },
        },
        cost: {
          totalCostCents: tokenCostBreakdown.totalCostCents,
          totalCostNanoDollars: (aggregate._sum.costNanoDollars || 0n).toString(),
          formattedUsd: tokenCostBreakdown.formattedUsd,
          itemizedTokensCost: {
            freshInputNano: tokenCostBreakdown.costFreshInputNano,
            cachedInputNano: tokenCostBreakdown.costCachedInputNano,
            outputNano: tokenCostBreakdown.costOutputNano,
            reasoningNano: tokenCostBreakdown.costReasoningNano,
          },
        },
      },
    });
  }
}
