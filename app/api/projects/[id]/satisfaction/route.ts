import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { recalculateProjectKpis } from "@/app/lib/recalculateProjectKpis";

function parseDate(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function clampScore(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(1, n));
}

function getSatisfactionLevel(score: number) {
  if (score >= 4.5) {
    return {
      level: "satisfied",
      color: "green",
      label: "Satisfait",
      actionRequired: false,
    };
  }

  if (score >= 3.5) {
    return {
      level: "warning",
      color: "orange",
      label: "À surveiller",
      actionRequired: false,
    };
  }

  return {
    level: "unsatisfied",
    color: "red",
    label: "Non satisfait",
    actionRequired: true,
  };
}

// GET /api/projects/[id]/satisfaction
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "ID projet invalide" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectNumber: true,
        titleProject: true,
        customerSatisfaction: true,
        csListening: true,
        csPlanning: true,
        csTechnical: true,
        csKpiFollowup: true,
        csRiskFollowup: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    const history = await prisma.customerSatisfactionHistory.findMany({
      where: { projectId },
      orderBy: [{ year: "asc" }, { month: "asc" }, { evaluationDate: "asc" }],
      select: {
        id: true,
        projectId: true,
        evaluationDate: true,
        year: true,
        month: true,
        listening: true,
        planning: true,
        technical: true,
        kpi: true,
        risk: true,
        average: true,
      },
    });

    const score = project.customerSatisfaction ?? 0;
    const level = getSatisfactionLevel(score);

    return NextResponse.json({
      projectId: project.id,
      projectNumber: project.projectNumber,
      titleProject: project.titleProject,
      scores: {
        listening: project.csListening ?? 0,
        planning: project.csPlanning ?? 0,
        technical: project.csTechnical ?? 0,
        kpi: project.csKpiFollowup ?? 0,
        risk: project.csRiskFollowup ?? 0,
      },
      average: score,
      history,
      ...level,
    });
  } catch (e: any) {
    console.error("GET /api/projects/[id]/satisfaction error", e);
    return NextResponse.json(
      {
        error:
          e?.message || "Erreur lors du chargement de la satisfaction client.",
      },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/satisfaction
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json({ error: "ID projet invalide" }, { status: 400 });
  }

  try {
    const body = await req.json();

    const listening = clampScore(body.listening);
    const planning = clampScore(body.planning);
    const technical = clampScore(body.technical);
    const kpi = clampScore(body.kpi);
    const risk = clampScore(body.risk);

    if (
      listening === 0 ||
      planning === 0 ||
      technical === 0 ||
      kpi === 0 ||
      risk === 0
    ) {
      return NextResponse.json(
        { error: "Les 5 notes doivent être renseignées entre 1 et 5." },
        { status: 400 }
      );
    }

    const evaluationDate = parseDate(body.evaluationDate) ?? new Date();
    const year = evaluationDate.getFullYear();
    const month = evaluationDate.getMonth() + 1;

    const averageRaw = (listening + planning + technical + kpi + risk) / 5;
    const average = Math.round(averageRaw * 10) / 10;
    const level = getSatisfactionLevel(average);

    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectNumber: true, titleProject: true },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    await prisma.customerSatisfactionHistory.create({
      data: {
        projectId,
        evaluationDate,
        year,
        month,
        listening,
        planning,
        technical,
        kpi,
        risk,
        average,
      },
    });

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        csListening: listening,
        csPlanning: planning,
        csTechnical: technical,
        csKpiFollowup: kpi,
        csRiskFollowup: risk,
        customerSatisfaction: average,
      },
      select: {
        id: true,
        projectNumber: true,
        titleProject: true,
        customerSatisfaction: true,
        csListening: true,
        csPlanning: true,
        csTechnical: true,
        csKpiFollowup: true,
        csRiskFollowup: true,
      },
    });

    await recalculateProjectKpis(projectId);

    const history = await prisma.customerSatisfactionHistory.findMany({
      where: { projectId },
      orderBy: [{ year: "asc" }, { month: "asc" }, { evaluationDate: "asc" }],
      select: {
        id: true,
        projectId: true,
        evaluationDate: true,
        year: true,
        month: true,
        listening: true,
        planning: true,
        technical: true,
        kpi: true,
        risk: true,
        average: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Satisfaction client enregistrée avec succès.",
      projectId: updated.id,
      projectNumber: updated.projectNumber,
      titleProject: updated.titleProject,
      scores: {
        listening: updated.csListening,
        planning: updated.csPlanning,
        technical: updated.csTechnical,
        kpi: updated.csKpiFollowup,
        risk: updated.csRiskFollowup,
      },
      average: updated.customerSatisfaction,
      evaluationDate,
      year,
      month,
      history,
      ...level,
    });
  } catch (e: any) {
    console.error("POST /api/projects/[id]/satisfaction error", e);
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erreur lors de l'enregistrement de la satisfaction client.",
      },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/satisfaction
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  return POST(req, context);
}