-- CreateTable
CREATE TABLE "job_run_logs" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_run_logs_jobName_createdAt_idx" ON "job_run_logs"("jobName", "createdAt");
