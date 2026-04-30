// app/api/quality/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// OTD = livrables livrés à temps / livrables livrés
function computeOtd(deliverables: any[]) {
  const delivered = deliverables.filter((d) => d.deliveredDate);
  if (delivered.length === 0) return 0;

  const onTime = delivered.filter((d) => {
    if (!d.plannedDate || !d.deliveredDate) return false;
    return d.deliveredDate <= d.plannedDate;
  });

  return (onTime.length / delivered.length) * 100;
}

// OQD = livrables conformes / livrables livrés
function computeOqd(deliverables: any[]) {
  const delivered = deliverables.filter((d) => d.deliveredDate);
  if (delivered.length === 0) return 0;

  const onQuality = delivered.filter(
    (d) => d.qualityStatus === "Conforme" || d.qualityStatus === "OK",
  );

  return (onQuality.length / delivered.length) * 100;
}

// DoD = moyenne des jours de retard (livrés en retard)
function computeDod(deliverables: any[]) {
  const late = deliverables.filter((d) => {
    if (!d.plannedDate || !d.deliveredDate) return false;
    return d.deliveredDate > d.plannedDate;
  });

  if (late.length === 0) return 0;

  const totalDays = late.reduce((sum, d) => {
    const delayMs = d.deliveredDate.getTime() - d.plannedDate.getTime();
    const days = delayMs / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return totalDays / late.length;
}

export async function GET(_req: NextRequest) {
  try {
    // On récupère tous les livrables qualité avec leur projet
    const deliverables = await prisma.deliverable.findMany({
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            titleProject: true,
            clientName: true,
          },
        },
      },
    });

    const totalDeliverables = deliverables.length;
    const otd = computeOtd(deliverables);
    const oqd = computeOqd(deliverables);
    const dod = computeDod(deliverables);

    // KPI par projet pour le tableau synthèse
    const projectsMap = new Map<
      number,
      {
        projectId: number;
        projectLabel: string;
        clientName: string | null;
        totalDeliverables: number;
        otd: number;
        oqd: number;
        dod: number;
      }
    >();

    for (const d of deliverables) {
      const p = d.project;
      if (!p) continue;

      const key = p.id;
      if (!projectsMap.has(key)) {
        projectsMap.set(key, {
          projectId: p.id,
          projectLabel:
            p.titleProject || p.projectNumber || `Projet ${p.id}`,
          clientName: p.clientName ?? null,
          totalDeliverables: 0,
          otd: 0,
          oqd: 0,
          dod: 0,
        });
      }
    }

    // On regroupe les livrables par projet pour recalculer OTD/OQD/DoD
    for (const entry of projectsMap.values()) {
      const dForProject = deliverables.filter(
        (d) => d.projectId === entry.projectId,
      );

      entry.totalDeliverables = dForProject.length;
      entry.otd = computeOtd(dForProject);
      entry.oqd = computeOqd(dForProject);
      entry.dod = computeDod(dForProject);
    }

    const projects = Array.from(projectsMap.values()).sort(
      (a, b) => b.totalDeliverables - a.totalDeliverables,
    );

    return NextResponse.json({
      totalDeliverables,
      otd,
      oqd,
      dod,
      projects,
    });
  } catch (error: any) {
    console.error("Error in /api/quality/overview:", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul des KPI qualité" },
      { status: 500 },
    );
  }
}
