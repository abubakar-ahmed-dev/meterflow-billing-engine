import { Request, Response } from "express";
import { StripePaymentService } from "../services/StripePaymentService.js";
import { logger } from "../utils/logger.js";

export class BillingController {
  /**
   * Handles POST /v1/billing/checkout
   * Initiates Stripe Checkout session for Pro plan
   */
  public static async handleCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, successUrl, cancelUrl } = req.body;

      const session = await StripePaymentService.createCheckoutSession(tenantId, successUrl, cancelUrl);

      res.status(200).json({
        success: true,
        data: {
          sessionId: session.sessionId,
          checkoutUrl: session.checkoutUrl,
        },
      });
    } catch (err) {
      logger.error({ err }, "Checkout session creation failed");
      res.status(400).json({
        success: false,
        error: "checkout_failed",
        message: (err as Error).message,
      });
    }
  }

  /**
   * Handles POST /v1/webhooks/stripe
   * Cryptographically verifies signature and deduplicates events.
   * Requirement: Forged signatures return 400 Bad Request.
   */
  public static async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      logger.warn("Webhook rejected: Missing 'Stripe-Signature' header.");
      res.status(400).json({
        success: false,
        error: "missing_signature",
        message: "Stripe-Signature header is missing.",
      });
      return;
    }

    // Retrieve raw body buffer
    const rawBody = (req as any).rawBody || req.body;

    let event;
    try {
      event = StripePaymentService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "🚫 Forged or invalid webhook signature rejected with 400");
      res.status(400).json({
        success: false,
        error: "invalid_signature",
        message: `Webhook signature verification failed: ${(err as Error).message}`,
      });
      return;
    }

    try {
      const result = await StripePaymentService.processWebhookEvent(event);
      res.status(200).json({
        received: true,
        eventId: event.id,
        status: result.status,
      });
    } catch (err) {
      logger.error({ err, eventId: event.id }, "Error processing verified webhook event");
      res.status(500).json({
        received: true,
        error: "internal_processing_error",
        message: (err as Error).message,
      });
    }
  }
}
