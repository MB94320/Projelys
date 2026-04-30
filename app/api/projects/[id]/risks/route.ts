import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import type { Risk as PrismaRisk } from "@prisma/client";

// GET: liste des risques d'un projet
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (Number.isNaN(projectId)) {
    return NextResponse.json(
      { error: "projectId invalide" },
      { status: 400 }
    );
  }

  const risks = await prisma.risk.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "asc" }],
  });

  return NextResponse.json(risks);
}

// POST: création d'un risque / opportunité
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (Number.isNaN(projectId)) {
    return NextResponse.json(
      { error: "projectId invalide" },
      { status: 400 }
    );
  }

  const data = await req.json();

  const nature: string = data.nature ?? "Risque";

  const initialImpact = data.initialImpact ?? null;
  const initialProbability = data.initialProbability ?? null;
  const initialPotentialImpact = data.initialPotentialImpact ?? null; // € potentiel

  let initialScore: number | null = null;
  let initialLevel: string | null = null;
  let initialValuatedImpact: number | null = null;

  if (
    typeof initialImpact === "number" &&
    typeof initialProbability === "number"
  ) {
    initialScore = initialImpact * initialProbability;

    if (nature === "Opportunité") {
      initialLevel = getOpportunityLevel(initialScore);
      initialValuatedImpact = getOpportunityValuatedImpact(
        initialLevel,
        initialPotentialImpact
      );
    } else {
      initialLevel = getRiskLevel(initialScore);
      initialValuatedImpact = getRiskValuatedImpact(
        initialLevel,
        initialPotentialImpact
      );
    }
  }

  const risk = await prisma.risk.create({
    data: {
      projectId,
      ref: data.ref ?? null,
      title: data.title,
      nature,
      clientName: data.clientName ?? null,
      category: data.category ?? null,
      status: data.status ?? "Ouvert",
      statusDate: new Date(),

      initialEvalDate: data.initialEvalDate
        ? new Date(data.initialEvalDate)
        : new Date(),
      initialImpact,
      initialProbability,
      initialScore,
      initialLevel,
      initialPotentialImpact,
      initialValuatedImpact,
      initialStrategy: data.initialStrategy ?? null,

      cause: data.cause ?? null,
      comments: data.comments ?? null,
    },
  });

  await updateProjectRiskKpis(projectId);

  return NextResponse.json(risk, { status: 201 });
}

// ---- helpers communs ----

function getRiskLevel(score: number): string {
  if (score <= 3) return "Négligeable";
  if (score <= 7) return "Significatif";
  if (score <= 11) return "Critique";
  return "Inacceptable";
}

// Pour les opportunités (1. Négligeable, 2. Significatif, 3. Motivant, 4. A ne pas rater)
function getOpportunityLevel(score: number): string {
  if (score <= 3) return "Négligeable";
  if (score <= 7) return "Significatif";
  if (score <= 11) return "Motivant";
  return "A ne pas rater";
}

// Impact valorisé (€) pour un risque (perte)
function getRiskValuatedImpact(
  level: string | null,
  potential: number | null
): number | null {
  if (!level || potential == null) return null;
  const base = potential;
  if (level === "Négligeable") return Math.round(base * 0.25);
  if (level === "Significatif") return Math.round(base * 0.5);
  if (level === "Critique") return Math.round(base * 0.75);
  if (level === "Inacceptable") return Math.round(base * 1);
  return null;
}

// Impact valorisé (€) pour une opportunité (gain)
function getOpportunityValuatedImpact(
  level: string | null,
  potential: number | null
): number | null {
  if (!level || potential == null) return null;
  const base = potential;
  if (level === "Négligeable") return Math.round(base * 0.25);
  if (level === "Significatif") return Math.round(base * 0.5);
  if (level === "Motivant") return Math.round(base * 0.75);
  if (level === "A ne pas rater") return Math.round(base * 1);
  return null;
}

async function updateProjectRiskKpis(projectId: number) {
  const risks = await prisma.risk.findMany({
    where: { projectId },
  });

  const openRisks = risks.filter(
    (r: PrismaRisk) => r.status !== "Clos" && r.status !== "Accepté"
  );
  const highRisks = openRisks.filter(
    (r: PrismaRisk) =>
      r.nature !== "Opportunité" &&
      (r.initialLevel === "Critique" ||
        r.initialLevel === "Inacceptable" ||
        r.updateLevel === "Critique" ||
        r.updateLevel === "Inacceptable")
  );
  const opportunities = openRisks.filter(
    (r: PrismaRisk) => r.nature === "Opportunité"
  );

  const levelsOrder = [
    "Négligeable",
    "Significatif",
    "Critique",
    "Inacceptable",
  ] as const;

  let maxLevel: string | null = null;
  for (const r of openRisks as PrismaRisk[]) {
    if (r.nature === "Opportunité") continue; // criticité projet = basée sur les risques
    const level = r.updateLevel ?? r.initialLevel;
    if (!level) continue;
    if (!maxLevel) {
      maxLevel = level;
    } else if (
      levelsOrder.indexOf(level as any) >
      levelsOrder.indexOf(maxLevel as any)
    ) {
      maxLevel = level;
    }
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      openRiskCount: openRisks.length,
      highRiskCount: highRisks.length,
      opportunityCount: opportunities.length,
      riskCriticality: maxLevel,
    },
  });
}
