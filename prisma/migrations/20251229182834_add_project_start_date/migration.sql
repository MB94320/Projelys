/*
  Warnings:

  - You are about to drop the column `estimatedDate` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "estimatedDate",
ADD COLUMN     "startDate" TIMESTAMP(3);
