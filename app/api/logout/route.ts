import { NextResponse } from "next/server";
import { logout, SESSION_COOKIE_NAME } from "@/app/lib/auth";

export async function POST() {
  try {
    await logout();

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur interne de déconnexion." },
      { status: 500 }
    );
  }
}