-- AlterTable
ALTER TABLE "NonConformity" ADD COLUMN     "createdBy" INTEGER,
ADD COLUMN     "eightDComment" TEXT,
ADD COLUMN     "eightDProgress" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "NonConformity_projectId_idx" ON "NonConformity"("projectId");

-- CreateIndex
CREATE INDEX "NonConformity_deliverableId_idx" ON "NonConformity"("deliverableId");

-- CreateIndex
CREATE INDEX "NonConformity_status_idx" ON "NonConformity"("status");

-- CreateIndex
CREATE INDEX "NonConformity_severity_idx" ON "NonConformity"("severity");

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
