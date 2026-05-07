import { ReactNode } from "react";
import { Lang } from "./marketing-content";

type KpiItem = {
  value: string;
  label: string;
  description: string;
  color: "sky" | "emerald" | "amber" | "rose";
  icon: ReactNode;
};

const kpis: Record<Lang, KpiItem[]> = {
  fr: [
    {
      value: "360°",
      label: "Vision consolidée",
      description: "Portefeuille, charge, risques, qualité et actions sur une seule lecture.",
      color: "sky",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M12 3a9 9 0 1 0 9 9" />
          <path d="M12 7v5l3 3" />
        </svg>
      ),
    },
    {
      value: "-30%",
      label: "Moins de dispersion",
      description: "Réduisez les fichiers éparpillés et les suivis parallèles difficiles à maintenir.",
      color: "emerald",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="9" y="14" width="6" height="6" rx="1.5" />
          <path d="M10 7h4M12 10v4" />
        </svg>
      ),
    },
    {
      value: "+25%",
      label: "Décisions accélérées",
      description: "Les arbitrages deviennent plus rapides quand les priorités sont visibles tout de suite.",
      color: "amber",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M4 19h16" />
          <path d="M7 14l3-3 3 2 4-5" />
          <path d="M17 8h3v3" />
        </svg>
      ),
    },
    {
      value: "94%",
      label: "Maîtrise qualité",
      description: "Suivez vos livrables, audits, objectifs et plans d’actions avec une vraie traçabilité.",
      color: "rose",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M9 12l2 2 4-4" />
          <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" />
        </svg>
      ),
    },
  ],
  en: [
    {
      value: "360°",
      label: "Consolidated visibility",
      description: "Portfolio, workload, risks, quality and actions in one operating view.",
      color: "sky",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M12 3a9 9 0 1 0 9 9" />
          <path d="M12 7v5l3 3" />
        </svg>
      ),
    },
    {
      value: "-30%",
      label: "Less fragmentation",
      description: "Reduce scattered files and parallel trackers that are hard to maintain.",
      color: "emerald",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="9" y="14" width="6" height="6" rx="1.5" />
          <path d="M10 7h4M12 10v4" />
        </svg>
      ),
    },
    {
      value: "+25%",
      label: "Faster decisions",
      description: "Arbitration becomes faster when priorities are instantly visible.",
      color: "amber",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M4 19h16" />
          <path d="M7 14l3-3 3 2 4-5" />
          <path d="M17 8h3v3" />
        </svg>
      ),
    },
    {
      value: "94%",
      label: "Quality control",
      description: "Track deliverables, audits, targets and action plans with real traceability.",
      color: "rose",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M9 12l2 2 4-4" />
          <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" />
        </svg>
      ),
    },
  ],
};

const colorMap = {
  sky: {
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    value: "text-sky-700 dark:text-sky-300",
  },
  emerald: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    value: "text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    value: "text-amber-700 dark:text-amber-300",
  },
  rose: {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    value: "text-rose-700 dark:text-rose-300",
  },
} as const;

export default function HomeKpis({ lang }: { lang: Lang }) {
  const items = kpis[lang];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8 max-w-3xl">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
          {lang === "fr"
            ? "Ce que Projelys améliore concrètement"
            : "What Projelys improves in practice"}
        </div>

        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white md:text-4xl">
          {lang === "fr"
            ? "Une plateforme pensée pour mieux piloter, décider et agir."
            : "A platform designed to improve visibility, decisions and execution."}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const tone = colorMap[item.color];

          return (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone.badge}`}
              >
                {item.icon}
              </div>

              <div className={`mt-5 text-3xl font-semibold ${tone.value}`}>
                {item.value}
              </div>

              <div className="mt-2 text-base font-semibold text-slate-950 dark:text-white">
                {item.label}
              </div>

              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}