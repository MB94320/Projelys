// app/api/holidays/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// GET /api/holidays?year=2025 (optionnel)
export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;

  let where: any = {};

  if (year) {
    where = {
      startDate: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
      },
      endDate: {
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      },
    };
  }

  const absences = await prisma.absence.findMany({
    where,
    orderBy: { startDate: "asc" },
    include: { resource: true },
  });

  return NextResponse.json(
    absences.map((a) => ({
      id: a.id,
      resourceId: a.resourceId,
      resourceName: a.resource?.name ?? "",
      type: a.type,
      startDate: a.startDate,
      endDate: a.endDate,
      daysCount: a.daysCount,
      duration: a.duration ?? "FULL_DAY",
      comment: a.comment,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
  );
}

// POST /api/holidays  (création)
export async function POST(req: NextRequest) {
  const body = await req.json();

  // on peut créer une ligne même sans nom de ressource,
  // la ressource sera créée au moment du premier enregistrement
  let resourceName = String(body.resourceName ?? "").trim();
  if (!resourceName) {
    resourceName = "Inconnu";
  }

  const resource = await prisma.resource.upsert({
    where: { name: resourceName },
    update: {},
    create: {
      name: resourceName,
      role: null,
      weeklyHours: 35,
    },
  });

  const absence = await prisma.absence.create({
    data: {
      resourceId: resource.id,
      type: String(body.type ?? "Congés payés"),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      daysCount: Number(body.daysCount ?? 0),
      duration: body.duration === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY",
      comment: body.comment !== undefined ? String(body.comment) : null,
    },
  });

  return NextResponse.json(
    {
      id: absence.id,
      resourceId: absence.resourceId,
      resourceName: resource.name,
      type: absence.type,
      startDate: absence.startDate,
      endDate: absence.endDate,
      daysCount: absence.daysCount,
      duration: absence.duration ?? "FULL_DAY",
      comment: absence.comment,
      createdAt: absence.createdAt,
      updatedAt: absence.updatedAt,
    },
    { status: 201 },
  );
}

// PUT /api/holidays  (mise à jour)
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { error: "id is required" },
      { status: 400 },
    );
  }

  let resourceName = String(body.resourceName ?? "").trim();
  if (!resourceName) {
    resourceName = "Inconnu";
  }

  const resource = await prisma.resource.upsert({
    where: { name: resourceName },
    update: {},
    create: {
      name: resourceName,
      role: null,
      weeklyHours: 35,
    },
  });

  const absence = await prisma.absence.update({
    where: { id },
    data: {
      resourceId: resource.id,
      type: String(body.type ?? "Congés payés"),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      daysCount: Number(body.daysCount ?? 0),
      duration: body.duration === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY",
      comment: body.comment !== undefined ? String(body.comment) : null,
    },
  });

  return NextResponse.json({
    id: absence.id,
    resourceId: absence.resourceId,
    resourceName: resource.name,
    type: absence.type,
    startDate: absence.startDate,
    endDate: absence.endDate,
    daysCount: absence.daysCount,
    duration: absence.duration ?? "FULL_DAY",
    comment: absence.comment,
    createdAt: absence.createdAt,
    updatedAt: absence.updatedAt,
  });
}

// DELETE /api/holidays?id=123
export async function DELETE(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get("id");
  const id = idParam ? Number(idParam) : NaN;

  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { error: "Missing id" },
      { status: 400 },
    );
  }

  await prisma.absence.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
