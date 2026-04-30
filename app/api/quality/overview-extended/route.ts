import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type DeliverableWithProject = Awaited<
  ReturnType<typeof prisma.deliverable.findMany>
>[number];

function getPlannedDate(d: DeliverableWithProject): Date | null {
  return (d.revisedDate ?? d.contractualDate) ?? null;
}

/** OTD (% livrables à l'heure) */
function computeOtd(deliverables: DeliverableWithProject[]) {
  const delivered = deliverables.filter((d) => d.deliveredDate);
  if (delivered.length === 0) return 0;

  const onTime = delivered.filter((d) => {
    const planned = getPlannedDate(d);
    if (!planned || !d.deliveredDate) return false;
    return d.deliveredDate <= planned;
  });

  return (onTime.length / delivered.length) * 100;
}

/** OQD (% livrables conformes) */
function computeOqd(deliverables: DeliverableWithProject[]) {
  const delivered = deliverables.filter((d) => d.deliveredDate);
  if (delivered.length === 0) return 0;

  const onQuality = delivered.filter(
    (d) => d.qualityStatus === "Conforme" || d.qualityStatus === "OK",
  );
  return (onQuality.length / delivered.length) * 100;
}

/** DoD moyen en jours de retard */
function computeDod(deliverables: DeliverableWithProject[]) {
  const late = deliverables.filter((d) => {
    if (!d.deliveredDate) return false;
    const planned = getPlannedDate(d);
    if (!planned) return false;
    return d.deliveredDate > planned;
  });
  if (late.length === 0) return 0;

  const totalDays = late.reduce((sum, d) => {
    const planned = getPlannedDate(d)!;
    const delayMs = d.deliveredDate!.getTime() - planned.getTime();
    const days = delayMs / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return totalDays / late.length;
}

/** DoD global = somme de tous les retards (jours) */
function computeDodGlobal(deliverables: DeliverableWithProject[]) {
  const late = deliverables.filter((d) => {
    if (!d.deliveredDate) return false;
    const planned = getPlannedDate(d);
    if (!planned) return false;
    return d.deliveredDate > planned;
  });
  if (late.length === 0) return 0;

  const totalDays = late.reduce((sum, d) => {
    const planned = getPlannedDate(d)!;
    const delayMs = d.deliveredDate!.getTime() - planned.getTime();
    const days = delayMs / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return totalDays;
}

export async function GET(_req: NextRequest) {
  try {
    const [deliverables, nonConformities, audits] = await Promise.all([
      prisma.deliverable.findMany({
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
      }),
      prisma.nonConformity.findMany({
        include: {
          project: { select: { id: true } },
        },
      }),
      prisma.audit.findMany({
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
        orderBy: { evaluationDate: "asc" },
      }),
    ]);

    const totalDeliverables = deliverables.length;
    const globalOtd = computeOtd(deliverables);
    const globalOqd = computeOqd(deliverables);
    const dodGlobal = computeDodGlobal(deliverables);

    const totalNc = nonConformities.length;
    const openNc = nonConformities.filter(
      (n) => n.status !== "Clôturé" && n.status !== "Annulé",
    ).length;
    const closedNc = nonConformities.filter(
      (n) => n.status === "Clôturé",
    );

    let totalDelayNc = 0;
    let closedCountNc = 0;
    for (const nc of closedNc) {
      if (!nc.detectedOn || !nc.closedDate) continue;
      const d1 = nc.detectedOn as unknown as Date;
      const d2 = nc.closedDate as unknown as Date;
      const diffDays =
        (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
      totalDelayNc += diffDays;
      closedCountNc += 1;
    }
    const avgCloseDelayNc =
      closedCountNc > 0 ? totalDelayNc / closedCountNc : 0;

    type ProjectAgg = {
      projectId: number;
      projectLabel: string;
      projectTitle: string | null;
      clientName: string | null;
      projectManagerName: string | null;
      status: string | null;
      totalDeliverables: number;
      otd: number;
      oqd: number;
      dod: number;
      dodTotal: number;
      ncOpen: number;
      ncTotal: number;
      ncCritical: number;
      avgCloseDelayNc: number;
      auditScore: number | null;
    };

    const projectsMap = new Map<number, ProjectAgg>();

    // init à partir des livrables
    for (const d of deliverables) {
      const p = d.project;
      if (!p) continue;
      if (!projectsMap.has(p.id)) {
        projectsMap.set(p.id, {
          projectId: p.id,
          projectLabel: p.projectNumber || `Projet ${p.id}`,
          projectTitle: p.titleProject ?? null,
          clientName: p.clientName ?? null,
          projectManagerName: p.projectManagerName ?? null,
          status: p.status ?? null,
          totalDeliverables: 0,
          otd: 0,
          oqd: 0,
          dod: 0,
          dodTotal: 0,
          ncOpen: 0,
          ncTotal: 0,
          ncCritical: 0,
          avgCloseDelayNc: 0,
          auditScore: null,
        });
      }
    }

    // init pour projets avec NC seulement
    for (const nc of nonConformities) {
      if (!nc.projectId) continue;
      if (!projectsMap.has(nc.projectId)) {
        projectsMap.set(nc.projectId, {
          projectId: nc.projectId,
          projectLabel: `Projet ${nc.projectId}`,
          projectTitle: null,
          clientName: null,
          projectManagerName: null,
          status: null,
          totalDeliverables: 0,
          otd: 0,
          oqd: 0,
          dod: 0,
          dodTotal: 0,
          ncOpen: 0,
          ncTotal: 0,
          ncCritical: 0,
          avgCloseDelayNc: 0,
          auditScore: null,
        });
      }
    }

    // init pour projets avec audits seulement
    for (const a of audits) {
      if (!a.projectId) continue;
      if (!projectsMap.has(a.projectId)) {
        const p = a.project;
        projectsMap.set(a.projectId, {
          projectId: a.projectId,
          projectLabel: p?.projectNumber || `Projet ${a.projectId}`,
          projectTitle: p?.titleProject ?? null,
          clientName: p?.clientName ?? null,
          projectManagerName: p?.projectManagerName ?? null,
          status: p?.status ?? null,
          totalDeliverables: 0,
          otd: 0,
          oqd: 0,
          dod: 0,
          dodTotal: 0,
          ncOpen: 0,
          ncTotal: 0,
          ncCritical: 0,
          avgCloseDelayNc: 0,
          auditScore: null,
        });
      }
    }

    // calcul par projet
    for (const entry of projectsMap.values()) {
      const dForProject = deliverables.filter(
        (d) => d.projectId === entry.projectId,
      );
      entry.totalDeliverables = dForProject.length;
      entry.otd = computeOtd(dForProject);
      entry.oqd = computeOqd(dForProject);
      entry.dod = computeDod(dForProject);

      const late = dForProject.filter((d) => {
        if (!d.deliveredDate) return false;
        const planned = getPlannedDate(d);
        if (!planned) return false;
        return d.deliveredDate > planned;
      });
      entry.dodTotal = late.reduce((sum, d) => {
        const planned = getPlannedDate(d)!;
        const delayMs = d.deliveredDate!.getTime() - planned.getTime();
        const days = delayMs / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);

      const ncForProject = nonConformities.filter(
        (n) => n.projectId === entry.projectId,
      );
      entry.ncTotal = ncForProject.length;
      entry.ncOpen = ncForProject.filter(
        (n) => n.status !== "Clôturé" && n.status !== "Annulé",
      ).length;
      entry.ncCritical = ncForProject.filter(
        (n) => n.severity === "Majeure" || n.severity === "Critique",
      ).length;

      let totDelay = 0;
      let cCount = 0;
      for (const n of ncForProject) {
        if (!n.detectedOn || !n.closedDate) continue;
        const d1 = n.detectedOn as unknown as Date;
        const d2 = n.closedDate as unknown as Date;
        const diffDays =
          (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        totDelay += diffDays;
        cCount += 1;
      }
      entry.avgCloseDelayNc = cCount > 0 ? totDelay / cCount : 0;

      const auditsForProject = audits.filter(
        (a) => a.projectId === entry.projectId,
      );
      if (auditsForProject.length > 0) {
        const lastAudit = auditsForProject[auditsForProject.length - 1];
        entry.auditScore =
          lastAudit.globalConformityRate !== null
            ? lastAudit.globalConformityRate * 100
            : null;
      }
    }

    const projects = Array.from(projectsMap.values()).sort(
      (a, b) => a.projectId - b.projectId,
    );

    const auditScores = projects
      .map((p) => p.auditScore)
      .filter((v): v is number => v !== null);
    const globalAuditScore =
      auditScores.length > 0
        ? auditScores.reduce((s, v) => s + v, 0) / auditScores.length
        : 0;

    return NextResponse.json({
      global: {
        totalDeliverables,
        globalOtd,
        globalOqd,
        dodGlobal,
        totalNc,
        openNc,
        closedNc: closedNc.length,
        avgCloseDelayNc,
        globalAuditScore,
      },
      projects,
    });
  } catch (error: any) {
    console.error("Error in /api/quality/overview-extended:", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul de la synthèse qualité globale" },
      { status: 500 },
    );
  }
}
