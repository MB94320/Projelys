import { NextResponse } from "next/server";
import { getStripe } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const stripe = getStripe();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ["ACTIVE", "PENDING"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!subscription?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Aucun abonnement actif Stripe trouvé." },
        { status: 404 },
      );
    }

    const updated = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    const currentPeriodEndUnix = (updated as any).current_period_end as
      | number
      | undefined;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: currentPeriodEndUnix
          ? new Date(currentPeriodEndUnix * 1000)
          : subscription.currentPeriodEnd,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement programmé pour résiliation à échéance.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la résiliation." },
      { status: 500 },
    );
  }
}