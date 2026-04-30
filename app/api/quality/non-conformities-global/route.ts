import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const ncs = await prisma.nonConformity.findMany({
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            titleProject: true,
            clientName: true,
            projectManagerName: true,
            status: true,
          },
        },
      },
      orderBy: { detectedOn: "desc" },
    });

    // Synthèse par projet
    const byProject = new Map<
      number,
      {
        projectId: number;
        projectNumber: string | null;
        titleProject: string | null;
        clientName: string | null;
        projectManagerName: string | null;
        status: string | null;
        total: number;
        open: number;
      }
    >();

    // Répartition par sévérité
    const severityCounts: Record<string, number> = {
      Mineure: 0,
      Majeure: 0,
      Critique: 0,
    };

    // NC détectées par mois
    const byMonthCounts = new Map<string, number>();

    // KPI globaux
    let total = 0;
    let open = 0;
    let majorOrCritical = 0;

    let totalDelay = 0;
    let closedCount = 0;

    for (const nc of ncs) {
      total += 1;
      if (nc.status !== "Clôturé") {
        open += 1;
      }
      if (nc.severity === "Majeure" || nc.severity === "Critique") {
        majorOrCritical += 1;
      }

      // délai moyen de clôture
      if (nc.detectedOn && nc.closedDate) {
        const d1 = nc.detectedOn;
        const d2 = nc.closedDate;
        const diffDays =
          (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        totalDelay += diffDays;
        closedCount += 1;
      }

      // par projet
      const p = nc.project;
      if (p) {
        if (!byProject.has(p.id)) {
          byProject.set(p.id, {
            projectId: p.id,
            projectNumber: p.projectNumber,
            titleProject: p.titleProject,
            clientName: p.clientName,
            projectManagerName: p.projectManagerName,
            status: p.status,
            total: 0,
            open: 0,
          });
        }
        const agg = byProject.get(p.id)!;
        agg.total += 1;
        if (nc.status !== "Clôturé") {
          agg.open += 1;
        }
      }

      // par sévérité
      if (nc.severity) {
        if (severityCounts[nc.severity] === undefined) {
          severityCounts[nc.severity] = 0;
        }
        severityCounts[nc.severity] += 1;
      }

      // par mois (détection)
      if (nc.detectedOn) {
        const d = nc.detectedOn;
        const key = `${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, "0")}`;
        byMonthCounts.set(key, (byMonthCounts.get(key) ?? 0) + 1);
      }
    }

    const criticalRate = total > 0 ? (majorOrCritical / total) * 100 : 0;
    const avgCloseDelay = closedCount > 0 ? totalDelay / closedCount : 0;

    const projectsSynth = Array.from(byProject.values()).sort((a, b) => {
      const na = a.projectNumber ?? "";
      const nb = b.projectNumber ?? "";
      return na.localeCompare(nb, "fr-FR", { numeric: true });
    });

    const severityBars = Object.entries(severityCounts).map(
      ([label, value]) => ({ label, value }),
    );

    const monthBars = Array.from(byMonthCounts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }));

    return NextResponse.json({
      ncs,
      kpi: {
        total,
        open,
        criticalRate,
        avgCloseDelay,
      },
      severityBars,
      monthBars,
      projectsSynth,
    });
  } catch (e: any) {
    console.error("Error loading global non-conformities", e);
    return NextResponse.json(
      { error: "Erreur lors du chargement des non-conformités globales." },
      { status: 500 },
    );
  }
}
