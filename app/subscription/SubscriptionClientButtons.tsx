"use client";

import { useState } from "react";

type Props = {
  hasActiveSubscription: boolean;
  cancelAtPeriodEnd: boolean;
};

export function SubscriptionClientButtons({
  hasActiveSubscription,
  cancelAtPeriodEnd,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // TODO: ajuster le priceId selon ton offre Stripe
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL ?? "";

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error || "Impossible de démarrer le checkout.");
      }

      window.location.href = data.url;
    } catch (err: any) {
      setMessage(err?.message || "Erreur lors de l’abonnement.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch("/api/stripe/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la résiliation.");
      }

      setMessage("Abonnement programmé pour résiliation à échéance.");
      // tu peux aussi déclencher un refresh client si tu utilises next/navigation
    } catch (err: any) {
      setMessage(err?.message || "Erreur lors de la résiliation.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasActiveSubscription) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {loading ? "Redirection vers Stripe..." : "S’abonner"}
        </button>
        {message && (
          <p className="text-xs text-amber-500">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (hasActiveSubscription && !cancelAtPeriodEnd) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
        >
          {loading ? "Traitement..." : "Se désabonner"}
        </button>
        {message && (
          <p className="text-xs text-amber-500">
            {message}
          </p>
        )}
      </div>
    );
  }

  // cas: abonnement déjà marqué cancelAtPeriodEnd
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-200">
      Votre abonnement est résilié à échéance. L’accès reste actif jusqu’à la fin de la période en cours.
    </div>
  );
}