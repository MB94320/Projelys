/*
  Warnings:

  - You are about to drop the column `lastUpdateDeadline` on the `Deliverable` table. All the data in the column will be lost.
  - You are about to drop the column `plannedDate` on the `Deliverable` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Deliverable" DROP COLUMN "lastUpdateDeadline",
DROP COLUMN "plannedDate",
ADD COLUMN     "revisedDate" TIMESTAMP(3);
