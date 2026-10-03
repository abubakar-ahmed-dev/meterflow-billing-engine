import dotenv from "dotenv";
import { StripePaymentService } from "../src/services/StripePaymentService.js";

dotenv.config();

async function main() {
  const targetUrl = process.argv[2] || "http://localhost:3000/v1/webhooks/stripe";
  const tenantId = process.argv[3] || "00000000-0000-0000-0000-000000000001";
  const eventId = `evt_manual_sim_${Date.now()}`;

  const payload = {
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_sim_${Date.now()}`,
        client_reference_id: tenantId,
        subscription: `sub_sim_pro_${Date.now()}`,
        customer: `cus_sim_${Date.now()}`,
      },
    },
  };

  const payloadStr = JSON.stringify(payload);
  const signature = StripePaymentService.generateTestSignature(payloadStr);

  console.log("📡 Dispatching simulated Stripe webhook...");
  console.log(`🎯 URL: ${targetUrl}`);
  console.log(`🏢 Tenant ID: ${tenantId}`);
  console.log(`🔑 Event ID: ${eventId}`);
  console.log(`🔐 Generated Signature: ${signature.slice(0, 30)}...`);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": signature,
      },
      body: payloadStr,
    });

    const data = await response.json();
    console.log(`✅ Webhook Response [${response.status}]:`, data);
  } catch (error) {
    console.error("❌ Failed to dispatch simulated webhook:", error);
  }
}

main();
