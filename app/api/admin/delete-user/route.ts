import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = await req.json();
    const userId = Number(body?.userId);

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "Identifiant utilisateur invalide." },
        { status: 400 }
      );
    }

    if (userId === admin.id) {
      return NextResponse.json(
        {
          error:
            "Vous ne pouvez pas supprimer votre propre compte administrateur connecté.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur." },
      { status: 500 }
    );
  }
}