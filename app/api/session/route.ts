import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      authenticated: !!user,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}