import { Router } from "express";
import { MeterController } from "../controllers/meter.controller.js";
import { BillingController } from "../controllers/billing.controller.js";
import { validateRequest } from "../middleware/validator.js";
import { BillableRequestSchema, CheckoutRequestSchema } from "../schemas/meter.schema.js";

export const apiRouter = Router();

// Metering & dummy generation endpoints
apiRouter.post("/meter/billable", validateRequest(BillableRequestSchema), MeterController.handleBillable);
apiRouter.post("/generate", validateRequest(BillableRequestSchema), MeterController.handleBillable);

// Usage rollup endpoint
apiRouter.get("/usage", MeterController.handleGetUsage);

// Stripe Checkout endpoint
apiRouter.post("/billing/checkout", validateRequest(CheckoutRequestSchema), BillingController.handleCheckout);
