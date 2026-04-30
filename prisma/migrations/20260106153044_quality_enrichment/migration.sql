/*
  Warnings:

  - You are about to drop the column `relatedNCId` on the `CustomerIssue` table. All the data in the column will be lost.
  - You are about to drop the column `documentLink` on the `Deliverable` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `NonConformity` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CustomerIssue" DROP CONSTRAINT "CustomerIssue_relatedNCId_fkey";

-- DropForeignKey
ALTER TABLE "Deliverable" DROP CONSTRAINT "Deliverable_projectId_fkey";

-- DropForeignKey
ALTER TABLE "NonConformity" DROP CONSTRAINT "NonConformity_projectId_fkey";

-- AlterTable
ALTER TABLE "CustomerIssue" DROP COLUMN "relatedNCId";

-- AlterTable
ALTER TABLE "Deliverable" DROP COLUMN "documentLink",
ADD COLUMN     "clientReference" TEXT,
ADD COLUMN     "clientVersion" TEXT,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "contractualDate" TIMESTAMP(3),
ADD COLUMN     "delayCause" TEXT,
ADD COLUMN     "deliveryIterations" INTEGER,
ADD COLUMN     "internalVersion" TEXT,
ADD COLUMN     "linkDoc" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "validatedBy" TEXT,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "NonConformity" DROP COLUMN "source",
ADD COLUMN     "classification" TEXT,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "fncUrl" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "preventiveAction" TEXT,
ADD COLUMN     "reference" TEXT,
ALTER COLUMN "status" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
