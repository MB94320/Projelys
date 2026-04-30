import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

function toDateOrNull(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toInt(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toFloat(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function pickNumber(...values: unknown[]) {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function pickDate(...values: unknown[]) {
  for (const v of values) {
    if (!v) continue;
    const d = new Date(String(v));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function isClosedStatus(value: unknown) {
  const v = normalize(value);
  return [
    "done",
    "completed",
    "complete",
    "closed",
    "clôturé",
    "cloture",
    "clôturée",
    "cloturée",
    "résolu",
    "resolu",
    "terminé",
    "termine",
    "livré",
    "livre",
    "ok",
    "validé",
    "valide",
  ].includes(v);
}

function isAuditPositive(audit: any) {
  const score = pickNumber(
    audit?.score,
    audit?.rate,
    audit?.resultRate,
    audit?.complianceRate,
    audit?.globalConformityRate,
  );

  if (score !== null) {
    return score > 1 ? score >= 95 : score >= 0.95;
  }

  const status = normalize(audit?.status ?? audit?.result ?? audit?.complianceStatus);
  return [
    "ok",
    "conforme",
    "conform",
    "validé",
    "valide",
    "passed",
    "pass",
  ].includes(status);
}

function isDeliverableConform(deliverable: any) {
  const score = pickNumber(
    deliverable?.oqdRate,
    deliverable?.qualityRate,
    deliverable?.conformityRate,
  );

  if (score !== null) {
    return score > 1 ? score >= 95 : score >= 0.95;
  }

  const status = normalize(
    deliverable?.qualityStatus ??
      deliverable?.status ??
      deliverable?.validationStatus ??
      deliverable?.conformityStatus,
  );

  return [
    "ok",
    "conforme",
    "conform",
    "validé",
    "valide",
    "approved",
    "complete",
    "completed",
  ].includes(status);
}

function isDeliverableOnTime(deliverable: any) {
  const planned = pickDate(
    deliverable?.plannedDate,
    deliverable?.dueDate,
    deliverable?.estimatedDate,
    deliverable?.targetDate,
    deliverable?.contractualDate,
    deliverable?.revisedDate,
  );

  const actual = pickDate(
    deliverable?.actualDate,
    deliverable?.deliveryDate,
    deliverable?.completedAt,
    deliverable?.doneAt,
    deliverable?.updatedAt,
    deliverable?.deliveredDate,
    deliverable?.validatedDate,
  );

  if (!planned || !actual) return false;
  return actual.getTime() <= planned.getTime();
}

function normalizeRate(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  if (value > 1) return value / 100;
  if (value < 0) return 0;
  return value;
}

function enrichProject(project: any) {
  const deliverables = Array.isArray(project.deliverables) ? project.deliverables : [];
  const audits = Array.isArray(project.audits) ? project.audits : [];
  const nonConformities = Array.isArray(project.nonConformities) ? project.nonConformities : [];

  const deliverablesCount = pickNumber(project.deliverablesCount) ?? deliverables.length;

  const deliveredCount =
    pickNumber(project.deliveredCount) ??
    deliverables.filter((d: any) => isClosedStatus(d?.status ?? d?.validationStatus)).length;

  const nonConformitiesCount =
    pickNumber(project.nonConformitiesCount) ?? nonConformities.length;

  const nonConformitiesOpenCount =
    pickNumber(project.nonConformitiesOpenCount, project.openNonConformitiesCount) ??
    nonConformities.filter((nc: any) => !isClosedStatus(nc?.status)).length;

  const auditsDoneCount = pickNumber(project.auditsDoneCount) ?? audits.length;

  let otdGlobal = normalizeRate(
    pickNumber(project.otdGlobal, project.deliverablesOtdRate),
  );

  if (otdGlobal === null) {
    const deliverablesWithDates = deliverables.filter((d: any) => {
      const planned = pickDate(
        d?.plannedDate,
        d?.dueDate,
        d?.estimatedDate,
        d?.targetDate,
        d?.contractualDate,
        d?.revisedDate,
      );
      const actual = pickDate(
        d?.actualDate,
        d?.deliveryDate,
        d?.completedAt,
        d?.doneAt,
        d?.updatedAt,
        d?.deliveredDate,
        d?.validatedDate,
      );
      return planned && actual;
    });

    if (deliverablesWithDates.length > 0) {
      const onTime = deliverablesWithDates.filter(isDeliverableOnTime).length;
      otdGlobal = onTime / deliverablesWithDates.length;
    } else {
      otdGlobal = 0;
    }
  }

  let oqdGlobal = normalizeRate(
    pickNumber(project.oqdGlobal, project.deliverablesOqdRate),
  );

  if (oqdGlobal === null) {
    const qualityDeliverables = deliverables.filter((d: any) => {
      return (
        d?.qualityStatus ||
        d?.status ||
        d?.validationStatus ||
        d?.conformityStatus ||
        pickNumber(d?.oqdRate, d?.qualityRate, d?.conformityRate) !== null
      );
    });

    if (qualityDeliverables.length > 0) {
      const conform = qualityDeliverables.filter(isDeliverableConform).length;
      oqdGlobal = conform / qualityDeliverables.length;
    } else if (deliverablesCount > 0) {
      oqdGlobal = Math.max(
        0,
        (Number(deliverablesCount) - Number(nonConformitiesOpenCount)) /
          Number(deliverablesCount),
      );
    } else {
      oqdGlobal = 0;
    }
  }

  const oqdPrevious =
    normalizeRate(pickNumber(project.oqdPrevious, project.previousAuditRate)) ?? 0;

  let globalConformityRate = normalizeRate(
    pickNumber(project.globalConformityRate, project.currentAuditRate),
  );

  if (globalConformityRate === null) {
    if (audits.length > 0) {
      const compliant = audits.filter(isAuditPositive).length;
      globalConformityRate = compliant / audits.length;
    } else {
      globalConformityRate = 0;
    }
  }

  return {
    ...project,
    deliverablesCount,
    deliveredCount,
    nonConformitiesCount,
    nonConformitiesOpenCount,
    openNonConformitiesCount: nonConformitiesOpenCount,
    auditsDoneCount,
    otdGlobal,
    oqdGlobal,
    oqdPrevious,
    globalConformityRate,
    customerSatisfaction: pickNumber(project.customerSatisfaction) ?? 0,
    csListening: pickNumber(project.csListening) ?? 0,
    csPlanning: pickNumber(project.csPlanning) ?? 0,
    csTechnical: pickNumber(project.csTechnical) ?? 0,
    csKpiFollowup: pickNumber(project.csKpiFollowup) ?? 0,
    csRiskFollowup: pickNumber(project.csRiskFollowup) ?? 0,
    tace: pickNumber(project.tace) ?? 0,
    budgetPlanned: pickNumber(project.budgetPlanned) ?? 0,
    budgetConsumed: pickNumber(project.budgetConsumed) ?? 0,
  };
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        tasks: true,
        deliverables: true,
        nonConformities: true,
        audits: true,
        _count: {
          select: {
            tasks: true,
            deliverables: true,
            nonConformities: true,
            audits: true,
          },
        },
      },
    });

    const enrichedProjects = projects.map(enrichProject);

    return NextResponse.json(enrichedProjects);
  } catch (e) {
    console.error("Error fetching projects", e);
    return NextResponse.json(
      { error: "Erreur lors du chargement des projets" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const project = await prisma.project.create({
      data: {
        projectNumber: body.projectNumber ?? null,
        clientName: body.clientName ?? null,
        projectManagerName: body.projectManagerName ?? null,
        titleProject: body.titleProject ?? body.name ?? "Projet sans titre",
        status: body.status ?? "Planifié",
        startDate: toDateOrNull(body.startDate),
        endDate: toDateOrNull(body.endDate),
        estimatedDate: body.estimatedDate
          ? toDateOrNull(body.estimatedDate)
          : body.endDate
          ? toDateOrNull(body.endDate)
          : null,
        progressPercent: toInt(body.progressPercent, 0),
        riskCriticality: body.riskCriticality ?? "Négligeable",
        plannedLoadDays: toInt(body.plannedLoadDays, 0),
        consumedLoadDays: toInt(body.consumedLoadDays, 0),
        comments: body.comments ?? null,
        openRiskCount: toInt(body.openRiskCount, 0),
        highRiskCount: toInt(body.highRiskCount, 0),
        opportunityCount: toInt(body.opportunityCount, 0),
        deliverablesCount: toInt(body.deliverablesCount, 0),
        deliveredCount: toInt(body.deliveredCount, 0),
        deliverablesOtdRate: toFloat(body.deliverablesOtdRate, 0),
        deliverablesDodRate: toFloat(body.deliverablesDodRate, 0),
        deliverablesOqdRate: toFloat(body.deliverablesOqdRate, 0),
        nonConformitiesCount: toInt(body.nonConformitiesCount, 0),
        openNonConformitiesCount: toInt(body.openNonConformitiesCount, 0),
        criticalNcRate: toFloat(body.criticalNcRate, 0),
        avgNcClosureDelayDays: toFloat(body.avgNcClosureDelayDays, 0),
        previousAuditRate: toFloat(body.previousAuditRate, 0),
        currentAuditRate: toFloat(body.currentAuditRate, 0),
        customerSatisfaction: toFloat(body.customerSatisfaction, 0),
        csListening: toFloat(body.csListening, 0),
        csPlanning: toFloat(body.csPlanning, 0),
        csTechnical: toFloat(body.csTechnical, 0),
        csKpiFollowup: toFloat(body.csKpiFollowup, 0),
        csRiskFollowup: toFloat(body.csRiskFollowup, 0),
        tace: toFloat(body.tace, 0),
        otdGlobal: toFloat(body.otdGlobal, 0),
        oqdGlobal: toFloat(body.oqdGlobal, 0),
        oqdPrevious: toFloat(body.oqdPrevious, 0),
        globalConformityRate: toFloat(body.globalConformityRate, 0),
        budgetPlanned: toFloat(body.budgetPlanned, 0),
        budgetConsumed: toFloat(body.budgetConsumed, 0),
        nonConformitiesOpenCount: toInt(body.nonConformitiesOpenCount, 0),
        auditsDoneCount: toInt(body.auditsDoneCount, 0),
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    console.error("Error creating project", e);
    return NextResponse.json(
      { error: "Erreur lors de la création du projet" },
      { status: 500 },
    );
  }
}