import express, { Request, Response, NextFunction } from "express";
import "express-async-errors";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { apiRouter } from "./routes/api.routes.js";
import { guideRouter } from "./routes/guide.routes.js";
import { BillingController } from "./controllers/billing.controller.js";
import { DashboardController } from "./controllers/dashboard.controller.js";
import { HomeController } from "./controllers/home.controller.js";
import { swaggerSpec } from "./config/swagger.js";
import { prisma } from "./db/prisma.js";
import { logger } from "./utils/logger.js";

dotenv.config();

export const app = express();

app.use(cors());

// Mount Stripe Webhook with raw buffer parsing BEFORE global express.json()
app.post(
  "/v1/webhooks/stripe",
  express.raw({ type: "application/json" }),
  (req: Request, _res: Response, next: NextFunction) => {
    (req as any).rawBody = req.body;
    next();
  },
  BillingController.handleWebhook
);

// Standard JSON parser for all application endpoints
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Liveness & Readiness health check
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1;`;
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptimeSeconds: process.uptime(),
    });
  } catch (error) {
    logger.error({ error }, "Health check database connection failed");
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: (error as Error).message,
    });
  }
});

// Interactive Swagger / OpenAPI Documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Public Explanatory Landing Page & Architecture Overview
app.get("/", HomeController.renderHome);

// Visual Developer / Evaluator Interactive Dashboard
app.get("/dashboard", DashboardController.renderDashboard);

// Architecture & Engineering System Guides Hub
app.use("/guides", guideRouter);

// Mount V1 API Router
app.use("/v1", apiRouter);

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled server error caught in global boundary");
  res.status(500).json({
    success: false,
    error: "internal_server_error",
    message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});
