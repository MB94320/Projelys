// app/api/projects/[id]/quality/non-conformities/[ncId]/actions-from-8d/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; ncId: string }> },
) {
  // 👇 on "unwrap" les params
  const { id, ncId } = await context.params;
  const projectId = Number(id);
  const nonConformityId = Number(ncId);

  if (!projectId || !nonConformityId) {
    return NextResponse.json(
      { error: "Projet ou NC invalide." },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const actionsInput = body.actions as {
      title: string;
      description?: string | null;
      owner?: string | null;
      priority?: "Basse" | "Moyenne" | "Haute" | null;
      dueDate?: string | null;
      category?: string | null;
    }[];

    if (!Array.isArray(actionsInput) || actionsInput.length === 0) {
      return NextResponse.json(
        { error: "Aucune action à créer." },
        { status: 400 },
      );
    }

    // NC pour responsable par défaut
    const nc = await prisma.nonConformity.findUnique({
      where: { id: nonConformityId },
      select: { detectedBy: true },
    });

            const createdActions = await prisma.$transaction(async (tx) => {
      const results: {
        global: Awaited<ReturnType<typeof tx.action.create>>;
        qa: Awaited<ReturnType<typeof tx.qualityAction.create>>;
      }[] = [];

      // 0) supprimer les anciennes actions 8D de cette NC
      const oldQualityActions = await tx.qualityAction.findMany({
        where: { nonConformityId },
        select: { id: true, globalActionId: true },
      });

      const oldGlobalIds = oldQualityActions
        .map((a) => a.globalActionId)
        .filter((id): id is number => id !== null);

      if (oldQualityActions.length > 0) {
        await tx.qualityAction.deleteMany({
          where: { nonConformityId },
        });
      }

      if (oldGlobalIds.length > 0) {
        await tx.action.deleteMany({
          where: { id: { in: oldGlobalIds } },
        });
      }

      // 1) créer les nouvelles actions à partir du payload
      for (const a of actionsInput) {
        const owner = a.owner ?? nc?.detectedBy ?? null;
        const due =
          a.dueDate && a.dueDate !== "" ? new Date(a.dueDate) : null;

        const global = await tx.action.create({
          data: {
            projectId,
            title: a.title,
            description: a.description ?? null,
            origin: "Non-Conformité",
            priority: a.priority ?? "Moyenne",
            owner,
            status: "Ouverte",
            progress: 0,
            startDate: new Date(),
            dueDate: due,
          },
        });

        const qa = await tx.qualityAction.create({
          data: {
            projectId,
            nonConformityId,
            title: a.title,
            description: a.description ?? null,
            category: a.category ?? "Corrective",
            owner,
            priority: a.priority ?? "Moyenne",
            status: "Ouverte",
            progress: 0,
            startDate: new Date(),
            dueDate: due,
            globalActionId: global.id,
          },
        });

        results.push({ global, qa });
      }

      return results;
    });



    return NextResponse.json(
      {
        ok: true,
        count: createdActions.length,
      },
      { status: 201 },
    );
  } catch (e) {
    console.error(
      "Error creating 8D actions for NC",
      nonConformityId,
      "project",
      projectId,
      e,
    );
    return NextResponse.json(
      { error: "Erreur lors de la création des actions 8D." },
      { status: 500 },
    );
  }
}
