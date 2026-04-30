-- CreateTable
CREATE TABLE "Deliverable" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "plannedDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "validatedDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Planifié',
    "qualityStatus" TEXT,
    "documentLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonConformity" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "deliverableId" INTEGER,
    "type" TEXT,
    "source" TEXT,
    "detectedOn" TIMESTAMP(3),
    "detectedBy" TEXT,
    "description" TEXT NOT NULL,
    "rootCause" TEXT,
    "immediateAction" TEXT,
    "correctiveAction" TEXT,
    "severity" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ouverte',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NonConformity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerIssue" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "deliverableId" INTEGER,
    "date" TIMESTAMP(3),
    "customerContact" TEXT,
    "channel" TEXT,
    "satisfactionScore" INTEGER,
    "isMajorIssue" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL,
    "expectation" TEXT,
    "responseGiven" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ouverte',
    "relatedNCId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityAction" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "owner" TEXT,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Ouverte',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),
    "nonConformityId" INTEGER,
    "customerIssueId" INTEGER,
    "deliverableId" INTEGER,
    "globalActionId" INTEGER,
    "effectiveness" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QualityAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityChecklistTemplateItem" (
    "id" SERIAL NOT NULL,
    "clause" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expectation" TEXT NOT NULL,
    "helpText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QualityChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectQualityChecklist" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT,
    "auditType" TEXT,
    "auditorName" TEXT,
    "auditDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Brouillon',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectQualityChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectQualityChecklistItem" (
    "id" SERIAL NOT NULL,
    "checklistId" INTEGER NOT NULL,
    "templateItemId" INTEGER NOT NULL,
    "clause" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Non évalué',
    "comment" TEXT,
    "evidenceLink" TEXT,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectQualityChecklistItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NonConformity" ADD CONSTRAINT "NonConformity_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerIssue" ADD CONSTRAINT "CustomerIssue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerIssue" ADD CONSTRAINT "CustomerIssue_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerIssue" ADD CONSTRAINT "CustomerIssue_relatedNCId_fkey" FOREIGN KEY ("relatedNCId") REFERENCES "NonConformity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAction" ADD CONSTRAINT "QualityAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAction" ADD CONSTRAINT "QualityAction_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAction" ADD CONSTRAINT "QualityAction_customerIssueId_fkey" FOREIGN KEY ("customerIssueId") REFERENCES "CustomerIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAction" ADD CONSTRAINT "QualityAction_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityAction" ADD CONSTRAINT "QualityAction_globalActionId_fkey" FOREIGN KEY ("globalActionId") REFERENCES "Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectQualityChecklist" ADD CONSTRAINT "ProjectQualityChecklist_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectQualityChecklistItem" ADD CONSTRAINT "ProjectQualityChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "ProjectQualityChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectQualityChecklistItem" ADD CONSTRAINT "ProjectQualityChecklistItem_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "QualityChecklistTemplateItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
