import { prisma } from "../db/prisma.js";

export interface QuotaCheckResult {
  allowed: boolean;
  statusCode?: 200 | 402 | 429;
  error?: string;
  message?: string;
  metric?: "api_calls" | "ai_tokens";
  currentUsage?: number;
  requestedUsage?: number;
  limit?: number;
  retryAfterSeconds?: number;
  planId?: string;
}

export class QuotaService {
  /**
   * Evaluates if a tenant has sufficient quota before executing a billable operation.
   * Enforces status code honesty:
   * - 402 Payment Required: When subscription is PAST_DUE, CANCELED, or INCOMPLETE.
   * - 429 Too Many Requests: When plan quota is exceeded on an active plan.
   */
  public static async checkQuota(
    tenantId: string,
    requestedCalls: number = 1,
    requestedTokens: number = 0
  ): Promise<QuotaCheckResult> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!tenant) {
      return {
        allowed: false,
        statusCode: 429,
        error: "tenant_not_found",
        message: `Tenant with ID ${tenantId} does not exist.`,
      };
    }

    const subscription = tenant.subscription;
    if (!subscription || !subscription.plan) {
      return {
        allowed: false,
        statusCode: 402,
        error: "no_active_subscription",
        message: "No subscription plan associated with tenant. Upgrade required.",
      };
    }

    // 1. Subscription status validation (402 Payment Required)
    if (subscription.status !== "ACTIVE") {
      return {
        allowed: false,
        statusCode: 402,
        error: "payment_required",
        message: `Tenant subscription is ${subscription.status}. Payment or plan renewal required.`,
        planId: subscription.planId,
      };
    }

    const plan = subscription.plan;
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    // 2. Aggregate current usage within active billing period
    const usageAggregate = await prisma.usageEvent.aggregate({
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
      },
    });

    const currentCalls = usageAggregate._sum.apiCallsCount || 0;
    const currentTokens =
      (usageAggregate._sum.tokensInputFresh || 0) +
      (usageAggregate._sum.tokensInputCached || 0) +
      (usageAggregate._sum.tokensOutputStandard || 0) +
      (usageAggregate._sum.tokensOutputReasoning || 0);

    const now = new Date();
    const retryAfterSeconds = Math.max(1, Math.floor((periodEnd.getTime() - now.getTime()) / 1000));

    // 3. API Calls quota check
    if (requestedCalls > 0 && currentCalls + requestedCalls > plan.maxApiCallsPerMonth) {
      return {
        allowed: false,
        statusCode: 429,
        error: "quota_exceeded",
        message: `Monthly API call quota exceeded. Current: ${currentCalls}, Requested: ${requestedCalls}, Limit: ${plan.maxApiCallsPerMonth}.`,
        metric: "api_calls",
        currentUsage: currentCalls,
        requestedUsage: requestedCalls,
        limit: plan.maxApiCallsPerMonth,
        retryAfterSeconds,
        planId: plan.id,
      };
    }

    // 4. AI Tokens quota check
    if (requestedTokens > 0 && currentTokens + requestedTokens > plan.maxTokensPerMonth) {
      return {
        allowed: false,
        statusCode: 429,
        error: "quota_exceeded",
        message: `Monthly AI token quota exceeded. Current: ${currentTokens}, Requested: ${requestedTokens}, Limit: ${plan.maxTokensPerMonth}.`,
        metric: "ai_tokens",
        currentUsage: currentTokens,
        requestedUsage: requestedTokens,
        limit: plan.maxTokensPerMonth,
        retryAfterSeconds,
        planId: plan.id,
      };
    }

    return {
      allowed: true,
      statusCode: 200,
      currentUsage: currentCalls,
      limit: plan.maxApiCallsPerMonth,
      planId: plan.id,
    };
  }
}
