import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import SubscriptionPlans from "./SubscriptionPlans";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/subscription");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const latestSubscription = dbUser?.subscriptions?.[0] ?? null;

  const hasActiveSubscription = latestSubscription?.status === "ACTIVE";
  const cancelAtPeriodEnd = latestSubscription?.cancelAtPeriodEnd ?? false;
  const currentPlan = latestSubscription?.plan ?? (user.role === "LIMITED" ? "LIMITED" : "FULL");
  const billingCycle = latestSubscription?.billingCycle ?? null;

  const renewalDate = latestSubscription?.currentPeriodStart
    ? new Intl.DateTimeFormat("fr-FR").format(latestSubscription.currentPeriodStart)
    : "—";

  const endDate = latestSubscription?.currentPeriodEnd
    ? new Intl.DateTimeFormat("fr-FR").format(latestSubscription.currentPeriodEnd)
    : "—";

  const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_MONTHLY;
  const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_YEARLY;

  return (
    <AppShell
      activeSection="subscription"
      pageTitle="Abonnement"
      pageSubtitle="Choisissez votre formule et gérez votre accès Projelys."
    >
      <div className="max-w-5xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Mon abonnement
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-200">
                Offre actuelle
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {currentPlan}
              </div>
            </div>

            <div className="rounded-xl bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-200">
                Cycle
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {billingCycle ?? "—"}
              </div>
            </div>

            <div className="rounded-xl bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-200">
                Début période
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {renewalDate}
              </div>
            </div>

            <div className="rounded-xl bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-200">
                Fin période
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {endDate}
              </div>
            </div>
          </div>
        </section>

        <SubscriptionPlans
          monthlyPriceId={monthlyPriceId}
          yearlyPriceId={yearlyPriceId}
          hasActiveSubscription={hasActiveSubscription}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
        />
      </div>
    </AppShell>
  );
}