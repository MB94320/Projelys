import { NextResponse } from "next/server";
import { logout } from "@/app/lib/auth";

export async function POST() {
  try {
    await logout();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion." },
      { status: 500 }
    );
  }
}