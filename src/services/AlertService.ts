import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

export class AlertService {
  /**
   * Checks whether the new total usage crosses 80% or 100% threshold,
   * recording a UsageAlert and notifying if triggered.
   */
  public static async evaluateThresholds(
    tenantId: string,
    metric: "api_calls" | "ai_tokens",
    currentUsage: number,
    limit: number
  ): Promise<void> {
    if (limit <= 0) return;

    const percentage = Math.floor((currentUsage / limit) * 100);

    const checkAndRecord = async (threshold: 80 | 100) => {
      if (percentage >= threshold) {
        const existing = await prisma.usageAlert.findFirst({
          where: {
            tenantId,
            metric,
            thresholdPercent: threshold,
          },
        });

        if (!existing) {
          await prisma.usageAlert.create({
            data: {
              tenantId,
              metric,
              thresholdPercent: threshold,
              triggeredAt: new Date(),
            },
          });

          logger.warn(
            { tenantId, metric, threshold, currentUsage, limit },
            `⚠️ USAGE ALERT: Tenant ${tenantId} reached ${threshold}% of ${metric} quota!`
          );
        }
      }
    };

    if (percentage >= 80) await checkAndRecord(80);
    if (percentage >= 100) await checkAndRecord(100);
  }
}
