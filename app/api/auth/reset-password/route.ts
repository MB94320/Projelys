import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { createHash, randomBytes, scryptSync } from "crypto";

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function hashPassword(password: string, salt?: string) {
  const usedSalt = salt ?? randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, usedSalt, 64).toString("hex");
  return `${usedSalt}:${derivedKey}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { token?: string; newPassword?: string; confirmPassword?: string }
      | null;

    const token = body?.token?.trim();
    const newPassword = body?.newPassword ?? "";
    const confirmPassword = body?.confirmPassword ?? "";

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Les mots de passe ne correspondent pas." },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 },
      );
    }

    const tokenHash = hashToken(token);

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Lien de réinitialisation invalide." },
        { status: 400 },
      );
    }

    if (resetRecord.usedAt) {
      return NextResponse.json(
        { error: "Ce lien a déjà été utilisé." },
        { status: 400 },
      );
    }

    if (resetRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Ce lien a expiré." },
        { status: 400 },
      );
    }

    if (!resetRecord.user.isActive) {
      return NextResponse.json(
        { error: "Compte inactif." },
        { status: 400 },
      );
    }

    const newHash = hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newHash },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      await tx.session.deleteMany({
        where: { userId: resetRecord.userId },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reset-password error", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 },
    );
  }
}