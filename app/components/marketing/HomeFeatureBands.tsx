import Image from "next/image";
import Link from "next/link";
import { Lang } from "./marketing-content";

function FeatureMarker({
  color,
  title,
  text,
}: {
  color: "sky" | "emerald" | "amber" | "rose";
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
        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles[color]}`}
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

export default function HomeFeatureBands({ lang }: { lang: Lang }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="max-w-3xl">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
          {lang === "fr" ? "Fonctionnalités clés" : "Key capabilities"}
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white md:text-4xl">
          {lang === "fr"
            ? "Des vues concrètes pour piloter du commerce jusqu’à l’exécution."
            : "Concrete views to manage work from pipeline to execution."}
        </h2>
      </div>

      <div className="mt-10 grid gap-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Image
              src="/Screen/Projet-Global.jpg"
              alt={lang === "fr" ? "Vue portefeuille projet" : "Project portfolio view"}
              width={1600}
              height={950}
              className="h-auto w-full object-cover"
            />
          </div>

          <div>
            <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
              {lang === "fr" ? "Pilotage global" : "Global oversight"}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
              {lang === "fr"
                ? "Suivez l’ensemble de votre portefeuille en un coup d’œil."
                : "Track your full portfolio at a glance."}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "Projelys rassemble les projets, l’avancement, les priorités, les alertes et les décisions à arbitrer dans une vue claire pour les managers, PMO et directions."
                : "Projelys brings projects, progress, priorities, alerts and arbitration items together in a clear view for managers, PMOs and leadership."}
            </p>

            <FeatureMarker
              color="sky"
              title={
                lang === "fr" ? "Lecture consolidée" : "Consolidated visibility"
              }
              text={
                lang === "fr"
                  ? "Centralisez les informations clés sans passer d’un outil à l’autre."
                  : "Centralize key information without jumping between tools."
              }
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {lang === "fr" ? "Charge & ressources" : "Workload & resources"}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
              {lang === "fr"
                ? "Anticipez les tensions de capacité avant qu’elles ne bloquent les projets."
                : "Spot capacity tensions before they block delivery."}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "Les vues de charge permettent de visualiser les ressources, les surcharges et les arbitrages nécessaires pour garder un pilotage réaliste."
                : "Workload views help you visualize resources, overloads and required trade-offs to keep planning realistic."}
            </p>

            <FeatureMarker
              color="emerald"
              title={lang === "fr" ? "Décisions réalistes" : "Realistic planning"}
              text={
                lang === "fr"
                  ? "Repérez rapidement les charges critiques et sécurisez l’exécution."
                  : "Spot critical workload pressure quickly and protect delivery."
              }
            />
          </div>

          <div className="order-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:order-2">
            <Image
              src="/Screen/Plan-de-Charge-Recommandation.jpg"
              alt={lang === "fr" ? "Vue plan de charge" : "Workload planning view"}
              width={1600}
              height={950}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              {lang === "fr" ? "Risques & opportunités" : "Risks & opportunities"}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
              {lang === "fr"
                ? "Maîtrisez les risques et opportunités sans perdre le fil."
                : "Stay on top of risks and opportunities."}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "Visualisez l’exposition, priorisez les traitements et gardez les actions associées dans le même environnement."
                : "Visualize exposure, prioritize treatment plans and keep linked actions in the same environment."}
            </p>

            <FeatureMarker
              color="amber"
              title={lang === "fr" ? "Priorisation claire" : "Clear prioritization"}
              text={
                lang === "fr"
                  ? "Transformez la matrice de risques en décisions concrètes et suivies."
                  : "Turn your risk matrix into clear and actionable decisions."
              }
            />
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Image
              src="/Screen/Matrice-de-Risques.jpg"
              alt={lang === "fr" ? "Matrice de risques" : "Risk matrix"}
              width={1200}
              height={900}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:items-center">
          <div className="order-2 lg:order-1 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <Image
              src="/Screen/Audit-Qualité.jpg"
              alt={lang === "fr" ? "Audit qualité" : "Quality audit"}
              width={1200}
              height={900}
              className="h-auto w-full object-cover"
            />
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {lang === "fr" ? "Qualité & conformité" : "Quality & compliance"}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
              {lang === "fr"
                ? "Pilotez qualité, audits et conformité dans la durée."
                : "Drive quality, audits and compliance over time."}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
              {lang === "fr"
                ? "Suivez les audits, objectifs qualité, non-conformités et plans d’actions avec une lecture exploitable au quotidien."
                : "Track audits, quality targets, non-conformities and action plans with an operational view."}
            </p>

            <FeatureMarker
              color="rose"
              title={lang === "fr" ? "Traçabilité durable" : "Sustainable traceability"}
              text={
                lang === "fr"
                  ? "Gardez une vision exploitable de vos écarts, audits et actions correctives."
                  : "Keep a usable view of deviations, audits and corrective actions."
              }
            />
          </div>
        </div>

        <div className="pt-2">
          <Link
            href={`/site/features?lang=${lang}`}
            className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {lang === "fr" ? "Découvrir les fonctionnalités" : "Explore features"}
          </Link>
        </div>
      </div>
    </section>
  );
}