import crypto from "crypto";
import { prisma } from "../db/prisma.js";
import { CostCalculator } from "./CostCalculator.js";
import { QuotaService } from "./QuotaService.js";
import { AlertService } from "./AlertService.js";
import { TokenUsageInput } from "../config/pricing.js";
import { logger } from "../utils/logger.js";

export interface MeterRecordParams {
  tenantId: string;
  idempotencyKey: string;
  requestPath: string;
  requestPayload: unknown;
  eventType?: "api_call" | "ai_token";
  apiCallsCount?: number;
  tokens?: TokenUsageInput;
}

export interface MeterRecordResult {
  isReplay: boolean;
  statusCode: number;
  body: Record<string, unknown>;
}

export class MeterService {
  /**
   * Processes a billable request with strict exactly-once idempotency guarantees.
   */
  public static async recordUsage(params: MeterRecordParams): Promise<MeterRecordResult> {
    const {
      tenantId,
      idempotencyKey,
      requestPath,
      requestPayload,
      eventType = "api_call",
      apiCallsCount = 1,
      tokens = {},
    } = params;

    const requestHash = crypto
      .createHash("sha256")
      .update(`${requestPath}:${JSON.stringify(requestPayload)}`)
      .digest("hex");

    const ttlSeconds = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || "86400", 10);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // 1. Check existing idempotency record
    const existingKey = await prisma.idempotencyRecord.findUnique({
      where: { idempotencyKey },
    });

    if (existingKey) {
      if (existingKey.status === "COMPLETED") {
        if (existingKey.requestHash === requestHash) {
          logger.info(
            { tenantId, idempotencyKey },
            "⚡ Idempotent request replay detected; returning cached response with zero new usage events."
          );
          return {
            isReplay: true,
            statusCode: existingKey.responseCode || 200,
            body: existingKey.responseBody ? JSON.parse(existingKey.responseBody) : {},
          };
        } else {
          return {
            isReplay: false,
            statusCode: 422,
            body: {
              error: "idempotency_payload_mismatch",
              message: "Idempotency key has already been used with a different request payload.",
            },
          };
        }
      }

      if (existingKey.status === "IN_PROGRESS") {
        return {
          isReplay: false,
          statusCode: 409,
          body: {
            error: "concurrent_request",
            message: "A request with this idempotency key is currently processing. Retry shortly.",
          },
        };
      }
    }

    // 2. Reserve the idempotency key with IN_PROGRESS status
    await prisma.idempotencyRecord.upsert({
      where: { idempotencyKey },
      update: {
        status: "IN_PROGRESS",
        requestHash,
        expiresAt,
      },
      create: {
        idempotencyKey,
        tenantId,
        requestHash,
        status: "IN_PROGRESS",
        expiresAt,
      },
    });

    // 3. Pre-Action Quota Validation
    const requestedTokensTotal =
      (tokens.freshInput || 0) +
      (tokens.cachedInput || 0) +
      (tokens.standardOutput || 0) +
      (tokens.reasoning || 0);

    const quotaResult = await QuotaService.checkQuota(tenantId, apiCallsCount, requestedTokensTotal);

    if (!quotaResult.allowed) {
      const errorResponse = {
        success: false,
        error: quotaResult.error,
        message: quotaResult.message,
        metric: quotaResult.metric,
        currentUsage: quotaResult.currentUsage,
        requestedUsage: quotaResult.requestedUsage,
        limit: quotaResult.limit,
        retryAfterSeconds: quotaResult.retryAfterSeconds,
      };

      const statusCode = quotaResult.statusCode || 429;

      // Complete idempotency record with rejection so retries return identical error
      await prisma.idempotencyRecord.update({
        where: { idempotencyKey },
        data: {
          status: "COMPLETED",
          responseCode: statusCode,
          responseBody: JSON.stringify(errorResponse),
        },
      });

      return {
        isReplay: false,
        statusCode,
        body: errorResponse,
      };
    }

    // 4. Calculate Pinned Integer Costs
    const costBreakdown = CostCalculator.calculateTokenCost(tokens);
    const apiCostNano = CostCalculator.calculateApiCallCost(apiCallsCount);
    const totalCostMicrocents = (BigInt(costBreakdown.totalCostNano) + apiCostNano) / 1000n; // Convert nano to microcents

    const successResponse = {
      success: true,
      data: {
        tenantId,
        eventType,
        apiCallsRecorded: apiCallsCount,
        tokensRecorded: costBreakdown.totalTokens,
        breakdown: {
          freshInput: costBreakdown.freshInputTokens,
          cachedInput: costBreakdown.cachedInputTokens,
          standardOutput: costBreakdown.standardOutputTokens,
          reasoning: costBreakdown.reasoningTokens,
        },
        cost: {
          totalCostCents: costBreakdown.totalCostCents,
          formattedUsd: costBreakdown.formattedUsd,
          costMicrocents: totalCostMicrocents.toString(),
        },
        planId: quotaResult.planId,
      },
    };

    // 5. Atomic Storage of Usage Event + Finalization of Idempotency Key
    await prisma.$transaction([
      prisma.usageEvent.create({
        data: {
          tenantId,
          eventType,
          apiCallsCount,
          tokensInputFresh: costBreakdown.freshInputTokens,
          tokensInputCached: costBreakdown.cachedInputTokens,
          tokensOutputStandard: costBreakdown.standardOutputTokens,
          tokensOutputReasoning: costBreakdown.reasoningTokens,
          costMicrocents: totalCostMicrocents,
          idempotencyKey,
        },
      }),
      prisma.idempotencyRecord.update({
        where: { idempotencyKey },
        data: {
          status: "COMPLETED",
          responseCode: 200,
          responseBody: JSON.stringify(successResponse),
        },
      }),
    ]);

    // 6. Asynchronously evaluate alert thresholds
    if (quotaResult.limit) {
      const newCallsUsage = (quotaResult.currentUsage || 0) + apiCallsCount;
      AlertService.evaluateThresholds(tenantId, "api_calls", newCallsUsage, quotaResult.limit).catch(
        (err) => logger.error({ err }, "Failed evaluating alert thresholds")
      );
    }

    return {
      isReplay: false,
      statusCode: 200,
      body: successResponse,
    };
  }
}
