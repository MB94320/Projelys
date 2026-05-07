import { Lang } from "./marketing-content";

export default function AboutHero({ lang }: { lang: Lang }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_28%),radial-gradient(circle_at_82%_18%,_rgba(217,70,239,0.12),_transparent_24%),linear-gradient(to_bottom,_#ffffff,_#f8fbff)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.12),_transparent_26%),radial-gradient(circle_at_82%_18%,_rgba(217,70,239,0.12),_transparent_24%),linear-gradient(to_bottom,_#020617,_#020617)]">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute left-[-80px] top-16 h-52 w-52 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute right-[-40px] top-10 h-44 w-44 rounded-full bg-fuchsia-200/40 blur-3xl dark:bg-fuchsia-500/10" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-18 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm dark:border-sky-900 dark:bg-slate-900/80 dark:text-sky-300">
            {lang === "fr" ? "À propos de Projelys" : "About Projelys"}
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 dark:text-white md:text-5xl xl:text-6xl">
            {lang === "fr" ? "Pourquoi Projelys existe." : "Why Projelys exists."}
          </h1>

          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {lang === "fr"
              ? "Projelys est né d’un constat simple : trop de structures pilotent encore des sujets critiques avec des fichiers dispersés, des tableaux partiels et des réunions qui redémarrent sans vraie continuité."
              : "Projelys was born from a simple observation: too many organizations still manage critical topics through scattered files, partial spreadsheets and meetings that restart without real continuity."}
          </p>
        </div>

        <div className="relative">
          <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.28)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {lang === "fr" ? "Vision produit" : "Product vision"}
            </div>

            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50 px-4 py-4 dark:border-sky-900/40 dark:from-sky-950/30 dark:to-cyan-950/20">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {lang === "fr" ? "Moins de dispersion" : "Less fragmentation"}
                </div>
                <div className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {lang === "fr"
                    ? "Un cockpit unique pour relier projets, risques, qualité, finance et actions."
                    : "A single cockpit to connect projects, risks, quality, finance and actions."}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50 to-white px-4 py-4 dark:border-fuchsia-900/40 dark:from-fuchsia-950/20 dark:to-slate-900">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {lang === "fr" ? "Décider plus vite" : "Decide faster"}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                    {lang === "fr"
                      ? "Des vues lisibles pour arbitrer sans refaire toute l’analyse."
                      : "Readable views to arbitrate without rebuilding the full analysis."}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-4 py-4 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-slate-900">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {lang === "fr" ? "Exécuter dans la durée" : "Execute over time"}
                  </div>
                  <div className="mt-1 text-xs leading-6 text-slate-600 dark:text-slate-300">
                    {lang === "fr"
                      ? "Des actions visibles, suivies et reliées aux vrais enjeux."
                      : "Visible, tracked actions connected to real operational issues."}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white dark:border-slate-700">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">
                      {lang === "fr" ? "Sobriété + dynamisme" : "Sobriety + dynamism"}
                    </div>
                    <div className="mt-1 text-xs leading-6 text-slate-300">
                      {lang === "fr"
                        ? "Projelys assume une esthétique premium, structurée et vivante."
                        : "Projelys embraces a premium, structured and lively aesthetic."}
                    </div>
                  </div>

                  <svg className="h-14 w-14 text-cyan-300" viewBox="0 0 120 120" fill="none">
                    <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="8" opacity="0.25" />
                    <path d="M34 64C42 51 53 44 67 42C78 40 88 44 96 54" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                    <path d="M30 82C43 76 55 73 68 73C79 73 88 76 98 82" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity="0.85" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}