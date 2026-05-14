import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireAdmin } from "@/app/lib/auth";

type SubscriptionPlanView =
  | "LIMITED"
  | "ESSENTIAL"
  | "FULL_MONTHLY"
  | "FULL_YEARLY"
  | "ENTERPRISE"
  | "NONE";

function normalizeSubscriptionPlan(
  plan: unknown,
  billingCycle: unknown
): SubscriptionPlanView {
  const p = String(plan || "");
  const c = String(billingCycle || "");

  if (p === "ESSENTIAL") return "ESSENTIAL";
  if (p === "ENTERPRISE") return "ENTERPRISE";
  if (p === "FULL" && c === "YEARLY") return "FULL_YEARLY";
  if (p === "FULL") return "FULL_MONTHLY";
  if (p === "LIMITED") return "LIMITED";
  return "NONE";
}

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

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            plan: true,
            billingCycle: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    const mappedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: String(u.role),
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      subscriptionPlan: normalizeSubscriptionPlan(
        u.subscriptions[0]?.plan,
        u.subscriptions[0]?.billingCycle
      ),
      subscriptionStatus: u.subscriptions[0]?.status
        ? String(u.subscriptions[0]?.status)
        : null,
      subscriptionPeriodStart: u.subscriptions[0]?.currentPeriodStart
        ? u.subscriptions[0]?.currentPeriodStart.toISOString()
        : null,
      subscriptionPeriodEnd: u.subscriptions[0]?.currentPeriodEnd
        ? u.subscriptions[0]?.currentPeriodEnd.toISOString()
        : null,
    }));

    return NextResponse.json({ users: mappedUsers });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des utilisateurs." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const userId = Number(body?.userId);
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

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: "Identifiant utilisateur invalide." },
        { status: 400 }
      );
    }

    if (!["ADMIN", "FULL", "LIMITED"].includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const latestSubscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const mapped = mapViewPlanToDb(subscriptionPlan);

    let finalRole = role;
    if (mapped && role !== "ADMIN") {
      finalRole = mapped.role;
    }
    if (subscriptionPlan === "NONE" && role !== "ADMIN") {
      finalRole = isActive ? "LIMITED" : role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: finalRole as any,
        isActive,
      },
    });

    if (mapped) {
      if (latestSubscription) {
        await prisma.subscription.update({
          where: { id: latestSubscription.id },
          data: {
            plan: mapped.plan as any,
            billingCycle: mapped.billingCycle as any,
            status: (isActive ? mapped.status : "CANCELED") as any,
            currentPeriodStart: subscriptionPeriodStart,
            currentPeriodEnd: subscriptionPeriodEnd,
            cancelAtPeriodEnd: false,
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            plan: mapped.plan as any,
            billingCycle: mapped.billingCycle as any,
            status: (isActive ? mapped.status : "PENDING") as any,
            currentPeriodStart: subscriptionPeriodStart,
            currentPeriodEnd: subscriptionPeriodEnd,
            cancelAtPeriodEnd: false,
          },
        });
      }
    } else if (subscriptionPlan === "NONE" && latestSubscription) {
      await prisma.subscription.update({
        where: { id: latestSubscription.id },
        data: {
          status: "CANCELED" as any,
          currentPeriodStart: subscriptionPeriodStart,
          currentPeriodEnd:
            subscriptionPeriodEnd ?? latestSubscription.currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: String(updatedUser.role),
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur." },
      { status: 500 }
    );
  }
}