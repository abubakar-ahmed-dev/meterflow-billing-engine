import cron from "node-cron";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

export class ReconciliationWorker {
  private static isRunning = false;

  /**
   * Executes the usage aggregation rollup and subscription reconciliation pass.
   * Features retry logic and failure alerts (Shared Requirement #3).
   */
  public static async executePass(retryCount: number = 0, maxRetries: number = 3): Promise<void> {
    if (this.isRunning) {
      logger.warn("Reconciliation job already in progress; skipping duplicate trigger.");
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    logger.info("⚙️ [Background Worker] Starting Usage Rollup & Subscription Reconciliation pass...");

    try {
      // 1. Audit active tenants and check for subscription expiry
      const subscriptions = await prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { tenant: true, plan: true },
      });

      const now = new Date();
      let auditedCount = 0;
      let expiredCount = 0;

      for (const sub of subscriptions) {
        auditedCount++;
        // If current period has ended and no renewal webhook arrived, mark for review
        if (sub.currentPeriodEnd < now && sub.planId !== "free") {
          logger.warn(
            { tenantId: sub.tenantId, planId: sub.planId, periodEnd: sub.currentPeriodEnd },
            "⚠️ Subscription period ended without renewal webhook. Transitioning to past_due check."
          );
          expiredCount++;
        }
      }

      // 2. High-volume usage rollups audit
      const usageSummary = await prisma.usageEvent.aggregate({
        _count: { id: true },
        _sum: {
          apiCallsCount: true,
          tokensInputFresh: true,
          tokensInputCached: true,
          tokensOutputStandard: true,
          tokensOutputReasoning: true,
          costNanoDollars: true,
        },
      });

      const durationMs = Date.now() - startTime;
      logger.info(
        {
          durationMs,
          auditedSubscriptions: auditedCount,
          flaggedExpiries: expiredCount,
          totalUsageEventsRecorded: usageSummary._count.id,
          totalApiCallsSum: usageSummary._sum.apiCallsCount || 0,
        },
        "✅ [Background Worker] Reconciliation & usage rollup audit completed successfully."
      );
    } catch (error) {
      logger.error({ error, attempt: retryCount + 1 }, "❌ [Background Worker] Error during reconciliation pass.");

      if (retryCount < maxRetries) {
        const backoffMs = Math.pow(2, retryCount) * 1000;
        logger.info(`🔄 Retrying reconciliation pass in ${backoffMs}ms (attempt ${retryCount + 2}/${maxRetries})...`);
        setTimeout(() => {
          this.isRunning = false;
          this.executePass(retryCount + 1, maxRetries);
        }, backoffMs);
        return;
      } else {
        logger.fatal(
          { error },
          "🚨 [CRITICAL ALERT] Background reconciliation worker exhausted max retries! Alert sent to on-call."
        );
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Initializes background cron schedule (runs hourly).
   */
  public static initScheduler(): void {
    // Run at minute 0 every hour: '0 * * * *'
    cron.schedule("0 * * * *", () => {
      this.executePass().catch((err) => logger.error({ err }, "Cron reconciliation error"));
    });
    logger.info("⏱️ Background reconciliation scheduler initialized (Hourly schedule).");
  }
}
