-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "estimatedDate" TIMESTAMP(3),
ADD COLUMN     "progressPercent" INTEGER,
ADD COLUMN     "projectManagerName" TEXT,
ADD COLUMN     "projectNumber" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "titleProject" TEXT;
