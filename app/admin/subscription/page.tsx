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
    pageTitle: "Abonnements & facturation",
    pageSubtitle:
      "Vision administrateur des offres Projelys, des cycles, des flux Stripe et des points de contrôle.",
    plannedOffers: "Catalogue d'offres",
    operatingModel: "Modèle d'exploitation",
    complianceTitle: "Paiement et conformité",
    adminChecklist: "Checklist administrateur",
    kpiTitle: "Indicateurs de pilotage",
    roadmapTitle: "Évolutions prévues",

    limitedTitle: "LIMITED",
    limitedPrice: "Essai / accès limité",
    limitedText:
      "Accès d’essai ou limité, réservé à un périmètre réduit et à une montée progressive.",

    essentialTitle: "ESSENTIAL",
    essentialPrice: "19,90 € / mois",
    essentialText:
      "Offre d’entrée de gamme pour structurer l’essentiel du pilotage projet avec un cadre simple.",

    fullMonthlyTitle: "FULL mensuel",
    fullMonthlyPrice: "49,90 € / mois",
    fullMonthlyText:
      "Abonnement complet avec renouvellement mensuel et souplesse d’engagement.",

    fullYearlyTitle: "FULL annuel",
    fullYearlyPrice: "490 € / an",
    fullYearlyText:
      "Abonnement complet avec renouvellement annuel, plus favorable sur la durée.",

    enterpriseTitle: "ENTREPRISE",
    enterprisePrice: "Sur devis",
    enterpriseText:
      "Offre sur mesure avec cadrage, accompagnement et déploiement adaptés.",

    operatingItems: [
      "Création manuelle d’un utilisateur avec rôle, offre et dates de contrat.",
      "Visualisation de l’offre active dans l’administration utilisateurs.",
      "Possibilité de modifier l’offre, les dates de début et les dates de fin.",
      "Activation / désactivation de compte côté administrateur.",
      "Alignement entre rôle fonctionnel et niveau d’abonnement.",
      "Préparation d’un pilotage plus complet des contrats et renouvellements.",
    ],

    complianceItems: [
      "Intégration Stripe Checkout.",
      "Webhooks pour activer, mettre à jour ou suspendre les accès.",
      "Dates de début et de fin d’abonnement.",
      "Suivi de cycle mensuel, annuel ou essai.",
      "Préparation facture et suivi comptable.",
      "Gestion future de la carte bancaire côté portail client.",
    ],

    checklistItems: [
      "Vérifier que les Price IDs Stripe sont bien renseignés en local et sur Vercel.",
      "Contrôler que les webhooks mettent à jour l’offre et le statut attendus.",
      "Surveiller les comptes inactifs ou les abonnements expirés.",
      "Vérifier les dates de contrat lors des créations et modifications manuelles.",
      "Conserver la cohérence entre rôle, offre et accès produit effectif.",
    ],

    roadmapItems: [
      "Portail client pour changement d’offre en autonomie.",
      "Historique des changements d’abonnement par utilisateur.",
      "Relances avant échéance et alertes de renouvellement.",
      "Exports administratifs pour suivi financier et comptable.",
      "Vue consolidée contrats / revenus / churn / conversions.",
    ],

    kpis: [
      { label: "Offres actives à suivre", value: "5", hint: "Limited, Essential, Full mensuel, Full annuel, Entreprise" },
      { label: "Modes de cycle", value: "3", hint: "Essai, mensuel, annuel" },
      { label: "Flux Stripe critiques", value: "3", hint: "Checkout, webhook, résiliation" },
      { label: "Contrôles admin", value: "5", hint: "Création, modification, activation, offre, dates" },
    ],
  },

  en: {
    pageTitle: "Subscriptions & billing",
    pageSubtitle:
      "Administrator view of Projelys offers, billing cycles, Stripe flows and control points.",
    plannedOffers: "Offer catalog",
    operatingModel: "Operating model",
    complianceTitle: "Payment and compliance",
    adminChecklist: "Administrator checklist",
    kpiTitle: "Operational indicators",
    roadmapTitle: "Planned evolutions",

    limitedTitle: "LIMITED",
    limitedPrice: "Trial / limited access",
    limitedText:
      "Trial or limited access reserved for reduced scope and progressive onboarding.",

    essentialTitle: "ESSENTIAL",
    essentialPrice: "€19.90 / month",
    essentialText:
      "Entry-level offer to structure essential project control with a simple framework.",

    fullMonthlyTitle: "FULL monthly",
    fullMonthlyPrice: "€49.90 / month",
    fullMonthlyText:
      "Full subscription with monthly renewal and flexible commitment.",

    fullYearlyTitle: "FULL yearly",
    fullYearlyPrice: "€490 / year",
    fullYearlyText:
      "Full subscription with annual renewal, more cost-effective over time.",

    enterpriseTitle: "ENTERPRISE",
    enterprisePrice: "Custom quote",
    enterpriseText:
      "Custom offer with scoping, support and adapted deployment.",

    operatingItems: [
      "Manual user creation with role, offer and contract dates.",
      "Display of active offer inside user administration.",
      "Ability to edit offer, start date and end date.",
      "Account activation / deactivation from admin side.",
      "Alignment between functional role and subscription level.",
      "Preparation for more advanced contract and renewal monitoring.",
    ],

    complianceItems: [
      "Stripe Checkout integration.",
      "Webhooks to activate, update or suspend access.",
      "Subscription start and end dates.",
      "Monthly, yearly or trial cycle tracking.",
      "Invoice preparation and accounting follow-up.",
      "Future payment card management from the customer portal.",
    ],

    checklistItems: [
      "Check that Stripe Price IDs are configured locally and on Vercel.",
      "Ensure webhooks update the expected offer and status.",
      "Monitor inactive accounts and expired subscriptions.",
      "Verify contract dates during manual creation and updates.",
      "Keep consistency between role, offer and effective product access.",
    ],

    roadmapItems: [
      "Customer portal for autonomous plan changes.",
      "Subscription change history per user.",
      "Alerts before expiry and renewal reminders.",
      "Administrative exports for finance and accounting follow-up.",
      "Consolidated contracts / revenue / churn / conversion dashboard.",
    ],

    kpis: [
      { label: "Offers to manage", value: "5", hint: "Limited, Essential, Full monthly, Full yearly, Enterprise" },
      { label: "Cycle types", value: "3", hint: "Trial, monthly, yearly" },
      { label: "Critical Stripe flows", value: "3", hint: "Checkout, webhook, cancellation" },
      { label: "Admin controls", value: "5", hint: "Creation, edition, activation, offer, dates" },
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
      <div className="max-w-7xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.kpiTitle}
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {t.kpis.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60"
              >
                <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                  {item.label}
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {item.value}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                  {item.hint}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.plannedOffers}
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.limitedTitle}
              </div>
              <div className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                {t.limitedPrice}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {t.limitedText}
              </p>
            </div>

            <div className="rounded-xl border border-yellow-300 bg-yellow-50/80 p-4 dark:border-yellow-900/60 dark:bg-yellow-950/20">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.essentialTitle}
              </div>
              <div className="mt-1 text-xs font-medium text-yellow-700 dark:text-yellow-300">
                {t.essentialPrice}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {t.essentialText}
              </p>
            </div>

            <div className="rounded-xl border border-sky-300 bg-sky-50/80 p-4 dark:border-sky-900/60 dark:bg-sky-950/20">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.fullMonthlyTitle}
              </div>
              <div className="mt-1 text-xs font-medium text-sky-700 dark:text-sky-300">
                {t.fullMonthlyPrice}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {t.fullMonthlyText}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.fullYearlyTitle}
              </div>
              <div className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {t.fullYearlyPrice}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {t.fullYearlyText}
              </p>
            </div>

            <div className="rounded-xl border border-violet-300 bg-violet-50/80 p-4 dark:border-violet-900/60 dark:bg-violet-950/20">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.enterpriseTitle}
              </div>
              <div className="mt-1 text-xs font-medium text-violet-700 dark:text-violet-300">
                {t.enterprisePrice}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                {t.enterpriseText}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {t.operatingModel}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {t.operatingItems.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {t.complianceTitle}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {t.complianceItems.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {t.adminChecklist}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {t.checklistItems.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {t.roadmapTitle}
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {t.roadmapItems.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}