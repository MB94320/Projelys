import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { setSessionCookie, verifyPasswordHash } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    const isValid = verifyPasswordHash(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: "Compte désactivé." },
        { status: 403 },
      );
    }

    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "FULL" | "LIMITED",
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("POST /api/login error", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la connexion." },
      { status: 500 },
    );
  }
}