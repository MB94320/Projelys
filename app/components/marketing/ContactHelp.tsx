import { Lang } from "./marketing-content";

export default function ContactHelp({ lang }: { lang: Lang }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-18">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-7 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 md:px-8">
        <div className="font-semibold text-slate-900 dark:text-white">
          {lang === "fr"
            ? "Tutoriels et accompagnement"
            : "Tutorials and guidance"}
        </div>
        <p className="mt-2 leading-7">
          {lang === "fr"
            ? "Projelys prévoit des tutoriels intégrés par page pour expliquer les sections (projets, charge, performance, qualité, risques…) et la meilleure façon de les utiliser au quotidien."
            : "Projelys includes page-level tutorials to explain each section (projects, workload, performance, quality, risks…) and how to use them in daily work."}
        </p>
        <p className="mt-1 leading-7">
          {lang === "fr"
            ? "Vous pourrez ainsi avancer en autonomie tout en gardant la possibilité de demander un accompagnement plus poussé si nécessaire."
            : "This way you can progress autonomously while still having the option to ask for deeper guidance if needed."}
        </p>
      </div>
    </section>
  );
}