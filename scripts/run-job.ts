import { ReconciliationWorker } from "../src/jobs/reconciliation.js";
import { prisma } from "../src/db/prisma.js";

async function main() {
  await ReconciliationWorker.executePass();
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error in reconciliation job script:", err);
  process.exit(1);
});
