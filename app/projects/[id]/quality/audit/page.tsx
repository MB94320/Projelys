"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { saveAs } from "file-saver";
import AppShell from "@/app/components/AppShell";
import NewAuditModal from "./NewAuditModal";
import {
  AuditEvaluationModal,
  Audit,
  Project as AuditProject,
} from "./AuditEvaluationModal";

type Project = AuditProject;

type AuditTheme = {
  id: number;
  type: string;
  area: "AVV" | "DELIVERY";
  conformityRate: number | null;
  color: string;
};

type BarPoint = { label: string; value: number | null; themeType?: string };

const THEME_LABELS: Record<string, string> = {
  REVUE_OPPORTUNITE: "Revue d’opportunité",
  PILOTAGE_REPONSE: "Pilotage de la réponse",
  REVUE_CONTRAT: "Revue de contrat",
  REVUE_PROPOSITION: "Revue de proposition",
  GESTION_EXIGENCES: "Gestion des exigences",
  GESTION_RISQUES_OPPORTUNITES: "Risques & opportunités",
  PLANIFICATION: "Planification",
  PERFORMANCE: "Performance",
  REUNIONS_COMMUNICATION: "Réunions & communication",
  VERIFICATION_VALIDATION: "Vérification & validation",
  CAPITALISATION: "Capitalisation",
  GESTION_CONFIGURATION: "Gestion de configuration",
  GESTION_DOCUMENTAIRE: "Gestion documentaire",
  SECURITE_PERSONNES: "Sécurité des personnes",
  SECURITE_DONNEES: "Sécurité des données",
  GESTION_RESSOURCES: "Gestion des ressources",
  GESTION_SOUS_TRAITANCE: "Sous-traitance",
  GESTION_XSHORE: "X-shore / transnational",
  GESTION_NON_CONFORMITES: "Gestion des NC",
  GESTION_INSATISFACTIONS: "Gestion des insatisfactions",
  PMP: "PMP / PAQ",
};

const THEME_ORDER_AVV: string[] = [
  "REVUE_OPPORTUNITE",
  "PILOTAGE_REPONSE",
  "REVUE_CONTRAT",
  "REVUE_PROPOSITION",
];

const THEME_ORDER_DELIVERY: string[] = [
  "GESTION_EXIGENCES",
  "GESTION_RISQUES_OPPORTUNITES",
  "PLANIFICATION",
  "PERFORMANCE",
  "REUNIONS_COMMUNICATION",
  "VERIFICATION_VALIDATION",
  "CAPITALISATION",
  "GESTION_CONFIGURATION",
  "GESTION_DOCUMENTAIRE",
  "SECURITE_PERSONNES",
  "SECURITE_DONNEES",
  "GESTION_RESSOURCES",
  "GESTION_SOUS_TRAITANCE",
  "GESTION_XSHORE",
  "GESTION_NON_CONFORMITES",
  "GESTION_INSATISFACTIONS",
  "PMP",
];

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "dd/MM/yyyy", { locale: fr });
}

function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "-";
  return `${(rate * 100).toFixed(0)} %`;
}

function rateBadge(rate: number | null) {
  let base =
    "inline-flex px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap border ";
  let color = "bg-slate-300 text-slate-800 border-slate-400";

  if (rate !== null) {
    const pct = rate * 100;
    if (pct >= 80) {
      color = "bg-emerald-100 text-emerald-700 border-emerald-200";
    } else if (pct >= 65) {
      color = "bg-amber-100 text-amber-700 border-amber-200";
    } else {
      color = "bg-rose-100 text-rose-700 border-rose-200";
    }
  }
  return <span className={base + color}>{formatRate(rate)}</span>;
}

type ThProps = {
  children: React.ReactNode;
  className?: string;
};

function Th({ children, className = "" }: ThProps) {
  return (
    <th
      className={
        "px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wide bg-slate-100 " +
        className
      }
    >
      {children}
    </th>
  );
}

