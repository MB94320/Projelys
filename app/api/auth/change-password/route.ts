// app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";
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
    "hex",
  );

  if (hashedBuffer.length !== suppliedBuffer.length) return false;
  return timingSafeEqual(hashedBuffer, suppliedBuffer);
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as
    | { currentPassword?: string; newPassword?: string; confirmPassword?: string }
    | null;

  if (!body?.currentPassword || !body?.newPassword || !body?.confirmPassword) {
    return NextResponse.json(
      { error: "Requête invalide" },
      { status: 400 },
    );
  }

  if (body.newPassword !== body.confirmPassword) {
    return NextResponse.json(
      { error: "Les mots de passe ne correspondent pas." },
      { status: 400 },
    );
  }

  if (body.newPassword.length < 8) {
    return NextResponse.json(
      { error: "Le nouveau mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || !dbUser.isActive) {
    return NextResponse.json(
      { error: "Compte introuvable ou inactif" },
      { status: 400 },
    );
  }

  const isValid = verifyPassword(body.currentPassword, dbUser.passwordHash);
  if (!isValid) {
    // On reste vague pour ne pas aider un attaquant
    return NextResponse.json(
      { error: "Mot de passe actuel incorrect." },
      { status: 400 },
    );
  }

  const newHash = hashPassword(body.newPassword);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: dbUser.id },
      data: { passwordHash: newHash },
    });

    // Invalider toutes les sessions actives de cet utilisateur
    await tx.session.deleteMany({
      where: { userId: dbUser.id },
    });
  });

  return NextResponse.json({ ok: true });
}