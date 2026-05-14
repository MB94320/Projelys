import { redirect } from "next/navigation";
import AppShell from "@/app/components/AppShell";
import { requireAdmin } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

type AdminSubscriptionPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

type OfferKey =
  | "LIMITED"
  | "ESSENTIAL"
  | "FULL_MONTHLY"
  | "FULL_YEARLY"
  | "ENTERPRISE"
  | "NONE";

function normalizeOffer(plan: string | null | undefined, billingCycle: string | null | undefined): OfferKey {
  if (plan === "ESSENTIAL") return "ESSENTIAL";
  if (plan === "ENTERPRISE") return "ENTERPRISE";
  if (plan === "FULL" && billingCycle === "YEARLY") return "FULL_YEARLY";
  if (plan === "FULL") return "FULL_MONTHLY";
  if (plan === "LIMITED") return "LIMITED";
  return "NONE";
}

const copy = {
  fr: {
    pageTitle: "Abonnements & facturation",
    pageSubtitle:
      "Vision administrateur des offres Projelys, des cycles, des revenus contractuels et du pilotage client.",
    overview: "Vue d’ensemble",
    distribution: "Répartition des offres",
    statusTitle: "Statuts d’abonnement",
    recentContracts: "Contrats récents",
    contractWatch: "Surveillance des échéances",
    operatingChecks: "Contrôles d’exploitation",

    totalUsers: "Utilisateurs",
    subscribedUsers: "Avec abonnement",
    activeContracts: "Contrats actifs",
    mrr: "MRR estimé",
    arr: "ARR estimé",
    expiringSoon: "Échéances proches",

    limitedTitle: "LIMITED",
    limitedPrice: "0 € / essai",
    limitedText:
      "Accès restreint, généralement utilisé pour l’essai, l’onboarding ou un périmètre minimum.",
    essentialTitle: "ESSENTIAL",
    essentialPrice: "19,90 € / mois",
    essentialText:
      "Offre d’entrée de gamme structurante pour le pilotage essentiel.",
    fullMonthlyTitle: "FULL mensuel",
    fullMonthlyPrice: "49,90 € / mois",
    fullMonthlyText:
      "Offre complète avec engagement mensuel et flexibilité de renouvellement.",
    fullYearlyTitle: "FULL annuel",
    fullYearlyPrice: "490 € / an",
    fullYearlyText:
      "Offre complète annuelle, plus avantageuse pour les usages installés.",
    enterpriseTitle: "ENTREPRISE",
    enterprisePrice: "Sur devis",
    enterpriseText:
      "Offre personnalisée avec cadrage, accompagnement et déploiement adapté.",

    cards: {
      totalUsers: "Utilisateurs administrés",
      subscribedUsers: "Comptes avec contrat",
      activeContracts: "Abonnements actifs",
      mrr: "Revenu mensuel récurrent",
      arr: "Projection annuelle",
      expiringSoon: "Fin de contrat sous 30 jours",
    },

    offerLabels: {
      LIMITED: "Limited",
      ESSENTIAL: "Essential",
      FULL_MONTHLY: "Full mensuel",
      FULL_YEARLY: "Full annuel",
      ENTERPRISE: "Entreprise",
      NONE: "Sans offre",
    },

    statusLabels: {
      ACTIVE: "Actif",
      TRIALING: "Essai",
      PENDING: "En attente",
      CANCELED: "Résilié",
      EXPIRED: "Expiré",
      NONE: "—",
    },

    recentHeaders: {
      user: "Utilisateur",
      offer: "Offre",
      status: "Statut",
      start: "Début",
      end: "Fin",
    },

    checks: [
      "Vérifier les Price IDs Stripe et les variables d’environnement Vercel.",
      "Contrôler les webhooks Stripe pour garantir la bonne mise à jour des contrats.",
      "Surveiller les contrats proches de l’échéance et les comptes expirés.",
      "Comparer les rôles attribués avec les offres réellement actives.",
      "Préparer les exports comptables et la traçabilité des changements d’offre.",
    ],

    noContracts: "Aucun contrat récent à afficher.",
  },

  en: {
    pageTitle: "Subscriptions & billing",
    pageSubtitle:
      "Administrator view of Projelys offers, cycles, contractual revenue and customer subscription monitoring.",
    overview: "Overview",
    distribution: "Offer distribution",
    statusTitle: "Subscription statuses",
    recentContracts: "Recent contracts",
    contractWatch: "Expiry watch",
    operatingChecks: "Operating checks",

    totalUsers: "Users",
    subscribedUsers: "Subscribed",
    activeContracts: "Active contracts",
    mrr: "Estimated MRR",
    arr: "Estimated ARR",
    expiringSoon: "Expiring soon",

    limitedTitle: "LIMITED",
    limitedPrice: "€0 / trial",
    limitedText:
      "Restricted access, usually used for trial, onboarding or a minimum scope.",
    essentialTitle: "ESSENTIAL",
    essentialPrice: "€19.90 / month",
    essentialText:
      "Entry-level structured offer for essential project control.",
    fullMonthlyTitle: "FULL monthly",
    fullMonthlyPrice: "€49.90 / month",
    fullMonthlyText:
      "Full offer with monthly commitment and renewal flexibility.",
    fullYearlyTitle: "FULL yearly",
    fullYearlyPrice: "€490 / year",
    fullYearlyText:
      "Full annual offer, more cost-effective for established usage.",
    enterpriseTitle: "ENTERPRISE",
    enterprisePrice: "Custom quote",
    enterpriseText:
      "Custom offer with scoping, support and adapted deployment.",

    cards: {
      totalUsers: "Managed users",
      subscribedUsers: "Accounts with contracts",
      activeContracts: "Active subscriptions",
      mrr: "Monthly recurring revenue",
      arr: "Annual projection",
      expiringSoon: "Ending within 30 days",
    },

    offerLabels: {
      LIMITED: "Limited",
      ESSENTIAL: "Essential",
      FULL_MONTHLY: "Full monthly",
      FULL_YEARLY: "Full yearly",
      ENTERPRISE: "Enterprise",
      NONE: "No offer",
    },

    statusLabels: {
      ACTIVE: "Active",
      TRIALING: "Trialing",
      PENDING: "Pending",
      CANCELED: "Canceled",
      EXPIRED: "Expired",
      NONE: "—",
    },

    recentHeaders: {
      user: "User",
      offer: "Offer",
      status: "Status",
      start: "Start",
      end: "End",
    },

    checks: [
      "Check Stripe Price IDs and Vercel environment variables.",
      "Validate Stripe webhooks to ensure correct contract updates.",
      "Monitor contracts close to expiry and expired accounts.",
      "Compare assigned roles with actually active offers.",
      "Prepare accounting exports and traceability of plan changes.",
    ],

    noContracts: "No recent contracts to display.",
  },
};

