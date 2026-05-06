import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();

    return NextResponse.json(
      {
        authenticated: Boolean(user),
        user: user ?? null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/session error", error);

    return NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}