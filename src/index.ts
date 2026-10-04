import { app } from "./app.js";
import { ReconciliationWorker } from "./jobs/reconciliation.js";
import { logger } from "./utils/logger.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

const server = app.listen(PORT, () => {
  logger.info(`🚀 MeterFlow Billing Engine listening on port ${PORT}`);
  logger.info(`🌐 Product Homepage: http://localhost:${PORT}/`);
  logger.info(`📊 Developer Dashboard: http://localhost:${PORT}/dashboard`);
  logger.info(`📚 System Guides Hub: http://localhost:${PORT}/guides`);
  logger.info(`📘 Swagger OpenAPI Docs: http://localhost:${PORT}/docs`);
  logger.info(`💚 Health Probe: http://localhost:${PORT}/health`);

  // Initialize background reconciliation cron scheduler
  ReconciliationWorker.initScheduler();
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  logger.info("🛑 Received termination signal; shutting down gracefully...");
  server.close(() => {
    logger.info("Process terminated cleanly.");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
