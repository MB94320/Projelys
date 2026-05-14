import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin, createPasswordHash } from "@/app/lib/auth";

type SubscriptionPlanView =
  | "LIMITED"
  | "ESSENTIAL"
  | "FULL_MONTHLY"
  | "FULL_YEARLY"
  | "ENTERPRISE"
  | "NONE";

function mapViewPlanToDb(plan: SubscriptionPlanView) {
  switch (plan) {
    case "ESSENTIAL":
      return {
        plan: "ESSENTIAL",
        billingCycle: "MONTHLY",
        role: "LIMITED",
        status: "ACTIVE",
      };
    case "FULL_MONTHLY":
      return {
        plan: "FULL",
        billingCycle: "MONTHLY",
        role: "FULL",
        status: "ACTIVE",
      };
    case "FULL_YEARLY":
      return {
        plan: "FULL",
        billingCycle: "YEARLY",
        role: "FULL",
        status: "ACTIVE",
      };
    case "ENTERPRISE":
      return {
        plan: "ENTERPRISE",
        billingCycle: "YEARLY",
        role: "FULL",
        status: "ACTIVE",
      };
    case "LIMITED":
      return {
        plan: "LIMITED",
        billingCycle: "TRIAL",
        role: "LIMITED",
        status: "ACTIVE",
      };
    default:
      return null;
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const name = String(body?.name ?? "").trim() || null;
    const password = String(body?.password ?? "");
    const role = String(body?.role ?? "FULL").toUpperCase();
    const isActive = body?.isActive !== false;

    const subscriptionPlan = String(
      body?.subscriptionPlan ?? "NONE"
    ) as SubscriptionPlanView;

    const subscriptionPeriodStart = body?.subscriptionPeriodStart
      ? new Date(body.subscriptionPeriodStart)
      : null;

    const subscriptionPeriodEnd = body?.subscriptionPeriodEnd
      ? new Date(body.subscriptionPeriodEnd)
      : null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    if (!["ADMIN", "FULL", "LIMITED"].includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà." },
        { status: 409 }
      );
    }

    const passwordHash = await createPasswordHash(password);
    const mapped = mapViewPlanToDb(subscriptionPlan);

    let effectiveRole = role;
    if (mapped && role !== "ADMIN") {
      effectiveRole = mapped.role;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: effectiveRole as any,
        isActive,
      },
    });

    if (mapped) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: mapped.plan as any,
          billingCycle: mapped.billingCycle as any,
          status: (isActive ? mapped.status : "PENDING") as any,
          currentPeriodStart: subscriptionPeriodStart,
          currentPeriodEnd: subscriptionPeriodEnd,
          cancelAtPeriodEnd: false,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: String(user.role),
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur." },
      { status: 500 }
    );
  }
}