import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { requireAdmin } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

type AdminSubscriptionPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

const copy = {
  fr: {
    pageTitle: "Abonnement",
    pageSubtitle:
      "Préparation de la gestion des offres, paiements et facturation.",
    plannedOffers: "Offres prévues",
    limitedTitle: "LIMITED",
    limitedText:
      "Accès d’essai ou limité, réservé à un périmètre réduit et à une montée progressive.",
    fullMonthlyTitle: "FULL mensuel",
    fullMonthlyText:
      "Abonnement complet avec renouvellement mensuel et souplesse d’engagement.",
    fullYearlyTitle: "FULL annuel",
    fullYearlyText:
      "Abonnement complet avec renouvellement annuel, plus favorable sur la durée.",
    enterpriseTitle: "ENTREPRISE",
    enterpriseText:
      "Offre sur mesure avec cadrage, accompagnement et déploiement adaptés.",
    complianceTitle: "Paiement et conformité",
    items: [
      "Intégration Stripe Checkout.",
      "Webhooks pour activer, mettre à jour ou suspendre les accès.",
      "Dates de début et de fin d’abonnement.",
      "Suivi de cycle mensuel, annuel ou essai.",
      "Préparation facture et suivi comptable.",
      "Gestion future de la carte bancaire côté portail client.",
    ],
  },
  en: {
    pageTitle: "Subscription",
    pageSubtitle:
      "Preparation of offers, payments and billing management.",
    plannedOffers: "Planned offers",
    limitedTitle: "LIMITED",
    limitedText:
      "Trial or limited access, reserved for reduced scope and progressive onboarding.",
    fullMonthlyTitle: "FULL monthly",
    fullMonthlyText:
      "Full subscription with monthly renewal and flexible commitment.",
    fullYearlyTitle: "FULL yearly",
    fullYearlyText:
      "Full subscription with annual renewal, more cost-effective over time.",
    enterpriseTitle: "ENTERPRISE",
    enterpriseText:
      "Custom offer with scoping, support and adapted deployment.",
    complianceTitle: "Payment and compliance",
    items: [
      "Stripe Checkout integration.",
      "Webhooks to activate, update or suspend access.",
      "Subscription start and end dates.",
      "Monthly, yearly or trial cycle tracking.",
      "Invoice preparation and accounting follow-up.",
      "Future payment card management from the customer portal.",
    ],
  },
};

export default async function AdminSubscriptionPage({
  searchParams,
}: AdminSubscriptionPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const lang = params?.lang === "en" ? "en" : "fr";
  const t = copy[lang];

  const user = await requireAdmin();

  if (!user) {
    redirect(`/login?next=/admin/subscription&lang=${lang}`);
  }

  return (
    <AppShell
      lang={lang}
      activeSection="dashboard"
      pageTitle={t.pageTitle}
      pageSubtitle={t.pageSubtitle}
    >
      <div className="max-w-6xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.plannedOffers}
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.limitedTitle}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {t.limitedText}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.fullMonthlyTitle}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {t.fullMonthlyText}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.fullYearlyTitle}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {t.fullYearlyText}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.enterpriseTitle}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                {t.enterpriseText}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.complianceTitle}
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {t.items.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}