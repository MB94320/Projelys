import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const company = String(body?.company ?? "").trim();
    const context = String(body?.context ?? "").trim();
    const priority = String(body?.priority ?? "").trim();
    const lang = body?.lang === "en" ? "en" : "fr";
    const website = String(body?.website ?? "").trim();

    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!name || name.length < 2) {
      return NextResponse.json(
        { ok: false, error: lang === "fr" ? "Nom invalide." : "Invalid name." },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: lang === "fr" ? "Email invalide." : "Invalid email." },
        { status: 400 }
      );
    }

    if (!context || context.length < 10) {
      return NextResponse.json(
        {
          ok: false,
          error:
            lang === "fr"
              ? "Merci de préciser un peu votre contexte."
              : "Please provide more context.",
        },
        { status: 400 }
      );
    }

    if (name.length > 120 || email.length > 190 || company.length > 160 || context.length > 4000 || priority.length > 200) {
      return NextResponse.json(
        {
          ok: false,
          error:
            lang === "fr"
              ? "Le message est trop long."
              : "The message is too long.",
        },
        { status: 400 }
      );
    }

    if (!resend) {
      return NextResponse.json(
        {
          ok: false,
          error:
            lang === "fr"
              ? "Service email non configuré."
              : "Email service not configured.",
        },
        { status: 500 }
      );
    }

    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL;

    if (!to || !from) {
      return NextResponse.json(
        {
          ok: false,
          error:
            lang === "fr"
              ? "Configuration email incomplète."
              : "Incomplete email configuration.",
        },
        { status: 500 }
      );
    }

    const subject =
      lang === "fr"
        ? `Nouveau contact Projelys — ${name}`
        : `New Projelys contact — ${name}`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin-bottom:16px;">${subject}</h2>
        <p><strong>Nom :</strong> ${name}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Société :</strong> ${company || "-"}</p>
        <p><strong>Priorité / besoin :</strong> ${priority || "-"}</p>
        <p><strong>Langue :</strong> ${lang}</p>
        <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0;" />
        <p><strong>Contexte :</strong></p>
        <p style="white-space:pre-line;">${context.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
      </div>
    `;

    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Unexpected error." },
      { status: 500 }
    );
  }
}