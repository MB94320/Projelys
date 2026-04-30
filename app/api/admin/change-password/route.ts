import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

function hashPassword(password: string, salt?: string) {
  const usedSalt = salt ?? randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, usedSalt, 64).toString("hex");
  return `${usedSalt}:${derivedKey}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const hashedBuffer = Buffer.from(key, "hex");
  const suppliedBuffer = Buffer.from(
    scryptSync(password, salt, 64).toString("hex"),
    "hex"
  );

  if (hashedBuffer.length !== suppliedBuffer.length) return false;

  return timingSafeEqual(hashedBuffer, suppliedBuffer);
}

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
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");
    const confirmPassword = String(body?.confirmPassword ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Les mots de passe ne correspondent pas." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: admin.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const isValid = verifyPassword(currentPassword, existing.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect." },
        { status: 401 }
      );
    }

    const newHash = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: newHash,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe." },
      { status: 500 }
    );
  }
}