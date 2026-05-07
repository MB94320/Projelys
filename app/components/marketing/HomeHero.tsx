import Image from "next/image";
import Link from "next/link";
import { Lang, content } from "./marketing-content";

export default function HomeHero({ lang }: { lang: Lang }) {
  const t = content[lang];

  const ui = {
    badge:
      lang === "fr"
        ? "Pilotage unifié pour activité, projets, charge, qualité et risques"
        : "Unified control for operations, projects, workload, quality and risks",
    title:
      lang === "fr"
        ? "Toute votre gouvernance projet et opérationnelle dans une seule plateforme."
        : "Your entire project and operational governance in one platform.",
    subtitle:
      lang === "fr"
        ? "Projelys réunit suivi commercial, pilotage projet, charge, performance, ressources, finance, actions, qualité et risques dans une interface claire, visuelle et exploitable."
        : "Projelys brings together commercial tracking, project delivery, workload, performance, resources, finance, actions, quality and risks in one clear, visual and actionable workspace.",
    slogan:
      lang === "fr"
        ? "Une lecture immédiate. Des arbitrages plus simples. Une maîtrise plus solide."
        : "Immediate visibility. Faster decisions. Stronger control.",
    ctaPrimary: t.hero.ctaPrimary,
    ctaSecondary: t.hero.ctaSecondary,
    availability:
      lang === "fr"
        ? "Pensé pour les équipes terrain, managers, PMO et directions."
        : "Designed for teams, managers, PMOs and leadership.",
    screenLabel:
      lang === "fr" ? "Exemples d’écrans Projelys" : "Projelys screen examples",
    desktop:
      lang === "fr" ? "Vue desktop portefeuille" : "Desktop portfolio view",
    tablet:
      lang === "fr" ? "Vue tablette plan de charge" : "Tablet workload view",
    floatingA:
      lang === "fr" ? "Portefeuille consolidé" : "Consolidated portfolio",
    floatingB:
      lang === "fr" ? "Charge & arbitrage" : "Workload & arbitration",
    floatingC:
      lang === "fr" ? "Risques critiques suivis" : "Tracked critical risks",
    floatingD:
      lang === "fr" ? "Qualité & audits" : "Quality & audits",
  };

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-sky-50 via-white to-white dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_34%),radial-gradient(circle_at_left,rgba(16,185,129,0.08),transparent_28%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-18 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <div className="inline-flex rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm dark:border-sky-900 dark:bg-slate-900/80 dark:text-sky-300">
            {ui.badge}
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.02em] text-slate-950 dark:text-white md:text-5xl xl:text-6xl">
            {ui.title}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {ui.subtitle}
          </p>

          <p className="mt-5 max-w-xl text-base font-medium text-slate-800 dark:text-slate-100">
            {ui.slogan}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={`/site/contact?lang=${lang}`}
              className="inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-medium text-white shadow-sm shadow-sky-600/25 hover:bg-sky-500"
            >
              {ui.ctaPrimary}
            </Link>

            <Link
              href={`/site/pricing?lang=${lang}`}
              className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {ui.ctaSecondary}
            </Link>
          </div>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            {ui.availability}
          </p>
        </div>

        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {ui.screenLabel}
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
              {lang === "fr" ? "Interface réelle" : "Real interface"}
            </div>
          </div>

          <div className="relative rounded-[30px] border border-slate-200 bg-white p-4 shadow-2xl shadow-sky-100/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>

              <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <Image
                  src="/Screen/Projet-Global.jpg"
                  alt={ui.desktop}
                  width={1600}
                  height={950}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </div>

            <div className="absolute -bottom-8 left-5 hidden w-[43%] rounded-[24px] border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60 md:block dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div className="overflow-hidden rounded-[18px] border border-slate-200 dark:border-slate-800">
                <Image
                  src="/Screen/Plan-de-Charge.jpg"
                  alt={ui.tablet}
                  width={900}
                  height={1100}
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>

            <div className="absolute -right-4 top-20 hidden w-52 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur md:block dark:border-slate-800 dark:bg-slate-900/95">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">
                {ui.floatingA}
              </div>
              <div className="mt-3 space-y-3">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "fr" ? "Programmes suivis" : "Tracked programs"}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
                    12
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/80">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === "fr" ? "Décisions à arbitrer" : "Items to arbitrate"}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
                    5
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-2 bottom-10 hidden w-56 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur lg:block dark:border-slate-800 dark:bg-slate-900/95">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                {ui.floatingC}
              </div>
              <div className="mt-3 grid gap-2">
                <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                  {lang === "fr" ? "2 risques élevés" : "2 high risks"}
                </div>
                <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  {lang === "fr" ? "7 actions en suivi" : "7 tracked actions"}
                </div>
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {lang === "fr"
                    ? "94% livrables conformes"
                    : "94% compliant deliverables"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {ui.floatingB}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {lang === "fr"
                  ? "Visualisez les tensions de capacité et priorisez rapidement les arbitrages."
                  : "Visualize capacity tensions and prioritize arbitration faster."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {ui.floatingC}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {lang === "fr"
                  ? "Suivez les risques, opportunités et actions critiques au même endroit."
                  : "Track risks, opportunities and critical actions in one place."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {ui.floatingD}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {lang === "fr"
                  ? "Transformez audits, objectifs et plans d’actions en pilotage quotidien."
                  : "Turn audits, targets and action plans into everyday management."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}