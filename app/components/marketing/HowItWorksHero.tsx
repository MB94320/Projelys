import { Lang } from "./marketing-content";

export default function HowItWorksHero({ lang }: { lang: Lang }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_28%),radial-gradient(circle_at_84%_22%,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(to_bottom,_#ffffff,_#f8fbff)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_30%),radial-gradient(circle_at_84%_22%,_rgba(16,185,129,0.12),_transparent_24%),linear-gradient(to_bottom,_#020617,_#020617)]">
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-18 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-cyan-200 bg-white/90 px-3 py-1 text-xs font-medium text-cyan-700 shadow-sm dark:border-cyan-900 dark:bg-slate-900/80 dark:text-cyan-300">
            {lang === "fr" ? "Méthode de pilotage" : "How it works"}
          </div>

          <h1 className="mt-6 max-w-5xl text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 dark:text-white md:text-5xl xl:text-6xl">
            {lang === "fr"
              ? "Comment Projelys structure le pilotage du quotidien."
              : "How Projelys structures day-to-day governance."}
          </h1>

          <p className="mt-6 max-w-5xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {lang === "fr"
              ? "Projelys suit un fil simple : partir du commercial, transformer les opportunités en projets, lire la charge, suivre les ressources, relier qualité et risques, piloter la finance puis convertir les décisions en actions visibles."
              : "Projelys follows a simple flow: start from the pipeline, turn opportunities into projects, read workload, track resources, connect quality and risks, manage finance and turn decisions into visible action."}
          </p>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.28)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {lang === "fr" ? "Cycle global" : "Operational cycle"}
          </div>

          <div className="mt-6 grid gap-3">
            {[
              lang === "fr" ? "Commercial & opportunités" : "Pipeline & opportunities",
              lang === "fr" ? "Projets & portefeuille" : "Projects & portfolio",
              lang === "fr" ? "Charge & ressources" : "Workload & resources",
              lang === "fr" ? "Qualité, risques & finance" : "Quality, risks & finance",
              lang === "fr" ? "Actions & performance" : "Actions & performance",
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-semibold text-white shadow-sm">
                  {index + 1}
                </div>
                <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}