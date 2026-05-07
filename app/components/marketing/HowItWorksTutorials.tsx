import Link from "next/link";
import { Lang } from "./marketing-content";

type TutorialItem = {
  title: string;
  text: string;
  href: string;
  accent: string;
};

export default function HowItWorksTutorials({ lang }: { lang: Lang }) {
  const items: TutorialItem[] =
    lang === "fr"
      ? [
          {
            title: "Tutoriel projets & Gantt",
            text: "Un point d’entrée clair pour comprendre la logique projet, la chronologie et la lecture de planification.",
            href: "/Tutoriel/projelys-project-gantt-tutorial.html",
            accent: "from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20",
          },
          {
            title: "Tutoriel charge & ressources",
            text: "Pour lire le plan de charge, visualiser les capacités, les absences et les tensions de ressources.",
            href: "/Tutoriel/projelys-loadplan-tutorial.html",
            accent: "from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900",
          },
          {
            title: "Autres tutoriels",
            text: "Qualité, risques, actions, finance, performance, e-commerce et autres rubriques déjà présentes.",
            href: "/Tutoriel/projelys-quality-hub-tutorial.html",
            accent: "from-fuchsia-50 to-white dark:from-fuchsia-950/20 dark:to-slate-900",
          },
        ]
      : [
          {
            title: "Projects & Gantt tutorial",
            text: "A clear starting point to understand project logic, timeline reading and planning visibility.",
            href: "/Tutoriel/projelys-project-gantt-tutorial.html",
            accent: "from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20",
          },
          {
            title: "Workload & resources tutorial",
            text: "Read workload planning, visualize capacities, absences and resource pressure areas.",
            href: "/Tutoriel/projelys-loadplan-tutorial.html",
            accent: "from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900",
          },
          {
            title: "Other tutorials",
            text: "Quality, risks, actions, finance, performance, e-commerce and other existing sections.",
            href: "/Tutoriel/projelys-quality-hub-tutorial.html",
            accent: "from-fuchsia-50 to-white dark:from-fuchsia-950/20 dark:to-slate-900",
          },
        ];

  return (
    <section className="mx-auto max-w-7xl px-6 pb-18">
      <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900">
        <div className="max-w-5xl">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
            {lang === "fr" ? "Tutoriels intégrés" : "Built-in tutorials"}
          </div>
          <h2 className="mt-3 max-w-5xl text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white md:text-4xl">
            {lang === "fr"
              ? "Des repères simples pour prendre l’outil en main."
              : "Simple guidance to get comfortable with the platform."}
          </h2>
          <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            {lang === "fr"
              ? "Projelys intègre des tutoriels par rubrique pour expliquer la logique des pages, faciliter la prise en main et accélérer l’adoption sur les sections déjà disponibles."
              : "Projelys includes section-based tutorials to explain page logic, simplify onboarding and accelerate adoption across the sections already available."}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className={`rounded-[28px] border border-slate-200 bg-gradient-to-br ${item.accent} p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/85 shadow-sm dark:bg-slate-900/85">
                <svg className="h-5 w-5 text-cyan-600 dark:text-cyan-300" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M10 4v12M4 10h12" strokeLinecap="round" />
                </svg>
              </div>

              <div className="mt-4 text-base font-semibold text-slate-950 dark:text-white">
                {item.title}
              </div>
              <p className="mt-2 min-h-[56px] text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item.text}
              </p>

              <Link
                href={item.href}
                className="mt-5 inline-flex rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {lang === "fr" ? "Voir le tutoriel" : "Open tutorial"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}