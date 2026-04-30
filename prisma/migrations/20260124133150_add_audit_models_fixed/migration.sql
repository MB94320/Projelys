-- CreateEnum
CREATE TYPE "AuditArea" AS ENUM ('AVV', 'DELIVERY');

-- CreateEnum
CREATE TYPE "AuditThemeType" AS ENUM ('REVUE_OPPORTUNITE', 'PILOTAGE_REPONSE', 'REVUE_CONTRAT', 'REVUE_PROPOSITION', 'GESTION_EXIGENCES', 'GESTION_RISQUES_OPPORTUNITES', 'PLANIFICATION', 'PERFORMANCE', 'REUNIONS_COMMUNICATION', 'VERIFICATION_VALIDATION', 'CAPITALISATION', 'GESTION_CONFIGURATION', 'GESTION_DOCUMENTAIRE', 'SECURITE_PERSONNES', 'SECURITE_DONNEES', 'GESTION_RESSOURCES', 'GESTION_SOUS_TRAITANCE', 'GESTION_XSHORE', 'GESTION_NON_CONFORMITES', 'GESTION_INSATISFACTIONS', 'PMP');

-- CreateEnum
CREATE TYPE "AuditAnswer" AS ENUM ('OUI', 'NON', 'NA');

-- CreateTable
CREATE TABLE "Audit" (
    "id" SERIAL NOT NULL,
    "ref" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "evaluationDate" TIMESTAMP(3) NOT NULL,
    "lastEvaluationDate" TIMESTAMP(3),
    "globalConformityRate" DOUBLE PRECISION NOT NULL,
    "previousGlobalRate" DOUBLE PRECISION,
    "qualityFollowUp" TEXT,
    "outsourcing" TEXT,
    "xshore" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ncFromAuditCount" INTEGER NOT NULL DEFAULT 0,
    "avgActionClosureDelay" INTEGER,

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditTheme" (
    "id" SERIAL NOT NULL,
    "auditId" INTEGER NOT NULL,
    "type" "AuditThemeType" NOT NULL,
    "area" "AuditArea" NOT NULL,
    "conformityRate" DOUBLE PRECISION,
    "color" TEXT,

    CONSTRAINT "AuditTheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditQuestion" (
    "id" SERIAL NOT NULL,
    "themeId" INTEGER NOT NULL,
    "code" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "answer" "AuditAnswer" NOT NULL DEFAULT 'NA',
    "comment" TEXT,

    CONSTRAINT "AuditQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Audit_ref_key" ON "Audit"("ref");

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditTheme" ADD CONSTRAINT "AuditTheme_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditQuestion" ADD CONSTRAINT "AuditQuestion_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "AuditTheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
