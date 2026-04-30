/*
  Warnings:

  - You are about to drop the column `assignee` on the `ProjectTask` table. All the data in the column will be lost.
  - You are about to drop the column `workload` on the `ProjectTask` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectTask" DROP CONSTRAINT "ProjectTask_projectId_fkey";

-- AlterTable
ALTER TABLE "ProjectTask" DROP COLUMN "assignee",
DROP COLUMN "workload",
ADD COLUMN     "assigneeName" TEXT,
ADD COLUMN     "consumedWorkHours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "plannedWorkHours" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "progressPercent" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'Planifiée';

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
