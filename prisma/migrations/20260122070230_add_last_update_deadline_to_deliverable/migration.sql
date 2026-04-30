/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "NonConformity" DROP CONSTRAINT "NonConformity_createdBy_fkey";

-- AlterTable
ALTER TABLE "Deliverable" ADD COLUMN     "lastUpdateDeadline" TIMESTAMP(3);

-- DropTable
DROP TABLE "User";
