import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { recalculateProjectKpis } from "@/app/lib/recalculateProjectKpis";

function parseDate(value: unknown) {
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

// GET /api/projects/[id]
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json(
      { error: "ID projet invalide" },
      { status: 400 },
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: true,
      risks: true,
      deliverables: true,
      nonConformities: true,
      audits: true,
      qualityChecklists: {
        include: { items: true },
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Projet introuvable" },
      { status: 404 },
    );
  }

  return NextResponse.json({ project });
}

// PUT /api/projects/[id]
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json(
      { error: "ID projet invalide" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();

    await prisma.project.update({
      where: { id: projectId },
      data: {
        projectNumber: body.projectNumber ?? null,
        titleProject: body.titleProject ?? null,
        clientName: body.clientName ?? null,
        projectManagerName: body.projectManagerName ?? null,
        status: body.status ?? null,
        riskCriticality: body.riskCriticality ?? null,
        comments: body.comments ?? null,

        startDate: parseDate(body.startDate),
        endDate: parseDate(body.endDate),
        estimatedDate: parseDate(body.estimatedDate),

        progressPercent:
          body.progressPercent !== undefined
            ? toInt(body.progressPercent, 0)
            : undefined,

        plannedLoadDays:
          body.plannedLoadDays !== undefined
            ? toInt(body.plannedLoadDays, 0)
            : undefined,

        consumedLoadDays:
          body.consumedLoadDays !== undefined
            ? toInt(body.consumedLoadDays, 0)
            : undefined,

        openRiskCount:
          body.openRiskCount !== undefined
            ? toInt(body.openRiskCount, 0)
            : undefined,

        highRiskCount:
          body.highRiskCount !== undefined
            ? toInt(body.highRiskCount, 0)
            : undefined,

        opportunityCount:
          body.opportunityCount !== undefined
            ? toInt(body.opportunityCount, 0)
            : undefined,

        deliverablesCount:
          body.deliverablesCount !== undefined
            ? toInt(body.deliverablesCount, 0)
            : undefined,

        deliveredCount:
          body.deliveredCount !== undefined
            ? toInt(body.deliveredCount, 0)
            : undefined,

        deliverablesOtdRate:
          body.deliverablesOtdRate !== undefined
            ? toFloat(body.deliverablesOtdRate, 0)
            : undefined,

        deliverablesDodRate:
          body.deliverablesDodRate !== undefined
            ? toFloat(body.deliverablesDodRate, 0)
            : undefined,

        deliverablesOqdRate:
          body.deliverablesOqdRate !== undefined
            ? toFloat(body.deliverablesOqdRate, 0)
            : undefined,

        nonConformitiesCount:
          body.nonConformitiesCount !== undefined
            ? toInt(body.nonConformitiesCount, 0)
            : undefined,

        openNonConformitiesCount:
          body.openNonConformitiesCount !== undefined
            ? toInt(body.openNonConformitiesCount, 0)
            : undefined,

        criticalNcRate:
          body.criticalNcRate !== undefined
            ? toFloat(body.criticalNcRate, 0)
            : undefined,

        avgNcClosureDelayDays:
          body.avgNcClosureDelayDays !== undefined
            ? toFloat(body.avgNcClosureDelayDays, 0)
            : undefined,

        previousAuditRate:
          body.previousAuditRate !== undefined
            ? toFloat(body.previousAuditRate, 0)
            : undefined,

        currentAuditRate:
          body.currentAuditRate !== undefined
            ? toFloat(body.currentAuditRate, 0)
            : undefined,

        customerSatisfaction:
          body.customerSatisfaction !== undefined
            ? toFloat(body.customerSatisfaction, 0)
            : undefined,

        csListening:
          body.csListening !== undefined
            ? toFloat(body.csListening, 0)
            : undefined,

        csPlanning:
          body.csPlanning !== undefined
            ? toFloat(body.csPlanning, 0)
            : undefined,

        csTechnical:
          body.csTechnical !== undefined
            ? toFloat(body.csTechnical, 0)
            : undefined,

        csKpiFollowup:
          body.csKpiFollowup !== undefined
            ? toFloat(body.csKpiFollowup, 0)
            : undefined,

        csRiskFollowup:
          body.csRiskFollowup !== undefined
            ? toFloat(body.csRiskFollowup, 0)
            : undefined,

        tace:
          body.tace !== undefined
            ? toFloat(body.tace, 0)
            : undefined,

        otdGlobal:
          body.otdGlobal !== undefined
            ? toFloat(body.otdGlobal, 0)
            : undefined,

        oqdGlobal:
          body.oqdGlobal !== undefined
            ? toFloat(body.oqdGlobal, 0)
            : undefined,

        oqdPrevious:
          body.oqdPrevious !== undefined
            ? toFloat(body.oqdPrevious, 0)
            : undefined,

        globalConformityRate:
          body.globalConformityRate !== undefined
            ? toFloat(body.globalConformityRate, 0)
            : undefined,

        budgetPlanned:
          body.budgetPlanned !== undefined
            ? toFloat(body.budgetPlanned, 0)
            : undefined,

        budgetConsumed:
          body.budgetConsumed !== undefined
            ? toFloat(body.budgetConsumed, 0)
            : undefined,

        nonConformitiesOpenCount:
          body.nonConformitiesOpenCount !== undefined
            ? toInt(body.nonConformitiesOpenCount, 0)
            : undefined,

        auditsDoneCount:
          body.auditsDoneCount !== undefined
            ? toInt(body.auditsDoneCount, 0)
            : undefined,
      },
    });

    await recalculateProjectKpis(projectId);

    const refreshedProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        risks: true,
        deliverables: true,
        nonConformities: true,
        audits: true,
        qualityChecklists: {
          include: { items: true },
        },
      },
    });

    return NextResponse.json({ project: refreshedProject });
  } catch (e: any) {
    console.error("PUT /api/projects/[id] error", e);
    return NextResponse.json(
      {
        error: e?.message || "Erreur lors de la mise à jour du projet.",
      },
      { status: 500 },
    );
  }
}