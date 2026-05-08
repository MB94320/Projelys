"use client";

import Link from "next/link";
import { useState } from "react";

type BillingPlan = "MONTHLY" | "YEARLY";

type SubscriptionPlansProps = {
  monthlyPriceId?: string;
  yearlyPriceId?: string;
  hasActiveSubscription: boolean;
  cancelAtPeriodEnd: boolean;
};

export default function SubscriptionPlans({
  monthlyPriceId,
  yearlyPriceId,
  hasActiveSubscription,
  cancelAtPeriodEnd,
}: SubscriptionPlansProps) {
  const [loadingPlan, setLoadingPlan] = useState<BillingPlan | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCheckout(plan: BillingPlan) {
    try {
      setMessage(null);
      setLoadingPlan(plan);

      const priceId = plan === "MONTHLY" ? monthlyPriceId : yearlyPriceId;

      if (!priceId) {
        throw new Error(
          plan === "MONTHLY"
            ? "Le priceId mensuel est manquant dans les variables d’environnement."
            : "Le priceId annuel est manquant dans les variables d’environnement.",
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Impossible de créer la session Stripe.");
      }

      if (!data?.url) {
        throw new Error("Aucune URL Stripe reçue.");
      }

      window.location.href = data.url;
    } catch (error: any) {
      setMessage(error?.message || "Erreur lors de la redirection vers Stripe.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleCancel() {
    try {
      setMessage(null);
      setLoadingPlan("MONTHLY");

      const response = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de la résiliation.");
      }

      setMessage("Abonnement programmé pour résiliation à échéance.");
      window.location.reload();
    } catch (error: any) {
      setMessage(error?.message || "Erreur lors de la résiliation.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
          {message}
        </div>
      ) : null}

      {/* Bloc d’actions abonnement */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Actions abonnement
        </h2>

        <div className="mt-4 space-y-3">
          {!hasActiveSubscription && (
            <p className="text-sm text-slate-500 dark:text-slate-200">
              Choisissez une formule ci-dessous pour accéder à Projelys Full.
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
                {loadingPlan ? "Traitement..." : "Se désabonner"}
              </button>
            </div>
          )}

          {hasActiveSubscription && cancelAtPeriodEnd && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-700 dark:text-amber-200">
              Votre abonnement est résilié à échéance. L’accès reste actif
              jusqu’à la fin de la période en cours.
            </div>
          )}
        </div>
      </section>

      {/* Choix des formules */}
      {!hasActiveSubscription && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Choisir une formule
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* Essential mensuel – jaune */}
            <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 ring-1 ring-amber-300/40 dark:border-amber-900/60 dark:bg-amber-950/20 dark:ring-amber-800/40">
              <div className="mb-3 inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                Offre standard
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Essential mensuel
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                    Entrée de gamme pour structurer l’essentiel du pilotage avec
                    un périmètre limité.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    19,90 €
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-200">
                    / mois
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-100">
                <li>- Portefeuille & projets limités à 5 projets.</li>
                <li>- Plan de charge et ressources.</li>
                <li>- Plan d’actions.</li>
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout("MONTHLY")}
                disabled={loadingPlan !== null}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-amber-400/70 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-400 disabled:opacity-60 dark:border-amber-400/70 dark:bg-amber-500 dark:hover:bg-amber-400"
              >
                {loadingPlan === "MONTHLY"
                  ? "Redirection..."
                  : "Choisir Essential mensuel"}
              </button>
            </div>

            {/* Pro mensuel – sky */}
            <div className="rounded-2xl border border-sky-300 bg-sky-50/80 p-5 ring-1 ring-sky-300/40 dark:border-sky-900/60 dark:bg-sky-950/20 dark:ring-sky-800/40">
              <div className="mb-3 inline-flex rounded-full bg-sky-500/15 px-3 py-1 text-xs font-medium text-sky-800 dark:text-sky-200">
                Offre premium
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Pro mensuel
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                    Couverture complète Projelys, facturation mensuelle.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    49,90 €
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-200">
                    / mois
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-100">
                <li>- Portefeuille & projets complets.</li>
                <li>- Charge, ressources, arbitrages.</li>
                <li>- Finance, risques, qualité & actions.</li>
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout("MONTHLY")}
                disabled={loadingPlan !== null}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-sky-400/70 bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60 dark:border-sky-400/70 dark:bg-sky-500 dark:hover:bg-sky-400"
              >
                {loadingPlan === "MONTHLY"
                  ? "Redirection..."
                  : "Choisir Pro mensuel"}
              </button>
            </div>

            {/* Pro annuel – emerald */}
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 ring-1 ring-emerald-300/40 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:ring-emerald-800/40">
              <div className="mb-3 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                Pro annuel
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Pro annuel
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                    Même couverture complète avec engagement annuel pour un
                    usage durable.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    490 €
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-200">
                    / an
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-100">
                <li>- Couverture complète Projelys.</li>
                <li>- Vision long terme & usage continu.</li>
                <li>- Plus avantageux que le mensuel.</li>
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout("YEARLY")}
                disabled={loadingPlan !== null}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-emerald-400/70 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 dark:border-emerald-400/70 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {loadingPlan === "YEARLY"
                  ? "Redirection..."
                  : "Choisir Pro annuel"}
              </button>
            </div>

            {/* Entreprise – violet */}
            <div className="rounded-2xl border border-violet-300 bg-violet-50/80 p-5 ring-1 ring-violet-300/40 dark:border-violet-900/60 dark:bg-violet-950/20 dark:ring-violet-800/40">
              <div className="mb-3 inline-flex rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-800 dark:text-violet-200">
                Offre entreprise
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Entreprise
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                    Pour TPE, PME, ETI et ESN à partir de 3 collaborateurs avec
                    cadrage adapté.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    Sur devis
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-200">
                    Offre personnalisée
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-100">
                <li>- À partir de 3 collaborateurs.</li>
                <li>- Déploiement & paramétrage adaptés.</li>
                <li>- Accompagnement et cadrage sur devis.</li>
              </ul>

              <Link
                href="/site/contact?lang=fr"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-violet-400/70 bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 dark:border-violet-400/70 dark:bg-violet-600 dark:hover:bg-violet-500"
              >
                Demander un devis
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}