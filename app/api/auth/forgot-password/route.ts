import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/app/lib/email";

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { email?: string } | null;
    const email = body?.email?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({
        ok: true,
        message:
          "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.isActive) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashToken(rawToken);

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await sendPasswordResetEmail({
        to: user.email,
        token: rawToken,
        name: user.name,
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error("forgot-password error", error);
    return NextResponse.json({
      ok: true,
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    });
  }
}