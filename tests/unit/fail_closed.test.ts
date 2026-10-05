import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { StripePaymentService } from "../../src/services/StripePaymentService.js";
import { ConfigurationError } from "../../src/utils/errors.js";

/**
 * Phase 3 gate: the server must fail closed on missing Stripe configuration.
 * Placeholder-secret fallbacks would let forged webhooks verify against a
 * secret that is public in the repository.
 */
describe("Phase 3 — Fail-Closed Stripe Configuration", () => {
  const savedKey = process.env.STRIPE_SECRET_KEY;
  const savedSecret = process.env.STRIPE_WEBHOOK_SECRET;

  afterEach(() => {
    if (savedKey === undefined) {
      delete process.env.STRIPE_SECRET_KEY;
    } else {
      process.env.STRIPE_SECRET_KEY = savedKey;
    }
    if (savedSecret === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = savedSecret;
    }
  });

  it("constructWebhookEvent throws ConfigurationError when STRIPE_WEBHOOK_SECRET is missing", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(() => StripePaymentService.constructWebhookEvent("{}", "t=1,v1=abc")).toThrow(ConfigurationError);
  });

  it("generateTestSignature throws ConfigurationError when STRIPE_WEBHOOK_SECRET is missing", () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect(() => StripePaymentService.generateTestSignature("{}")).toThrow(ConfigurationError);
  });

  it("getStripe throws ConfigurationError when STRIPE_SECRET_KEY is missing and no client is cached", () => {
    const cached = (StripePaymentService as any).stripeClient;
    (StripePaymentService as any).stripeClient = null;
    try {
      delete process.env.STRIPE_SECRET_KEY;
      expect(() => StripePaymentService.getStripe()).toThrow(ConfigurationError);
    } finally {
      (StripePaymentService as any).stripeClient = cached;
    }
  });

  it("webhook endpoint answers 500 server_configuration_error (not 400) when the secret is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const res = await request(app)
        .post("/v1/webhooks/stripe")
        .set("Content-Type", "application/json")
        .set("Stripe-Signature", "t=123,v1=deadbeef")
        .send({});

      expect(res.status).toBe(500);
      expect(res.body.error).toBe("server_configuration_error");
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = savedSecret;
    }
  });
});
