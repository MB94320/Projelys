import AppShell from "@/app/components/AppShell";
import { prisma } from "@/app/lib/prisma";
import ActionsClient, { ActionRow } from "./ActionsClient";

export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  const actions = await prisma.action.findMany({
    include: {
      project: { select: { id: true, projectNumber: true } },
      risk: { select: { id: true, ref: true, projectId: true } },
      qualityActions: {
        include: {
          nonConformity: { select: { id: true, reference: true } },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  const mapped: ActionRow[] = actions.map((a: any) => {
    let origin = a.origin ?? (a.riskId ? "Risques" : "Autres");

    const qa = (a.qualityActions?.[0] as any) ?? null;
    if (qa?.nonConformityId) {
      origin = "Non-Conformité";
    }

    return {
      id: a.id,
      actionDbId: a.id,
      title: a.title,
      origin,
      priority: (a.priority as "Basse" | "Moyenne" | "Haute") ?? "Moyenne",
      progress: typeof a.progress === "number" ? a.progress : 0,
      owner: a.owner ?? "",
      startDate: (a.startDate ?? a.createdAt).toISOString().slice(0, 10),
      dueDate: a.dueDate ? a.dueDate.toISOString().slice(0, 10) : "",
      status:
        a.status === "open"
          ? ("Ouverte" as any)
          : ((a.status as any) ?? "Ouverte"),
      efficience:
        (a.efficience as
          | "Conforme"
          | "Partiellement conforme"
          | "Non conforme"
          | null) ?? "Conforme",
      riskId: a.riskId,
      riskRef: a.risk?.ref ?? null,
      projectId: a.projectId ?? a.risk?.projectId ?? null,
      projectLabel: a.project?.projectNumber ?? null,
      closedDate: a.closedDate
        ? a.closedDate.toISOString().slice(0, 10)
        : null,
      comment: a.description ?? null, // DAC/DAP – ...
      ncId: qa?.nonConformityId ?? null,
      ncRef: qa?.nonConformity?.reference ?? null,
    } satisfies ActionRow;
  });

  return (
    <AppShell
      activeSection="actions"
      pageTitle="Plan d’actions"
      pageSubtitle="Vue consolidée des actions issues des projets, risques, non-conformités et audits qualité."
    >
      <ActionsClient initialActions={mapped} />
    </AppShell>
  );
}
