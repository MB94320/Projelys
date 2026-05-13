"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type BillingPlan = "ESSENTIAL_MONTHLY" | "FULL_MONTHLY" | "FULL_YEARLY";
type Lang = "fr" | "en";

type SubscriptionPlansProps = {
  essentialMonthlyPriceId?: string;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
  hasActiveSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  currentPlanName?: string | null;
  currentPlanPriceLabel?: string | null;
  currentPeriodEndLabel?: string | null;
};

const copy = {
  fr: {
    pageTitle: "Abonnement",
    pageSubtitle: "Choisissez votre formule et gérez votre accès Projelys.",
    currentSubscription: "Mon abonnement",
    currentOffer: "Offre actuelle",
    currentBilling: "Facturation",
    currentStatus: "Statut",
    currentRenewal: "Échéance",
    noPlan: "Aucune offre active",
    monthly: "Mensuelle",
    yearly: "Annuelle",
    active: "Active",
    scheduledCancel: "Résiliée à échéance",
    notAvailable: "Non renseigné",

    missingEssential:
      "Le priceId Essential mensuel est manquant dans les variables d’environnement.",
    missingMonthly:
      "Le priceId Pro mensuel est manquant dans les variables d’environnement.",
    missingYearly:
      "Le priceId Pro annuel est manquant dans les variables d’environnement.",
    checkoutError: "Impossible de créer la session Stripe.",
    noStripeUrl: "Aucune URL Stripe reçue.",
    redirectError: "Erreur lors de la redirection vers Stripe.",
    cancelError: "Erreur lors de la résiliation.",
    cancelSuccess: "Abonnement programmé pour résiliation à échéance.",

    actionsTitle: "Actions abonnement",
    chooseIntro: "Choisissez une formule ci-dessous pour accéder à Projelys.",
    unsubscribe: "Se désabonner",
    processing: "Traitement...",
    cancelledInfo:
      "Votre abonnement est résilié à échéance. L’accès reste actif jusqu’à la fin de la période en cours.",

    choosePlan: "Choisir une formule",
    standardOffer: "Offre standard",
    premiumOffer: "Offre premium",
    yearlyOffer: "Pro annuel",
    enterpriseOffer: "Offre entreprise",

    essentialMonthly: "Essential mensuel",
    proMonthly: "Pro mensuel",
    proYearly: "Pro annuel",
    enterprise: "Entreprise",

    monthlySuffix: "/ mois",
    yearlySuffix: "/ an",
    enterpriseSuffix: "Offre personnalisée",

    essentialDesc:
      "Entrée de gamme pour structurer l’essentiel du pilotage avec un périmètre limité.",
    proMonthlyDesc: "Couverture complète Projelys, facturation mensuelle.",
    proYearlyDesc:
      "Même couverture complète avec engagement annuel pour un usage durable.",
    enterpriseDesc:
      "Pour TPE, PME, ETI et ESN à partir de 3 collaborateurs avec cadrage adapté.",

    chooseEssential: "Choisir Essential mensuel",
    chooseProMonthly: "Choisir Pro mensuel",
    chooseProYearly: "Choisir Pro annuel",
    requestQuote: "Demander un devis",
    redirecting: "Redirection...",
    onQuote: "Sur devis",

    essentialFeatures: [
      "Portefeuille & projets limités à 5 projets.",
      "Plan de charge et ressources.",
      "Plan d’actions.",
    ],
    proMonthlyFeatures: [
      "Portefeuille & projets complets.",
      "Charge, ressources, arbitrages.",
      "Finance, risques, qualité & actions.",
    ],
    proYearlyFeatures: [
      "Couverture complète Projelys.",
      "Vision long terme & usage continu.",
      "Plus avantageux que le mensuel.",
    ],
    enterpriseFeatures: [
      "À partir de 3 collaborateurs.",
      "Déploiement & paramétrage adaptés.",
      "Accompagnement et cadrage sur devis.",
    ],
  },

  en: {
    pageTitle: "Subscription",
    pageSubtitle: "Choose your plan and manage your Projelys access.",
    currentSubscription: "My subscription",
    currentOffer: "Current plan",
    currentBilling: "Billing",
    currentStatus: "Status",
    currentRenewal: "Renewal",
    noPlan: "No active plan",
    monthly: "Monthly",
    yearly: "Yearly",
    active: "Active",
    scheduledCancel: "Cancels at period end",
    notAvailable: "Not provided",

    missingEssential:
      "Essential monthly priceId is missing from environment variables.",
    missingMonthly:
      "Pro monthly priceId is missing from environment variables.",
    missingYearly:
      "Pro yearly priceId is missing from environment variables.",
    checkoutError: "Unable to create Stripe session.",
    noStripeUrl: "No Stripe URL received.",
    redirectError: "Error while redirecting to Stripe.",
    cancelError: "Error while cancelling subscription.",
    cancelSuccess: "Subscription scheduled for cancellation at period end.",

    actionsTitle: "Subscription actions",
    chooseIntro: "Choose a plan below to access Projelys.",
    unsubscribe: "Unsubscribe",
    processing: "Processing...",
    cancelledInfo:
      "Your subscription is scheduled for cancellation. Access remains active until the end of the current billing period.",

    choosePlan: "Choose a plan",
    standardOffer: "Standard offer",
    premiumOffer: "Premium offer",
    yearlyOffer: "Yearly Pro",
    enterpriseOffer: "Enterprise offer",

    essentialMonthly: "Essential monthly",
    proMonthly: "Pro monthly",
    proYearly: "Pro yearly",
    enterprise: "Enterprise",

    monthlySuffix: "/ month",
    yearlySuffix: "/ year",
    enterpriseSuffix: "Custom offer",

    essentialDesc:
      "Entry-level plan to structure essential project control with a limited scope.",
    proMonthlyDesc: "Full Projelys coverage with monthly billing.",
    proYearlyDesc:
      "Same full coverage with annual commitment for long-term use.",
    enterpriseDesc:
      "For SMBs, mid-sized firms and service companies from 3 collaborators with adapted setup.",

    chooseEssential: "Choose Essential monthly",
    chooseProMonthly: "Choose Pro monthly",
    chooseProYearly: "Choose Pro yearly",
    requestQuote: "Request a quote",
    redirecting: "Redirecting...",
    onQuote: "Custom quote",

    essentialFeatures: [
      "Portfolio & projects limited to 5 projects.",
      "Capacity planning and resources.",
      "Action plan.",
    ],
    proMonthlyFeatures: [
      "Full portfolio & project coverage.",
      "Capacity, resources and arbitrations.",
      "Finance, risks, quality and actions.",
    ],
    proYearlyFeatures: [
      "Full Projelys coverage.",
      "Long-term visibility and continuous usage.",
      "More cost-effective than monthly.",
    ],
    enterpriseFeatures: [
      "From 3 collaborators.",
      "Adapted deployment and setup.",
      "Support and scoping on quotation.",
    ],
  },
};

