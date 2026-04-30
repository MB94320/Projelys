// app/api/projects/[id]/quality/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";


export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // ⚠️ avec app router, params est un Promise → il faut l'await
  const { id: projectIdParam } = await params;
  const projectId = Number(projectIdParam);

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const ncId = searchParams.get("id");

  if (!projectId || !ncId) {
    return NextResponse.json(
      { error: "Projet ou NC invalide." },
      { status: 400 },
    );
  }

  if (type !== "non-conformities") {
    return NextResponse.json(
      { error: "Type non supporté pour DELETE." },
      { status: 400 },
    );
  }

  try {
    await prisma.nonConformity.delete({
      where: { id: Number(ncId) },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE non-conformity error", e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la non-conformité." },
      { status: 500 },
    );
  }
}


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = parseInt(id, 10);
  const type = request.nextUrl.searchParams.get("type");

  try {
    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID projet invalide" },
        { status: 400 }
      );
    }

    // Liste des NC du projet
    if (type === "non-conformities") {
      const ncs = await prisma.nonConformity.findMany({
        where: { projectId },
        include: {
          deliverable: true,
          qualityActions: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(ncs);
    }

    // Livrables du projet
    if (type === "deliverables") {
  try {
    const deliverables = await prisma.deliverable.findMany({
      where: { projectId },
      // si ton modèle a createdAt, tu peux remettre orderBy ici
      // orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(deliverables);
  } catch (err) {
    console.error("Erreur Prisma deliverables:", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement des livrables" },
      { status: 500 }
    );
  }
}


    // Actions qualité du projet
    if (type === "quality-actions") {
      const actions = await prisma.qualityAction.findMany({
        where: { projectId },
        include: {
          nonConformity: true,
          customerIssue: true,
          deliverable: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(actions);
    }

    // KPI qualité côté backend (pour NC)
    if (type === "kpi") {
      const ncs = await prisma.nonConformity.findMany({
        where: { projectId },
        select: {
          id: true,
          severity: true,
          status: true,
          detectedOn: true,
          closedDate: true,
        },
      });

      const total = ncs.length;
      const open = ncs.filter((nc) => nc.status !== "Clôturé").length;
      const critical = ncs.filter(
        (nc) => nc.severity === "Majeure" || nc.severity === "Critique"
      ).length;
      const criticalRate = total > 0 ? (critical / total) * 100 : 0;

      let totalDelay = 0;
      let closedCount = 0;
      for (const nc of ncs) {
        if (!nc.detectedOn || !nc.closedDate) continue;
        const d1 = nc.detectedOn;
        const d2 = nc.closedDate;
        const diffDays =
          (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        if (Number.isNaN(diffDays)) continue;
        totalDelay += diffDays;
        closedCount += 1;
      }
      const avgCloseDelay = closedCount > 0 ? totalDelay / closedCount : 0;

      return NextResponse.json({
        nonConformities: {
          total,
          open,
          critical,
          criticalRate: Number(criticalRate.toFixed(1)),
          avgCloseDelay: Number(avgCloseDelay.toFixed(1)),
        },
      });
    }

    // Par défaut : renvoyer le projet
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Erreur GET /quality:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = parseInt(id, 10);
  const type = request.nextUrl.searchParams.get("type");
  const body = await request.json();

  try {
    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID projet invalide" },
        { status: 400 }
      );
    }

    // Création d’une NC
    if (type === "non-conformities") {
      const nc = await prisma.nonConformity.create({
        data: {
          projectId,
          reference: body.reference ?? null,
          deliverableId: body.deliverableId ?? null,
          type: body.type ?? null,
          origin: body.origin ?? null,
          description: body.description ?? "",
          severity: body.severity ?? null,
          detectedOn: body.detectedOn ? new Date(body.detectedOn) : null,
          detectedBy: body.detectedBy?.trim() || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          status: body.status ?? "Ouvert",
          closedDate: body.closedDate ? new Date(body.closedDate) : null,
          rootCause: body.rootCause?.trim() || null,
          immediateAction: body.immediateAction?.trim() || null,
          correctiveAction: body.correctiveAction?.trim() || null,
          preventiveAction: body.preventiveAction?.trim() || null,
          comments: body.comments?.trim() || null,
          fncUrl: body.fncUrl?.trim() || null,
          eightDProgress:
            typeof body.eightDProgress === "number"
              ? body.eightDProgress
              : 0,
          eightDComment: body.eightDComment?.trim() || null,
          createdBy: body.createdBy ?? null,
        },
        include: {
          deliverable: true,
        },
      });

      return NextResponse.json(nc, { status: 201 });
    }

    // Création d’une action qualité
    if (type === "quality-actions") {
      const action = await prisma.qualityAction.create({
        data: {
          projectId,
          title: body.title,
          description: body.description ?? null,
          category: body.category ?? null,
          owner: body.owner ?? null,
          priority: body.priority ?? null,
          status: body.status ?? "Ouverte",
          progress:
            typeof body.progress === "number" ? body.progress : 0,
          startDate: body.startDate ? new Date(body.startDate) : null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          closedDate: body.closedDate ? new Date(body.closedDate) : null,
          nonConformityId: body.nonConformityId ?? null,
          customerIssueId: body.customerIssueId ?? null,
          deliverableId: body.deliverableId ?? null,
          globalActionId: body.globalActionId ?? null,
          effectiveness: body.effectiveness ?? null,
        },
      });

      return NextResponse.json(action, { status: 201 });
    }

    return NextResponse.json(
      { error: "Type non reconnu" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur POST /quality:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = parseInt(id, 10);
  const type = request.nextUrl.searchParams.get("type");
  const body = await request.json();

  try {
    if (!projectId || Number.isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID projet invalide" },
        { status: 400 }
      );
    }

    // Mise à jour NC
    if (type === "non-conformities") {
      const ncId = body.id;
      if (!ncId) {
        return NextResponse.json(
          { error: "ID NC manquant" },
          { status: 400 }
        );
      }

      const updated = await prisma.nonConformity.update({
        where: { id: ncId },
        data: {
          reference: body.reference ?? undefined,
          deliverableId:
            body.deliverableId !== undefined
              ? body.deliverableId
              : undefined,
          type: body.type ?? undefined,
          origin: body.origin ?? undefined,
          description: body.description ?? undefined,
          severity: body.severity ?? undefined,
          detectedOn: body.detectedOn
            ? new Date(body.detectedOn)
            : undefined,
          detectedBy: body.detectedBy ?? undefined,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          status: body.status ?? undefined,
          closedDate:
            body.status === "Clôturé"
              ? new Date()
              : body.closedDate
              ? new Date(body.closedDate)
              : undefined,
          rootCause: body.rootCause ?? undefined,
          immediateAction: body.immediateAction ?? undefined,
          correctiveAction: body.correctiveAction ?? undefined,
          preventiveAction: body.preventiveAction ?? undefined,
          comments: body.comments ?? undefined,
          fncUrl: body.fncUrl ?? undefined,
          eightDProgress:
            typeof body.eightDProgress === "number"
              ? body.eightDProgress
              : undefined,
          eightDComment: body.eightDComment ?? undefined,
          createdBy: body.createdBy ?? undefined,
        },
        include: { deliverable: true },
      });

      return NextResponse.json(updated);
    }

    // Mise à jour action qualité
    if (type === "quality-actions") {
      const actionId = body.id;
      if (!actionId) {
        return NextResponse.json(
          { error: "ID action manquant" },
          { status: 400 }
        );
      }

      const updated = await prisma.qualityAction.update({
        where: { id: actionId },
        data: {
          title: body.title ?? undefined,
          description: body.description ?? undefined,
          category: body.category ?? undefined,
          owner: body.owner ?? undefined,
          priority: body.priority ?? undefined,
          status: body.status ?? undefined,
          progress:
            typeof body.progress === "number"
              ? body.progress
              : undefined,
          startDate: body.startDate
            ? new Date(body.startDate)
            : undefined,
          dueDate: body.dueDate
            ? new Date(body.dueDate)
            : undefined,
          closedDate:
            body.status === "Terminée"
              ? new Date()
              : body.closedDate
              ? new Date(body.closedDate)
              : undefined,
          effectiveness: body.effectiveness ?? undefined,
        },
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "Type non reconnu" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur PATCH /quality:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
