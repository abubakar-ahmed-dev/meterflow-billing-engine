import Stripe from "stripe";
import { prisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

export class StripePaymentService {
  private static stripeClient: Stripe | null = null;

  public static getStripe(): Stripe {
    if (!this.stripeClient) {
      const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key";
      this.stripeClient = new Stripe(apiKey, {
        apiVersion: "2025-02-24.acacia" as any,
      });
    }
    return this.stripeClient;
  }

  /**
   * Creates a Stripe Checkout Session for upgrading a tenant to Pro plan.
   * Supports local mock mode when MOCK_STRIPE=true or when real credentials aren't present.
   */
  public static async createCheckoutSession(
    tenantId: string,
    successUrl: string = "http://localhost:3000/dashboard?checkout=success",
    cancelUrl: string = "http://localhost:3000/dashboard?checkout=cancel"
  ): Promise<{ sessionId: string; checkoutUrl: string }> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    if (process.env.MOCK_STRIPE === "true") {
      const mockSessionId = `cs_test_mock_${Date.now()}`;
      logger.info({ tenantId, mockSessionId }, "⚡ [Mock Mode] Created simulated Stripe Checkout session");
      return {
        sessionId: mockSessionId,
        checkoutUrl: `https://checkout.stripe.com/c/pay/${mockSessionId}#mock_mode`,
      };
    }

    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      client_reference_id: tenantId,
      customer_email: `${tenant.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Pro Tier Plan",
              description: "50,000 API calls & 5,000,000 AI tokens per month",
            },
            unit_amount: 2900, // $29.00
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url || "",
    };
  }

  /**
   * Cryptographically verifies incoming Stripe webhook signature.
   * Throws Error if signature is invalid or forged.
   */
  public static constructWebhookEvent(rawBody: string | Buffer, signatureHeader: string): Stripe.Event {
    const stripe = this.getStripe();
    const secret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder_secret";
    return stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
  }

  /**
   * Generates authentic test webhook signature headers locally without Stripe servers.
   */
  public static generateTestSignature(payload: string, secret?: string): string {
    const stripe = this.getStripe();
    const webhookSecret = secret || process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder_secret";
    return stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret,
    });
  }

  /**
   * Processes a verified Stripe webhook event with idempotent deduplication.
   */
  public static async processWebhookEvent(event: Stripe.Event): Promise<{ status: string; eventId: string }> {
    const eventId = event.id;

    // 1. Check for duplicate webhook delivery
    const existing = await prisma.processedWebhookEvent.findUnique({
      where: { stripeEventId: eventId },
    });

    if (existing) {
      logger.info({ eventId, type: event.type }, "⚡ Replayed webhook event ignored (idempotent deduplication)");
      return { status: "duplicate_ignored", eventId };
    }

    // Record event as in-progress
    await prisma.processedWebhookEvent.create({
      data: {
        stripeEventId: eventId,
        eventType: event.type,
        status: "PROCESSING",
      },
    });

    try {
      // 2. State Machine Transitions based on Event Type
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const tenantId = session.client_reference_id;
          const stripeSubscriptionId =
            typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null;
          const stripeCustomerId =
            typeof session.customer === "string" ? session.customer : session.customer?.id || null;

          if (tenantId) {
            const now = new Date();
            const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            await prisma.$transaction([
              prisma.tenant.update({
                where: { id: tenantId },
                data: { stripeCustomerId },
              }),
              prisma.subscription.upsert({
                where: { tenantId },
                update: {
                  planId: "pro",
                  status: "ACTIVE",
                  stripeSubscriptionId,
                  currentPeriodEnd: periodEnd,
                },
                create: {
                  tenantId,
                  planId: "pro",
                  status: "ACTIVE",
                  stripeSubscriptionId,
                  currentPeriodStart: now,
                  currentPeriodEnd: periodEnd,
                },
              }),
            ]);

            logger.info({ tenantId, stripeSubscriptionId }, "🚀 Upgraded tenant to PRO tier via verified webhook");
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const stripeSubscriptionId = subscription.id;
          const statusMap: Record<string, string> = {
            active: "ACTIVE",
            past_due: "PAST_DUE",
            canceled: "CANCELED",
            incomplete: "INCOMPLETE",
          };

          const newStatus = statusMap[subscription.status] || "ACTIVE";

          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId },
            data: {
              status: newStatus,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          });
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const stripeSubscriptionId = subscription.id;

          // Downgrade to Free plan
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId },
            data: {
              planId: "free",
              status: "ACTIVE",
              stripeSubscriptionId: null,
            },
          });

          logger.info({ stripeSubscriptionId }, "📉 Downgraded tenant back to FREE tier upon subscription deletion");
          break;
        }

        default:
          logger.info({ type: event.type }, "Webhook event received and acknowledged (no state transition required)");
      }

      await prisma.processedWebhookEvent.update({
        where: { stripeEventId: eventId },
        data: { status: "SUCCESS" },
      });

      return { status: "processed", eventId };
    } catch (err) {
      await prisma.processedWebhookEvent.update({
        where: { stripeEventId: eventId },
        data: { status: "FAILED" },
      });
      throw err;
    }
  }
}
