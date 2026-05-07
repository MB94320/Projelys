import Link from "next/link";
import { Lang } from "./marketing-content";

export default function AboutPrinciples({ lang }: { lang: Lang }) {
  const items =
    lang === "fr"
      ? [
          {
            title: "Une lecture claire",
            text: "Projelys simplifie la lecture du portefeuille, de la charge, des risques, des finances et de la performance pour aider à arbitrer plus vite.",
            tone: "from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20",
          },
          {
            title: "Un outil ancré dans la réalité",
            text: "Le produit est pensé pour les équipes qui doivent vraiment suivre des projets, des ressources, des audits, des plans d’actions et des budgets.",
            tone: "from-fuchsia-50 to-white dark:from-fuchsia-950/20 dark:to-slate-900",
          },
          {
            title: "Une adoption progressive",
            text: "L’objectif n’est pas d’imposer une usine à gaz, mais de proposer un cadre de pilotage qui grandit avec les besoins.",
            tone: "from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900",
          },
        ]
      : [
          {
            title: "Clear reading",
            text: "Projelys simplifies how portfolios, workload, risks, finance and performance are read so teams can arbitrate faster.",
            tone: "from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20",
          },
          {
            title: "Grounded in reality",
            text: "The product is designed for teams that truly need to track projects, resources, audits, action plans and budgets.",
            tone: "from-fuchsia-50 to-white dark:from-fuchsia-950/20 dark:to-slate-900",
          },
          {
            title: "Progressive adoption",
            text: "The goal is not to impose a heavy system, but to offer a governance framework that grows with real needs.",
            tone: "from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900",
          },
        ];

  return (
    <section className="mx-auto max-w-7xl px-6 pb-18">
      <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900">
        <div className="max-w-5xl">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {lang === "fr" ? "Principes produit" : "Product principles"}
          </div>
          <h2 className="mt-3 max-w-5xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white md:text-4xl">
            {lang === "fr"
              ? "Une ambition simple : mieux piloter sans complexifier."
              : "One simple ambition: better governance without added complexity."}
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className={`rounded-[28px] border border-slate-200 bg-gradient-to-br ${item.tone} p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800`}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-slate-900/80">
                <svg className="h-5 w-5 text-sky-600 dark:text-sky-300" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 10h12M10 4v12" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-base font-semibold text-slate-950 dark:text-white">
                {item.title}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/site/how-it-works?lang=${lang}`}
            className="inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-sky-600/25 transition hover:bg-sky-500"
          >
            {lang === "fr" ? "Voir la méthode de pilotage" : "See how it works"}
          </Link>

          <Link
            href={`/site/contact?lang=${lang}`}
            className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {lang === "fr" ? "Prendre contact" : "Get in touch"}
          </Link>
        </div>
      </div>
    </section>
  );
}