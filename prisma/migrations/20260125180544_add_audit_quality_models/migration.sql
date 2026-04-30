/*
  Warnings:

  - Made the column `color` on table `AuditTheme` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AuditTheme" ALTER COLUMN "color" SET NOT NULL;
