import { Lang } from "./marketing-content";

type Step = {
  title: string;
  text: string;
  bullets: string[];
  icon: React.ReactNode;
  accent: string;
};

export default function HowItWorksFlow({ lang }: { lang: Lang }) {
  const steps: Step[] =
    lang === "fr"
      ? [
          {
            title: "Commercial & opportunités",
            text: "Le cycle commence par la dynamique business : opportunités à concrétiser, propositions commerciales, réponses à appels d’offre, commandes et retours post mortem.",
            bullets: [
              "Opportunités à réaliser",
              "Suivi des propositions commerciales",
              "Réponses à appel d’offre, commandes & post mortem",
            ],
            accent: "from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19V9M10 19V5M16 19v-8M22 19V3" strokeLinecap="round" />
              </svg>
            ),
          },
          {
            title: "Projets & portefeuille",
            text: "Une fois la vision commerciale clarifiée, Projelys structure le portefeuille, les projets, les priorités et les jalons pour donner un cadre lisible aux arbitrages.",
            bullets: [
              "Vue portefeuille et pipeline projet",
              "Statuts, priorités, jalons clés",
              "Vision centralisée pour piloter",
            ],
            accent: "from-fuchsia-50 to-white dark:from-fuchsia-950/20 dark:to-slate-900",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="7" height="7" rx="1.5" />
                <rect x="14" y="4" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 17h7" strokeLinecap="round" />
              </svg>
            ),
          },
          {
            title: "Charge & ressources",
            text: "Projelys aide à lire les tensions de capacité, à visualiser les surcharges et à suivre les ressources réellement disponibles dans le temps.",
            bullets: [
              "Plan de charge par semaine, rôle ou personne",
              "Disponibilités, absences et équilibre de capacité",
              "Lecture rapide des zones de tension",
            ],
            accent: "from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 18c2-4 4-6 8-6s6 2 8 6" />
                <circle cx="9" cy="8" r="2.5" />
                <circle cx="16" cy="7" r="2" />
              </svg>
            ),
          },
          {
            title: "Qualité, risques & finance",
            text: "Les décisions ne reposent pas seulement sur l’avancement. Elles s’appuient aussi sur les budgets, les écarts, les audits, les non-conformités, les risques et les indicateurs utiles.",
            bullets: [
              "Qualité, audits et suivi des écarts",
              "Matrice risques & opportunités",
              "Lecture financière, budgets et performance",
            ],
            accent: "from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 18h16" />
                <path d="M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
          {
            title: "Actions & exécution",
            text: "Chaque décision importante doit produire des actions visibles, suivies dans le temps et reliées aux vrais enjeux projet, qualité, risque ou organisation.",
            bullets: [
              "Plan d’actions centralisé",
              "Lien entre décisions et suivi terrain",
              "Continuité de l’exécution",
            ],
            accent: "from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
          {
            title: "Performance & lecture managériale",
            text: "Le dernier niveau de lecture aide à préparer les comités, synthétiser les tendances et rendre la performance plus lisible pour décider sans perdre le détail utile.",
            bullets: [
              "KPI et vues synthétiques",
              "Radar, tableaux et lecture de tendance",
              "Support pour arbitrages et comités",
            ],
            accent: "from-rose-50 to-fuchsia-50 dark:from-rose-950/20 dark:to-fuchsia-950/20",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3 19 7v10l-7 4-7-4V7l7-4Z" />
                <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
        ]
      : [
          {
            title: "Pipeline & opportunities",
            text: "The cycle starts with business dynamics: opportunities to convert, proposals, bids, orders and post-mortem feedback.",
            bullets: [
              "Opportunities to convert",
              "Commercial proposal tracking",
              "Bids, orders and post-mortem reviews",
            ],
            accent: "from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 19V9M10 19V5M16 19v-8M22 19V3" strokeLinecap="round" />
              </svg>
            ),
          },
          {
            title: "Projects & portfolio",
            text: "Once the commercial view is clearer, Projelys structures the portfolio, projects, priorities and milestones to create a readable decision framework.",
            bullets: [
              "Portfolio and project pipeline view",
              "Statuses, priorities and key milestones",
              "Centralized governance visibility",
            ],
            accent: "from-fuchsia-50 to-white dark:from-fuchsia-950/20 dark:to-slate-900",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="7" height="7" rx="1.5" />
                <rect x="14" y="4" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <path d="M14 17h7" strokeLinecap="round" />
              </svg>
            ),
          },
          {
            title: "Workload & resources",
            text: "Projelys helps read capacity pressure, visualize overload and track resources that are actually available over time.",
            bullets: [
              "Workload by week, role or person",
              "Availability, absences and capacity balance",
              "Fast visibility on pressure areas",
            ],
            accent: "from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 18c2-4 4-6 8-6s6 2 8 6" />
                <circle cx="9" cy="8" r="2.5" />
                <circle cx="16" cy="7" r="2" />
              </svg>
            ),
          },
          {
            title: "Quality, risks & finance",
            text: "Decisions do not rely on progress alone. They also depend on budgets, gaps, audits, non-conformities, risks and useful indicators.",
            bullets: [
              "Quality, audits and issue tracking",
              "Risk & opportunity matrix",
              "Financial reading, budgets and performance",
            ],
            accent: "from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 18h16" />
                <path d="M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
          {
            title: "Actions & execution",
            text: "Every important decision should produce visible actions, tracked over time and linked to the real project, quality, risk or organizational issues.",
            bullets: [
              "Centralized action plan",
              "Connection between decisions and execution",
              "Execution continuity over time",
            ],
            accent: "from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
          {
            title: "Performance & management reading",
            text: "The final layer helps prepare steering committees, synthesize trends and make performance easier to read without losing useful operational detail.",
            bullets: [
              "KPIs and executive views",
              "Radar, tables and trend reading",
              "Support for arbitration and committees",
            ],
            accent: "from-rose-50 to-fuchsia-50 dark:from-rose-950/20 dark:to-fuchsia-950/20",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3 19 7v10l-7 4-7-4V7l7-4Z" />
                <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
          },
        ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 max-w-4xl">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
          {lang === "fr" ? "Le fil de pilotage" : "The operating flow"}
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white md:text-4xl">
          {lang === "fr"
            ? "Une logique visuelle, progressive et reliée au terrain."
            : "A visual, progressive logic connected to real operations."}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((item) => (
          <div
            key={item.title}
            className={`group rounded-[30px] border border-slate-200 bg-gradient-to-br ${item.accent} p-6 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.22)] transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 text-slate-800 shadow-sm dark:bg-slate-900/85 dark:text-white">
                {item.icon}
              </div>

              <div className="h-px flex-1 bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-700" />
            </div>

            <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white">
              {item.title}
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {item.text}
            </p>

            <div className="mt-5 grid gap-2">
              {item.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
                >
                  {bullet}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}