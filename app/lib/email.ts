import "server-only";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function sendPasswordResetEmail(params: {
  to: string;
  token: string;
  name?: string | null;
}) {
  const resetUrl = `${getBaseUrl()}/auth/reset-password?token=${encodeURIComponent(params.token)}`;

  const from = process.env.MAIL_FROM || "Projelys <onboarding@resend.dev>";

  const subject = "Réinitialisation de votre mot de passe Projelys";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a">
      <h2>Réinitialisation du mot de passe</h2>
      <p>Bonjour ${params.name ?? ""},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe Projelys.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:8px;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Ou copiez ce lien dans votre navigateur :</p>
      <p style="word-break:break-all">${resetUrl}</p>
      <p>Ce lien expirera dans 1 heure.</p>
      <p>Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email.</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message || "Erreur envoi email Resend");
  }
}