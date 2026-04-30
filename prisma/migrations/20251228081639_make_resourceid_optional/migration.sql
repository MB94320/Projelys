-- DropForeignKey
ALTER TABLE "Absence" DROP CONSTRAINT "Absence_resourceId_fkey";

-- AlterTable
ALTER TABLE "Absence" ALTER COLUMN "duration" DROP DEFAULT,
ALTER COLUMN "resourceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
