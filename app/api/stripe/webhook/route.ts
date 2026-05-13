import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

function mapStripeStatusToDbStatus(status: string) {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "ACTIVE";
    case "past_due":
      return "PENDING";
    case "unpaid":
      return "PENDING";
    case "incomplete":
      return "PENDING";
    case "incomplete_expired":
      return "CANCELED";
    case "canceled":
      return "CANCELED";
    default:
      return "PENDING";
  }
}

function mapSelectedPlanToInternalPlan(selectedPlan: string | undefined | null) {
  switch (selectedPlan) {
    case "ESSENTIAL_MONTHLY":
      return {
        plan: "LIMITED" as const,
        role: "LIMITED" as const,
        billingCycle: "MONTHLY" as const,
      };
    case "PRO_MONTHLY":
      return {
        plan: "FULL" as const,
        role: "FULL" as const,
        billingCycle: "MONTHLY" as const,
      };
    case "PRO_YEARLY":
      return {
        plan: "FULL" as const,
        role: "FULL" as const,
        billingCycle: "YEARLY" as const,
      };
    default:
      return {
        plan: "FULL" as const,
        role: "FULL" as const,
        billingCycle: "MONTHLY" as const,
      };
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook Stripe non configuré." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Signature invalide: ${err.message}` },
      { status: 400 },
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

        const selectedPlan = session.metadata?.selectedPlan || null;
        const mappedPlan = mapSelectedPlanToInternalPlan(selectedPlan);

        if (stripeSubscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(
            stripeSubscriptionId,
          );

          const currentPeriodStartUnix = (stripeSub as any)
            .current_period_start as number | undefined;
          const currentPeriodEndUnix = (stripeSub as any)
            .current_period_end as number | undefined;

          const existing = await prisma.subscription.findFirst({
            where: {
              stripeSubscriptionId,
            },
          });

          if (!existing) {
            await prisma.subscription.create({
              data: {
                userId,
                plan: mappedPlan.plan,
                billingCycle: mappedPlan.billingCycle,
                status: mapStripeStatusToDbStatus(stripeSub.status),
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
          } else {
            await prisma.subscription.update({
              where: { id: existing.id },
              data: {
                plan: mappedPlan.plan,
                billingCycle: mappedPlan.billingCycle,
                status: mapStripeStatusToDbStatus(stripeSub.status),
                currentPeriodStart: currentPeriodStartUnix
                  ? new Date(currentPeriodStartUnix * 1000)
                  : existing.currentPeriodStart,
                currentPeriodEnd: currentPeriodEndUnix
                  ? new Date(currentPeriodEndUnix * 1000)
                  : existing.currentPeriodEnd,
                cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
                stripeCustomerId,
              },
            });
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              role: mappedPlan.role,
              isActive: true,
            },
          });
        }

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        const selectedPlan =
          sub.metadata?.selectedPlan ||
          sub.items.data[0]?.price?.nickname ||
          null;

        const mappedPlan = mapSelectedPlanToInternalPlan(selectedPlan);

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
            plan: mappedPlan.plan,
            billingCycle: mappedPlan.billingCycle,
            status: mapStripeStatusToDbStatus(sub.status),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodStart: currentPeriodStartUnix
              ? new Date(currentPeriodStartUnix * 1000)
              : null,
            currentPeriodEnd: currentPeriodEndUnix
              ? new Date(currentPeriodEndUnix * 1000)
              : null,
          },
        });

        const existing = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        });

        if (existing) {
          await prisma.user.update({
            where: { id: existing.userId },
            data: {
              role:
                mapStripeStatusToDbStatus(sub.status) === "ACTIVE"
                  ? mappedPlan.role
                  : "LIMITED",
            },
          });
        }

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
              cancelAtPeriodEnd: false,
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
    console.error("Stripe webhook error", error);

    return NextResponse.json(
      { error: error?.message || "Erreur webhook Stripe." },
      { status: 500 },
    );
  }
}