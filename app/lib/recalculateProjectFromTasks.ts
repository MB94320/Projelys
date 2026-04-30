import { prisma } from "@/app/lib/prisma";

/**
 * Recalcule :
 * - plannedLoadDays / consumedLoadDays (en heures)
 * - progressPercent (pondéré par la charge)
 * - KPIs qualité de base (livrables, NC, audits)
 */
export async function recalculateProjectFromTasks(projectId: number) {
  // --- Tâches : charge et avancement ---
  const tasks = await prisma.projectTask.findMany({
    where: { projectId },
  });

  const planned = tasks.reduce(
    (sum, t) => sum + (t.plannedWorkHours ?? 0),
    0,
  );
  const consumed = tasks.reduce(
    (sum, t) => sum + (t.consumedWorkHours ?? 0),
    0,
  );

  const totalPlannedForProgress = tasks.reduce(
    (sum, t) => sum + (t.plannedWorkHours ?? 0),
    0,
  );

  const weightedProgress =
    totalPlannedForProgress > 0
      ? Math.round(
          tasks.reduce(
            (sum, t) =>
              sum +
              (t.progressPercent ?? 0) *
                (t.plannedWorkHours ?? 0),
            0,
          ) / totalPlannedForProgress,
        )
      : 0;

  // --- Livrables ---
  const deliverables = await prisma.deliverable.findMany({
    where: { projectId },
    include: {
      nonConformities: true,
    },
  });

  const deliverablesCount = deliverables.length;

  const delivered = deliverables.filter(
    (d) => d.deliveredDate !== null,
  );

  const deliveredCount = delivered.length;

  const otdCount = delivered.filter((d) => {
    if (!d.deliveredDate) return false;
    const due =
      d.revisedDate ?? d.contractualDate ?? null;
    if (!due) return false;
    return d.deliveredDate <= due;
  }).length;

  const dodCount = delivered.filter(
    (d) => d.qualityStatus === "Conforme",
  ).length;

  const otdRate =
    deliveredCount > 0 ? otdCount / deliveredCount : 0;
  const dodRate =
    deliveredCount > 0 ? dodCount / deliveredCount : 0;

  // OQD : livrables livrés sans NC critique ouverte
  const oqdCount = delivered.filter((d) => {
    const hasCriticalOpenNc = d.nonConformities.some(
      (nc) =>
        nc.severity === "Critique" &&
        nc.status !== "Clôturée",
    );
    return !hasCriticalOpenNc;
  }).length;

  const oqdRate =
    deliveredCount > 0 ? oqdCount / deliveredCount : 0;

  // --- Non-conformités ---
  const ncs = await prisma.nonConformity.findMany({
    where: { projectId },
  });

  const ncTotal = ncs.length;
  const ncOpen = ncs.filter(
    (nc) => nc.status !== "Clôturée",
  ).length;
  const ncCritical = ncs.filter(
    (nc) => nc.severity === "Critique",
  ).length;
  const ncCriticalRate =
    ncTotal > 0 ? ncCritical / ncTotal : 0;

  const closedNcs = ncs.filter(
    (nc) => nc.detectedOn && nc.closedDate,
  );
  const avgNcClosureDelay =
    closedNcs.length > 0
      ? Math.round(
          closedNcs.reduce((sum, nc) => {
            const diffMs =
              (nc.closedDate!.getTime() -
                nc.detectedOn!.getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + diffMs;
          }, 0) / closedNcs.length,
        )
      : null;

  // --- Audits ---
  const audits = await prisma.audit.findMany({
    where: { projectId },
  });

  const previousRates = audits
    .map((a) => a.previousGlobalRate)
    .filter((v): v is number => v !== null);

  const currentRates = audits
    .map((a) => a.globalConformityRate)
    .filter((v): v is number => v !== null);

  const prevAuditRate =
    previousRates.length > 0
      ? previousRates.reduce((s, v) => s + v, 0) /
        previousRates.length
      : 0;

  const currentAuditRate =
    currentRates.length > 0
      ? currentRates.reduce((s, v) => s + v, 0) /
        currentRates.length
      : 0;

  // On stocke les chiffres bruts dans Project
  await prisma.project.update({
    where: { id: projectId },
    data: {
      plannedLoadDays: planned,
      consumedLoadDays: consumed,
      progressPercent: weightedProgress,

      // KPIs livrables (stockés en Int % *100 et compte)
      // tu peux ajouter ces colonnes dans Project si tu le souhaites
      // ici on ne les stocke pas, on les recalculera côté page
    },
  });
}