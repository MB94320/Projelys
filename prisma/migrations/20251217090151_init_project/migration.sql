-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "projectNumber" TEXT NOT NULL,
    "quoteNumber" TEXT,
    "clientName" TEXT NOT NULL,
    "projectManagerName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "estimatedStartDate" TIMESTAMP(3),
    "estimatedEndDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "replannedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "estimatedWorkloadHours" INTEGER,
    "actualWorkloadHours" INTEGER,
    "progressPercent" INTEGER,
    "riskCriticality" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comments" TEXT,
    "organizationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