/** Couleur des barres (en %) */
function getBarColor(value: number | null): string {
  if (value === null) return "bg-slate-300";
  if (value < 65) return "bg-rose-500";
  if (value < 80) return "bg-amber-400";
  return "bg-emerald-500";
}

type BarChartProps = {
  title: string;
  data: BarPoint[];
  unit?: string;
  commentary?: string;
  onBarClick?: (themeType: string) => void;
};

function BarChart({
  title,
  data,
  unit,
  commentary,
  onBarClick,
}: BarChartProps) {
  const ticks = [0, 50, 80, 100];

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold mb-1 text-slate-900">
        {title}
      </div>
      {commentary && (
        <p className="text-[11px] text-slate-500 mb-2">{commentary}</p>
      )}

      {data.length === 0 ? (
        <p className="text-xs text-slate-400">Pas de données.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] text-slate-400 pl-40 pr-6">
            {ticks.map((t) => (
              <span key={t}>{t}%</span>
            ))}
          </div>

          <div className="space-y-1">
            {data.map((p) => {
              const v = p.value;
              const isNA = v === null;

              const color = getBarColor(isNA ? null : v!);

              const width = isNA
                ? "0%"
                : `${Math.max(5, Math.min(100, v!))}%`;

              const titleValue = isNA
                ? "NA"
                : `${v!.toFixed(0)}${unit ?? " %"}`;

              return (
                <button
                  key={p.label}
                  type="button"
                  className="w-full flex items-center gap-2 text-[11px]"
                  onClick={() =>
                    p.themeType && onBarClick?.(p.themeType)
                  }
                >
                  <div className="w-40 shrink-0 text-right pr-2 text-slate-600">
                    {p.label}
                  </div>
                  <div className="flex-1 h-4 bg-slate-100 rounded-sm relative">
                    {!isNA && (
                      <div
                        className={`h-4 rounded-sm ${color}`}
                        style={{ width }}
                        title={titleValue}
                      />
                    )}
                  </div>
                  <div className="w-10 text-right text-slate-700">
                    {isNA
                      ? "NA"
                      : `${v!.toFixed(0)}${unit ?? " %"}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type KpiCardProps = {
  label: string;
  value: number;
  suffix?: string;
  loading: boolean;
  variant?: "success" | "info" | "warning";
};

function KpiCard({
  label,
  value,
  suffix,
  loading,
  variant = "info",
}: KpiCardProps) {
  let valueColor = "text-slate-900";
  if (variant === "success") valueColor = "text-emerald-700";
  if (variant === "warning") valueColor = "text-amber-700";

  const display = Number.isFinite(value) ? value.toFixed(1) : value;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-medium uppercase text-slate-500">
        {label}
      </div>
      <div className={"mt-2 text-2xl font-semibold " + valueColor}>
        {loading ? "…" : display}
        {suffix && !loading ? suffix : null}
      </div>
    </div>
  );
}

/* ======================== */
/* GROSSE FLECHE KPI (image) */
/* ======================== */

type SmileyProps = {
  mood: "good" | "medium" | "bad" | "na";
};

function Smiley({ mood }: SmileyProps) {
  let fill = "#CBD5E1"; // gris NA
  let mouthPath = "M10 13 Q12 13 14 13"; // bouche neutre
  if (mood === "good") {
    fill = "#22C55E"; // vert
    mouthPath = "M9 12 Q12 15 15 12";
  } else if (mood === "medium") {
    fill = "#FACC15"; // jaune
    mouthPath = "M9 14 Q12 12 15 14";
  } else if (mood === "bad") {
    fill = "#EF4444"; // rouge
    mouthPath = "M9 15 Q12 12 15 15";
  }

  return (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <circle cx="12" cy="12" r="10" fill={fill} stroke="#0F172A" strokeWidth="1.5" />
      <circle cx="9" cy="10" r="1" fill="#0F172A" />
      <circle cx="15" cy="10" r="1" fill="#0F172A" />
      <path d={mouthPath} stroke="#0F172A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

type BigArrowKpiProps = {
  themes: AuditTheme[];
  onThemeClick?: (themeType: string) => void;
};

function BigArrowKpi({ themes, onThemeClick }: BigArrowKpiProps) {
  const themeByType: Record<string, AuditTheme> = {};
  for (const t of themes) themeByType[t.type] = t;

  type Zone = {
    type: string;
    left: number;
    top: number;
  };

  const zones: Zone[] = [
    { type: "REVUE_OPPORTUNITE",        left: 19, top: 13 },
    { type: "REVUE_CONTRAT",            left: 19, top: 72 },
    { type: "REVUE_PROPOSITION",        left: 26, top: 72 },
    { type: "PILOTAGE_REPONSE",         left: 26, top: 13 },

    { type: "PMP",                      left: 32, top: 19 },
    { type: "PLANIFICATION",            left: 37, top: 19 },
    { type: "GESTION_EXIGENCES",        left: 32, top: 65 },
    { type: "GESTION_RISQUES_OPPORTUNITES", left: 37, top: 65 },
    { type: "GESTION_RESSOURCES",       left: 42, top: 19 },
    { type: "REUNIONS_COMMUNICATION",   left: 47, top: 19 },
    { type: "GESTION_DOCUMENTAIRE",     left: 42, top: 65 },
    { type: "GESTION_CONFIGURATION",    left: 47, top: 65 },
    { type: "PERFORMANCE",              left: 51, top: 19 },
    { type: "GESTION_SOUS_TRAITANCE",   left: 55, top: 19 },
    { type: "SECURITE_PERSONNES",       left: 51, top: 65 },
    { type: "SECURITE_DONNEES",         left: 55, top: 65 },

    { type: "GESTION_XSHORE",           left: 64, top: 19 },
    { type: "VERIFICATION_VALIDATION",  left: 62.5, top: 46.5 },
    { type: "GESTION_NON_CONFORMITES",  left: 64, top: 65 },

    { type: "GESTION_INSATISFACTIONS",  left: 72, top: 30 },
    { type: "CAPITALISATION",           left: 72, top: 53 },
  ];

  const diameter = 5; // encore un peu plus petit

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max flex flex-col items-center">
        <div
          className="relative"
          style={{
            width: 900,
            height: 320,
            backgroundImage: "url('/Quality-Target.jpg')",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          {zones.map((z) => {
            const t = themeByType[z.type];
            if (!t) return null;

            const pct = t.conformityRate == null ? null : t.conformityRate * 100;
            let mood: SmileyProps["mood"] = "na";
            if (pct !== null) {
              if (pct < 65) mood = "bad";
              else if (pct < 80) mood = "medium";
              else mood = "good";
            }

            const label = THEME_LABELS[t.type] ?? t.type;

            return (
              <button
                key={z.type}
                type="button"
                onClick={() => onThemeClick?.(t.type)}
                title={
                  pct === null
                    ? `${label} : NA`
                    : `${label} : ${pct.toFixed(0)} %`
                }
                className="absolute rounded-full border border-white shadow-sm bg-transparent hover:scale-110 transition-transform"
                style={{
                  width: `${diameter}%`,
                  height: `${diameter}%`,
                  left: `calc(${z.left}% - ${diameter / 2}%)`,
                  top: `calc(${z.top}% - ${diameter / 2}%)`,
                }}
              >
                <Smiley mood={mood} />
              </button>
            );
          })}
        </div>        
      </div>

      <p className="mt-1 text-[10px] text-slate-500">
        Vert &gt; 80 %, Orange 65–80 %, Rouge &lt; 65 %, Gris = NA / non applicable.
      </p>
    </div>
  );
}



export default function ProjectAuditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routeProjectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(
    null,
  );
  const [selectedThemeType, setSelectedThemeType] = useState<
    string | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterPm, setFilterPm] = useState<string>("Tous");
  const [filterStatus, setFilterStatus] = useState<string>("Tous");
  const [filterRate, setFilterRate] = useState<string>("Tous");
  const [filterOutsourcing, setFilterOutsourcing] =
    useState<string>("Tous");
  const [filterXshore, setFilterXshore] = useState<string>("Tous");

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [projRes, auditsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch(`/api/projects/${routeProjectId}/audit`),
      ]);

      if (!projRes.ok) {
        throw new Error("Erreur de chargement du projet");
      }
      if (!auditsRes.ok) {
        const text = await auditsRes.text();
        console.error("Error audits GET:", auditsRes.status, text);
        throw new Error("Erreur de chargement des audits");
      }

      const projData = (await projRes.json()) as Project[];
      const auditsData = (await auditsRes.json()) as Audit[];

      const current =
        projData.find((p) => p.id === routeProjectId) ?? null;

      setProject(current);
      setAudits(auditsData);
    } catch (e: any) {
      setError(
        e?.message ?? "Erreur inconnue lors du chargement des audits",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!routeProjectId) return;
    loadData();
  }, [routeProjectId]);

  const isProjectLoaded = !!project;
  const projectLabel =
    project?.projectNumber ??
    project?.titleProject ??
    `P-${routeProjectId}`;

  const pageTitle = isProjectLoaded
    ? `Audit - ${projectLabel}`
    : "Audit - chargement en cours";

  const globalPrev =
    audits.length === 0 ? 0 : audits[0]?.previousGlobalRate ?? 0;

  const globalCurrent =
    audits.length === 0 ? 0 : audits[0]?.globalConformityRate ?? 0;

  const totalNcFromAudits = audits.reduce(
    (acc, a) => acc + (a.ncFromAuditCount ?? 0),
    0,
  );

  const avgDelayActions =
    audits.length === 0
      ? 0
      : (() => {
          const delays = audits
            .map((a) => a.avgActionClosureDelay)
            .filter(
              (v): v is number => v !== null && v !== undefined,
            );
          if (!delays.length) return 0;
          return (
            delays.reduce((acc, v) => acc + v, 0) / delays.length
          );
        })();

  const filteredAudits = useMemo(() => {
    return audits.filter((a) => {
      if (
        filterPm !== "Tous" &&
        (a.project.projectManagerName ?? "") !== filterPm
      ) {
        return false;
      }

      if (
        filterStatus !== "Tous" &&
        (a.project.status ?? "") !== filterStatus
      ) {
        return false;
      }

      if (filterRate !== "Tous") {
        const rate = a.globalConformityRate;
        if (filterRate === "<65%" && !(rate < 0.65)) return false;
        if (
          filterRate === "65-85%" &&
          !(rate >= 0.65 && rate < 0.85)
        )
          return false;
        if (filterRate === ">85%" && !(rate >= 0.85)) return false;
      }

      if (filterOutsourcing !== "Tous") {
        const yesNo = (a.outsourcing ?? "").toLowerCase();
        const isYes = yesNo === "oui" || yesNo === "yes";
        if (
          (filterOutsourcing === "Oui" && !isYes) ||
          (filterOutsourcing === "Non" && isYes)
        ) {
          return false;
        }
      }

      if (filterXshore !== "Tous") {
        const yesNo = (a.xshore ?? "").toLowerCase();
        const isYes = yesNo === "oui" || yesNo === "yes";
        if (
          (filterXshore === "Oui" && !isYes) ||
          (filterXshore === "Non" && isYes)
        ) {
          return false;
        }
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          a.ref,
          a.project.projectNumber ?? "",
          a.project.clientName ?? "",
          a.project.projectManagerName ?? "",
          a.project.titleProject ?? "",
          a.project.status ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    audits,
    filterPm,
    filterStatus,
    filterRate,
    filterOutsourcing,
    filterXshore,
    search,
  ]);

  const barsByDate: BarPoint[] = useMemo(
    () =>
      filteredAudits
        .slice()
        .reverse()
        .map((a) => ({
          label: formatDate(a.evaluationDate) || a.ref,
          value:
            a.globalConformityRate === null
              ? null
              : a.globalConformityRate * 100,
        })),
    [filteredAudits],
  );

  type ThemeAgg = {
    label: string;
    value: number | null;
    area: "AVV" | "DELIVERY";
    type: string;
  };

  const themeAggByArea: ThemeAgg[] = useMemo(() => {
    const agg: Record<
      string,
      { sum: number; count: number; area: "AVV" | "DELIVERY" }
    > = {};

    function auditHasOutsourcing(a: Audit): boolean {
  const raw = (a.outsourcing ?? a.project.outsourcing ?? "").toLowerCase();
  return raw === "oui" || raw === "yes";
}

function auditHasXshore(a: Audit): boolean {
  const raw = (a.xshore ?? a.project.xshore ?? "").toLowerCase();
  return raw === "oui" || raw === "yes";
}

    for (const a of filteredAudits) {
  const hasOutsourcing = auditHasOutsourcing(a);
  const hasXshore = auditHasXshore(a);

  for (const t of a.themes as AuditTheme[]) {
    // Sauter les thèmes non applicables pour cet audit
    if (
      (!hasOutsourcing && t.type === "GESTION_SOUS_TRAITANCE") ||
      (!hasXshore && t.type === "GESTION_XSHORE")
    ) {
      continue;
    }

    const key = `${t.area}-${t.type}`;
    if (!agg[key]) {
      agg[key] = { sum: 0, count: 0, area: t.area };
    }
    if (t.conformityRate !== null) {
      agg[key].sum += t.conformityRate;
      agg[key].count += 1;
    }
  }
}


    return Object.entries(agg).map(([key, v]) => {
      const [, type] = key.split("-");
      const label = THEME_LABELS[type] ?? type;
      const avg =
        v.count > 0 ? v.sum / v.count : null;
      return {
        label,
        value: avg === null ? null : avg * 100,
        area: v.area,
        type,
      };
    });
  }, [filteredAudits]);

  const barsAvv: BarPoint[] = themeAggByArea
    .filter((t) => t.area === "AVV")
    .sort(
      (a, b) =>
        THEME_ORDER_AVV.indexOf(a.type) -
        THEME_ORDER_AVV.indexOf(b.type),
    )
    .map((t) => ({
      label: t.label,
      value: t.value,
      themeType: t.type,
    }));

  const barsDelivery: BarPoint[] = themeAggByArea
    .filter((t) => t.area === "DELIVERY")
    .sort(
      (a, b) =>
        THEME_ORDER_DELIVERY.indexOf(a.type) -
        THEME_ORDER_DELIVERY.indexOf(b.type),
    )
    .map((t) => ({
      label: t.label,
      value: t.value,
      themeType: t.type,
    }));

  function handleExportExcel() {
    if (!filteredAudits.length) {
      alert("Aucun audit à exporter.");
      return;
    }
    const headers = [
      "ref",
      "projectId",
      "projectNumber",
      "clientName",
      "projectManagerName",
      "titleProject",
      "statusProject",
      "evaluationDate",
      "globalConformityRate",
      "previousGlobalRate",
      "lastEvaluationDate",
      "qualityFollowUp",
      "outsourcing",
      "xshore",
      "ncFromAuditCount",
      "avgActionClosureDelay",
    ];

    const rows = filteredAudits.map((a) => [
      a.ref,
      a.projectId,
      a.project.projectNumber ?? "",
      a.project.clientName ?? "",
      a.project.projectManagerName ?? "",
      a.project.titleProject ?? "",
      a.project.status ?? "",
      formatDate(a.evaluationDate),
      (a.globalConformityRate * 100).toFixed(1),
      a.previousGlobalRate != null
        ? (a.previousGlobalRate * 100).toFixed(1)
        : "",
      formatDate(a.lastEvaluationDate),
      a.qualityFollowUp ?? "",
      a.outsourcing ?? "",
      a.xshore ?? "",
      a.ncFromAuditCount ?? "",
      a.avgActionClosureDelay ?? "",
    ]);

    const csv = [headers.join(";")]
      .concat(rows.map((r) => r.join(";")))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    saveAs(blob, `Audit_projet_${projectLabel}.csv`);
  }

  async function handleDeleteAudit(auditId: number) {
    const ok = window.confirm(
      "Supprimer définitivement cet audit ?",
    );
    if (!ok) return;
    try {
      const res = await fetch(
        `/api/projects/${routeProjectId}/audit/${auditId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.error ?? "Erreur lors de la suppression.",
        );
      }
      setAudits((prev) => prev.filter((a) => a.id !== auditId));
    } catch (e: any) {
      alert(e?.message ?? "Erreur lors de la suppression.");
    }
  }

  function handleBarThemeClick(themeType: string) {
    if (!filteredAudits.length) return;

    const auditsWithTheme = filteredAudits.filter((a) =>
      (a.themes as AuditTheme[]).some((t) => t.type === themeType),
    );
    if (!auditsWithTheme.length) return;

    const lastAudit =
      auditsWithTheme[auditsWithTheme.length - 1];

    setSelectedAudit(lastAudit);
    setSelectedThemeType(themeType);
  }

  const lastAuditForArrows =
    filteredAudits.length > 0
      ? filteredAudits[filteredAudits.length - 1]
      : null;

  const arrowThemes = lastAuditForArrows
    ? (lastAuditForArrows.themes as AuditTheme[])
    : [];

  return (
    <AppShell
      activeSection="quality"
      pageTitle={pageTitle}
      pageSubtitle="Synthèse des évaluations qualité pour ce projet."
    >
      <div className="space-y-6">
        {!isProjectLoaded && loading && (
          <p className="text-xs text-slate-500">
            Chargement du projet et des audits...
          </p>
        )}
        {!isProjectLoaded && !loading && (
          <p className="text-xs text-rose-600">
            Projet introuvable pour l’identifiant {routeProjectId}.
          </p>
        )}

        <Link
          href={"/quality/audits-projects"}
          className="text-xs text-indigo-600 hover:underline"
        >
          <span aria-hidden="true">←</span>
          <span>Retour vue audits projets</span>
        </Link>

        {error && (
          <div className="rounded bg-rose-50 text-rose-700 px-4 py-2 text-xs border border-rose-200">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => setShowNewAuditModal(true)}
              className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Nouvel audit
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/projects/${routeProjectId}/quality/deliverables`,
                )
              }
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Voir les livrables
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/projects/${routeProjectId}/quality/non-conformities`,
                )
              }
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Voir les NC
            </button>
            <button
              type="button"
              onClick={() =>
                window.open("/synoptique-audits.pdf", "_blank")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700"
            >
              Voir le synoptic audits
            </button>
          </div>
        </div>

        {/* Filtres */}
        <section className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (réf, projet, client, chef de projet...)"
              className="w-full md:max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs mt-3">
            <div>
              <label className="block text-slate-500 mb-1">
                Chef de projet
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={filterPm}
                onChange={(e) => setFilterPm(e.target.value)}
              >
                <option value="Tous">Tous</option>
                {Array.from(
                  new Set(
                    audits
                      .map(
                        (a) => a.project.projectManagerName ?? "",
                      )
                      .filter((v) => v.trim() !== ""),
                  ),
                ).map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">
                Statut
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="Tous">Tous</option>
                {Array.from(
                  new Set(
                    audits
                      .map((a) => a.project.status ?? "")
                      .filter((v) => v.trim() !== ""),
                  ),
                ).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">
                Taux de conformité
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={filterRate}
                onChange={(e) => setFilterRate(e.target.value)}
              >
                <option value="Tous">Tous</option>
                <option value="<65%">&lt; 65%</option>
                <option value="65-85%">65% – 85%</option>
                <option value=">85%">&gt; 85%</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">
                Sous-traitance
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={filterOutsourcing}
                onChange={(e) =>
                  setFilterOutsourcing(e.target.value)
                }
              >
                <option value="Tous">Tous</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">
                X-shore
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={filterXshore}
                onChange={(e) => setFilterXshore(e.target.value)}
              >
                <option value="Tous">Tous</option>
                <option value="Oui">Oui</option>
                <option value="Non">Non</option>
              </select>
            </div>
          </div>
        </section>

        {/* KPIs globaux */}
        <section className="grid gap-4 md:grid-cols-4">
          <KpiCard
            label="Taux global précédent"
            value={globalPrev * 100}
            suffix="%"
            loading={loading}
            variant="info"
          />
          <KpiCard
            label="Taux global actuel"
            value={globalCurrent * 100}
            suffix="%"
            loading={loading}
            variant="success"
          />
          <KpiCard
            label="NC issues des audits"
            value={totalNcFromAudits}
            loading={loading}
            variant="warning"
          />
          <KpiCard
            label="Délai moyen actions d’audit"
            value={avgDelayActions}
            suffix=" j"
            loading={loading}
            variant="warning"
          />
        </section>

        {/* Grosse flèche KPI */}
        {lastAuditForArrows && (
          <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
            <h3 className="text-xs font-semibold text-slate-900 mb-2">
              Niveau de conformité des process (dernier audit)
            </h3>
            <BigArrowKpi
              themes={arrowThemes}
              onThemeClick={handleBarThemeClick}
            />
          </section>
        )}

        {/* Graphiques par thème AVV / DELIVERY */}
        <section className="grid gap-4 lg:grid-cols-2">
          <BarChart
            title="AVV – Taux de conformité par thème"
            data={barsAvv}
            unit="%"
            commentary="Cliquer sur une barre pour ouvrir l’évaluation du thème dans la modale."
            onBarClick={handleBarThemeClick}
          />
          <BarChart
            title="DELIVERY – Taux de conformité par thème"
            data={barsDelivery}
            unit="%"
            commentary="Cliquer sur une barre pour ouvrir l’évaluation du thème dans la modale."
            onBarClick={handleBarThemeClick}
          />
        </section>

        {/* Tableau des audits */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Audits du projet
            </h2>
            <span className="text-[11px] text-slate-500">
              {filteredAudits.length} audit(s) filtré(s) /{" "}
              {audits.length} au total
            </span>
          </div>
          {loading ? (
            <p className="text-xs text-slate-500">
              Chargement des audits...
            </p>
          ) : filteredAudits.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aucun audit avec ces filtres.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[260px]">
              <table className="min-w-full text-xs table-fixed">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <Th className="w-28">Réf audit</Th>
                    <Th className="w-32">N° projet</Th>
                    <Th className="w-40">Client</Th>
                    <Th className="w-40">Chef de projet</Th>
                    <Th className="w-56">Intitulé projet</Th>
                    <Th className="w-32">Statut projet</Th>
                    <Th className="w-32">Date évaluation</Th>
                    <Th className="w-32">
                      Taux de conformité global
                    </Th>
                    <Th className="w-40">
                      Date de dernière évaluation
                    </Th>
                    <Th className="w-40">Suivi qualité</Th>
                    <Th className="w-32">Sous-traitance</Th>
                    <Th className="w-32">X-shore</Th>
                    <Th className="w-32 text-center">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAudits.map((audit) => (
                    <tr
                      key={audit.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-800">
                        <button
                          type="button"
                          className="text-indigo-600 hover:underline"
                          onClick={() => {
                            setSelectedAudit(audit);
                            setSelectedThemeType(null);
                          }}
                        >
                          {audit.ref}
                        </button>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                        <Link
                          href={`/projects/${audit.projectId}`}
                          className="text-indigo-600 hover:underline"
                        >
                          {audit.project.projectNumber ??
                            `P-${audit.projectId}`}
                        </Link>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                        {audit.project.clientName ?? ""}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                        {audit.project.projectManagerName ?? ""}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-700">
                        {audit.project.titleProject ?? ""}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-[11px]">
                        {(() => {
                          const status =
                            audit.project.status ?? "";
                          let cls =
                            "inline-flex px-2 py-0.5 rounded text-[11px] border ";
                          const s = status.toLowerCase();

                          if (s.includes("cours")) {
                            cls +=
                              "bg-amber-100 text-amber-700 border-amber-200";
                          } else if (
                            s.includes("termin") ||
                            s.includes("clos")
                          ) {
                            cls +=
                              "bg-emerald-100 text-emerald-700 border-emerald-200";
                          } else if (
                            s.includes("alerte") ||
                            s.includes("critique")
                          ) {
                            cls +=
                              "bg-rose-100 text-rose-700 border-rose-200";
                          } else {
                            cls +=
                              "bg-sky-100 text-sky-700 border-sky-200";
                          }

                          return (
                            <span className={cls}>
                              {status || "-"}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                        {formatDate(audit.evaluationDate)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {rateBadge(audit.globalConformityRate)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                        {formatDate(audit.lastEvaluationDate)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-700">
                        {audit.qualityFollowUp ?? ""}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-700">
                        {audit.outsourcing ?? ""}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-700">
                        {audit.xshore ?? ""}
                      </td>

                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[11px] text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                              setSelectedAudit(audit);
                              setSelectedThemeType(null);
                            }}
                          >
                            Évaluer
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  `/api/projects/${routeProjectId}/audit/${audit.id}/export`,
                                );
                                if (!res.ok) {
                                  const text = await res.text();
                                  console.error(
                                    "Export audit error:",
                                    text,
                                  );
                                  alert(
                                    "Erreur lors de l’export PDF.",
                                  );
                                  return;
                                }
                                const blob = await res.blob();
                                const url =
                                  window.URL.createObjectURL(
                                    blob,
                                  );
                                const aEl =
                                  document.createElement("a");
                                aEl.href = url;
                                aEl.download = `Audit_${audit.ref}.pdf`;
                                document.body.appendChild(aEl);
                                aEl.click();
                                aEl.remove();
                                window.URL.revokeObjectURL(url);
                              } catch (e: any) {
                                alert(
                                  e?.message ??
                                    "Erreur inconnue lors de l’export PDF.",
                                );
                              }
                            }}
                            className="px-2 py-0.5 rounded border border-indigo-300 bg-indigo-50 text-[11px] text-indigo-700 hover:bg-indigo-100"
                          >
                            Export PDF
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteAudit(audit.id)
                            }
                            title="Supprimer l’audit"
                            className="h-7 w-7 flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showNewAuditModal && project && (
          <NewAuditModal
            projectId={project.id}
            projectNumber={project.projectNumber}
            onClose={() => setShowNewAuditModal(false)}
            onCreated={(created) => {
              setAudits((prev) => [created, ...prev]);
              setShowNewAuditModal(false);
            }}
          />
        )}

        {selectedAudit && (
          <AuditEvaluationModal
            audit={selectedAudit}
            onClose={() => {
              setSelectedAudit(null);
              setSelectedThemeType(null);
            }}
            onUpdated={(updated) => {
              setSelectedAudit(updated);
              setAudits((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a)),
              );
            }}
            initialThemeType={selectedThemeType ?? undefined}
          />
        )}
      </div>
    </AppShell>
  );
}
