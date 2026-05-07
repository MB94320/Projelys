import { Lang } from "./marketing-content";

type Pillar = {
  title: string;
  text: string;
  icon: React.ReactNode;
};

export default function SecurityPillars({ lang }: { lang: Lang }) {
  const items: Pillar[] =
    lang === "fr"
      ? [
          {
            title: "Données & hébergement",
            text: "Données hébergées dans l’Union européenne avec une attention particulière portée à la confidentialité des informations projets et des ressources.",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 10h18" />
                <path d="M7 7h.01M11 7h.01M15 7h.01" />
              </svg>
            ),
          },
          {
            title: "Accès & permissions",
            text: "Accès authentifiés, gestion de rôles (administration / pilotage / contributeurs) et séparation claire entre les environnements.",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="8" r="3" />
                <path d="M4 20a7 7 0 0 1 16 0" />
              </svg>
            ),
          },
          {
            title: "Traçabilité & sauvegardes",
            text: "Journalisation des opérations clés et sauvegardes régulières pour limiter le risque de perte de données critiques.",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 4h16v6H4z" />
                <path d="M4 14h16v6H4z" />
                <path d="M8 8h.01M8 18h.01" />
              </svg>
            ),
          },
        ]
      : [
          {
            title: "Data & hosting",
            text: "Data hosted in the European Union with particular care for project, workload and resource confidentiality.",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M3 10h18" />
                <path d="M7 7h.01M11 7h.01M15 7h.01" />
              </svg>
            ),
          },
          {
            title: "Access & permissions",
            text: "Authenticated access, role-based permissions (admin / leadership / contributors) and clear separation between environments.",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="8" r="3" />
                <path d="M4 20a7 7 0 0 1 16 0" />
              </svg>
            ),
          },
          {
            title: "Traceability & backups",
            text: "Logging of key operations and regular backups to reduce the risk of losing critical governance data.",
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M4 4h16v6H4z" />
                <path d="M4 14h16v6H4z" />
                <path d="M8 8h.01M8 18h.01" />
              </svg>
            ),
          },
        ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-10 max-w-3xl">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
          {lang === "fr" ? "Principes de sécurité" : "Security principles"}
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white md:text-4xl">
          {lang === "fr"
            ? "Des règles simples, lisibles et adaptées à la réalité des projets."
            : "Simple, readable rules adapted to real-world project work."}
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {item.icon}
            </div>
            <div className="mt-4 text-base font-semibold text-slate-950 dark:text-white">
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