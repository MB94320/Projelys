import Image from "next/image";
import { Lang } from "./marketing-content";

function Marker({
  tone,
  title,
  text,
}: {
  tone: "sky" | "emerald" | "amber" | "rose";
  title: string;
  text: string;
}) {
  const styles = {
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  };

  return (
    <div className="mt-5 flex items-start gap-3">
      <div
        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-950 dark:text-white">
          {title}
        </div>
        <p className="mt-1 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {text}
        </p>
      </div>
    </div>
  );
}

export default function FeaturesStoryBands({ lang }: { lang: Lang }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-6 pb-16">
      <div className="grid gap-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Image
              src="/Screen/Projet-Unique.jpg"
              alt={lang === "fr" ? "Pilotage projet" : "Project delivery"}
              width={1600}
              height={950}
              className="h-auto w-full object-cover"
            />
          </div>

          <div>
            <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              {lang === "fr" ? "Exécution projet" : "Project execution"}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
              {lang === "fr"
                ? "Passez d’une vue d’ensemble à un pilotage projet détaillé."
                : "Move from global oversight to detailed project delivery."}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "Projelys permet de suivre les projets individuellement avec leurs jalons, leur contexte, leurs informations utiles et leur lecture opérationnelle."
                : "Projelys lets you monitor individual projects with milestones, context and operational visibility."}
            </p>

            <Marker
              tone="sky"
              title={lang === "fr" ? "Vue exploitable" : "Actionable view"}
              text={
                lang === "fr"
                  ? "Accédez rapidement aux informations qui servent réellement au pilotage."
                  : "Quickly access the information that truly supports delivery management."
              }
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {lang === "fr" ? "Planning & jalons" : "Planning & milestones"}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
              {lang === "fr"
                ? "Sécurisez vos échéances avec une lecture claire du planning."
                : "Secure deadlines with a clearer planning view."}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "Les vues Gantt donnent une lecture immédiate de l’avancement, des séquences de travail et des points de vigilance."
                : "Gantt views provide immediate clarity on progress, sequencing and delivery watchpoints."}
            </p>

            <Marker
              tone="emerald"
              title={lang === "fr" ? "Repères visuels" : "Visual checkpoints"}
              text={
                lang === "fr"
                  ? "Identifiez plus vite les décalages, dépendances et échéances sensibles."
                  : "Identify delays, dependencies and sensitive deadlines more quickly."
              }
            />
          </div>

          <div className="order-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:order-2">
            <Image
              src="/Screen/Projet-Unique-Gantt.jpg"
              alt={lang === "fr" ? "Vue Gantt" : "Gantt view"}
              width={1600}
              height={950}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Image
              src="/Screen/Perfiormance-radar.jpg"
              alt={lang === "fr" ? "Vue performance" : "Performance view"}
              width={1600}
              height={950}
              className="h-auto w-full object-cover"
            />
          </div>

          <div>
            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              {lang === "fr" ? "Performance & lecture décisionnelle" : "Performance & decision support"}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
              {lang === "fr"
                ? "Donnez plus de relief à vos KPI et tableaux d’analyse."
                : "Give more impact to your KPIs and analysis views."}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "Projelys aide à transformer les indicateurs en lecture utile pour piloter, arbitrer et communiquer avec les parties prenantes."
                : "Projelys helps turn indicators into useful decision material for leadership and teams."}
            </p>

            <Marker
              tone="amber"
              title={lang === "fr" ? "Lecture immédiate" : "Immediate readability"}
              text={
                lang === "fr"
                  ? "Des vues plus visuelles pour mieux comprendre les signaux faibles et les écarts."
                  : "More visual views to better understand weak signals and gaps."
              }
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {lang === "fr" ? "Qualité & satisfaction" : "Quality & satisfaction"}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
              {lang === "fr"
                ? "Reliez conformité, objectifs qualité et perception de la performance."
                : "Connect compliance, quality targets and performance perception."}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "Projelys permet de suivre la qualité dans une logique plus opérationnelle, plus lisible et plus durable."
                : "Projelys gives quality follow-up a more operational, readable and durable structure."}
            </p>

            <Marker
              tone="rose"
              title={lang === "fr" ? "Objectifs visibles" : "Visible targets"}
              text={
                lang === "fr"
                  ? "Suivez les objectifs qualité, les tendances et les axes d’amélioration dans la continuité."
                  : "Track quality targets, trends and improvement areas over time."
              }
            />
          </div>

          <div className="order-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:order-2">
            <Image
              src="/Screen/Quality-target.jpg"
              alt={lang === "fr" ? "Objectifs qualité" : "Quality targets"}
              width={1600}
              height={950}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}