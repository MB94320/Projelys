import { NextRequest, NextResponse } from "next/server";
import { getStripe, getStripePlanConfig } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json();
    const plan = String(body?.plan || "");
    const lang = body?.lang === "en" ? "en" : "fr";

    if (!plan) {
      return NextResponse.json({ error: "Plan requis." }, { status: 400 });
    }

    const planConfig = getStripePlanConfig(plan);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "Utilisateur introuvable." },
        { status: 404 },
      );
    }

    const latestSubscription = await prisma.subscription.findFirst({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    let stripeCustomerId = latestSubscription?.stripeCustomerId || null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: dbUser.email,
        name: dbUser.name || undefined,
        metadata: {
          userId: String(dbUser.id),
        },
      });

      stripeCustomerId = customer.id;
    }

    const successUrl = `${appUrl}/subscription?success=1&lang=${lang}`;
    const cancelUrl = `${appUrl}/subscription?cancel=1&lang=${lang}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        userId: String(dbUser.id),
        selectedPlan: planConfig.label,
        internalPlan: planConfig.internalPlan,
        billingCycle: planConfig.billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: String(dbUser.id),
          selectedPlan: planConfig.label,
          internalPlan: planConfig.internalPlan,
          billingCycle: planConfig.billingCycle,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("POST /api/stripe/checkout error", error);

    return NextResponse.json(
      {
        error:
          error?.message || "Erreur lors de la création du checkout Stripe.",
      },
      { status: 500 },
    );
  }
}