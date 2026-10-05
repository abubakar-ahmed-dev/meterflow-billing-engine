import crypto from "crypto";
import { Prisma } from "@prisma/client";
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

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

/**
 * Outcome of resolving a lost reservation race.
 * - respond: answer immediately with the given result (replay / 422 / 409).
 * - proceed: the caller won a stale-reservation reclaim and owns the key.
 * - retry: the record vanished — worth one more reserve attempt.
 */
type KeyResolution =
  | { kind: "respond"; result: MeterRecordResult }
  | { kind: "proceed" }
  | { kind: "retry" };

export class MeterService {
  /**
   * Processes a billable request with strict exactly-once idempotency guarantees.
   *
   * Concurrency protocol:
   * 1. Reserve the key with a single INSERT. A duplicate (P2002) means another
   *    request owns the key: replay its cached response, reject mismatched
   *    payloads with 422, or answer 409 while it is IN_PROGRESS.
   * 2. A stale IN_PROGRESS record (past its TTL from a crashed request) is
   *    reclaimed atomically via a conditional updateMany — only one writer can win.
   * 3. The usage_event unique constraint (tenantId, idempotencyKey) is the final
   *    backstop: a losing writer catches P2002 and returns the winner's response.
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

    // 1. Atomic key reservation. Lost the insert race → resolve against the winner.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await prisma.idempotencyRecord.create({
          data: {
            idempotencyKey,
            tenantId,
            requestHash,
            status: "IN_PROGRESS",
            expiresAt,
          },
        });
        break;
      } catch (err) {
        if (!isUniqueConstraintError(err)) {
          throw err;
        }
        const resolved = await this.resolveExistingKey(idempotencyKey, requestHash, expiresAt);
        if (resolved.kind === "respond") {
          return resolved.result;
        }
        if (resolved.kind === "proceed") {
          // We won a stale-reservation reclaim: the key is ours, skip re-insert.
          break;
        }
        // "retry": record vanished between insert and read — one more reserve attempt.
      }
    }

    // 2. Pre-Action Quota Validation
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

    // 3. Calculate Pinned Integer Costs
    const costBreakdown = CostCalculator.calculateTokenCost(tokens);
    const apiCostNano = CostCalculator.calculateApiCallCost(apiCallsCount);
    const totalCostNanoDollars = (BigInt(costBreakdown.totalCostNano) + apiCostNano) / 1000n;

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
          costMicrocents: totalCostNanoDollars.toString(),
        },
        planId: quotaResult.planId,
      },
    };

    // 4. Atomic Storage of Usage Event + Finalization of Idempotency Key
    try {
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
            costMicrocents: totalCostNanoDollars,
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
    } catch (err) {
      if (isUniqueConstraintError(err)) {
        // A reclaimed-zombie writer lost the final backstop race.
        // The legitimate owner completed: mirror its stored response.
        logger.warn({ tenantId, idempotencyKey }, "Usage event insert lost the uniqueness race; mirroring owner response.");
        const record = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
        if (record?.status === "COMPLETED") {
          return {
            isReplay: true,
            statusCode: record.responseCode || 200,
            body: record.responseBody ? JSON.parse(record.responseBody) : {},
          };
        }
      }
      throw err;
    }

    // 5. Asynchronously evaluate alert thresholds
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

  private static async resolveExistingKey(
    idempotencyKey: string,
    requestHash: string,
    newExpiry: Date
  ): Promise<KeyResolution> {
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { idempotencyKey },
    });

    if (!existing) {
      // Record vanished (cleanup between insert and read) — caller may retry insert.
      return { kind: "retry" };
    }

    if (existing.status === "COMPLETED") {
      if (existing.requestHash === requestHash) {
        logger.info(
          { tenantId: existing.tenantId, idempotencyKey },
          "⚡ Idempotent request replay detected; returning cached response with zero new usage events."
        );
        return {
          kind: "respond",
          result: {
            isReplay: true,
            statusCode: existing.responseCode || 200,
            body: existing.responseBody ? JSON.parse(existing.responseBody) : {},
          },
        };
      }
      return {
        kind: "respond",
        result: {
          isReplay: false,
          statusCode: 422,
          body: {
            error: "idempotency_payload_mismatch",
            message: "Idempotency key has already been used with a different request payload.",
          },
        },
      };
    }

    // IN_PROGRESS: reclaim only if the reservation expired (crashed request).
    if (existing.expiresAt && existing.expiresAt.getTime() < Date.now()) {
      const reclaimed = await prisma.idempotencyRecord.updateMany({
        where: {
          idempotencyKey,
          status: "IN_PROGRESS",
          expiresAt: { lt: new Date() },
        },
        data: {
          requestHash,
          expiresAt: newExpiry,
        },
      });
      if (reclaimed.count === 1) {
        logger.warn(
          { tenantId: existing.tenantId, idempotencyKey },
          "♻️ Stale IN_PROGRESS idempotency reservation expired and was reclaimed by this request."
        );
        return { kind: "proceed" };
      }
    }

    return {
      kind: "respond",
      result: {
        isReplay: false,
        statusCode: 409,
        body: {
          error: "concurrent_request",
          message: "A request with this idempotency key is currently processing. Retry shortly.",
        },
      },
    };
  }
}
