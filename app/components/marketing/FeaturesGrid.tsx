import { Lang } from "./marketing-content";

type FeatureCard = {
  title: string;
  text: string;
  color:
    | "sky"
    | "emerald"
    | "amber"
    | "rose"
    | "violet"
    | "slate"
    | "teal"
    | "orange";
  icon: React.ReactNode;
};

const colorMap = {
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  teal: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
} as const;

export default function FeaturesGrid({ lang }: { lang: Lang }) {
  const items: FeatureCard[] =
    lang === "fr"
      ? [
          {
            title: "Suivi commercial",
            text: "Gardez une continuité claire entre opportunités, décisions et exécution.",
            color: "sky",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 19h16" />
                <path d="M6 16V8" />
                <path d="M12 16V5" />
                <path d="M18 16v-4" />
              </svg>
            ),
          },
          {
            title: "Pilotage projet",
            text: "Visualisez avancement, jalons, priorités et coordination multi-projets.",
            color: "emerald",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M3 7h18" />
                <path d="M6 4h4l1 2h7a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H7a4 4 0 0 1-4-4V6a2 2 0 0 1 2-2h1z" />
              </svg>
            ),
          },
          {
            title: "Charge & ressources",
            text: "Détectez les tensions de capacité et sécurisez vos arbitrages.",
            color: "amber",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M8 2v4M16 2v4M3 10h18" />
              </svg>
            ),
          },
          {
            title: "Performance",
            text: "Appuyez les décisions avec des vues lisibles et actionnables.",
            color: "rose",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 19h16" />
                <path d="M7 15l3-3 3 2 4-5" />
                <path d="M17 9h2v2" />
              </svg>
            ),
          },
          {
            title: "Finance projet",
            text: "Reliez budget, suivi financier et lecture de performance dans le même pilotage.",
            color: "teal",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v8" />
                <path d="M9.5 10.5c0-1 1.1-1.8 2.5-1.8s2.5.8 2.5 1.8-1.1 1.8-2.5 1.8-2.5.8-2.5 1.8 1.1 1.8 2.5 1.8 2.5-.8 2.5-1.8" />
              </svg>
            ),
          },
          {
            title: "Risques & opportunités",
            text: "Priorisez l’exposition réelle et reliez-la aux bonnes actions.",
            color: "violet",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M12 3 2 21h20L12 3z" />
                <path d="M12 9v5" />
                <path d="M12 18h.01" />
              </svg>
            ),
          },
          {
            title: "Plan d’actions",
            text: "Pilotez les actions correctives, les suivis et les échéances dans un seul cadre.",
            color: "orange",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            ),
          },
          {
            title: "Qualité & conformité",
            text: "Suivez livrables, audits, objectifs qualité et écarts de conformité.",
            color: "slate",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" />
              </svg>
            ),
          },
        ]
      : [
          {
            title: "Commercial follow-up",
            text: "Keep a clear continuity between opportunities, decisions and execution.",
            color: "sky",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 19h16" />
                <path d="M6 16V8" />
                <path d="M12 16V5" />
                <path d="M18 16v-4" />
              </svg>
            ),
          },
          {
            title: "Project oversight",
            text: "Visualize progress, milestones, priorities and multi-project coordination.",
            color: "emerald",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M3 7h18" />
                <path d="M6 4h4l1 2h7a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H7a4 4 0 0 1-4-4V6a2 2 0 0 1 2-2h1z" />
              </svg>
            ),
          },
          {
            title: "Workload & resources",
            text: "Detect capacity pressure early and secure better arbitration.",
            color: "amber",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="3" y="4" width="18" height="17" rx="2" />
                <path d="M8 2v4M16 2v4M3 10h18" />
              </svg>
            ),
          },
          {
            title: "Performance",
            text: "Support decisions with readable and actionable views.",
            color: "rose",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 19h16" />
                <path d="M7 15l3-3 3 2 4-5" />
                <path d="M17 9h2v2" />
              </svg>
            ),
          },
          {
            title: "Project finance",
            text: "Connect budget, financial follow-up and performance reading in the same system.",
            color: "teal",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v8" />
                <path d="M9.5 10.5c0-1 1.1-1.8 2.5-1.8s2.5.8 2.5 1.8-1.1 1.8-2.5 1.8-2.5.8-2.5 1.8 1.1 1.8 2.5 1.8 2.5-.8 2.5-1.8" />
              </svg>
            ),
          },
          {
            title: "Risks & opportunities",
            text: "Prioritize real exposure and link it to the right action plans.",
            color: "violet",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M12 3 2 21h20L12 3z" />
                <path d="M12 9v5" />
                <path d="M12 18h.01" />
              </svg>
            ),
          },
          {
            title: "Action plans",
            text: "Manage corrective actions, follow-up and deadlines inside one structured view.",
            color: "orange",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            ),
          },
          {
            title: "Quality & compliance",
            text: "Track deliverables, audits, quality targets and compliance gaps.",
            color: "slate",
            icon: (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" />
              </svg>
            ),
          },
        ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 max-w-3xl">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
          {lang === "fr" ? "Couverture fonctionnelle" : "Functional coverage"}
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white md:text-4xl">
          {lang === "fr"
            ? "Les briques clés d’un vrai cockpit de pilotage."
            : "The key building blocks of a real operating cockpit."}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorMap[item.color]}`}
            >
              {item.icon}
            </div>

            <div className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">
              {item.title}
            </div>

            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}