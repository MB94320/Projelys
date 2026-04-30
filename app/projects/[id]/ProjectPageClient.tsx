"use client";

import { useState } from "react";
import Link from "next/link";
import ProjectEditClient from "./ProjectEditClient";
import ProjectTasksClient from "./ProjectTasksClient";
import ProjectWeeklyLoadChart from "./ProjectWeeklyLoadChart";
import { ExportPdfButton } from "./ExportPdfButton";

/* === CONFIG COULEURS & CONSTANTES === */

const riskColors: Record<string, string> = {
  Négligeable:
    "bg-indigo-100 text-indigo-700 border border-indigo-200",
  Significatif:
    "bg-amber-100 text-amber-700 border border-amber-200",
  Critique: "bg-rose-100 text-rose-700 border border-rose-200",
  Inacceptable: "bg-red-100 text-red-700 border border-red-200",
};

const statusColors: Record<string, string> = {
  Planifié: "bg-indigo-100 text-indigo-700",
  "En cours": "bg-amber-100 text-amber-700",
  Terminé: "bg-emerald-100 text-emerald-700",
  Annulé: "bg-slate-100 text-slate-700",
};

const riskOrder: string[] = [
  "Négligeable",
  "Significatif",
  "Critique",
  "Inacceptable",
];

const statusOrder: string[] = [
  "Ouvert",
  "En cours",
  "Traité",
  "Clos",
  "Accepté",
];

const riskStatusColors: Record<string, string> = {
  Ouvert: "bg-rose-100 text-rose-700 border border-rose-200",
  "En cours": "bg-amber-100 text-amber-700 border border-amber-200",
  Traité: "bg-sky-100 text-sky-700 border border-sky-200",
  Clos: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Accepté: "bg-slate-100 text-slate-700 border border-slate-200",
};

// couleurs barre criticité
const riskLevelBarColors: Record<string, string> = {
  Négligeable: "bg-indigo-400",
  Significatif: "bg-amber-400",
  Critique: "bg-rose-400",
  Inacceptable: "bg-red-500",
};

type SCurvePoint = {
  label: string;
  date: Date;
  cbtp: number;
  crte: number;
  cbte: number;
};

type ProjectPageClientProps = {
  project: any;
};

/* === HELPERS === */

function hasHighRisk(p: any): boolean {
  return (
    p.riskCriticality === "Critique" ||
    p.riskCriticality === "Inacceptable"
  );
}

function getWeekKey(d: Date) {
  const date = new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(
    Date.UTC(date.getUTCFullYear(), 0, 1),
  );
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return {
    year: date.getUTCFullYear(),
    week,
    key: `${date.getUTCFullYear()}-S${String(week).padStart(2, "0")}`,
  };
}

const colorByRate = (v?: number | null) => {
  if (v == null) return "text-slate-600";
  if (v >= 95) return "text-emerald-600";
  if (v >= 80) return "text-amber-600";
  return "text-rose-600";
};

/* === COMPOSANT PRINCIPAL === */

