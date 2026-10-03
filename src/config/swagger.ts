export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "MeterFlow Billing Engine API",
    version: "1.0.0",
    description:
      "Production-grade multi-tenant usage metering and billing service with exact idempotency, quota enforcement, and Stripe test-mode integration.",
    contact: {
      name: "Abubakar Ahmed",
      url: "https://github.com/abubakar-ahmed-dev/meterflow-billing-engine",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Development Server",
    },
  ],
  paths: {
    "/v1/meter/billable": {
      post: {
        summary: "Record billable usage event",
        description:
          "Atomically checks tenant quota, calculates integer token cost, and records a single usage event. Deduplicated by Idempotency-Key.",
        parameters: [
          {
            name: "X-Tenant-Id",
            in: "header",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Tenant UUID",
          },
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,
            schema: { type: "string" },
            description: "Unique request identifier preventing double-counting on retry",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  action: { type: "string", example: "ai_generate" },
                  eventType: { type: "string", enum: ["api_call", "ai_token"], example: "ai_token" },
                  apiCallsCount: { type: "integer", default: 1 },
                  tokens: {
                    type: "object",
                    properties: {
                      freshInput: { type: "integer", example: 1000 },
                      cachedInput: { type: "integer", example: 400 },
                      standardOutput: { type: "integer", example: 500 },
                      reasoning: { type: "integer", example: 200 },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Usage successfully recorded" },
          "400": { description: "Missing required header or malformed payload" },
          "402": { description: "Payment required (subscription past due or upgrade required)" },
          "409": { description: "Concurrent request with this idempotency key in progress" },
          "422": { description: "Idempotency key reused with mismatched payload" },
          "429": { description: "Usage quota exceeded" },
        },
      },
    },
    "/v1/generate": {
      post: {
        summary: "Dummy billable AI endpoint (Alias for /v1/meter/billable)",
        description: "Exercises the exact same metering and quota enforcement pipeline.",
        parameters: [
          { name: "X-Tenant-Id", in: "header", required: true, schema: { type: "string" } },
          { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Operation succeeded" },
          "429": { description: "Quota exceeded" },
        },
      },
    },
    "/v1/usage": {
      get: {
        summary: "Get tenant usage rollup & cost breakdown",
        description: "Aggregates usage across active billing window, returning quota percent used and integer cost breakdown.",
        parameters: [
          {
            name: "X-Tenant-Id",
            in: "header",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "tenantId",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Usage rollup details" },
          "400": { description: "Tenant ID missing" },
          "404": { description: "Tenant not found" },
        },
      },
    },
    "/v1/billing/checkout": {
      post: {
        summary: "Initiate Stripe Checkout Session for Pro tier",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tenantId"],
                properties: {
                  tenantId: { type: "string", format: "uuid" },
                  successUrl: { type: "string" },
                  cancelUrl: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Checkout session created" },
          "400": { description: "Invalid tenant ID" },
        },
      },
    },
    "/v1/webhooks/stripe": {
      post: {
        summary: "Stripe signature-verified webhook listener",
        description: "Cryptographically verifies Stripe-Signature header. Deduplicates events by event ID.",
        parameters: [
          {
            name: "Stripe-Signature",
            in: "header",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Webhook event processed or duplicate ignored" },
          "400": { description: "Forged or missing Stripe-Signature" },
        },
      },
    },
    "/health": {
      get: {
        summary: "Liveness & database readiness probe",
        responses: {
          "200": { description: "Service is healthy and connected to PostgreSQL" },
          "503": { description: "Database unavailable" },
        },
      },
    },
  },
};
