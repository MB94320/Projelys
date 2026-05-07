"use client";

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

      const priceId =
        plan === "MONTHLY" ? monthlyPriceId : yearlyPriceId;

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

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Actions abonnement
        </h2>

        <div className="mt-4">
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
              Votre abonnement est résilié à échéance. L’accès reste actif jusqu’à la fin de la période en cours.
            </div>
          )}
        </div>
      </section>

      {!hasActiveSubscription && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Choisir une formule
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-5 dark:bg-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Full mensuel
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
                    Accès complet à Projelys, facturation mensuelle.
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

              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-100">
                <li>- Accès complet projets, qualité, risques, actions.</li>
                <li>- Adapté aux freelances et petites structures.</li>
                <li>- Résiliable à échéance.</li>
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout("MONTHLY")}
                disabled={loadingPlan !== null}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-sky-500/30 bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60 dark:border-sky-400/30 dark:bg-sky-500 dark:hover:bg-sky-400"
              >
                {loadingPlan === "MONTHLY"
                  ? "Redirection..."
                  : "Choisir le mensuel"}
              </button>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-[var(--surface-muted)] p-5 ring-1 ring-emerald-500/20 dark:bg-slate-700">
              <div className="mb-3 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Recommandé
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Full annuel
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
                    Accès complet à Projelys, facturation annuelle.
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

              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-100">
                <li>- Accès complet projets, qualité, risques, actions.</li>
                <li>- Économie par rapport au mensuel.</li>
                <li>- Idéal pour un usage continu sur l’année.</li>
              </ul>

              <button
                type="button"
                onClick={() => handleCheckout("YEARLY")}
                disabled={loadingPlan !== null}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 dark:border-emerald-400/30 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                {loadingPlan === "YEARLY"
                  ? "Redirection..."
                  : "Choisir l’annuel"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}