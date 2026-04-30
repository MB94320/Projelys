import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectIdParam = searchParams.get("projectId");
    if (!projectIdParam) {
      return NextResponse.json(
        { error: "projectId manquant pour le calcul KPI." },
        { status: 400 },
      );
    }
    const projectId = Number(projectIdParam);
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId invalide." },
        { status: 400 },
      );
    }

    const deliverables = await prisma.deliverable.findMany({
      where: { projectId },
    });

    const total = deliverables.length;
    const delivered = deliverables.filter((d) => d.deliveredDate).length;

    // livrables livrés et ayant une date d’échéance (contractuelle ou revue)
    const deliveredItems = deliverables.filter(
      (d) => d.deliveredDate && (d.contractualDate || d.revisedDate),
    );

    // livrables évalués par le client (Validé ou Refusé)
    const evaluatedItems = deliveredItems.filter(
      (d) => d.status === "Validé" || d.status === "Refusé",
    );

    // livrables validés
    const validated = evaluatedItems.filter((d) => d.status === "Validé").length;

    // OQD = Validé / (Validé + Refusé)
    const oqd = evaluatedItems.length
      ? (validated / evaluatedItems.length) * 100
      : 0;

    const onTime = deliveredItems.filter((d) => {
      const refDate =
        d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
      return new Date(d.deliveredDate!).getTime() <= new Date(refDate).getTime();
    }).length;

    const lateItems = deliveredItems.filter((d) => {
      const refDate =
        d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
      return new Date(d.deliveredDate!).getTime() > new Date(refDate).getTime();
    });

    const dod =
      lateItems.length === 0
        ? 0
        : lateItems.reduce((sum, d) => {
            const refDate =
              d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
            const diff =
              new Date(d.deliveredDate!).getTime() -
              new Date(refDate).getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
          }, 0) / lateItems.length;

    const kpi = {
      deliverables: {
        total,
        delivered,
        onTime,
        otd: deliveredItems.length
          ? (onTime / deliveredItems.length) * 100
          : 0,
        oqd,
        dod,
      },
      nonConformities: {
        total: 0,
        open: 0,
        critical: 0,
        criticalRate: 0,
        avgCloseDelay: 0,
      },
    };

    return NextResponse.json(kpi);
  } catch (e: any) {
    console.error("Error computing deliverables KPI", e);
    return NextResponse.json(
      { error: "Erreur lors du calcul des KPI livrables." },
      { status: 500 },
    );
  }
}
