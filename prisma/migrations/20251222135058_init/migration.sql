/*
  Warnings:

  - You are about to drop the column `actualEndDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `actualStartDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `actualWorkloadHours` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `clientName` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `comments` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedEndDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedStartDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedWorkloadHours` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `progressPercent` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectManagerName` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectNumber` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `quoteNumber` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `replannedEndDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `riskCriticality` on the `Project` table. All the data in the column will be lost.
  - Added the required column `name` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "actualEndDate",
DROP COLUMN "actualStartDate",
DROP COLUMN "actualWorkloadHours",
DROP COLUMN "clientName",
DROP COLUMN "comments",
DROP COLUMN "description",
DROP COLUMN "estimatedEndDate",
DROP COLUMN "estimatedStartDate",
DROP COLUMN "estimatedWorkloadHours",
DROP COLUMN "label",
DROP COLUMN "organizationId",
DROP COLUMN "progressPercent",
DROP COLUMN "projectManagerName",
DROP COLUMN "projectNumber",
DROP COLUMN "quoteNumber",
DROP COLUMN "replannedEndDate",
DROP COLUMN "riskCriticality",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ProjectTask" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assignee" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "workload" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
