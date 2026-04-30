/*
  Warnings:

  - You are about to drop the column `name` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "name",
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "consumedLoadDays" INTEGER,
ADD COLUMN     "estimatedDate" TIMESTAMP(3),
ADD COLUMN     "plannedLoadDays" INTEGER,
ADD COLUMN     "progressPercent" INTEGER,
ADD COLUMN     "projectManagerName" TEXT,
ADD COLUMN     "projectNumber" TEXT,
ADD COLUMN     "riskCriticality" TEXT,
ADD COLUMN     "titleProject" TEXT;
