-- CreateTable
CREATE TABLE "CustomerSatisfactionHistory" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "evaluationDate" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "listening" DOUBLE PRECISION NOT NULL,
    "planning" DOUBLE PRECISION NOT NULL,
    "technical" DOUBLE PRECISION NOT NULL,
    "kpi" DOUBLE PRECISION NOT NULL,
    "risk" DOUBLE PRECISION NOT NULL,
    "average" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSatisfactionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerSatisfactionHistory_projectId_year_month_idx" ON "CustomerSatisfactionHistory"("projectId", "year", "month");

-- AddForeignKey
ALTER TABLE "CustomerSatisfactionHistory" ADD CONSTRAINT "CustomerSatisfactionHistory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
