import { Lang } from "./marketing-content";

export default function PricingHero({ lang }: { lang: Lang }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-white via-sky-50/70 to-white dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-18">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm dark:border-sky-900 dark:bg-slate-900/80 dark:text-sky-300">
            {lang === "fr" ? "Tarifs Projelys" : "Projelys pricing"}
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-slate-950 dark:text-white md:text-5xl xl:text-6xl">
            {lang === "fr"
              ? "Une tarification claire pour structurer votre pilotage."
              : "Clear pricing to structure the way you govern work."}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {lang === "fr"
              ? "Choisissez une formule simple pour centraliser vos projets, votre charge, vos risques, votre qualité et vos arbitrages dans une seule plateforme."
              : "Choose a simple plan to centralize projects, workload, risks, quality and decisions in one platform."}
          </p>
        </div>
      </div>
    </section>
  );
}