// app/api/quality/audits-global/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const audits = await prisma.audit.findMany({
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
        themes: true,
      },
      orderBy: { evaluationDate: "desc" },
    });

    // KPI globaux (actuels / précédents sur dernier audit par projet)
    const totalAudits = audits.length;
    let sumCurrent = 0;
    let countCurrent = 0;
    let sumPrevious = 0;
    let countPrevious = 0;
    let totalNcFromAudits = 0;
    let sumDelay = 0;
    let countDelay = 0;

    // dernier audit par projet
    const lastAuditByProject = new Map<number, (typeof audits)[number]>();

    for (const a of audits) {
      totalNcFromAudits += a.ncFromAuditCount ?? 0;
      if (a.avgActionClosureDelay != null) {
        sumDelay += a.avgActionClosureDelay;
        countDelay += 1;
      }

      const pId = a.projectId;
      const existing = lastAuditByProject.get(pId);
      if (!existing) {
        lastAuditByProject.set(pId, a);
        continue;
      }
      if (existing.evaluationDate < a.evaluationDate) {
        lastAuditByProject.set(pId, a);
      }
    }

    for (const a of lastAuditByProject.values()) {
      if (a.globalConformityRate != null) {
        sumCurrent += a.globalConformityRate;
        countCurrent += 1;
      }
      if (a.previousGlobalRate != null) {
        sumPrevious += a.previousGlobalRate;
        countPrevious += 1;
      }
    }

    const globalCurrent =
      countCurrent > 0 ? sumCurrent / countCurrent : 0;
    const globalPrev =
      countPrevious > 0 ? sumPrevious / countPrevious : 0;
    const avgDelayActions =
      countDelay > 0 ? sumDelay / countDelay : 0;

    // Synthèse par projet (score précédent / actuel)
    type ProjectSynth = {
      projectId: number;
      projectNumber: string | null;
      titleProject: string | null;
      clientName: string | null;
      projectManagerName: string | null;
      status: string | null;
      previousScore: number | null;
      currentScore: number | null;
    };

    const projectsSynthMap = new Map<number, ProjectSynth>();

    for (const a of lastAuditByProject.values()) {
      const p = a.project;
      if (!p) continue;
      projectsSynthMap.set(p.id, {
        projectId: p.id,
        projectNumber: p.projectNumber,
        titleProject: p.titleProject,
        clientName: p.clientName,
        projectManagerName: p.projectManagerName,
        status: p.status,
        previousScore:
          a.previousGlobalRate != null ? a.previousGlobalRate : null,
        currentScore:
          a.globalConformityRate != null ? a.globalConformityRate : null,
      });
    }

    const projectsSynth = Array.from(projectsSynthMap.values()).sort(
      (a, b) => {
        const na = a.projectNumber ?? "";
        const nb = b.projectNumber ?? "";
        return na.localeCompare(nb, "fr-FR", { numeric: true });
      },
    );

    // Agrégation par thème (AVV / DELIVERY)
    type Area = "AVV" | "DELIVERY";
    const aggThemes: Record<
      string,
      { sum: number; count: number; area: Area }
    > = {};

    for (const a of audits) {
      for (const t of a.themes) {
        const key = `${t.area}-${t.type}`;
        if (!aggThemes[key]) {
          aggThemes[key] = {
            sum: 0,
            count: 0,
            area: t.area as Area,
          };
        }
        if (t.conformityRate != null) {
          aggThemes[key].sum += t.conformityRate;
          aggThemes[key].count += 1;
        }
      }
    }

    const themeAgg = Object.entries(aggThemes).map(([key, v]) => {
      const [, type] = key.split("-");
      const avg = v.count > 0 ? v.sum / v.count : null;
      return {
        type,
        area: v.area,
        value: avg,
      };
    });

    return NextResponse.json({
      audits,
      kpi: {
        totalAudits,
        globalPrev,
        globalCurrent,
        totalNcFromAudits,
        avgDelayActions,
      },
      themeAgg,
      projectsSynth,
    });
  } catch (e: any) {
    console.error("Error loading global audits", e);
    return NextResponse.json(
      { error: "Erreur lors du chargement des audits globaux." },
      { status: 500 },
    );
  }
}
