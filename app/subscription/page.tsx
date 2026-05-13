import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { getCurrentUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import SubscriptionPlans from "./SubscriptionPlans";

export const dynamic = "force-dynamic";

type SubscriptionPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

const pageCopy = {
  fr: {
    pageTitle: "Abonnement",
    pageSubtitle: "Choisissez votre formule et gérez votre accès Projelys.",
    noPlan: "Aucune offre active",
    essentialMonthly: "Essential mensuel",
    proMonthly: "Pro mensuel",
    proYearly: "Pro annuel",
    enterprise: "Entreprise",
  },
  en: {
    pageTitle: "Subscription",
    pageSubtitle: "Choose your plan and manage your Projelys access.",
    noPlan: "No active plan",
    essentialMonthly: "Essential monthly",
    proMonthly: "Pro monthly",
    proYearly: "Pro yearly",
    enterprise: "Enterprise",
  },
};

export default async function SubscriptionPage({
  searchParams,
}: SubscriptionPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const lang = params?.lang === "en" ? "en" : "fr";
  const t = pageCopy[lang];

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=/subscription&lang=${lang}`);
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

  const subscriptionStatus = latestSubscription?.status
    ? String(latestSubscription.status)
    : null;
  const billingCycle = latestSubscription?.billingCycle
    ? String(latestSubscription.billingCycle)
    : null;
  const currentPlan = latestSubscription?.plan
    ? String(latestSubscription.plan)
    : null;

  const hasActiveSubscription =
    subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING";

  const cancelAtPeriodEnd = latestSubscription?.cancelAtPeriodEnd ?? false;

  const dateLocale = lang === "en" ? "en-GB" : "fr-FR";

  const currentPeriodEndLabel = latestSubscription?.currentPeriodEnd
    ? new Intl.DateTimeFormat(dateLocale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(latestSubscription.currentPeriodEnd))
    : null;

  const currentPlanName =
    currentPlan === "ESSENTIAL"
      ? t.essentialMonthly
      : currentPlan === "FULL" && billingCycle === "YEARLY"
      ? t.proYearly
      : currentPlan === "FULL"
      ? t.proMonthly
      : currentPlan === "ENTERPRISE"
      ? t.enterprise
      : t.noPlan;

  const currentPlanPriceLabel =
    currentPlan === "ESSENTIAL"
      ? `19,90 € ${lang === "en" ? "/ month" : "/ mois"}`
      : currentPlan === "FULL" && billingCycle === "YEARLY"
      ? `490 € ${lang === "en" ? "/ year" : "/ an"}`
      : currentPlan === "FULL"
      ? `49,90 € ${lang === "en" ? "/ month" : "/ mois"}`
      : currentPlan === "ENTERPRISE"
      ? lang === "en"
        ? "Custom quote"
        : "Sur devis"
      : null;

  const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_MONTHLY;
  const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_YEARLY;
  const essentialMonthlyPriceId =
    process.env.NEXT_PUBLIC_STRIPE_PRICE_ESSENTIAL_MONTHLY;

  return (
    <AppShell
      activeSection="subscription"
      pageTitle={t.pageTitle}
      pageSubtitle={t.pageSubtitle}
    >
      <div className="max-w-7xl space-y-6">
        <SubscriptionPlans
          monthlyPriceId={monthlyPriceId}
          yearlyPriceId={yearlyPriceId}
          essentialMonthlyPriceId={essentialMonthlyPriceId}
          hasActiveSubscription={hasActiveSubscription}
          cancelAtPeriodEnd={cancelAtPeriodEnd}
          currentPlanName={currentPlanName}
          currentPlanPriceLabel={currentPlanPriceLabel}
          currentPeriodEndLabel={currentPeriodEndLabel}
        />
      </div>
    </AppShell>
  );
}