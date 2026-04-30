import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const entries = await prisma.customerSatisfactionHistory.findMany({
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

    return NextResponse.json({ entries });
  } catch (e: any) {
    console.error("GET /api/projects/satisfaction error", e);
    return NextResponse.json(
      {
        error:
          e?.message || "Erreur lors du chargement de l'historique satisfaction.",
      },
      { status: 500 }
    );
  }
}