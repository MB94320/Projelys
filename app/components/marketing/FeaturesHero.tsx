import Image from "next/image";
import Link from "next/link";
import { Lang } from "./marketing-content";

export default function FeaturesHero({ lang }: { lang: Lang }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-sky-50/70 to-white dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_26%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-18 lg:grid-cols-[1.02fr_1.38fr] lg:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm dark:border-sky-900 dark:bg-slate-900/80 dark:text-sky-300">
            {lang === "fr"
              ? "Fonctionnalités Projelys"
              : "Projelys capabilities"}
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1] tracking-[-0.04em] text-slate-950 dark:text-white md:text-5xl xl:text-[4.35rem]">
            {lang === "fr"
              ? "Piloter, arbitrer et sécuriser vos projets, dans un seul espace."
              : "Govern, arbitrate and secure execution in one unified workspace."}
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            {lang === "fr"
              ? "Projelys réunit le suivi commercial, les projets, la charge, la performance, les ressources, les risques, la finance, les actions et la qualité dans une seule logique de pilotage."
              : "Projelys brings commercial follow-up, projects, workload, performance, resources, risks, finance, action plans and quality into one operating system."}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={`/site/contact?lang=${lang}`}
              className="inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-medium text-white shadow-sm shadow-sky-600/25 hover:bg-sky-500"
            >
              {lang === "fr" ? "Demander une démo" : "Request a demo"}
            </Link>

            <Link
              href={`/site/pricing?lang=${lang}`}
              className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {lang === "fr" ? "Voir les tarifs" : "View pricing"}
            </Link>
          </div>
        </div>

        <div className="lg:pl-2 xl:pl-2">
          <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white p-4 shadow-2xl shadow-sky-100/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>

              <div className="overflow-hidden rounded-[10px] border border-slate-200 dark:border-slate-800">
                <Image
                  src="/Screen/Projet-Unique-Gantt.jpg"
                  alt={lang === "fr" ? "Fonctionnalités Projelys" : "Projelys features"}
                  width={2200}
                  height={1320}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}