/*
  Warnings:

  - You are about to alter the column `reference` on the `Deliverable` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to drop the column `classification` on the `NonConformity` table. All the data in the column will be lost.
  - You are about to alter the column `reference` on the `NonConformity` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE "Deliverable" ALTER COLUMN "status" SET DEFAULT 'Non commencé',
ALTER COLUMN "reference" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "NonConformity" DROP COLUMN "classification",
ALTER COLUMN "status" SET DEFAULT 'Ouvert',
ALTER COLUMN "reference" SET DATA TYPE VARCHAR(50);