function formatDate(value: Date | null, lang: "fr" | "en") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

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

  const usersCount = await prisma.user.count();

  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  const enriched = subscriptions.map((sub) => {
    const offer = normalizeOffer(String(sub.plan), String(sub.billingCycle));
    return {
      ...sub,
      offer,
    };
  });

  const subscribedUsers = new Set(enriched.map((s) => s.userId)).size;
  const activeContracts = enriched.filter((s) => String(s.status) === "ACTIVE").length;

  const offerCounts = {
    LIMITED: enriched.filter((s) => s.offer === "LIMITED").length,
    ESSENTIAL: enriched.filter((s) => s.offer === "ESSENTIAL").length,
    FULL_MONTHLY: enriched.filter((s) => s.offer === "FULL_MONTHLY").length,
    FULL_YEARLY: enriched.filter((s) => s.offer === "FULL_YEARLY").length,
    ENTERPRISE: enriched.filter((s) => s.offer === "ENTERPRISE").length,
    NONE: enriched.filter((s) => s.offer === "NONE").length,
  };

  const statusCounts = {
    ACTIVE: enriched.filter((s) => String(s.status) === "ACTIVE").length,
    TRIALING: enriched.filter((s) => String(s.status) === "TRIALING").length,
    PENDING: enriched.filter((s) => String(s.status) === "PENDING").length,
    CANCELED: enriched.filter((s) => String(s.status) === "CANCELED").length,
    EXPIRED: enriched.filter((s) => String(s.status) === "EXPIRED").length,
  };

  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(now.getDate() + 30);

  const expiringSoon = enriched.filter(
    (s) =>
      s.currentPeriodEnd &&
      s.currentPeriodEnd >= now &&
      s.currentPeriodEnd <= in30Days
  ).length;

  const estimatedMrr =
    offerCounts.ESSENTIAL * 19.9 +
    offerCounts.FULL_MONTHLY * 49.9 +
    offerCounts.FULL_YEARLY * (490 / 12);

  const estimatedArr =
    offerCounts.ESSENTIAL * (19.9 * 12) +
    offerCounts.FULL_MONTHLY * (49.9 * 12) +
    offerCounts.FULL_YEARLY * 490;

  const recentContracts = enriched.slice(0, 10);

  const maxOfferCount = Math.max(
    offerCounts.LIMITED,
    offerCounts.ESSENTIAL,
    offerCounts.FULL_MONTHLY,
    offerCounts.FULL_YEARLY,
    offerCounts.ENTERPRISE,
    1
  );

  const maxStatusCount = Math.max(
    statusCounts.ACTIVE,
    statusCounts.TRIALING,
    statusCounts.PENDING,
    statusCounts.CANCELED,
    statusCounts.EXPIRED,
    1
  );

  const totalTrackedOffers =
    offerCounts.LIMITED +
    offerCounts.ESSENTIAL +
    offerCounts.FULL_MONTHLY +
    offerCounts.FULL_YEARLY +
    offerCounts.ENTERPRISE;

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
            {t.overview}
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                {t.cards.totalUsers}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {usersCount}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                {t.cards.subscribedUsers}
              </div>
              <div className="mt-2 text-2xl font-semibold text-sky-600 dark:text-sky-300">
                {subscribedUsers}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                {t.cards.activeContracts}
              </div>
              <div className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
                {activeContracts}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                {t.cards.mrr}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {estimatedMrr.toFixed(2)} €
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                {t.cards.arr}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {estimatedArr.toFixed(2)} €
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
                {t.cards.expiringSoon}
              </div>
              <div className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-300">
                {expiringSoon}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Catalogue d'offres
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
              {t.distribution}
            </h2>

            <div className="mt-4 space-y-3">
              {[
                { label: t.offerLabels.LIMITED, value: offerCounts.LIMITED, color: "bg-amber-500" },
                { label: t.offerLabels.ESSENTIAL, value: offerCounts.ESSENTIAL, color: "bg-yellow-500" },
                { label: t.offerLabels.FULL_MONTHLY, value: offerCounts.FULL_MONTHLY, color: "bg-sky-500" },
                { label: t.offerLabels.FULL_YEARLY, value: offerCounts.FULL_YEARLY, color: "bg-emerald-500" },
                { label: t.offerLabels.ENTERPRISE, value: offerCounts.ENTERPRISE, color: "bg-violet-500" },
              ].map((item) => {
                const width = totalTrackedOffers
                  ? Math.max(Math.round((item.value / maxOfferCount) * 100), item.value > 0 ? 8 : 0)
                  : 0;

                const donutPercent = totalTrackedOffers
                  ? Math.round((item.value / totalTrackedOffers) * 100)
                  : 0;

                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 dark:bg-slate-700/60"
                  >
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900 dark:text-slate-50">
                        {item.label}
                      </span>
                      <span className="text-slate-500 dark:text-slate-300">
                        {item.value}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0">
                        <div className="absolute inset-0 rounded-full border-[7px] border-slate-200 dark:border-slate-600" />
                        <div
                          className={`absolute inset-0 rounded-full ${item.color}`}
                          style={{
                            clipPath: `polygon(50% 50%, 50% 0%, ${
                              donutPercent <= 25
                                ? `${50 + donutPercent * 2}% 0%`
                                : donutPercent <= 50
                                ? "100% 0%, 100% 50%"
                                : donutPercent <= 75
                                ? "100% 0%, 100% 100%, 50% 100%"
                                : "100% 0%, 100% 100%, 0% 100%, 0% 0%"
                            })`,
                          }}
                        />
                        <div className="absolute inset-[9px] flex items-center justify-center rounded-full bg-white text-[10px] font-semibold text-slate-700 dark:bg-slate-900 dark:text-white">
                          {donutPercent}%
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                          <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              {t.statusTitle}
            </h2>

            <div className="mt-4 space-y-3">
              {[
                { label: t.statusLabels.ACTIVE, value: statusCounts.ACTIVE, color: "#22c55e" },
                { label: t.statusLabels.TRIALING, value: statusCounts.TRIALING, color: "#0ea5e9" },
                { label: t.statusLabels.PENDING, value: statusCounts.PENDING, color: "#eab308" },
                { label: t.statusLabels.CANCELED, value: statusCounts.CANCELED, color: "#f97316" },
                { label: t.statusLabels.EXPIRED, value: statusCounts.EXPIRED, color: "#64748b" },
              ].map((item) => {
                const width = Math.max(
                  Math.round((item.value / maxStatusCount) * 100),
                  item.value > 0 ? 8 : 0
                );

                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-900 dark:text-slate-50">
                        {item.label}
                      </span>
                      <span className="text-slate-500 dark:text-slate-300">
                        {item.value}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${width}%`, background: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700/60">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t.contractWatch}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[var(--surface)] p-3 text-center dark:bg-slate-800">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {t.cards.expiringSoon}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-amber-600 dark:text-amber-300">
                    {expiringSoon}
                  </div>
                </div>
                <div className="rounded-lg bg-[var(--surface)] p-3 text-center dark:bg-slate-800">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {t.statusLabels.PENDING}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-yellow-600 dark:text-yellow-300">
                    {statusCounts.PENDING}
                  </div>
                </div>
                <div className="rounded-lg bg-[var(--surface)] p-3 text-center dark:bg-slate-800">
                  <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {t.statusLabels.EXPIRED}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-700 dark:text-slate-200">
                    {statusCounts.EXPIRED}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.recentContracts}
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  <th className="px-3 py-2 text-left">{t.recentHeaders.user}</th>
                  <th className="px-3 py-2 text-left">{t.recentHeaders.offer}</th>
                  <th className="px-3 py-2 text-left">{t.recentHeaders.status}</th>
                  <th className="px-3 py-2 text-left">{t.recentHeaders.start}</th>
                  <th className="px-3 py-2 text-left">{t.recentHeaders.end}</th>
                </tr>
              </thead>
              <tbody>
                {recentContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="bg-[var(--surface-muted)] text-sm text-slate-700 dark:bg-slate-700/60 dark:text-slate-200"
                  >
                    <td className="rounded-l-xl px-3 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-50">
                        {contract.user.name || contract.user.email}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-300">
                        {contract.user.email}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={[
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          contract.offer === "LIMITED"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : contract.offer === "ESSENTIAL"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300"
                            : contract.offer === "FULL_MONTHLY"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                            : contract.offer === "FULL_YEARLY"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : contract.offer === "ENTERPRISE"
                            ? "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        ].join(" ")}
                      >
                        {t.offerLabels[contract.offer]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {t.statusLabels[String(contract.status) as keyof typeof t.statusLabels] || String(contract.status)}
                    </td>
                    <td className="px-3 py-3">
                      {formatDate(contract.currentPeriodStart, lang)}
                    </td>
                    <td className="rounded-r-xl px-3 py-3">
                      {formatDate(contract.currentPeriodEnd, lang)}
                    </td>
                  </tr>
                ))}

                {recentContracts.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-300"
                    >
                      {t.noContracts}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800/85">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t.operatingChecks}
          </h2>

          <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {t.checks.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}