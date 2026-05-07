import { Lang } from "./marketing-content";

export default function AboutStory({ lang }: { lang: Lang }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {lang === "fr" ? "L’origine du produit" : "Product origin"}
          </div>

          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
            {lang === "fr"
              ? "Un besoin de clarté dans le pilotage réel."
              : "A need for clarity in real-world governance."}
          </h2>

          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <p>
              {lang === "fr"
                ? "Le point de départ de Projelys, c’est le terrain : gestion de projet, qualité, risques, plans d’actions, charge, ressources, finance et suivi de sujets transverses qui ne rentrent jamais proprement dans un seul fichier."
                : "Projelys starts from the field: project management, quality, risks, action plans, workload, resources, finance and cross-functional topics that never fit cleanly into a single file."}
            </p>
            <p>
              {lang === "fr"
                ? "Dans beaucoup d’organisations, les informations utiles existent déjà, mais elles vivent dans plusieurs tableaux, plusieurs habitudes et plusieurs réunions. Le vrai sujet n’est pas seulement de stocker l’information : c’est de la relier pour pouvoir décider."
                : "In many organizations, the right information already exists, but it lives across multiple spreadsheets, habits and meetings. The real issue is not only storing information: it is connecting it so decisions can actually be made."}
            </p>
            <p>
              {lang === "fr"
                ? "Projelys a été imaginé pour répondre à cette réalité avec une approche plus lisible, plus visuelle et plus continue : un point d’entrée unique pour structurer le portefeuille, suivre l’exécution, lire la charge, traiter les risques, piloter la qualité, suivre les finances et garder une trace des actions."
                : "Projelys was designed to answer this reality with a more readable, visual and continuous approach: one entry point to structure the portfolio, track execution, read workload, manage risks, oversee quality, monitor finance and keep actions visible over time."}
            </p>
          </div>

          <div className="mt-7 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 p-5 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950/20">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {lang === "fr" ? "Une logique simple" : "A simple logic"}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium">
              {[
                lang === "fr" ? "Commercial" : "Pipeline",
                lang === "fr" ? "Projets" : "Projects",
                lang === "fr" ? "Ressources" : "Resources",
                lang === "fr" ? "Qualité / Risques" : "Quality / Risks",
                lang === "fr" ? "Finance" : "Finance",
                lang === "fr" ? "Actions" : "Actions",
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {item}
                  </div>
                  {index < 5 && (
                    <svg className="h-4 w-4 text-sky-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbff)] p-7 shadow-[0_20px_70px_-30px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a,#020617)]">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {lang === "fr" ? "Ce que Projelys veut éviter" : "What Projelys avoids"}
          </div>

          <div className="mt-5 space-y-4">
            {[
              lang === "fr"
                ? "Un outil trop lourd à maintenir."
                : "A tool that becomes too heavy to maintain.",
              lang === "fr"
                ? "Des vues trop théoriques, loin du quotidien des équipes."
                : "Views that are too theoretical and disconnected from daily work.",
              lang === "fr"
                ? "Un pilotage éclaté entre trop de supports."
                : "Governance scattered across too many disconnected supports.",
              lang === "fr"
                ? "Des décisions non reliées à des actions concrètes."
                : "Decisions that never translate into concrete action.",
            ].map((item, index) => (
              <div
                key={item}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-fuchsia-500 text-xs font-semibold text-white">
                  0{index + 1}
                </div>
                <div className="text-sm leading-7 text-slate-700 dark:text-slate-200">{item}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 to-cyan-50 p-4 dark:border-fuchsia-900/30 dark:from-fuchsia-950/20 dark:to-cyan-950/20">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {lang === "fr" ? "Ce que cela change" : "What this changes"}
            </div>
            <div className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "Moins de reconstitution manuelle, plus de lecture immédiate, et une meilleure continuité entre stratégie, pilotage et exécution."
                : "Less manual reconstruction, more immediate clarity, and better continuity between strategy, governance and execution."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}