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
}) {
  return (
    <div
      className={`rounded-[30px] border p-8 shadow-sm ${
        highlighted
          ? "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/20"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div
        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          highlighted
            ? "bg-sky-600 text-white"
            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        }`}
      >
        {badge}
      </div>

      <h2 className="mt-5 text-2xl font-semibold text-slate-950 dark:text-white">
        {title}
      </h2>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
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
        className={`mt-8 inline-flex rounded-xl px-5 py-3 text-sm font-medium transition ${
          highlighted
            ? "bg-sky-600 text-white hover:bg-sky-500"
            : softButton
            ? "border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        }`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

export default function PricingPlans({ lang }: { lang: Lang }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
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
        />
      </div>
    </section>
  );
}