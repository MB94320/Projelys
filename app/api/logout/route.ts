import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/app/lib/auth";

export async function POST() {
  try {
    await clearSessionCookie();

    return NextResponse.json(
      { ok: true, message: "Déconnexion effectuée." },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("POST /api/logout error", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la déconnexion." },
      { status: 500 },
    );
  }
}