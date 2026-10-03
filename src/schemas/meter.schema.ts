import { z } from "zod";

export const BillableRequestSchema = z.object({
  action: z.string().min(1, "Action name is required").default("api_call"),
  eventType: z.enum(["api_call", "ai_token"]).default("api_call"),
  apiCallsCount: z.number().int().min(0, "API calls count cannot be negative").default(1),
  tokens: z
    .object({
      freshInput: z.number().int().min(0).default(0),
      cachedInput: z.number().int().min(0).default(0),
      standardOutput: z.number().int().min(0).default(0),
      reasoning: z.number().int().min(0).default(0),
    })
    .default({}),
});

export const CheckoutRequestSchema = z.object({
  tenantId: z.string().uuid("tenantId must be a valid UUID"),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});