export default function SubscriptionPlans({
  essentialMonthlyPriceId,
  monthlyPriceId,
  yearlyPriceId,
  hasActiveSubscription,
  cancelAtPeriodEnd,
  currentPlanName,
  currentPlanPriceLabel,
  currentPeriodEndLabel,
}: SubscriptionPlansProps) {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams.get("lang") === "en" ? "en" : "fr";
  const t = copy[lang];

  const [loadingPlan, setLoadingPlan] = useState<BillingPlan | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const contactHref = useMemo(() => `/site/contact?lang=${lang}`, [lang]);

  async function handleCheckout(plan: BillingPlan) {
    try {
      setMessage(null);
      setLoadingPlan(plan);

      const priceId =
        plan === "ESSENTIAL_MONTHLY"
          ? essentialMonthlyPriceId
          : plan === "FULL_MONTHLY"
          ? monthlyPriceId
          : yearlyPriceId;

      if (!priceId) {
        throw new Error(
          plan === "ESSENTIAL_MONTHLY"
            ? t.missingEssential
            : plan === "FULL_MONTHLY"
            ? t.missingMonthly
            : t.missingYearly
        );
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId,
          plan,
          lang,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || t.checkoutError);
      }

      if (!data?.url) {
        throw new Error(t.noStripeUrl);
      }

      window.location.href = data.url;
    } catch (error: any) {
      setMessage(error?.message || t.redirectError);
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleCancel() {
    try {
      setMessage(null);
      setLoadingPlan("FULL_MONTHLY");

      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || t.cancelError);
      }

      setMessage(t.cancelSuccess);
      window.location.reload();
    } catch (error: any) {
      setMessage(error?.message || t.cancelError);
    } finally {
      setLoadingPlan(null);
    }
  }

  const billingLabel =
    currentPlanPriceLabel?.includes("/ an") || currentPlanPriceLabel?.includes("/ year")
      ? t.yearly
      : currentPlanPriceLabel
      ? t.monthly
      : t.notAvailable;

  const statusLabel = hasActiveSubscription
    ? cancelAtPeriodEnd
      ? t.scheduledCancel
      : t.active
    : t.noPlan;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800 xl:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {t.currentSubscription}
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {t.currentOffer}
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              {currentPlanName || t.noPlan}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {t.currentBilling}
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              {hasActiveSubscription ? billingLabel : t.notAvailable}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {currentPlanPriceLabel || t.notAvailable}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {t.currentStatus}
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              {statusLabel}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              {t.currentRenewal}
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              {currentPeriodEndLabel || t.notAvailable}
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          {message}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800 xl:p-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {t.actionsTitle}
        </h2>

        <div className="mt-4 space-y-3">
          {!hasActiveSubscription && (
            <p className="text-sm text-slate-600 dark:text-slate-200">
              {t.chooseIntro}
            </p>
          )}

          {hasActiveSubscription && !cancelAtPeriodEnd && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loadingPlan !== null}
                className="inline-flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60 dark:border-rose-400/30 dark:bg-rose-500 dark:hover:bg-rose-400"
              >
                {loadingPlan ? t.processing : t.unsubscribe}
              </button>
            </div>
          )}

          {hasActiveSubscription && cancelAtPeriodEnd && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
              {t.cancelledInfo}
            </div>
          )}
        </div>
      </section>

      {!hasActiveSubscription && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800 xl:p-6 2xl:p-7">
          <div className="mb-5 flex flex-col gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white md:text-lg">
              {t.choosePlan}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-200">
              {t.chooseIntro}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-1 xl:grid-cols-2 3xl:grid-cols-4">
            <div className="flex h-full min-h-[460px] flex-col rounded-2xl border border-amber-300 bg-amber-50/80 p-6 ring-1 ring-amber-300/40 dark:border-amber-900/60 dark:bg-amber-950/20 dark:ring-amber-800/40">
              <div className="mb-3 inline-flex w-fit rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                {t.standardOffer}
              </div>

              <div className="border-b border-amber-300/60 pb-4 dark:border-amber-800/50">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t.essentialMonthly}
                    </div>
                  </div>
                  <div className="shrink-0 text-left xl:text-right">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      19,90 €
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-200">
                      {t.monthlySuffix}
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-200">
                {t.essentialDesc}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-100">
                {t.essentialFeatures.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout("ESSENTIAL_MONTHLY")}
                disabled={loadingPlan !== null}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-amber-400/70 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-400 disabled:opacity-60 dark:border-amber-400/70 dark:bg-amber-500 dark:hover:bg-amber-400"
              >
                {loadingPlan === "ESSENTIAL_MONTHLY" ? t.redirecting : t.chooseEssential}
              </button>
            </div>

            <div className="flex h-full min-h-[460px] flex-col rounded-2xl border border-sky-300 bg-sky-50/80 p-6 ring-1 ring-sky-300/40 dark:border-sky-900/60 dark:bg-sky-950/20 dark:ring-sky-800/40">
              <div className="mb-3 inline-flex w-fit rounded-full bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-800 dark:text-sky-200">
                {t.premiumOffer}
              </div>

              <div className="border-b border-sky-300/60 pb-4 dark:border-sky-800/50">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t.proMonthly}
                    </div>
                  </div>
                  <div className="shrink-0 text-left xl:text-right">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      49,90 €
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-200">
                      {t.monthlySuffix}
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-200">
                {t.proMonthlyDesc}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-100">
                {t.proMonthlyFeatures.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout("FULL_MONTHLY")}
                disabled={loadingPlan !== null}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-sky-400/70 bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60 dark:border-sky-400/70 dark:bg-sky-500 dark:hover:bg-sky-400"
              >
                {loadingPlan === "FULL_MONTHLY" ? t.redirecting : t.chooseProMonthly}
              </button>
            </div>

            <div className="flex h-full min-h-[460px] flex-col rounded-2xl border border-emerald-300 bg-emerald-50/80 p-6 ring-1 ring-emerald-300/40 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:ring-emerald-800/40">
              <div className="mb-3 inline-flex w-fit rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                {t.yearlyOffer}
              </div>

              <div className="border-b border-emerald-300/60 pb-4 dark:border-emerald-800/50">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t.proYearly}
                    </div>
                  </div>
                  <div className="shrink-0 text-left xl:text-right">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      490 €
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-200">
                      {t.yearlySuffix}
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-200">
                {t.proYearlyDesc}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-100">
                {t.proYearlyFeatures.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout("FULL_YEARLY")}
                disabled={loadingPlan !== null}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-emerald-400/70 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 dark:border-emerald-400/70 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {loadingPlan === "FULL_YEARLY" ? t.redirecting : t.chooseProYearly}
              </button>
            </div>

            <div className="flex h-full min-h-[460px] flex-col rounded-2xl border border-violet-300 bg-violet-50/80 p-6 ring-1 ring-violet-300/40 dark:border-violet-900/60 dark:bg-violet-950/20 dark:ring-violet-800/40">
              <div className="mb-3 inline-flex w-fit rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-800 dark:text-violet-200">
                {t.enterpriseOffer}
              </div>

              <div className="border-b border-violet-300/60 pb-4 dark:border-violet-800/50">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t.enterprise}
                    </div>
                  </div>
                  <div className="shrink-0 text-left xl:text-right">
                    <div className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t.onQuote}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-200">
                      {t.enterpriseSuffix}
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-200">
                {t.enterpriseDesc}
              </p>

              <ul className="mt-4 flex-1 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-100">
                {t.enterpriseFeatures.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>

              <Link
                href={contactHref}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-violet-400/70 bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 dark:border-violet-400/70 dark:bg-violet-600 dark:hover:bg-violet-500"
              >
                {t.requestQuote}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}