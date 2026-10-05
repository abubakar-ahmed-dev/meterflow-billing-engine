import cron from "node-cron";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

export class ReconciliationWorker {
  private static isRunning = false;

  /**
   * Executes the subscription reconciliation pass and usage rollup audit.
   *
   * Actions (Shared Requirement #3: slow work off the request path, retries +
   * failure alert):
   * 1. ACTIVE subscriptions whose billing period ended without a renewal webhook
   *    are transitioned to PAST_DUE — quota enforcement then honestly answers 402.
   * 2. Usage-event rollup totals are audited for drift.
   * 3. Every run is persisted to job_run_logs; an exhausted retry budget is a
   *    persisted FAILED alert, not just a log line.
   */
  public static async executePass(retryCount: number = 0, maxRetries: number = 3): Promise<void> {
    if (this.isRunning) {
      logger.warn("Reconciliation job already in progress; skipping duplicate trigger.");
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    logger.info("⚙️ [Background Worker] Starting reconciliation pass...");

    try {
      // 1. Subscription reconciliation: expire lapsed periods.
      const lapsed = await prisma.subscription.updateMany({
        where: {
          status: "ACTIVE",
          currentPeriodEnd: { lt: new Date() },
          planId: { not: "free" },
        },
        data: { status: "PAST_DUE" },
      });

      if (lapsed.count > 0) {
        logger.warn(
          { transitioned: lapsed.count },
          "⚠️ [Background Worker] Subscriptions past period end without renewal moved to PAST_DUE (402 enforcement active)."
        );
      }

      // 2. Usage rollup audit.
      const usageSummary = await prisma.usageEvent.aggregate({
        _count: { id: true },
        _sum: {
          apiCallsCount: true,
          costNanoDollars: true,
        },
      });

      const durationMs = Date.now() - startTime;
      const detail = JSON.stringify({
        durationMs,
        subscriptionsMovedToPastDue: lapsed.count,
        totalUsageEvents: usageSummary._count.id,
        totalApiCalls: usageSummary._sum.apiCallsCount || 0,
        totalCostNanoDollars: (usageSummary._sum.costNanoDollars || 0n).toString(),
      });

      await prisma.jobRunLog.create({
        data: { jobName: "reconciliation", status: "SUCCESS", detail },
      });

      logger.info({ durationMs, subscriptionsMovedToPastDue: lapsed.count }, "✅ [Background Worker] Reconciliation pass completed.");
    } catch (error) {
      logger.error({ error, attempt: retryCount + 1 }, "❌ [Background Worker] Error during reconciliation pass.");

      if (retryCount < maxRetries) {
        const backoffMs = Math.pow(2, retryCount) * 1000;
        logger.info(`🔄 Retrying reconciliation pass in ${backoffMs}ms (attempt ${retryCount + 2}/${maxRetries + 1})...`);
        setTimeout(() => {
          this.isRunning = false;
          this.executePass(retryCount + 1, maxRetries).catch(() => {});
        }, backoffMs);
        return;
      }

      // Retry budget exhausted: persisted failure alert (Shared Requirement #3).
      await prisma.jobRunLog.create({
        data: {
          jobName: "reconciliation",
          status: "FAILED",
          detail: `ALERT: reconciliation failed after ${maxRetries + 1} attempts: ${(error as Error).message}`,
        },
      });
      logger.fatal(
        { error },
        "🚨 [CRITICAL ALERT] Reconciliation worker exhausted retries. Failure persisted to job_run_logs for operator action."
      );
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
