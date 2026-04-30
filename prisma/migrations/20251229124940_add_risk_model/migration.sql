/*
  Warnings:

  - You are about to drop the column `clientName` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `progressPercent` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectManagerName` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectNumber` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `titleProject` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "riskId" INTEGER;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "clientName",
DROP COLUMN "endDate",
DROP COLUMN "estimatedDate",
DROP COLUMN "progressPercent",
DROP COLUMN "projectManagerName",
DROP COLUMN "projectNumber",
DROP COLUMN "startDate",
DROP COLUMN "status",
DROP COLUMN "titleProject",
ADD COLUMN     "highRiskCount" INTEGER DEFAULT 0,
ADD COLUMN     "openRiskCount" INTEGER DEFAULT 0,
ADD COLUMN     "opportunityCount" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "Risk" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "ref" TEXT,
    "title" TEXT NOT NULL,
    "nature" TEXT,
    "clientName" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Ouvert',
    "initialEvalDate" TIMESTAMP(3),
    "initialImpact" INTEGER,
    "initialProbability" INTEGER,
    "initialScore" INTEGER,
    "initialLevel" TEXT,
    "initialPotentialImpact" DOUBLE PRECISION,
    "initialValuatedImpact" DOUBLE PRECISION,
    "initialStrategy" TEXT,
    "updateEvalDate" TIMESTAMP(3),
    "updateImpact" INTEGER,
    "updateProbability" INTEGER,
    "updateScore" INTEGER,
    "updateLevel" TEXT,
    "updatePotentialImpact" DOUBLE PRECISION,
    "updateValuatedImpact" DOUBLE PRECISION,
    "updateStrategy" TEXT,
    "cause" TEXT,
    "comments" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
