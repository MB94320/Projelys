import { NextResponse } from "next/server";
import { logout } from "@/app/lib/auth";

async function handleLogout() {
  try {
    await logout();

    const res = NextResponse.json({ ok: true });
    res.cookies.set("projelys_session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    });

    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la déconnexion." },
      { status: 500 }
    );
  }
}

export async function POST() {
  return handleLogout();
}

export async function GET() {
  return handleLogout();
}