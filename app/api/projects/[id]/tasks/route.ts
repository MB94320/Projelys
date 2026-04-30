import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { recalculateProjectKpis } from "@/app/lib/recalculateProjectKpis";

function parseDate(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

// GET /api/projects/[id]/tasks
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json(
      { error: "ID projet invalide" },
      { status: 400 },
    );
  }

  const tasks = await prisma.projectTask.findMany({
    where: { projectId },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(tasks);
}

// POST /api/projects/[id]/tasks
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (!Number.isFinite(projectId)) {
    return NextResponse.json(
      { error: "ID projet invalide" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();

    const task = await prisma.projectTask.create({
      data: {
        projectId,
        name: String(body.name ?? "Nouvelle tâche"),
        description:
          body.description !== undefined
            ? String(body.description)
            : null,
        startDate: parseDate(body.startDate),
        endDate: parseDate(body.endDate),
        plannedWorkHours: Number(body.plannedWorkHours ?? 0),
        consumedWorkHours: Number(body.consumedWorkHours ?? 0),
        progressPercent: Number(body.progressPercent ?? 0),
        status: String(body.status ?? "Planifiée"),
        assigneeName:
          body.assigneeName !== undefined
            ? String(body.assigneeName)
            : null,
        role:
          body.role !== undefined && body.role !== ""
            ? String(body.role)
            : null,
      },
    });

    await recalculateProjectKpis(projectId);

    return NextResponse.json(task, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/projects/[id]/tasks error:", e);
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erreur lors de la création de la tâche.",
      },
      { status: 500 },
    );
  }
}

// PUT /api/projects/[id]/tasks
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const taskId = Number(body.id);

    if (!Number.isFinite(taskId)) {
      return NextResponse.json(
        { error: "ID tâche invalide" },
        { status: 400 },
      );
    }

    const existing = await prisma.projectTask.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Tâche introuvable" },
        { status: 404 },
      );
    }

    const task = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        name: String(body.name ?? "Sans titre"),
        description:
          body.description !== undefined
            ? String(body.description)
            : null,
        startDate: parseDate(body.startDate),
        endDate: parseDate(body.endDate),
        plannedWorkHours: Number(body.plannedWorkHours ?? 0),
        consumedWorkHours: Number(body.consumedWorkHours ?? 0),
        progressPercent: Number(body.progressPercent ?? 0),
        status: String(body.status ?? "Planifiée"),
        assigneeName:
          body.assigneeName !== undefined
            ? String(body.assigneeName)
            : null,
        role:
          body.role !== undefined && body.role !== ""
            ? String(body.role)
            : null,
      },
    });

    await recalculateProjectKpis(existing.projectId);

    return NextResponse.json(task);
  } catch (e: any) {
    console.error("PUT /api/projects/[id]/tasks error:", e);
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erreur lors de la mise à jour de la tâche.",
      },
      { status: 500 },
    );
  }
}

// DELETE /api/projects/[id]/tasks
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const taskId = Number(body.id);

    if (!Number.isFinite(taskId)) {
      return NextResponse.json(
        { error: "ID tâche invalide" },
        { status: 400 },
      );
    }

    const existing = await prisma.projectTask.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Tâche introuvable" },
        { status: 404 },
      );
    }

    await prisma.projectTask.delete({ where: { id: taskId } });

    await recalculateProjectKpis(existing.projectId);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/projects/[id]/tasks error:", e);
    return NextResponse.json(
      {
        error:
          e?.message ||
          "Erreur lors de la suppression de la tâche.",
      },
      { status: 500 },
    );
  }
}