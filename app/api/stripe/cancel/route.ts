import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const subscription =
      subscriptions.find(
        (item) => item.status === "ACTIVE" || String(item.status) === "TRIALING"
      ) ?? null;

    if (!subscription) {
      return NextResponse.json(
        { error: "Aucun abonnement actif à résilier." },
        { status: 404 }
      );
    }

    if (!subscription.stripeSubscriptionId) {
      const updated = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      });

      return NextResponse.json({
        ok: true,
        subscription: updated,
      });
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "STRIPE_SECRET_KEY manquante." },
        { status: 500 }
      );
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({
      ok: true,
      subscription: updated,
    });
  } catch (error: any) {
    console.error("POST /api/stripe/cancel error", error);

    return NextResponse.json(
      {
        error:
          error?.message || "Erreur serveur lors de la résiliation Stripe.",
      },
      { status: 500 }
    );
  }
}