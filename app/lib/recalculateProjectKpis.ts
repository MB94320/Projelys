// app/lib/recalculateProjectKpis.ts
import { prisma } from "@/app/lib/prisma";

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

function pct01To100(v: number) {
  return round2(v * 100);
}

export async function recalculateProjectKpis(projectId: number) {
  const [project, tasks, deliverables, ncs, audits] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId } }),
    prisma.projectTask.findMany({ where: { projectId } }),
    prisma.deliverable.findMany({
      where: { projectId },
      include: { nonConformities: true },
    }),
    prisma.nonConformity.findMany({ where: { projectId } }),
    prisma.audit.findMany({ where: { projectId } }),
  ]);

  if (!project) return;

  // --- tâches : charge & avancement pondéré ---
  const plannedLoadDays = tasks.reduce(
    (s, t) => s + (t.plannedWorkHours ?? 0),
    0,
  );
  const consumedLoadDays = tasks.reduce(
    (s, t) => s + (t.consumedWorkHours ?? 0),
    0,
  );
  const base = tasks.reduce(
    (s, t) => s + (t.plannedWorkHours ?? 0),
    0,
  );
  const progressPercent =
    base > 0
      ? Math.round(
          tasks.reduce(
            (s, t) =>
              s +
              (t.progressPercent ?? 0) * (t.plannedWorkHours ?? 0),
            0,
          ) / base,
        )
      : project.progressPercent ?? 0;

  // --- livrables ---
  const deliverablesCount = deliverables.length;
  const delivered = deliverables.filter((d) => {
    const st = (d.status ?? "").toLowerCase();
    return (
      d.deliveredDate !== null ||
      st === "livré" ||
      st === "livree" ||
      st === "livrée"
    );
  });
  const deliveredCount = delivered.length;

  const otdCount = delivered.filter((d) => {
    if (!d.deliveredDate) return false;
    const due = d.revisedDate ?? d.contractualDate ?? null;
    if (!due) return false;
    return d.deliveredDate.getTime() <= due.getTime();
  }).length;

  const dodCount = delivered.filter((d) => {
    const qs = (d.qualityStatus ?? "").toLowerCase();
    return qs === "conforme";
  }).length;

  const oqdCount = delivered.filter((d) => {
    const hasCriticalOpenNc = d.nonConformities.some((nc) => {
      const sev = (nc.severity ?? "").toLowerCase();
      const st = (nc.status ?? "").toLowerCase();
      return (
        sev === "critique" &&
        st !== "clôturée" &&
        st !== "cloturee" &&
        st !== "closed"
      );
    });
    return !hasCriticalOpenNc;
  }).length;

  const deliverablesOtdRate =
    deliveredCount > 0
      ? pct01To100(otdCount / deliveredCount)
      : 0;
  const deliverablesDodRate =
    deliveredCount > 0
      ? pct01To100(dodCount / deliveredCount)
      : 0;
  const deliverablesOqdRate =
    deliveredCount > 0
      ? pct01To100(oqdCount / deliveredCount)
      : 0;

  // --- non-conformités ---
  const nonConformitiesCount = ncs.length;
  const openNonConformitiesCount = ncs.filter((nc) => {
    const st = (nc.status ?? "").toLowerCase();
    return (
      st !== "clôturée" &&
      st !== "cloturee" &&
      st !== "closed"
    );
  }).length;

  const criticalNcCount = ncs.filter((nc) => {
    const sev = (nc.severity ?? "").toLowerCase();
    return sev === "critique";
  }).length;

  const criticalNcRate =
    nonConformitiesCount > 0
      ? pct01To100(criticalNcCount / nonConformitiesCount)
      : 0;

  const closedNcs = ncs.filter(
    (nc) => nc.detectedOn && nc.closedDate,
  );
  const avgNcClosureDelayDays =
    closedNcs.length > 0
      ? round2(
          closedNcs.reduce((s, nc) => {
            const diff =
              (nc.closedDate!.getTime() -
                nc.detectedOn!.getTime()) /
              (1000 * 60 * 60 * 24);
            return s + diff;
          }, 0) / closedNcs.length,
        )
      : 0;

  // --- audits ---
  const prevRates = audits
    .map((a) => a.previousGlobalRate)
    .filter((v): v is number => typeof v === "number");
  const curRates = audits
    .map((a) => a.globalConformityRate)
    .filter((v): v is number => typeof v === "number");

  const previousAuditRate =
    prevRates.length > 0
      ? pct01To100(
          prevRates.reduce((s, v) => s + v, 0) / prevRates.length,
        )
      : 0;

  const currentAuditRate =
    curRates.length > 0
      ? pct01To100(
          curRates.reduce((s, v) => s + v, 0) / curRates.length,
        )
      : 0;

  await prisma.project.update({
    where: { id: projectId },
    data: {
      plannedLoadDays,
      consumedLoadDays,
      progressPercent,
      deliverablesCount,
      deliveredCount,
      deliverablesOtdRate,
      deliverablesDodRate,
      deliverablesOqdRate,
      nonConformitiesCount,
      openNonConformitiesCount,
      criticalNcRate,
      avgNcClosureDelayDays,
      previousAuditRate,
      currentAuditRate,
    },
  });
}