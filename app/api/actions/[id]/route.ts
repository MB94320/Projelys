// app/api/actions/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: Params) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);

  if (!id) {
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });
  }

  const action = await prisma.action.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, projectNumber: true } },
      risk: { select: { id: true, ref: true, projectId: true } },
    },
  });

  if (!action) {
    return NextResponse.json(
      { error: "Action non trouvée." },
      { status: 404 },
    );
  }

  // normalisation statut côté API pour la page d’édition
  const normalized = {
    ...action,
    status: action.status === "open" ? "Ouverte" : action.status,
  };

  return NextResponse.json(normalized);
}

export async function PATCH(request: Request, context: Params) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);

  if (!id) {
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      origin,
      priority,
      status,
      progress,
      owner,
      startDate,
      dueDate,
      closedDate,
      efficience,
      comment,
      projectNumber,
    } = body as {
      origin?: string;
      priority?: string;
      status?: string;
      progress?: number;
      owner?: string;
      startDate?: string | null;
      dueDate?: string | null;
      closedDate?: string | null;
      efficience?: string | null;
      comment?: string | null;
      projectNumber?: string | null;
    };

    const data: any = {};
    if (origin !== undefined) data.origin = origin;
    if (priority !== undefined) data.priority = priority;
    if (status) {
      data.status = status === "Ouverte" ? "Ouverte" : status;
    }
    if (typeof progress === "number") data.progress = progress;
    if (owner !== undefined) data.owner = owner || null;
    if (startDate !== undefined) {
      data.startDate = startDate ? new Date(startDate) : null;
    }
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (closedDate !== undefined) {
      data.closedDate = closedDate ? new Date(closedDate) : null;
    }
    if (comment !== undefined) data.description = comment || null;
    if (efficience !== undefined) data.efficience = efficience || null;

    const updated = await prisma.action.update({
      where: { id },
      data,
      include: {
        project: { select: { id: true, projectNumber: true } },
        risk: { select: { id: true, ref: true, projectId: true } },
      },
    });

        if (projectNumber !== undefined) {
      const trimmed = projectNumber?.trim() || null;

      if (!trimmed) {
        // si champ vidé, on détache l'action de tout projet
        await prisma.action.update({
          where: { id },
          data: { projectId: null },
        });
      } else {
        // on cherche un projet avec ce n°
        let project = await prisma.project.findFirst({
          where: { projectNumber: trimmed },
        });

        // si pas trouvé, on le crée avec les seuls champs existants
        if (!project) {
          project = await prisma.project.create({
            data: {
              projectNumber: trimmed,
            },
          });
        }

        await prisma.action.update({
          where: { id },
          data: { projectId: project.id },
        });
      }
    }


    return NextResponse.json(updated);
  } catch (e) {
    console.error("Error updating action:", e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'action." },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, context: Params) {
  const { id: idParam } = await context.params;
  const id = Number(idParam);

  if (!id) {
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });
  }

  try {
    await prisma.action.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error deleting action:", e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'action." },
      { status: 500 },
    );
  }
}
