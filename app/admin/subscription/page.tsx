import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { requireAdmin } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionPage() {
  const user = await requireAdmin();

  if (!user) {
    redirect("/login?next=/admin/subscription");
  }

  return (
    <AppShell
      activeSection="dashboard"
      pageTitle="Abonnement"
      pageSubtitle="Préparation de la gestion des offres, paiements et facturation."
    >
      <div className="max-w-5xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Offres prévues
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">LIMITED</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Accès d’essai, limité à certaines fonctionnalités, durée max 7 jours.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">FULL mensuel</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Abonnement complet avec renouvellement mensuel.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">FULL annuel</div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Abonnement complet avec renouvellement annuel.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Paiement et conformité
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>- Intégration Stripe Checkout.</li>
            <li>- Webhooks pour activer ou suspendre les accès.</li>
            <li>- Dates de début et fin d’abonnement.</li>
            <li>- Préparation facture et suivi comptable.</li>
            <li>- Gestion future de la carte bancaire côté portail client.</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}