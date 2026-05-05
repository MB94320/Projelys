import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const userId = Number(body?.userId);
    const role = String(body?.role ?? "").toUpperCase();

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "Identifiant utilisateur invalide." },
        { status: 400 }
      );
    }

    if (!["ADMIN", "FULL", "LIMITED"].includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors du changement de rôle." },
      { status: 500 }
    );
  }
}