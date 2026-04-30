import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function toDateOrNull(val: string | null | undefined) {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectIdParam = searchParams.get("projectId");

    const where = projectIdParam
      ? { projectId: Number(projectIdParam) || 0 }
      : {};

    const deliverables = await prisma.deliverable.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            titleProject: true,
          },
        },
      },
      orderBy: { contractualDate: "asc" },
    });

    return NextResponse.json(deliverables);
  } catch (e: any) {
    console.error("Error loading deliverables", e);
    return NextResponse.json(
      { error: "Erreur lors du chargement des livrables." },
      { status: 500 },
    );
  }
}


export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectIdParam = searchParams.get("projectId");
    if (!projectIdParam) {
      return NextResponse.json(
        { error: "projectId manquant dans l’URL." },
        { status: 400 },
      );
    }
    const projectId = Number(projectIdParam);
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId invalide." },
        { status: 400 },
      );
    }

    const body = await req.json();

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { error: "Intitulé du livrable obligatoire." },
        { status: 400 },
      );
    }

    const created = await prisma.deliverable.create({
      data: {
        projectId,
        reference: body.reference ?? null,
        title: body.title,
        type: body.type ?? null,
        description: body.description ?? null,
        owner: body.owner ?? null,
        clientReference: body.clientReference ?? null,
        contractualDate: toDateOrNull(body.contractualDate),
        revisedDate: toDateOrNull(body.revisedDate),
        deliveredDate: toDateOrNull(body.deliveredDate),
        validatedDate: toDateOrNull(body.validatedDate),
        progress: body.progress ?? 0,
        status: body.status ?? "Non commencé",
        qualityStatus: body.qualityStatus ?? null,
        delayCause: body.delayCause ?? null,
        deliveryIterations: body.deliveryIterations ?? null,
        validatedBy: body.validatedBy ?? null,
        comments: body.comments ?? null,
        linkDoc: body.linkDoc ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error("Error creating deliverable", e);
    return NextResponse.json(
      { error: "Erreur lors de la création du livrable." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json(
        { error: "id de livrable manquant dans l’URL." },
        { status: 400 },
      );
    }
    const id = Number(idParam);
    if (!id) {
      return NextResponse.json(
        { error: "id invalide." },
        { status: 400 },
      );
    }

    const body = await req.json();

    const updated = await prisma.deliverable.update({
      where: { id },
      data: {
        title: body.title,
        type: body.type ?? null,
        owner: body.owner ?? null,
        contractualDate: toDateOrNull(body.contractualDate),
        revisedDate: toDateOrNull(body.revisedDate),
        deliveredDate: toDateOrNull(body.deliveredDate),
        validatedDate: toDateOrNull(body.validatedDate),
        progress: body.progress ?? 0,          // <--
        status: body.status,
        qualityStatus: body.qualityStatus ?? null,
        delayCause: body.delayCause ?? null,
        deliveryIterations: body.deliveryIterations ?? null,
        validatedBy: body.validatedBy ?? null,
        comments: body.comments ?? null,
        linkDoc: body.linkDoc ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Error updating deliverable", e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du livrable." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json(
        { error: "id de livrable manquant dans l’URL." },
        { status: 400 },
      );
    }
    const id = Number(idParam);
    if (!id) {
      return NextResponse.json(
        { error: "id invalide." },
        { status: 400 },
      );
    }

    await prisma.deliverable.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error deleting deliverable", e);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du livrable." },
      { status: 500 },
    );
  }
}
