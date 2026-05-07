import { Lang } from "./marketing-content";

export default function ContactHero({ lang }: { lang: Lang }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-white via-sky-50/70 to-white dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-6 py-18">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm dark:border-sky-900 dark:bg-slate-900/80 dark:text-sky-300">
            {lang === "fr" ? "Contact & démo" : "Contact & demo"}
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-slate-950 dark:text-white md:text-5xl xl:text-6xl">
            {lang === "fr"
              ? "Parlons de votre façon de piloter vos projets."
              : "Let’s talk about how you govern your projects."}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {lang === "fr"
              ? "Expliquez votre contexte, vos irritants et vos priorités. Nous voyons ensuite comment Projelys peut vous aider à structurer le pilotage sans vous rajouter une usine à gaz."
              : "Share your context, pain points and priorities. Then we explore how Projelys can help structure governance without adding complexity."}
          </p>
        </div>
      </div>
    </section>
  );
}