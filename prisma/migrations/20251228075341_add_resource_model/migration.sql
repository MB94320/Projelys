/*
  Warnings:

  - You are about to drop the column `resourceName` on the `Absence` table. All the data in the column will be lost.
  - Added the required column `resourceId` to the `Absence` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Absence" DROP COLUMN "resourceName",
ADD COLUMN     "resourceId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Resource" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "weeklyHours" INTEGER NOT NULL DEFAULT 35,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Resource_name_key" ON "Resource"("name");

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
