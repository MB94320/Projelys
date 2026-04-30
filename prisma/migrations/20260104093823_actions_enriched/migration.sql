-- AlterTable
ALTER TABLE "Action" ADD COLUMN     "closedDate" TIMESTAMP(3),
ADD COLUMN     "efficience" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "startDate" TIMESTAMP(3);
