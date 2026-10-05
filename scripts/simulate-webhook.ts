/**
 * `stripe trigger` equivalent for environments without a Stripe account
 * (Stripe is not available as a merchant platform in Pakistan).
 *
 * Builds payloads that mirror real Stripe event schemas and signs them with
 * Stripe's own SDK (`webhooks.generateTestHeaderString`), so the verification
 * path exercised is byte-identical to a real forwarded webhook.
 *
 * Usage:
 *   npm run stripe:trigger -- [eventType] [tenantId] [targetUrl] [subscriptionId]
 *
 * eventType: checkout.session.completed (default)
 *            customer.subscription.updated
 *            customer.subscription.deleted
 *            forged            (bad signature -> expects 400)
 */
import dotenv from "dotenv";
import { StripePaymentService } from "../src/services/StripePaymentService.js";

dotenv.config();

const CHECKOUT_COMPLETED = "checkout.session.completed";
const SUBSCRIPTION_UPDATED = "customer.subscription.updated";
const SUBSCRIPTION_DELETED = "customer.subscription.deleted";

const USAGE = `Usage: npm run stripe:trigger -- [eventType] [tenantId] [url] [subscriptionId]
  eventType: ${CHECKOUT_COMPLETED} | ${SUBSCRIPTION_UPDATED} | ${SUBSCRIPTION_DELETED} | forged`;

function buildEventPayload(eventType: string, tenantId: string, subscriptionId: string): Record<string, unknown> {
  // A forged delivery carries a perfectly ordinary payload — only the signature is invalid.
  const effectiveType = eventType === "forged" ? CHECKOUT_COMPLETED : eventType;
  const nowSec = Math.floor(Date.now() / 1000);
  const monthEndSec = nowSec + 30 * 24 * 3600;
  const customerId = `cus_sim_${Date.now()}`;

  switch (effectiveType) {
    case CHECKOUT_COMPLETED:
      // Mirrors a real checkout.session.completed payload (Stripe.Checkout.Session).
      return {
        id: `evt_${Date.now()}`,
        object: "event",
        api_version: "2025-02-24.acacia",
        type: CHECKOUT_COMPLETED,
        data: {
          object: {
            id: `cs_${Date.now()}`,
            object: "checkout.session",
            status: "complete",
            payment_status: "paid",
            client_reference_id: tenantId,
            customer: customerId,
            subscription: subscriptionId,
            mode: "subscription",
          },
        },
      };
    case SUBSCRIPTION_UPDATED:
      // Mirrors Stripe.Subscription (unix-second period timestamps).
      return {
        id: `evt_${Date.now()}`,
        object: "event",
        api_version: "2025-02-24.acacia",
        type: SUBSCRIPTION_UPDATED,
        data: {
          object: {
            id: subscriptionId,
            object: "subscription",
            status: "past_due",
            customer: customerId,
            current_period_start: nowSec,
            current_period_end: monthEndSec,
          },
        },
      };
    case SUBSCRIPTION_DELETED:
      return {
        id: `evt_${Date.now()}`,
        object: "event",
        api_version: "2025-02-24.acacia",
        type: SUBSCRIPTION_DELETED,
        data: {
          object: {
            id: subscriptionId,
            object: "subscription",
            status: "canceled",
            customer: customerId,
            current_period_start: nowSec,
            current_period_end: monthEndSec,
          },
        },
      };
    default:
      throw new Error(USAGE);
  }
}

async function main() {
  const [eventTypeArg, tenantIdArg, urlArg, subIdArg] = process.argv.slice(2);
  const eventType = eventTypeArg || CHECKOUT_COMPLETED;
  const tenantId = tenantIdArg || "00000000-0000-0000-0000-000000000001";
  const targetUrl = urlArg || `http://localhost:${process.env.PORT || 3000}/v1/webhooks/stripe`;
  // Real Stripe events for one subscription share its id across lifecycle;
  // pass the id printed by the checkout trigger to chain update/delete events.
  const subscriptionId = subIdArg || `sub_sim_${Date.now()}`;

  const isForged = eventType === "forged";
  let payloadStr: string;
  try {
    payloadStr = JSON.stringify(buildEventPayload(eventType, tenantId, subscriptionId));
  } catch {
    console.error(USAGE);
    process.exit(1);
  }

  // Forged: deliberately invalid signature; everything else: authentic HMAC.
  const signature = isForged
    ? "t=1,v1=forged_signature_not_signed_by_stripe"
    : StripePaymentService.generateTestSignature(payloadStr);

  console.log(`📡 Triggering ${isForged ? "FORGED" : eventType} webhook (stripe trigger equivalent)...`);
  console.log(`🎯 URL: ${targetUrl}`);
  console.log(`🏢 Tenant: ${tenantId}`);
  if (eventType === CHECKOUT_COMPLETED) {
    console.log(`🔑 Subscription: ${subscriptionId} (pass this to updated/deleted to chain the lifecycle)`);
  }

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Stripe-Signature": signature },
      body: payloadStr,
    });
    const data = await response.json();
    const verdict = response.status === 200 && data.status === "processed" ? "✅ processed" : `ℹ️ [${response.status}]`;
    console.log(`${verdict}:`, JSON.stringify(data));
    process.exit(response.ok ? 0 : 1);
  } catch (error) {
    console.error("❌ Failed to dispatch simulated webhook:", error);
    process.exit(1);
  }
}

main();
