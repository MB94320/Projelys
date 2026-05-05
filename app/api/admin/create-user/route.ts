import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, createPasswordHash } from "@/app/lib/auth";

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
    const email = String(body?.email ?? "").trim().toLowerCase();
    const name = String(body?.name ?? "").trim() || null;
    const password = String(body?.password ?? "");
    const role = String(body?.role ?? "FULL").toUpperCase();
    const isActive = body?.isActive !== false;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    if (!["ADMIN", "FULL", "LIMITED"].includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà." },
        { status: 409 }
      );
    }

    const passwordHash = await createPasswordHash(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role as any,
        isActive,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur." },
      { status: 500 }
    );
  }
}