// app/api/projects/route.bak.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (!projectId || Number.isNaN(projectId)) {
    return NextResponse.json(
      { error: "Identifiant invalide" },
      { status: 400 }
    );
  }

  const body = await req.json();

  // "2025-01-15" -> Date
  const parseDate = (value: string | null | undefined): Date | null => {
    if (!value) return null;
    return new Date(`${value}T12:00:00`); // format accepté par Prisma pour DateTime [web:68][web:72]
  };

  try {
    console.log("BODY UPDATE PROJECT", body);

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        projectNumber: body.projectNumber ?? null,
        titleProject: body.titleProject ?? null,
        clientName: body.clientName ?? null,
        projectManagerName: body.projectManagerName ?? null,
        startDate: parseDate(body.startDate),
        estimatedDate: parseDate(body.estimatedDate),
        status: body.status ?? null,
        riskCriticality: body.riskCriticality ?? null,
        progressPercent: body.progressPercent ?? null,
        comments: body.comments ?? null,
        plannedLoadDays: body.plannedLoadDays ?? null,
        consumedLoadDays: body.consumedLoadDays ?? null,
      },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (e) {
    console.error("Erreur update project", e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du projet" },
      { status: 500 }
    );
  }
}
