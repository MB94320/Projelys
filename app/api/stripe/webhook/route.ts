import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook Stripe non configuré." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Signature invalide: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = Number(session.metadata?.userId || "0");

        if (!userId) break;

        const stripeSubscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;

        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : null;

        if (stripeSubscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(
            stripeSubscriptionId
          );

          const recurringInterval =
            stripeSub.items.data[0]?.price?.recurring?.interval;

          const billingCycle =
            recurringInterval === "year" ? "YEARLY" : "MONTHLY";

          const currentPeriodStartUnix = (stripeSub as any)
            .current_period_start as number | undefined;
          const currentPeriodEndUnix = (stripeSub as any)
            .current_period_end as number | undefined;

          await prisma.subscription.create({
            data: {
              userId,
              plan: "FULL",
              billingCycle,
              status: "ACTIVE",
              currentPeriodStart: currentPeriodStartUnix
                ? new Date(currentPeriodStartUnix * 1000)
                : null,
              currentPeriodEnd: currentPeriodEndUnix
                ? new Date(currentPeriodEndUnix * 1000)
                : null,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
              stripeCustomerId,
              stripeSubscriptionId,
            },
          });

          await prisma.user.update({
            where: { id: userId },
            data: {
              role: "FULL",
              isActive: true,
            },
          });
        }

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        const currentPeriodStartUnix = (sub as any).current_period_start as
          | number
          | undefined;
        const currentPeriodEndUnix = (sub as any).current_period_end as
          | number
          | undefined;

        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: sub.id,
          },
          data: {
            status: sub.status === "active" ? "ACTIVE" : "PENDING",
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodStart: currentPeriodStartUnix
              ? new Date(currentPeriodStartUnix * 1000)
              : null,
            currentPeriodEnd: currentPeriodEndUnix
              ? new Date(currentPeriodEndUnix * 1000)
              : null,
          },
        });

        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const existing = await prisma.subscription.findFirst({
          where: {
            stripeSubscriptionId: sub.id,
          },
        });

        if (existing) {
          const currentPeriodEndUnix = (sub as any).current_period_end as
            | number
            | undefined;

          await prisma.subscription.update({
            where: { id: existing.id },
            data: {
              status: "CANCELED",
              currentPeriodEnd: currentPeriodEndUnix
                ? new Date(currentPeriodEndUnix * 1000)
                : existing.currentPeriodEnd,
            },
          });

          await prisma.user.update({
            where: { id: existing.userId },
            data: {
              role: "LIMITED",
            },
          });
        }

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erreur webhook Stripe." },
      { status: 500 }
    );
  }
}