import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import type { Risk as PrismaRisk } from "@prisma/client";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string; riskId: string }> }
) {
  const { id, riskId: riskIdParam } = await context.params;
  const projectId = Number(id);
  const riskId = Number(riskIdParam);

  if (Number.isNaN(projectId) || Number.isNaN(riskId)) {
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 400 }
    );
  }

  const data = await req.json();

  const nature: string = data.nature ?? "Risque";

  // recalcul initial
  let initialScore: number | null = null;
  let initialLevel: string | null = null;
  let initialValuatedImpact: number | null | undefined = undefined;

  if (
    typeof data.initialImpact === "number" &&
    typeof data.initialProbability === "number"
  ) {
    initialScore = data.initialImpact * data.initialProbability;

    if (nature === "Opportunité") {
      initialLevel = getOpportunityLevel(initialScore);
      initialValuatedImpact = getOpportunityValuatedImpact(
        initialLevel,
        data.initialPotentialImpact ?? null
      );
    } else {
      initialLevel = getRiskLevel(initialScore);
      initialValuatedImpact = getRiskValuatedImpact(
        initialLevel,
        data.initialPotentialImpact ?? null
      );
    }
  }

  // recalcul mise à jour
  const updateImpact = data.updateImpact ?? null;
  const updateProbability = data.updateProbability ?? null;
  const updatePotentialImpact = data.updatePotentialImpact ?? null;

  let updateScore: number | null = null;
  let updateLevel: string | null = null;
  let updateValuatedImpact: number | null | undefined = undefined;

  if (
    typeof updateImpact === "number" &&
    typeof updateProbability === "number"
  ) {
    updateScore = updateImpact * updateProbability;

    if (nature === "Opportunité") {
      updateLevel = getOpportunityLevel(updateScore);
      updateValuatedImpact = getOpportunityValuatedImpact(
        updateLevel,
        updatePotentialImpact
      );
    } else {
      updateLevel = getRiskLevel(updateScore);
      updateValuatedImpact = getRiskValuatedImpact(
        updateLevel,
        updatePotentialImpact
      );
    }
  }

  const risk = await prisma.risk.update({
    where: { id: riskId },
    data: {
      title: data.title,
      nature,
      category: data.category ?? null,
      status: data.status ?? "Ouvert",
      statusDate: new Date(),

      // initial (corrigeable)
      initialEvalDate: data.initialEvalDate
        ? new Date(data.initialEvalDate)
        : undefined,
      initialImpact:
        typeof data.initialImpact === "number"
          ? data.initialImpact
          : undefined,
      initialProbability:
        typeof data.initialProbability === "number"
          ? data.initialProbability
          : undefined,
      initialScore: initialScore ?? undefined,
      initialLevel: initialLevel ?? undefined,
      initialPotentialImpact:
        data.initialPotentialImpact ?? undefined,
      initialValuatedImpact,

      initialStrategy: data.initialStrategy ?? undefined,

      // mise à jour
      updateEvalDate: data.updateEvalDate
        ? new Date(data.updateEvalDate)
        : undefined,
      updateImpact,
      updateProbability,
      updateScore,
      updateLevel,
      updatePotentialImpact,
      updateValuatedImpact,

      updateStrategy: data.updateStrategy ?? undefined,

      cause: data.cause ?? undefined,
      comments: data.comments ?? undefined,
    },
  });

  await updateProjectRiskKpis(projectId);

  return NextResponse.json(risk);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; riskId: string }> }
) {
  const { id, riskId: riskIdParam } = await context.params;
  const projectId = Number(id);
  const riskId = Number(riskIdParam);

  if (Number.isNaN(projectId) || Number.isNaN(riskId)) {
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 400 }
    );
  }

  await prisma.risk.delete({ where: { id: riskId } });
  await updateProjectRiskKpis(projectId);

  return NextResponse.json({ ok: true });
}

// ---- helpers communs ----

function getRiskLevel(score: number): string {
  if (score <= 3) return "Négligeable";
  if (score <= 7) return "Significatif";
  if (score <= 11) return "Critique";
  return "Inacceptable";
}

function getOpportunityLevel(score: number): string {
  if (score <= 3) return "Négligeable";
  if (score <= 7) return "Significatif";
  if (score <= 11) return "Motivant";
  return "A ne pas rater";
}

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
    if (r.nature === "Opportunité") continue;
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
