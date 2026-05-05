import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { getCurrentUser } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/subscription");
  }

  const hasActiveSubscription = false;
  const cancelAtPeriodEnd = false;
  const currentPlan = user.role === "LIMITED" ? "LIMITED" : "FULL";
  const renewalDate = "À connecter à Stripe";
  const endDate = "À connecter à Stripe";

  return (
    <AppShell
      activeSection="dashboard"
      pageTitle="Abonnement"
      pageSubtitle="Choisissez votre offre et gérez votre renouvellement."
    >
      <div className="max-w-5xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Mon abonnement
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-200">Offre actuelle</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {currentPlan}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-200">Renouvellement</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {renewalDate}
              </div>
            </div>
            <div className="rounded-xl bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-200">Fin prévue</div>
              <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {endDate}
              </div>
            </div>
          </div>

          <div className="mt-5">
            {!hasActiveSubscription && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 dark:border-emerald-400/30 dark:bg-emerald-500 dark:hover:bg-emerald-400"
              >
                S’abonner
              </button>
            )}

            {hasActiveSubscription && !cancelAtPeriodEnd && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-rose-500/30 bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 dark:border-rose-400/30 dark:bg-rose-500 dark:hover:bg-rose-400"
              >
                Se désabonner
              </button>
            )}

            {hasActiveSubscription && cancelAtPeriodEnd && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-200">
                Votre abonnement est résilié à échéance. L’accès reste actif jusqu’à la fin de la période en cours.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Offres prévues
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">LIMITED</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
                Accès d’essai limité, jusqu’à 7 jours, avec restrictions sur certaines fonctions.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">FULL mensuel</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
                Accès complet avec renouvellement mensuel.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">FULL annuel</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
                Accès complet avec renouvellement annuel.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}