export default function ProjectPageClient({ project }: ProjectPageClientProps) {
  const projectId = project.id;
  const id = projectId.toString();
  const today = new Date();

  const [activeTab, setActiveTab] = useState<"info" | "tasks">("info");

  /* --- Données risques & opportunités --- */

  const risksAll = (project.risks ?? []) as any[];

  const risks = risksAll.filter((r) => r.nature === "Risque");
  const opportunities = risksAll.filter((r) => r.nature === "Opportunité");

  const totalRisks = risks.length;

  const totalPotentialImpact = risks.reduce(
    (sum, r) =>
      sum +
      (r.updatePotentialImpact ??
        r.initialPotentialImpact ??
        0),
    0,
  );

  const totalValuatedImpact = risks.reduce(
    (sum, r) =>
      sum +
      (r.updateValuatedImpact ??
        r.initialValuatedImpact ??
        0),
    0,
  );

  const highRiskCount = risks.filter((r) => {
    const lvl = r.updateLevel ?? r.initialLevel ?? null;
    return lvl === "Critique" || lvl === "Inacceptable";
  }).length;

  const totalOpp = opportunities.length;
  const oppMotivant = opportunities.filter(
    (o) =>
      (o.updateLevel ?? o.initialLevel) === "Motivant",
  ).length;
  const oppANePasRater = opportunities.filter(
    (o) =>
      (o.updateLevel ?? o.initialLevel) === "A ne pas rater",
  ).length;

  const riskStatusCounts: Record<string, number> = {};
  const riskLevelCounts: Record<string, number> = {};
  for (const r of risks) {
    const status = r.status ?? "Ouvert";
    riskStatusCounts[status] = (riskStatusCounts[status] ?? 0) + 1;

    const level = r.updateLevel ?? r.initialLevel ?? "Non défini";
    riskLevelCounts[level] = (riskLevelCounts[level] ?? 0) + 1;
  }

  const totalStatus = Object.values(riskStatusCounts).reduce(
    (s, v) => s + v,
    0,
  );
  const totalLevels = Object.values(riskLevelCounts).reduce(
    (s, v) => s + v,
    0,
  );

  /* --- Données planning & charge --- */

  const allTaskDates: Date[] = project.tasks
    .flatMap((t: any) => [
      t.startDate ? new Date(t.startDate) : null,
      t.endDate ? new Date(t.endDate) : null,
    ])
    .filter((d: Date): d is Date => d !== null);

  const startDateFromTasks: Date | null =
    allTaskDates.length > 0
      ? new Date(
          Math.min(
            ...allTaskDates.map((d: Date) => d.getTime()),
          ),
        )
      : null;

  const endDateFromTasks: Date | null =
    allTaskDates.length > 0
      ? new Date(
          Math.max(
            ...allTaskDates.map((d: Date) => d.getTime()),
          ),
        )
      : null;

  const start: Date | null =
    startDateFromTasks ??
    (project.startDate ? new Date(project.startDate) : null);

  const end: Date | null =
    endDateFromTasks ??
    (project.estimatedDate ? new Date(project.estimatedDate) : null);

  const plannedHours: number =
    project.tasks.reduce(
      (s: number, t: any) => s + (t.plannedWorkHours ?? 0),
      0,
    ) || 0;

  const consumedHours: number =
    project.tasks.reduce(
      (s: number, t: any) => s + (t.consumedWorkHours ?? 0),
      0,
    ) || 0;

  const remainingHours = plannedHours - consumedHours;

  const totalDurationDays: number | null =
    start && end
      ? Math.max(
          1,
          Math.round(
            (end.getTime() - start.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null;

  const elapsedDays: number | null =
    start && totalDurationDays
      ? Math.min(
          totalDurationDays,
          Math.max(
            0,
            Math.round(
              (today.getTime() - start.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          ),
        )
      : null;

  const elapsedRatio: number | null =
    totalDurationDays && elapsedDays
      ? Math.round((elapsedDays / totalDurationDays) * 100)
      : null;

  /* --- Progression et synthèse --- */

  const totalPlannedForProgress = project.tasks.reduce(
    (s: number, t: any) => s + (t.plannedWorkHours ?? 0),
    0,
  );

  const weightedProgress: number =
    totalPlannedForProgress > 0
      ? Math.round(
          project.tasks.reduce(
            (s: number, t: any) =>
              s +
              (t.progressPercent ?? 0) *
                (t.plannedWorkHours ?? 0),
            0,
          ) / totalPlannedForProgress,
        )
      : project.progressPercent ?? 0;

  const progress = weightedProgress;
  const progressVsTimeDelta: number | null =
    elapsedRatio !== null ? progress - elapsedRatio : null;

  const revenue = 0;
  const costs = 0;
  const margin = revenue - costs;
  const marginRate =
    revenue > 0 ? Math.round((margin / revenue) * 100) : null;

  const progressColor =
    progress >= 90
      ? "text-emerald-600"
      : progress >= 60
      ? "text-sky-600"
      : progress >= 30
      ? "text-amber-600"
      : "text-rose-600";

  const riskBadgeClass =
    project.riskCriticality && riskColors[project.riskCriticality]
      ? riskColors[project.riskCriticality]
      : "bg-slate-100 text-slate-700 border border-slate-200";

  const statusBadgeClass =
    project.status && statusColors[project.status]
      ? statusColors[project.status]
      : "bg-slate-100 text-slate-700";

  const loadProgress: number =
    plannedHours > 0
      ? Math.round((consumedHours / plannedHours) * 100)
      : 0;

  const sCurveDelta: number = progress - loadProgress;

  let sCurveKpiLabel =
    "Valeur créée cohérente avec la charge consommée.";
  let sCurveKpiColor = "text-slate-600";
  let sCurveKpiBadge =
    "bg-slate-100 text-slate-700 border border-slate-200";

  if (plannedHours > 0) {
    if (sCurveDelta >= 5) {
      sCurveKpiLabel =
        "Valeur créée supérieure à la charge consommée (tendance favorable).";
      sCurveKpiColor = "text-emerald-600";
      sCurveKpiBadge =
        "bg-emerald-50 text-emerald-700 border border-emerald-200";
    } else if (sCurveDelta <= -5) {
      sCurveKpiLabel =
        "Charge consommée supérieure à la valeur créée (risque de dérive coûts / délais).";
      sCurveKpiColor = "text-rose-600";
      sCurveKpiBadge =
        "bg-rose-50 text-rose-700 border border-rose-200";
    }
  }

  /* --- Recommandations --- */

  const recommendations: string[] = [];
  const hasDelay =
    progressVsTimeDelta !== null && progressVsTimeDelta <= -5;

  if (hasDelay) {
    recommendations.push(
      "Projet en retard par rapport au temps écoulé : analyser la charge, ajuster les priorités ou revoir la date d’échéance.",
    );
  }
  if (hasHighRisk(project)) {
    recommendations.push(
      "Risque élevé : prévoir un point spécifique en comité, formaliser un plan de mitigation et des actions dans le plan d’actions.",
    );
  }
  if (remainingHours < 0) {
    recommendations.push(
      "Surconsommation de charge : vérifier le périmètre, renégocier éventuellement le budget ou réallouer des ressources.",
    );
  }
  if (recommendations.length === 0) {
    if (project.comments && project.comments.trim().length > 0) {
      recommendations.push(project.comments.trim());
    } else {
      recommendations.push(
        "Aucune alerte majeure détectée sur ce projet. Continuer le pilotage régulier et la mise à jour des données.",
      );
    }
  }

  /* --- Données charge hebdo & courbe en S --- */

  const weeklyLoadsRaw: {
    weekKey: string;
    year: number;
    week: number;
    planned: number;
    consumed: number;
    resourceName: string | null;
  }[] = (() => {
    if (!project.tasks || project.tasks.length === 0) return [];

    const list: {
      weekKey: string;
      year: number;
      week: number;
      planned: number;
      consumed: number;
      resourceName: string | null;
    }[] = [];

    for (const t of project.tasks as any[]) {
      if (!t.startDate && !t.endDate) continue;
      const baseDate = t.startDate
        ? new Date(t.startDate)
        : new Date(t.endDate);
      const { year, week, key } = getWeekKey(baseDate);

      list.push({
        weekKey: key,
        year,
        week,
        planned: t.plannedWorkHours ?? 0,
        consumed: t.consumedWorkHours ?? 0,
        resourceName: t.assigneeName ?? "Non affectée",
      });
    }

    return list;
  })();

  const sCurvePoints: SCurvePoint[] = (() => {
    if (!start || !end || plannedHours <= 0) {
      return [
        { label: "Début", date: today, cbtp: 0, crte: 0, cbte: 0 },
        { label: "25 %", date: today, cbtp: 0, crte: 0, cbte: 0 },
        { label: "50 %", date: today, cbtp: 0, crte: 0, cbte: 0 },
        { label: "75 %", date: today, cbtp: 0, crte: 0, cbte: 0 },
        { label: "Fin", date: today, cbtp: 0, crte: 0, cbte: 0 },
      ];
    }

    const startTime = start.getTime();
    const endTime = end.getTime();
    const totalMs = endTime - startTime || 1;

    const ratios = [0, 0.25, 0.5, 0.75, 1];
    const labels = ["Début", "25 %", "50 %", "75 %", "Fin"];

    const tasks = project.tasks as any[];

    return ratios.map((r, idx) => {
      const t = startTime + r * totalMs;
      const date = new Date(t);

      const cbtp = Math.round(r * 100);

      let consumedAtDate = 0;
      for (const task of tasks) {
        if (!task.startDate && !task.endDate) continue;
        const taskEnd = task.endDate
          ? new Date(task.endDate).getTime()
          : new Date(task.startDate).getTime();
        if (taskEnd <= t) {
          consumedAtDate += task.consumedWorkHours ?? 0;
        }
      }
      const crte = Math.max(
        0,
        Math.min(
          100,
          plannedHours > 0
            ? Math.round((consumedAtDate / plannedHours) * 100)
            : 0,
        ),
      );

      const timeRatio = (t - startTime) / totalMs;
      const cbte = Math.max(
        0,
        Math.min(
          100,
          Math.round(progress * timeRatio),
        ),
      );

      return {
        label: labels[idx],
        date,
        cbtp,
        crte,
        cbte,
      };
    });
  })();

  let sCurveMessage =
    "Données insuffisantes pour analyser la courbe en S.";
  if (plannedHours > 0) {
    if (sCurveDelta >= 5) {
      sCurveMessage =
        "Le projet crée plus de valeur que la charge consommée : tendance favorable (valeur acquise au-dessus des coûts réels).";
    } else if (sCurveDelta <= -5) {
      sCurveMessage =
        "Le projet consomme plus de charge que la valeur créée : risque de dérive coûts / délais, surveiller les écarts.";
    } else {
      sCurveMessage =
        "Valeur créée cohérente avec la charge consommée : situation globalement maîtrisée.";
    }
  }

  // --- KPIs qualité issus de Project ---
  const deliverablesCount = project.deliverablesCount ?? 0;
  const deliveredCount = project.deliveredCount ?? 0;
  const otdRate = project.deliverablesOtdRate ?? 0;
  const dodRate = project.deliverablesDodRate ?? 0;
  const oqdRate = project.deliverablesOqdRate ?? 0;

  const ncTotal = project.nonConformitiesCount ?? 0;
  const ncOpen = project.openNonConformitiesCount ?? 0;
  const criticalNcRate = project.criticalNcRate ?? 0;
  const avgNcClosureDelayDays =
    project.avgNcClosureDelayDays ?? 0;

  const previousAuditRate = project.previousAuditRate ?? 0;
  const currentAuditRate = project.currentAuditRate ?? 0;

  return (
    <>
      {/* Bandeau haut : fiche + statut + boutons globaux */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-row items-center gap-4 text-xs text-slate-500">
          <span>Fiche projet</span>
          {project.status && (
            <span
              className={`0.5 text-[10px] font-medium ${statusBadgeClass}`}
            >
              {project.status}
            </span>
          )}
        </div>
      </div>

      {/* Retour + boutons Refresh / Export */}
      <div className="mb-4 flex items-center justify-between text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/projects"
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
          >
            ← Retour portefeuille
          </Link>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
          >
            <span className="text-sm">⟳</span>
            <span>Rafraîchir</span>
          </button>

          <ExportPdfButton projectId={projectId} />
        </div>
      </div>

      {/* LIGNE 1 : Synthèse / Synthèse projet / Liens rapides */}
      <div className="py-1.5 mb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Bloc Synthèse & recommandations */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs">
              !
            </span>
            <h2 className="text-sm font-semibold text-slate-900">
              Synthèse et recommandations
            </h2>
          </div>

          <div className="mb-2 text-[11px] text-slate-600">
            Vue rapide des points de vigilance et des actions à prioriser.
          </div>

          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-700">
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
            {/* Sous-bloc situation globale coloré */}
            <div
              className={
                "rounded-md p-2 " +
                (progress >= 80 && !hasHighRisk(project)
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-amber-50 border border-amber-200")
              }
            >
              <div className="font-semibold text-slate-700 mb-0.5">
                Situation globale
              </div>
              <div className="text-[10px] text-slate-600">
                {progress >= 80 && !hasHighRisk(project)
                  ? "Projet plutôt maîtrisé, poursuivre le pilotage standard."
                  : "Points de vigilance identifiés, suivre les recommandations ci‑dessus."}
              </div>
            </div>

            {/* Sous-bloc prochaine étape coloré */}
            <div
              className={
                "rounded-md p-2 " +
                (hasHighRisk(project)
                  ? "bg-rose-50 border border-rose-200"
                  : "bg-sky-50 border border-sky-200")
              }
            >
              <div className="font-semibold text-slate-700 mb-0.5">
                Prochaine étape
              </div>
              <div className="text-[10px] text-slate-600">
                {hasHighRisk(project)
                  ? "Prévoir un point spécifique sur les risques en comité projet."
                  : "Mettre à jour les tâches et la charge pour fiabiliser le pilotage."}
              </div>
            </div>
          </div>
        </div>

        {/* Bloc Synthèse du projet */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Synthèse du projet
            </h2>
          </div>
          <div className="flex gap-4 items-center">
            <div className="relative h-24 w-24 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-24 w-24">
                <path
                  className="text-slate-200"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                />
                <path
                  className="text-emerald-500"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${progress},100`}
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-semibold ${progressColor}`}>
                  {progress}%
                </span>
                <span className="text-[10px] text-slate-500">
                  Avancement
                </span>
              </div>
            </div>

            <div className="flex-1 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Statut</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass}`}
                >
                  {project.status ?? "Non renseigné"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Criticité / risque</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${riskBadgeClass}`}
                >
                  {project.riskCriticality ?? "Non renseigné"}
                </span>
              </div>
              {progressVsTimeDelta !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">
                    Avancement vs. temps
                  </span>
                  <span
                    className={
                      progressVsTimeDelta >= 5
                        ? "text-emerald-600 font-semibold"
                        : progressVsTimeDelta <= -5
                        ? "text-rose-600 font-semibold"
                        : "text-slate-600"
                    }
                  >
                    {progressVsTimeDelta > 0 ? "+" : ""}
                    {progressVsTimeDelta} pts
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Courbe en S</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sCurveKpiBadge}`}
                >
                  <span className={sCurveKpiColor}>
                    {sCurveDelta > 0 ? "+" : ""}
                    {sCurveDelta} pts
                  </span>
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                {sCurveKpiLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Pilotage & liens rapides du projet */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Pilotage et liens rapides du projet
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <Link
              href={`/projects/${id}/gantt`}
              className="flex items-center justify-between rounded-md border border-indigo-200 px-3 py-2 bg-indigo-50 hover:bg-indigo-100"
            >
              <span>Planning Gantt</span>
            </Link>

            <Link
              href={`/projects/${id}/quality/deliverables`}
              className="flex items-center justify-between rounded-md border border-emerald-200 px-3 py-2 bg-emerald-50 hover:bg-emerald-100"
            >
              <span>Livrables</span>
            </Link>

            <Link
              href={`/projects/${id}/quality/non-conformities`}
              className="flex items-center justify-between rounded-md border border-rose-200 px-3 py-2 bg-rose-50 hover:bg-rose-100"
            >
              <span>Non-conformités</span>
            </Link>

            <Link
              href={`/projects/${id}/quality/audit`}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 bg-slate-50 hover:bg-slate-100"
            >
              <span>Audits</span>
            </Link>

            <Link
              href={`/projects/${id}/risks`}
              className="flex items-center justify-between rounded-md border border-amber-200 px-3 py-2 bg-amber-50 hover:bg-amber-100"
            >
              <span>Risques</span>
            </Link>

            <Link
              href={`/actions?projectId=${id}`}
              className="flex items-center justify-between rounded-md border border-fuchsia-200 px-3 py-2 bg-fuchsia-50 hover:bg-fuchsia-100"
            >
              <span>Actions</span>
            </Link>

            <Link
              href={`/projects/${id}/presales`}
              className="flex items-center justify-between rounded-md border border-sky-200 px-3 py-2 bg-sky-50 hover:bg-sky-100"
            >
              <span>Avant-vente</span>
            </Link>

            <Link
              href={`/projects/${id}/finance`}
              className="flex items-center justify-between rounded-md border border-emerald-200 px-3 py-2 bg-emerald-50 hover:bg-emerald-100"
            >
              <span>Financier</span>
            </Link>
          </div>
        </div>
      </div>

      {/* LIGNE 2 : Données financières / Cadre planning / Charge projet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Données financières */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Données financière (issue de l’AVV)
          </h2>
          <div className="text-xs text-slate-500 mb-2">
            CA, coûts, marge et % de marge seront récupérés dès que les
            données financières avant-vente seront branchées.
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">Revenu</div>
              <div className="text-sm font-semibold text-slate-800">
                {revenue.toLocaleString("fr-FR")} €
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">Coûts</div>
              <div className="text-sm font-semibold text-slate-800">
                {costs.toLocaleString("fr-FR")} €
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">Marge</div>
              <div className="text-sm font-semibold text-slate-800">
                {margin.toLocaleString("fr-FR")} €
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Taux de marge
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {marginRate !== null ? `${marginRate} %` : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Cadre planning */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Cadre planning
          </h2>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Date de début</span>
              <span className="font-semibold">
                {start
                  ? start.toLocaleDateString("fr-FR")
                  : "Non renseignée"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Date d’échéance</span>
              <span className="font-semibold">
                {end
                  ? end.toLocaleDateString("fr-FR")
                  : "Non renseignée"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Durée totale (jours)</span>
              <span className="font-semibold">
                {totalDurationDays ?? "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Jours écoulés</span>
              <span className="font-semibold">
                {elapsedDays ?? "N/A"}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-[11px] text-slate-500 mb-1">
                Avancement du temps
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-2 bg-emerald-500"
                  style={{
                    width:
                      elapsedRatio !== null ? `${elapsedRatio}%` : "0%",
                  }}
                />
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Objectif&nbsp;: avancement projet ≥ avancement du temps
                pour rester dans le vert.
              </div>
            </div>
          </div>
        </div>

        {/* Charge projet */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Charge projet (heures)
          </h2>
          <div className="flex items-end gap-4 h-28 justify-center">
            <div className="flex flex-col items-center justify-end">
              <div className="relative w-6 h-20 bg-slate-100 rounded-full overflow-hidden flex items-end">
                <div
                  className="w-full bg-indigo-500"
                  style={{
                    height:
                      plannedHours > 0
                        ? `${Math.min(
                            100,
                            (plannedHours /
                              Math.max(
                                plannedHours,
                                consumedHours || 1,
                              )) * 100,
                          )}%`
                        : "5%",
                  }}
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-500 text-center">
                Prévu
                <br />
                <span className="font-semibold text-slate-700">
                  {plannedHours}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-end">
              <div className="relative w-6 h-20 bg-slate-100 rounded-full overflow-hidden flex items-end">
                <div
                  className="w-full bg-emerald-500"
                  style={{
                    height:
                      consumedHours > 0
                        ? `${Math.min(
                            100,
                            (consumedHours /
                              Math.max(
                                plannedHours || 1,
                                consumedHours,
                              )) * 100,
                          )}%`
                        : "5%",
                  }}
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-500 text-center">
                Consommé
                <br />
                <span className="font-semibold text-slate-700">
                  {consumedHours}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-1 text-[10px] text-slate-500">
            Objectif&nbsp;: charge consommée ≤ charge prévue.
          </div>
        </div>
      </div>

      {/* LIGNE 3 : Suivi livrables / NC / Audits (placeholder, valeurs 0 pour l’instant) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Suivi livrables */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Suivi livrables
            </h2>
            <Link
              href={`/projects/${id}/quality/deliverables`}
              className="text-[11px] text-indigo-600 hover:underline"
            >
              Voir la fiche livrables
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Nb de livrables
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {deliverablesCount}
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Livrables livrés
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {deliverablesCount}
              </div>
            </div>

            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">OTD</div>
              <div className={`text-sm font-semibold ${colorByRate(otdRate)}`}>
                {otdRate.toFixed(0)} %
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">DoD</div>
              <div className={`text-sm font-semibold ${colorByRate(dodRate)}`}>
                {dodRate.toFixed(0)} %
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2 col-span-2">
              <div className="text-[10px] text-slate-500">OQD</div>
              <div className={`text-sm font-semibold ${colorByRate(oqdRate)}`}>
                {oqdRate.toFixed(0)} %
              </div>
            </div>
          </div>
        </div>

        {/* Suivi des non-conformités */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Suivi des non-conformités
            </h2>
            <Link
              href={`/projects/${id}/quality/non-conformities`}
              className="text-[11px] text-indigo-600 hover:underline"
            >
              Voir la fiche non-conformités
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">NC totales</div>
              <div className="text-sm font-semibold text-slate-800">
                {ncTotal}
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">NC ouvertes</div>
              <div className="text-sm font-semibold text-slate-800">
                {ncOpen}
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                % NC critiques
              </div>
              <div className={`text-sm font-semibold ${colorByRate(100 - criticalNcRate)}`}>
                {criticalNcRate.toFixed(0)} %
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Délai moyen de clôture
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {avgNcClosureDelayDays.toFixed(0)} j
              </div>
            </div>
          </div>
        </div>

        {/* Suivi des audits */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Suivi des audits
            </h2>
            <Link
              href={`/projects/${id}/quality/audit`}
              className="text-[11px] text-indigo-600 hover:underline"
            >
              Voir la fiche audits
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Taux global précédent
              </div>
              <div className={`text-sm font-semibold ${colorByRate(previousAuditRate)}`}>
                {previousAuditRate.toFixed(0)} %
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Taux global actuel
              </div>
              <div className={`text-sm font-semibold ${colorByRate(currentAuditRate)}`}>
                {currentAuditRate.toFixed(0)} %
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Risques & opportunités du projet */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Synthèse risques */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Risques du projet
            </h2>
            <Link
              href={`/projects/${id}/risks`}
              className="text-[11px] text-indigo-600 hover:underline"
            >
              Voir la fiche risques
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Nombre de risques
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {totalRisks}
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Risques critiques
              </div>
              <div className="text-sm font-semibold text-rose-700">
                {highRiskCount}
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Impact potentiel total
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {totalPotentialImpact.toLocaleString("fr-FR")} €
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Impact valorisé total
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {totalValuatedImpact.toLocaleString("fr-FR")} €
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            L’impact potentiel correspond au scénario «&nbsp;si le risque se
            réalise&nbsp;». L’impact valorisé rapproche ce montant de la
            probabilité et de la criticité.
          </p>
        </div>

        {/* Synthèse opportunités */}
        <div className="bg-white rounded-lg shadow-sm border border-emerald-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Opportunités du projet
          </h2>
          <div className="flex flex-col gap-2 text-xs">
            <div className="bg-emerald-50 rounded-md p-2">
              <div className="text-[10px] text-emerald-700">
                Nombre d’opportunités
              </div>
              <div className="text-sm font-semibold text-emerald-800">
                {totalOpp}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-md p-2">
              <div className="text-[10px] text-emerald-700">
                Motivantes
              </div>
              <div className="text-sm font-semibold text-emerald-800">
                {oppMotivant}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-md p-2 col-span-2">
              <div className="text-[10px] text-emerald-700">
                À ne pas rater
              </div>
              <div className="text-sm font-semibold text-emerald-800">
                {oppANePasRater}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Les opportunités prises en compte sont : «&nbsp;Motivant&nbsp;» et «&nbsp;À ne pas
            rater&nbsp;».
          </p>
        </div>

        {/* Répartition par statut des risques */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Répartition par statut
            </h2>
          </div>
          <div className="mt-2 h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {statusOrder.map((st: string) => {
              const count = riskStatusCounts[st] ?? 0;
              if (!totalStatus || count === 0) return null;
              const width = (count / totalStatus) * 100;
              return (
                <div
                  key={st}
                  className={`h-full ${riskStatusColors[st] ?? ""}`}
                  style={{ width: `${width}%` }}
                  title={`${st} : ${count}`}
                />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            {statusOrder.map((st: string) => (
              <div key={st} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    riskStatusColors[st]?.split(" ")[0] ??
                    "bg-slate-200"
                  }`}
                />
                <span className="truncate">{st}</span>
                <span className="ml-auto font-medium">
                  {riskStatusCounts[st] ?? 0}
                </span>
              </div>
            ))}
          </div>
          <span className="text-[11px] text-slate-500">
            {totalStatus} risque(s)
          </span>
          <p className="mt-2 text-[10px] text-slate-500">
            Les statuts ne concernent que les risques du projet (hors
            opportunités).
          </p>
        </div>

        {/* Répartition par criticité des risques */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Répartition par criticité
            </h2>
          </div>
          <div className="mt-2 h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {riskOrder.map((rk: string) => {
              const count = riskLevelCounts[rk] ?? 0;
              if (!totalLevels || count === 0) return null;
              const width = (count / totalLevels) * 100;
              const cls = riskLevelBarColors[rk] ?? "bg-slate-300";
              return (
                <div
                  key={rk}
                  className={`h-full ${cls}`}
                  style={{ width: `${width}%` }}
                  title={`${rk} : ${count}`}
                />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            {riskOrder.map((rk: string) => (
              <div key={rk} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    riskLevelBarColors[rk] ?? "bg-slate-300"
                  }`}
                />
                <span className="truncate">{rk}</span>
                <span className="ml-auto font-medium">
                  {riskLevelCounts[rk] ?? 0}
                </span>
              </div>
            ))}
          </div>
          <span className="text-[11px] text-slate-500">
            {totalLevels} risque(s)
          </span>
          <p className="mt-2 text-[10px] text-slate-500">
            Criticité basée sur le niveau mis à jour si présent, sinon
            sur la criticité initiale.
          </p>
        </div>
      </div>

      {/* Charge hebdo + courbe en S */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectWeeklyLoadChart weeklyLoadsRaw={weeklyLoadsRaw} />

        {/* Courbe en S (graphique + analyse) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Courbe en S
          </h2>
          <p className="text-[10px] text-slate-500 mb-2">
            CBTP (prévu), CRTE (réel) et CBTE (valeur acquise) en % cumulés
            sur la durée du projet.
          </p>

          <div className="rounded-md border border-slate-200 bg-white mb-3 px-3 py-2 overflow-hidden">
            {plannedHours <= 0 ? (
              <div className="h-32 flex items-center justify-center">
                <span className="text-[11px] text-slate-400">
                  Renseigne des charges prévues et consommées pour afficher
                  la courbe en S.
                </span>
              </div>
            ) : (
              <>
                <div className="h-32 flex items-center justify-center">
                  <svg viewBox="0 0 120 80" className="w-full h-full">
                    {(() => {
                      const xMin = 12;
                      const xMax = 112;
                      const yMin = 12;
                      const yMax = 68;
                      const xSpan = xMax - xMin;
                      const ySpan = yMax - yMin;
                      const clamp = (v: number) =>
                        Math.max(0, Math.min(100, v));
                      const n = sCurvePoints.length || 1;

                      return (
                        <>
                          {/* Axes */}
                          <line
                            x1={xMin}
                            y1={yMax}
                            x2={xMax}
                            y2={yMax}
                            stroke="#cbd5f5"
                            strokeWidth="0.6"
                          />
                          <line
                            x1={xMin}
                            y1={yMin}
                            x2={xMin}
                            y2={yMax}
                            stroke="#cbd5f5"
                            strokeWidth="0.6"
                          />

                          {/* Graduations Y */}
                          {[0, 25, 50, 75, 100].map((v) => {
                            const y =
                              yMax - (clamp(v) / 100) * ySpan;
                            return (
                              <g key={v}>
                                <line
                                  x1={xMin}
                                  y1={y}
                                  x2={xMax}
                                  y2={y}
                                  stroke="#e5e7eb"
                                  strokeWidth="0.3"
                                />
                                <text
                                  x={xMin - 4}
                                  y={y + 2}
                                  fontSize="4"
                                  fill="#6b7280"
                                  textAnchor="end"
                                >
                                  {v}
                                </text>
                              </g>
                            );
                          })}

                          {/* Courbes */}
                          {(["cbtp", "crte", "cbte"] as const).map(
                            (key) => {
                              const color =
                                key === "cbtp"
                                  ? "#6366f1"
                                  : key === "crte"
                                  ? "#10b981"
                                  : "#f97316";
                              const dash =
                                key === "cbtp"
                                  ? ""
                                  : key === "crte"
                                  ? "2 2"
                                  : "4 2";

                              const points = sCurvePoints
                                .map((p, i) => {
                                  const ratio =
                                    n === 1 ? 0 : i / (n - 1);
                                  const x =
                                    xMin + ratio * xSpan;
                                  const y =
                                    yMax -
                                    (clamp(p[key]) / 100) *
                                      ySpan;
                                  return `${x},${y}`;
                                })
                                .join(" ");

                              return (
                                <polyline
                                  key={key}
                                  fill="none"
                                  stroke={color}
                                  strokeWidth="1.4"
                                  strokeDasharray={dash}
                                  points={points}
                                />
                              );
                            },
                          )}

                          {/* Points + labels X */}
                          {sCurvePoints.map((p, i) => {
                            const ratio =
                              n === 1 ? 0 : i / (n - 1);
                            const x =
                              xMin + ratio * xSpan;
                            const y =
                              yMax -
                              (clamp(p.cbtp) / 100) * ySpan;

                            return (
                              <g key={p.label}>
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="1.4"
                                  fill="#6366f1"
                                  stroke="white"
                                  strokeWidth="0.4"
                                />
                                <text
                                  x={x}
                                  y={76}
                                  fontSize="4"
                                  fill="#6b7280"
                                  textAnchor="middle"
                                >
                                  {p.label}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Légende + deltas */}
                <div className="mt-1 flex items-center justify-between text-[8px] text-slate-600 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-4 rounded-sm bg-indigo-500" />
                      <span>CBTP</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-4 rounded-sm bg-emerald-500" />
                      <span>CRTE</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-2 w-4 rounded-sm bg-orange-400" />
                      <span>CBTE</span>
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-[8px]">
                    <div>
                      <span className="font-semibold">
                        Δ(CBTE‑CBTP)
                      </span>{" "}
                      <span>
                        = {sCurveDelta > 0 ? "+" : ""}
                        {sCurveDelta} pts
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">
                        Δ(CBTE‑CRTE)
                      </span>{" "}
                      <span>
                        = {sCurveDelta > 0 ? "+" : ""}
                        {sCurveDelta} pts
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-700">
            <span className="font-semibold">Analyse automatique :</span>{" "}
            {sCurveMessage}
          </div>
        </div>
      </div>

      {/* Onglets Infos générales / Tâches */}
      <div className="mt-4 bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200 px-4 pt-3 flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={
              "px-3 py-1.5 rounded-t-md border-b-2 -mb-px " +
              (activeTab === "info"
                ? "border-indigo-500 text-indigo-700 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700")
            }
          >
            Informations générales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={
              "px-3 py-1.5 rounded-t-md border-b-2 -mb-px " +
              (activeTab === "tasks"
                ? "border-indigo-500 text-indigo-700 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700")
            }
          >
            Tâches du projet
          </button>
        </div>

        <div className="p-4">
          {activeTab === "info" && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Informations générales
              </h2>
              <ProjectEditClient
                project={{
                  ...(project as any),
                  plannedLoadDays: plannedHours,
                  consumedLoadDays: consumedHours,
                  progressPercent: progress,
                }}
              />
            </div>
          )}

          {activeTab === "tasks" && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Tâches du projet
              </h2>
              <ProjectTasksClient projectId={projectId} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
