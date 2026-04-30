import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const ncs = await prisma.nonConformity.findMany({
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            titleProject: true,
          },
        },
        deliverable: {
          select: {
            id: true,
            reference: true,
            title: true,
          },
        },
      },
      orderBy: { detectedOn: "desc" },
    });

    return NextResponse.json(ncs);
  } catch (e: any) {
    console.error("Error loading global non-conformities", e);
    return NextResponse.json(
      { error: "Erreur lors du chargement des non-conformités globales." },
      { status: 500 },
    );
  }
}
