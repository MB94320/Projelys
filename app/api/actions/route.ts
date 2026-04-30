// app/api/actions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      origin,
      priority,
      owner,
      startDate,
      dueDate,
      closedDate,
      status,
      progress,
      efficience,
      comment,
      projectNumber,
    } = body as {
      title: string;
      origin?: string;
      priority?: string;
      owner?: string;
      startDate?: string | null;
      dueDate?: string | null;
      closedDate?: string | null;
      status?: string;
      progress?: number;
      efficience?: string | null;
      comment?: string | null;
      projectNumber?: string | null;
    };

    const created = await prisma.action.create({
      data: {
        title,
        origin: origin ?? null,
        priority: priority ?? null,
        owner: owner ?? null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        closedDate: closedDate ? new Date(closedDate) : null,
        status: status ?? "Ouverte",
        progress: typeof progress === "number" ? progress : 0,
        efficience: efficience ?? null,
        description: comment ?? null,
      },
    });

    // si un n° projet est fourni, on essaie de le rattacher
    if (projectNumber) {
      const project = await prisma.project.findFirst({
        where: { projectNumber },
      });
      if (project) {
        await prisma.action.update({
          where: { id: created.id },
          data: { projectId: project.id },
        });
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error("Error creating action:", e);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'action." },
      { status: 500 },
    );
  }
}
