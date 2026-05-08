import Link from "next/link";
import { Lang } from "./marketing-content";

function PlanCard({
  badge,
  title,
  price,
  subtitle,
  features,
  ctaLabel,
  ctaHref,
  highlighted = false,
  softButton = false,
  tone = "slate",
}: {
  badge: string;
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  softButton?: boolean;
  tone?: "slate" | "sky" | "yellow" | "emerald" | "violet";
}) {
  const toneStyles = {
    slate: {
      card: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
      badge:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      button: softButton
        ? "border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200",
    },
    sky: {
      card: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/20",
      badge: "bg-sky-600 text-white",
      button: "bg-sky-600 text-white hover:bg-sky-500",
    },
    yellow: {
      card:
        "border-amber-200 bg-amber-50 dark:border-amber-900/70 dark:bg-amber-950/20",
      badge: "bg-amber-500 text-white dark:bg-amber-500 dark:text-white",
      button: softButton
        ? "border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100 dark:hover:bg-amber-900/60"
        : "bg-amber-500 text-white hover:bg-amber-400",
    },
    emerald: {
      card:
        "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20",
      badge: "bg-emerald-600 text-white",
      button: softButton
        ? "border border-emerald-300 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100 dark:hover:bg-emerald-900/60"
        : "bg-emerald-600 text-white hover:bg-emerald-500",
    },
    violet: {
      card:
        "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/20",
      badge: "bg-violet-600 text-white",
      button: softButton
        ? "border border-violet-300 bg-violet-100 text-violet-900 hover:bg-violet-200 dark:border-violet-800 dark:bg-violet-900/40 dark:text-violet-100 dark:hover:bg-violet-900/60"
        : "bg-violet-600 text-white hover:bg-violet-500",
    },
  } as const;

  const styles = highlighted ? toneStyles[tone] : toneStyles[tone];

  return (
    <div
      className={`rounded-[30px] border p-6 sm:p-8 shadow-sm transition-colors ${styles.card}`}
    >
      <div
        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles.badge}`}
      >
        {badge}
      </div>

      <h2 className="mt-5 text-xl sm:text-2xl font-semibold text-slate-950 dark:text-white">
        {title}
      </h2>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
          {price}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
        {subtitle}
      </p>

      <div className="mt-6 grid gap-3 text-sm text-slate-700 dark:text-slate-200">
        {features.map((feature) => (
          <div key={feature}>• {feature}</div>
        ))}
      </div>

      <Link
        href={ctaHref}
        className={`mt-8 inline-flex w-full justify-center rounded-xl px-5 py-3 text-sm font-medium transition sm:w-auto ${styles.button}`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export default function PricingPlans({ lang }: { lang: Lang }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <PlanCard
          badge={lang === "fr" ? "Offre standard" : "Standard plan"}
          title="Essential"
          price={lang === "fr" ? "19,90€ / mois" : "€19.90 / month"}
          subtitle={
            lang === "fr"
              ? "Une offre d’entrée pensée pour structurer l’essentiel du pilotage avec un périmètre plus cadré."
              : "An entry plan designed to structure the essentials with a more focused scope."
          }
          features={
            lang === "fr"
              ? [
                  "Pilotage portefeuille et projets limité à 5 projets",
                  "Plan de charge et ressources",
                  "Actions",
                ]
              : [
                  "Project oversight limited to 5 projects",
                  "Workload and resources",
                  "Action plans",
                ]
          }
          ctaLabel={lang === "fr" ? "Souscrire" : "Subscribe"}
          ctaHref="/subscription"
          softButton
          tone="yellow"
        />

        <PlanCard
          badge={lang === "fr" ? "Offre premium" : "Premium plan"}
          title={lang === "fr" ? "Pro mensuel" : "Pro monthly"}
          price={lang === "fr" ? "49,90€ / mois" : "€49.90 / month"}
          subtitle={
            lang === "fr"
              ? "La formule complète pour piloter projets, charge, finance, risques, qualité et arbitrages au quotidien."
              : "The full plan to manage projects, workload, finance, risks, quality and decisions every day."
          }
          features={
            lang === "fr"
              ? [
                  "Pilotage portefeuille et projets",
                  "Charge, ressources et arbitrages",
                  "Finance, risques, qualité et actions",
                ]
              : [
                  "Portfolio and project oversight",
                  "Workload, resources and arbitration",
                  "Finance, risks, quality and action plans",
                ]
          }
          ctaLabel={lang === "fr" ? "Souscrire" : "Subscribe"}
          ctaHref="/subscription"
          highlighted
          tone="sky"
        />

        <PlanCard
          badge={lang === "fr" ? "Offre premium" : "Premium plan"}
          title={lang === "fr" ? "Pro annuel" : "Pro yearly"}
          price={lang === "fr" ? "490€ / an" : "€490 / year"}
          subtitle={
            lang === "fr"
              ? "La même couverture complète avec une logique d’engagement annuel pour un usage durable."
              : "The same full coverage with an annual commitment for long-term use."
          }
          features={
            lang === "fr"
              ? [
                  "Couverture complète Projelys",
                  "Vision long terme et usage continu",
                  "Idéal pour sécuriser votre cadre de pilotage",
                ]
              : [
                  "Full Projelys coverage",
                  "Long-term visibility and continuous use",
                  "Ideal to secure your operating framework",
                ]
          }
          ctaLabel={lang === "fr" ? "Souscrire" : "Subscribe"}
          ctaHref="/subscription"
          softButton
          tone="emerald"
        />

        <PlanCard
          badge={lang === "fr" ? "Offre entreprise" : "Enterprise plan"}
          title={lang === "fr" ? "Entreprise" : "Enterprise"}
          price={lang === "fr" ? "Sur devis" : "Custom quote"}
          subtitle={
            lang === "fr"
              ? "Pour les ETI, TPE, PME et ESN à partir de 3 collaborateurs avec un cadrage adapté à l’organisation."
              : "For SMBs, mid-sized companies and service firms from 3 collaborators with tailored setup."
          }
          features={
            lang === "fr"
              ? [
                  "À partir de 3 collaborateurs",
                  "Déploiement adapté",
                  "Accompagnement et cadrage sur devis",
                ]
              : [
                  "From 3 collaborators",
                  "Setup adapted to your structure",
                  "Quote-based support and onboarding",
                ]
          }
          ctaLabel={lang === "fr" ? "Demander un devis" : "Request a quote"}
          ctaHref={`/site/contact?lang=${lang}`}
          softButton
          tone="violet"
        />
      </div>
    </section>
  );
}