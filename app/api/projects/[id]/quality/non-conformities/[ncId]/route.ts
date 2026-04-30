// app/api/projects/[id]/quality/non-conformities/[ncId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function getIdsFromUrl(req: NextRequest) {
  const segments = req.nextUrl.pathname.split("/");
  // ['', 'api', 'projects', '1', 'quality', 'non-conformities', '12']
  const projectSegment = segments[3];
  const ncSegment = segments[6];

  const projectId = Number(projectSegment);
  const ncId = Number(ncSegment);

  return {
    projectId: Number.isFinite(projectId) ? projectId : null,
    ncId: Number.isFinite(ncId) ? ncId : null,
    rawProjectId: projectSegment,
    rawNcId: ncSegment,
  };
}

export async function GET(req: NextRequest) {
  const { projectId, ncId, rawProjectId, rawNcId } = getIdsFromUrl(req);

  if (!projectId || !ncId) {
    return NextResponse.json(
      { error: "GET NC: projectId ou ncId invalide", rawProjectId, rawNcId },
      { status: 400 }
    );
  }

  const nc = await prisma.nonConformity.findFirst({
    where: { id: ncId, projectId },
  });

  if (!nc) {
    return NextResponse.json(
      { error: "Non-conformité introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json(nc);
}

export async function PUT(req: NextRequest) {
  const { projectId, ncId, rawProjectId, rawNcId } = getIdsFromUrl(req);

  if (!projectId || !ncId) {
    return NextResponse.json(
      { error: "PUT NC: projectId ou ncId invalide", rawProjectId, rawNcId },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  // ne pas changer la référence automatiquement en édition
  const data: any = {
  type: body.type ?? null,
  origin: body.origin ?? null,
  description:
    typeof body.description === "string"
      ? body.description.trim()
      : undefined,
  severity: body.severity ?? null,
  detectedOn: body.detectedOn ? new Date(body.detectedOn) : null,
  detectedBy: body.detectedBy ?? null,
  dueDate: body.dueDate ? new Date(body.dueDate) : null,
  status: body.status ?? "Ouvert",
  closedDate: body.closedDate ? new Date(body.closedDate) : null,
  rootCause: body.rootCause ?? null,
  immediateAction: body.immediateAction ?? null,
  correctiveAction: body.correctiveAction ?? null,
  preventiveAction: body.preventiveAction ?? null,
  comments: body.comments ?? null,
  fncUrl: body.fncUrl ?? null,
};


  // facultatif : mise à jour du livrable lié
  if (body.deliverableId === null) {
    data.deliverableId = null;
  } else if (typeof body.deliverableId === "number") {
    data.deliverableId = body.deliverableId;
  }

  const updated = await prisma.nonConformity.update({
    where: { id: ncId },
    data,
  });


  return NextResponse.json(updated);
}
