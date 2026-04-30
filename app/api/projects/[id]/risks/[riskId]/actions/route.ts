import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; riskId: string }> }
) {
  const { id, riskId } = await context.params;
  const projectId = Number(id);
  const rId = Number(riskId);

  if (Number.isNaN(projectId) || Number.isNaN(rId)) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 400 });
  }

  const actions = await prisma.action.findMany({
    where: { projectId, riskId: rId },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(actions);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; riskId: string }> }
) {
  const { id, riskId } = await context.params;
  const projectId = Number(id);
  const rId = Number(riskId);

  if (Number.isNaN(projectId) || Number.isNaN(rId)) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 400 });
  }

  const data = await req.json();

  const action = await prisma.action.create({
    data: {
      projectId,
      riskId: rId,
      title: data.title,
      description: data.description ?? null,
      owner: data.owner ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status ?? "open",
      priority: data.priority ?? null,
    },
  });

  return NextResponse.json(action, { status: 201 });
}
