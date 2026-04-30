// app/quality/audits-projects/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import AppShell from "@/app/components/AppShell";

type Area = "AVV" | "DELIVERY";

type Project = {
  id: number;
  projectNumber: string | null;
  titleProject: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  status: string | null;
};

type AuditTheme = {
  id: number;
  auditId: number;
  type: string;
  area: Area;
  conformityRate: number | null;
};

type Audit = {
  id: number;
  projectId: number;
  ref: string;
  evaluationDate: string;
  lastEvaluationDate: string | null;
  globalConformityRate: number | null;
  previousGlobalRate: number | null;
  qualityFollowUp: string | null;
  outsourcing: string | null;
  xshore: string | null;
  ncFromAuditCount: number | null;
  avgActionClosureDelay: number | null;
  project: Project;
  themes: AuditTheme[];
};

type KpiGlobal = {
  totalAudits: number;
  globalPrev: number;
  globalCurrent: number;
  totalNcFromAudits: number;
  avgDelayActions: number;
};

type ThemeAgg = {
  type: string;
  area: Area;
  value: number | null;
};

type ProjectSynth = {
  projectId: number;
  projectNumber: string | null;
  titleProject: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  status: string | null;
  previousScore: number | null;
  currentScore: number | null;
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

type ThMiniProps = {
  children: React.ReactNode;
  className?: string;
};

function ThMini({ children, className = "" }: ThMiniProps) {
  return (
    <th
      className={
        "px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wide " +
        className
      }
    >
      {children}
    </th>
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy", { locale: fr });
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
  const value =
    rate === null ? "-" : `${(rate * 100).toFixed(0)} %`;
  return <span className={base + color}>{value}</span>;
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
};

function BarChart({
  title,
  data,
  unit,
  commentary,
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
                <div
                  key={p.label}
                  className="w-full flex items-center gap-2 text-[11px]"
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* Smiley & grande flèche */

type SmileyProps = {
  mood: "good" | "medium" | "bad" | "na";
};

function Smiley({ mood }: SmileyProps) {
  let fill = "#CBD5E1";
  let mouthPath = "M10 13 Q12 13 14 13";
  if (mood === "good") {
    fill = "#22C55E";
    mouthPath = "M9 12 Q12 15 15 12";
  } else if (mood === "medium") {
    fill = "#FACC15";
    mouthPath = "M9 14 Q12 12 15 14";
  } else if (mood === "bad") {
    fill = "#EF4444";
    mouthPath = "M9 15 Q12 12 15 15";
  }

  return (
    <svg viewBox="0 0 24 24" className="w-full h-full">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill={fill}
        stroke="#0F172A"
        strokeWidth="1.5"
      />
      <circle cx="9" cy="10" r="1" fill="#0F172A" />
      <circle cx="15" cy="10" r="1" fill="#0F172A" />
      <path
        d={mouthPath}
        stroke="#0F172A"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

type BigArrowKpiProps = {
  themes: AuditTheme[];
};

function BigArrowKpi({ themes }: BigArrowKpiProps) {
  const themeByType: Record<string, AuditTheme> = {};
  for (const t of themes) themeByType[t.type] = t;

  type Zone = {
    type: string;
    left: number;
    top: number;
  };

  const zones: Zone[] = [
    { type: "REVUE_OPPORTUNITE", left: 19, top: 13 },
    { type: "REVUE_CONTRAT", left: 19, top: 72 },
    { type: "REVUE_PROPOSITION", left: 26, top: 72 },
    { type: "PILOTAGE_REPONSE", left: 26, top: 13 },

    { type: "PMP", left: 32, top: 19 },
    { type: "PLANIFICATION", left: 37, top: 19 },
    { type: "GESTION_EXIGENCES", left: 32, top: 65 },
    {
      type: "GESTION_RISQUES_OPPORTUNITES",
      left: 37,
      top: 65,
    },
    { type: "GESTION_RESSOURCES", left: 42, top: 19 },
    { type: "REUNIONS_COMMUNICATION", left: 47, top: 19 },
    { type: "GESTION_DOCUMENTAIRE", left: 42, top: 65 },
    { type: "GESTION_CONFIGURATION", left: 47, top: 65 },
    { type: "PERFORMANCE", left: 51, top: 19 },
    { type: "GESTION_SOUS_TRAITANCE", left: 55, top: 19 },
    { type: "SECURITE_PERSONNES", left: 51, top: 65 },
    { type: "SECURITE_DONNEES", left: 55, top: 65 },

    { type: "GESTION_XSHORE", left: 64, top: 19 },
    { type: "VERIFICATION_VALIDATION", left: 62.5, top: 46.5 },
    { type: "GESTION_NON_CONFORMITES", left: 64, top: 65 },

    { type: "GESTION_INSATISFACTIONS", left: 72, top: 30 },
    { type: "CAPITALISATION", left: 72, top: 53 },
  ];

  const diameter = 5;

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

            const pct =
              t.conformityRate == null
                ? null
                : t.conformityRate * 100;
            let mood: SmileyProps["mood"] = "na";
            if (pct !== null) {
              if (pct < 65) mood = "bad";
              else if (pct < 80) mood = "medium";
              else mood = "good";
            }

            const label = THEME_LABELS[t.type] ?? t.type;

            return (
              <div
                key={z.type}
                title={
                  pct === null
                    ? `${label} : NA`
                    : `${label} : ${pct.toFixed(0)} %`
                }
                className="absolute rounded-full border border-white shadow-sm bg-transparent"
                style={{
                  width: `${diameter}%`,
                  height: `${diameter}%`,
                  left: `calc(${z.left}% - ${diameter / 2}%)`,
                  top: `calc(${z.top}% - ${diameter / 2}%)`,
                }}
              >
                <Smiley mood={mood} />
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-1 text-[10px] text-slate-500">
        Vert &gt; 80 %, Orange 65–80 %, Rouge &lt; 65 %, Gris = NA / non
        applicable.
      </p>
    </div>
  );
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  const v = (value ?? "").toLowerCase();

  let classes =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-700";

  if (v.includes("en cours") || v.includes("ouvert")) {
    classes =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-amber-200 bg-amber-50 text-amber-800";
  } else if (
    v.includes("termin") ||
    v.includes("clôt") ||
    v.includes("clos")
  ) {
    classes =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-emerald-200 bg-emerald-50 text-emerald-800";
  } else if (v.includes("critique") || v.includes("bloqué")) {
    classes =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-rose-200 bg-rose-50 text-rose-800";
  }

  return <span className={classes}>{value ?? "—"}</span>;
}

/* -------- MODALE NOUVEL AUDIT GLOBAL -------- */

type NewAuditGlobalModalProps = {
  projects: Project[];
  onClose: () => void;
  onCreated: (a: Audit) => void;
};

function NewAuditGlobalModal({
  projects,
  onClose,
  onCreated,
}: NewAuditGlobalModalProps) {
  const [projectId, setProjectId] = useState<number | null>(
    projects[0]?.id ?? null,
  );
  const [evaluationDate, setEvaluationDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd", { locale: fr }),
  );
  const [qualityFollowUp, setQualityFollowUp] = useState("");
  const [outsourcing, setOutsourcing] = useState("Non");
  const [xshore, setXshore] = useState("Non");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) {
      setError("Veuillez sélectionner un projet.");
      return;
    }
    if (!evaluationDate) {
      setError("La date d’évaluation est obligatoire.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        evaluationDate,
        qualityFollowUp:
          qualityFollowUp.trim().length > 0
            ? qualityFollowUp.trim()
            : null,
        outsourcing,
        xshore,
      };

      const res = await fetch(
        `/api/projects/${projectId}/audit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          data?.error ?? "Erreur lors de la création de l’audit.",
        );
        setSubmitting(false);
        return;
      }

      const created = (await res.json()) as Audit;
      onCreated(created);
    } catch (err: any) {
      setError(
        err?.message ??
          "Erreur inconnue lors de la création de l’audit.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Nouvel audit qualité (vue projets)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-sm"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-600">
                N° projet
              </label>
              <select
                value={projectId ?? ""}
                onChange={(e) =>
                  setProjectId(Number(e.target.value) || null)
                }
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectNumber ?? `P-${p.id}`} –{" "}
                    {p.titleProject ?? ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-600">
                Date d’évaluation
              </label>
              <input
                type="date"
                value={evaluationDate}
                onChange={(e) =>
                  setEvaluationDate(e.target.value)
                }
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-600">
                Sous-traitance
              </label>
              <select
                value={outsourcing}
                onChange={(e) =>
                  setOutsourcing(e.target.value)
                }
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              >
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-600">
                X-shore
              </label>
              <select
                value={xshore}
                onChange={(e) => setXshore(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              >
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-slate-600">
                Commentaires de suivi qualité (optionnel)
              </label>
              <textarea
                value={qualityFollowUp}
                onChange={(e) =>
                  setQualityFollowUp(e.target.value)
                }
                rows={3}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs resize-none"
                placeholder="Ex : points d’attention, plan d’actions, etc."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Création..." : "Créer l’audit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========== PAGE PRINCIPALE ========== */

export default function AuditsProjectsPage() {
  const router = useRouter();

  const [audits, setAudits] = useState<Audit[]>([]);
  const [kpi, setKpi] = useState<KpiGlobal | null>(null);
  const [themeAggGlobal, setThemeAggGlobal] = useState<ThemeAgg[]>(
    [],
  );
  const [projectsSynthBase, setProjectsSynthBase] = useState<
    ProjectSynth[]
  >([]);
  const [projectsForNewAudit, setProjectsForNewAudit] = useState<
    Project[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewAuditModal, setShowNewAuditModal] = useState(false);

  // filtres
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState<string>("Tous");
  const [filterProjectNumber, setFilterProjectNumber] =
    useState<string>("Tous");
  const [filterPm, setFilterPm] = useState<string>("Tous");
  const [filterStatus, setFilterStatus] = useState<string>("Tous");
  const [filterRate, setFilterRate] = useState<string>("Tous");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [auditsRes, projectsRes] = await Promise.all([
          fetch("/api/quality/audits-global"),
          fetch("/api/projects"),
        ]);

        if (!auditsRes.ok) {
          const d = await auditsRes.json().catch(() => null);
          throw new Error(
            d?.error ?? "Erreur de chargement des audits globaux",
          );
        }
        const auditsData = await auditsRes.json();
        setAudits(auditsData.audits as Audit[]);
        setKpi(auditsData.kpi as KpiGlobal);
        setThemeAggGlobal(auditsData.themeAgg as ThemeAgg[]);
        setProjectsSynthBase(
          auditsData.projectsSynth as ProjectSynth[],
        );

        if (!projectsRes.ok) {
          const d = await projectsRes.json().catch(() => null);
          console.error(
            "Erreur chargement projets pour la modale d’audit global",
            d,
          );
        } else {
          const prj = (await projectsRes.json()) as Project[];
          setProjectsForNewAudit(prj);
        }
      } catch (e: any) {
        setError(e?.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredAudits = useMemo(() => {
    return audits.filter((a) => {
      const p = a.project;

      if (
        filterClient !== "Tous" &&
        (p.clientName ?? "") !== filterClient
      ) {
        return false;
      }
      if (
        filterProjectNumber !== "Tous" &&
        (p.projectNumber ?? `P-${p.id}`) !== filterProjectNumber
      ) {
        return false;
      }
      if (
        filterPm !== "Tous" &&
        (p.projectManagerName ?? "") !== filterPm
      ) {
        return false;
      }
      if (
        filterStatus !== "Tous" &&
        (p.status ?? "") !== filterStatus
      ) {
        return false;
      }

      if (filterRate !== "Tous") {
        const rate = a.globalConformityRate;
        if (rate == null) return false;
        if (filterRate === "<65%" && !(rate < 0.65)) return false;
        if (
          filterRate === "65-85%" &&
          !(rate >= 0.65 && rate < 0.85)
        )
          return false;
        if (filterRate === ">85%" && !(rate >= 0.85)) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          a.ref,
          p.projectNumber ?? "",
          p.titleProject ?? "",
          p.clientName ?? "",
          p.projectManagerName ?? "",
          p.status ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    audits,
    filterClient,
    filterProjectNumber,
    filterPm,
    filterStatus,
    filterRate,
    search,
  ]);

  // KPI recalculés sur les audits filtrés
  const kpiFiltered = useMemo(() => {
    if (!filteredAudits.length) {
      return {
        prev: 0,
        current: 0,
        nc: 0,
        delay: 0,
      };
    }

    const lastByProject = new Map<
      number,
      (typeof filteredAudits)[number]
    >();
    let totalNc = 0;
    let sumDelay = 0;
    let countDelay = 0;

    for (const a of filteredAudits) {
      totalNc += a.ncFromAuditCount ?? 0;
      if (a.avgActionClosureDelay != null) {
        sumDelay += a.avgActionClosureDelay;
        countDelay += 1;
      }
      const ex = lastByProject.get(a.projectId);
      if (!ex || ex.evaluationDate < a.evaluationDate) {
        lastByProject.set(a.projectId, a);
      }
    }

    let sumPrev = 0;
    let countPrev = 0;
    let sumCur = 0;
    let countCur = 0;

    for (const a of lastByProject.values()) {
      if (a.previousGlobalRate != null) {
        sumPrev += a.previousGlobalRate;
        countPrev += 1;
      }
      if (a.globalConformityRate != null) {
        sumCur += a.globalConformityRate;
        countCur += 1;
      }
    }

    const prev = countPrev > 0 ? (sumPrev / countPrev) * 100 : 0;
    const cur = countCur > 0 ? (sumCur / countCur) * 100 : 0;
    const delay = countDelay > 0 ? sumDelay / countDelay : 0;

    return {
      prev,
      current: cur,
      nc: totalNc,
      delay,
    };
  }, [filteredAudits]);

  // Agrégation par thème sur audits filtrés (et non plus global)
  const themeAggFiltered = useMemo(() => {
    type AggRec = {
      sum: number;
      count: number;
      area: Area;
    };
    const agg: Record<string, AggRec> = {};

    for (const a of filteredAudits) {
      for (const t of a.themes) {
        const key = `${t.area}-${t.type}`;
        if (!agg[key]) {
          agg[key] = {
            sum: 0,
            count: 0,
            area: t.area as Area,
          };
        }
        if (t.conformityRate != null) {
          agg[key].sum += t.conformityRate;
          agg[key].count += 1;
        }
      }
    }

    return Object.entries(agg).map(([key, v]) => {
      const [, type] = key.split("-");
      const avg = v.count > 0 ? v.sum / v.count : null;
      return {
        type,
        area: v.area,
        value: avg,
      };
    });
  }, [filteredAudits]);

  const barsAvv: BarPoint[] = useMemo(() => {
    const list = themeAggFiltered.filter((t) => t.area === "AVV");
    return list
      .slice()
      .sort(
        (a, b) =>
          THEME_ORDER_AVV.indexOf(a.type) -
          THEME_ORDER_AVV.indexOf(b.type),
      )
      .map((t) => ({
        label: THEME_LABELS[t.type] ?? t.type,
        value:
          t.value == null ? null : Math.round(t.value * 100),
        themeType: t.type,
      }));
  }, [themeAggFiltered]);

  const barsDelivery: BarPoint[] = useMemo(() => {
    const list = themeAggFiltered.filter(
      (t) => t.area === "DELIVERY",
    );
    return list
      .slice()
      .sort(
        (a, b) =>
          THEME_ORDER_DELIVERY.indexOf(a.type) -
          THEME_ORDER_DELIVERY.indexOf(b.type),
      )
      .map((t) => ({
        label: THEME_LABELS[t.type] ?? t.type,
        value:
          t.value == null ? null : Math.round(t.value * 100),
        themeType: t.type,
      }));
  }, [themeAggFiltered]);

  // flèche : on prend les thèmes du dernier audit dans le scope filtré
  const lastAuditForArrow =
    filteredAudits.length > 0
      ? filteredAudits
          .slice()
          .sort(
            (a, b) =>
              new Date(a.evaluationDate).getTime() -
              new Date(b.evaluationDate).getTime(),
          )[filteredAudits.length - 1]
      : null;

  const arrowThemes = lastAuditForArrow
    ? (lastAuditForArrow.themes as AuditTheme[])
    : [];

  // messages Alertes & reco (basés sur kpiFiltered)
  const strengths: string[] = [];
  const watchPoints: string[] = [];
  const recommandations: string[] = [];

  const curRate = kpiFiltered.current;
  const delay = kpiFiltered.delay;
  const ncCount = kpiFiltered.nc;

  if (curRate >= 85) {
    strengths.push(
      "Un niveau de conformité global élevé sur les audits récents.",
    );
  } else if (curRate >= 70 && filteredAudits.length > 0) {
    strengths.push(
      "Un niveau de conformité global correct avec des marges d’amélioration.",
    );
    watchPoints.push(
      "Certaines thématiques restent en‑dessous du niveau cible de conformité.",
    );
    recommandations.push(
      "Renforcer les plans d’actions sur les thèmes les plus en retrait dans les audits.",
    );
  } else if (filteredAudits.length > 0) {
    watchPoints.push(
      "Niveau de conformité global des audits insuffisant par rapport aux attentes.",
    );
    recommandations.push(
      "Planifier un plan d’amélioration structuré (QRQC / 8D) sur les thèmes les plus critiques.",
    );
  }

  if (delay <= 15 && filteredAudits.length > 0) {
    strengths.push(
      "Les actions issues d’audit sont clôturées dans des délais raisonnables.",
    );
  } else if (delay > 15 && delay <= 30) {
    watchPoints.push(
      "Les délais de traitement des actions d’audit sont modérés.",
    );
    recommandations.push(
      "Mettre en place un suivi hebdomadaire des plans d’actions d’audit pour sécuriser les jalons.",
    );
  } else if (delay > 30) {
    watchPoints.push(
      "Délai moyen de clôture des actions d’audit élevé, risque de dérive.",
    );
    recommandations.push(
      "Renforcer l’escalade managériale lorsque les actions d’audit dépassent 30 jours.",
    );
  }

  if (ncCount === 0 && filteredAudits.length > 0) {
    strengths.push(
      "Aucune non‑conformité issue des audits sur la période filtrée.",
    );
  } else if (ncCount > 0 && filteredAudits.length > 0) {
    watchPoints.push(
      "Des non‑conformités sont régulièrement émises lors des audits.",
    );
    recommandations.push(
      "Vérifier systématiquement le lien entre NC d’audit et plan d’actions projet.",
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "Données insuffisantes pour dégager des points forts sur les audits.",
    );
  }
  if (watchPoints.length === 0) {
    watchPoints.push(
      "Aucun point de vigilance majeur identifié sur les filtres actuels.",
    );
  }
  if (recommandations.length === 0) {
    recommandations.push(
      "Maintenir le dispositif actuel de suivi des audits et capitaliser les bonnes pratiques.",
    );
  }

  const projectsSynthFiltered: ProjectSynth[] = useMemo(() => {
    return projectsSynthBase.filter((p) => {
      if (
        filterClient !== "Tous" &&
        (p.clientName ?? "") !== filterClient
      )
        return false;
      if (
        filterProjectNumber !== "Tous" &&
        (p.projectNumber ?? `P-${p.projectId}`) !==
          filterProjectNumber
      )
        return false;
      if (
        filterPm !== "Tous" &&
        (p.projectManagerName ?? "") !== filterPm
      )
        return false;
      if (
        filterStatus !== "Tous" &&
        (p.status ?? "") !== filterStatus
      )
        return false;
      return true;
    });
  }, [
    projectsSynthBase,
    filterClient,
    filterProjectNumber,
    filterPm,
    filterStatus,
  ]);

  const allProjectsForFilters = useMemo(() => {
    const map = new Map<number, ProjectSynth>();
    for (const p of projectsSynthBase) {
      map.set(p.projectId, p);
    }
    return Array.from(map.values()).sort((a, b) => {
      const na = a.projectNumber ?? "";
      const nb = b.projectNumber ?? "";
      return na.localeCompare(nb, "fr-FR", { numeric: true });
    });
  }, [projectsSynthBase]);

  async function handleExportExcel() {
    if (!filteredAudits.length) {
      alert("Aucun audit à exporter.");
      return;
    }

    const headers = [
      "ref",
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
      a.project.projectNumber ?? "",
      a.project.clientName ?? "",
      a.project.projectManagerName ?? "",
      a.project.titleProject ?? "",
      a.project.status ?? "",
      formatDate(a.evaluationDate),
      a.globalConformityRate != null
        ? (a.globalConformityRate * 100).toFixed(1)
        : "",
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

    const lines = [
      headers.join(";"),
      ...rows.map((r) =>
        r
          .map((val) => {
            const v = String(val ?? "");
            if (
              v.includes(";") ||
              v.includes('"') ||
              v.includes("\n")
            ) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return v;
          })
          .join(";"),
      ),
    ];

    const csv = "\ufeff" + lines.join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement("a");
    aEl.href = url;
    aEl.download = "Audits_projets.csv";
    document.body.appendChild(aEl);
    aEl.click();
    aEl.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell
      activeSection="quality"
      pageTitle="Audits projets"
      pageSubtitle="Vue consolidée de l’ensemble des audits qualité sur tous les projets."
    >
      <div className="space-y-6">
        <Link
          href="/quality"
          className="text-xs text-indigo-600 hover:underline"
        >
          ← Retour Qualité ISO 9001
        </Link>

        {error && (
          <div className="rounded bg-rose-50 text-rose-700 px-4 py-2 text-xs border border-rose-200">
            {error}
          </div>
        )}

        {/* Actions haut */}
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
                router.push("/quality/deliverables-projects")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Livrables (vue projets)
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/quality/non-conformities-projects")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Non-conformités (vue projets)
            </button>

            <button
              type="button"
              onClick={() =>
                window.open("/synoptique-audits.pdf", "_blank")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700"
            >
              Voir le synoptique audit
            </button>
          </div>
        </div>

        {/* Recherche + filtres */}
        <section className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (N° projet, client, chef de projet, statut...)"
              className="w-full md:max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs mt-3">
            <div>
              <label className="block text-slate-500 mb-1">
                Client
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
              >
                <option value="Tous">Tous</option>
                {Array.from(
                  new Set(
                    allProjectsForFilters
                      .map((p) => p.clientName ?? "")
                      .filter((v) => v.trim() !== ""),
                  ),
                ).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 mb-1">
                N° projet
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={filterProjectNumber}
                onChange={(e) =>
                  setFilterProjectNumber(e.target.value)
                }
              >
                <option value="Tous">Tous</option>
                {allProjectsForFilters.map((p) => (
                  <option
                    key={p.projectId}
                    value={p.projectNumber ?? `P-${p.projectId}`}
                  >
                    {p.projectNumber ?? `P-${p.projectId}`}
                  </option>
                ))}
              </select>
            </div>
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
                    allProjectsForFilters
                      .map((p) => p.projectManagerName ?? "")
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
                onChange={(e) =>
                  setFilterStatus(e.target.value)
                }
              >
                <option value="Tous">Tous</option>
                {Array.from(
                  new Set(
                    allProjectsForFilters
                      .map((p) => p.status ?? "")
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
          </div>
        </section>

        {/* KPI ligne */}
        <section className="grid gap-4 md:grid-cols-4">
          <KpiCard
            label="Taux global précédent"
            value={kpiFiltered.prev}
            suffix="%"
            loading={loading}
            variant="info"
          />
          <KpiCard
            label="Taux global actuel"
            value={kpiFiltered.current}
            suffix="%"
            loading={loading}
            variant="success"
          />
          <KpiCard
            label="NC issues des audits"
            value={kpiFiltered.nc}
            loading={loading}
            variant="warning"
          />
          <KpiCard
            label="Délai moyen actions d’audit"
            value={kpiFiltered.delay}
            suffix=" j"
            loading={loading}
            variant="warning"
          />
        </section>

        {/* Alertes & reco */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Alertes et recommandations – audits
            </h2>
            <span className="text-[11px] text-slate-500">
              Analyse basée sur les audits filtrés
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">✅</span>
                <span className="text-[11px] font-semibold text-emerald-900">
                  Points forts
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-emerald-900">
                {strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span className="text-[11px] font-semibold text-amber-900">
                  Points de vigilance
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-900">
                {watchPoints.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📝</span>
                <span className="text-[11px] font-semibold text-indigo-900">
                  Recommandations
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-indigo-900">
                {recommandations.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* KPI flèche (sur les audits filtrés) */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-3">
          <h3 className="text-xs font-semibold text-slate-900 mb-2">
            Niveau de conformité des process global (audits filtrés)
          </h3>
          {filteredAudits.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Aucun audit disponible avec ces filtres.
            </p>
          ) : (
            <BigArrowKpi themes={arrowThemes} />
          )}
        </section>

        {/* Graphiques AVV / DELIVERY */}
        <section className="grid gap-4 lg:grid-cols-2">
          <BarChart
            title="AVV – Taux de conformité par thème (audits filtrés)"
            data={barsAvv}
            unit="%"
            commentary="Agrégation des taux de conformité des audits filtrés sur les thèmes Avant-Vente."
          />
          <BarChart
            title="DELIVERY – Taux de conformité par thème (audits filtrés)"
            data={barsDelivery}
            unit="%"
            commentary="Agrégation des taux de conformité des audits filtrés sur les thèmes Delivery."
          />
        </section>

        {/* Tableau Projets – synthèse Audits */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Projets – synthèse Audits
            </h2>
            <span className="text-[11px] text-slate-500">
              {projectsSynthFiltered.length} projets
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500">
              Chargement des données projets…
            </p>
          ) : projectsSynthFiltered.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aucun projet avec audit pour ces filtres.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[260px]">
              <table className="min-w-full text-xs table-fixed">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <ThMini className="w-32">N° projet</ThMini>
                    <ThMini className="w-40">Intitulé projet</ThMini>
                    <ThMini className="w-40">Client</ThMini>
                    <ThMini className="w-36">Chef de projet</ThMini>
                    <ThMini className="w-28">Statut</ThMini>
                    <ThMini className="w-40">Score audit précédent</ThMini>
                    <ThMini className="w-40">Score audit actuel</ThMini>
                    <ThMini className="w-44 text-center">Actions</ThMini>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectsSynthFiltered.map((p) => {
                    const curPct =
                      p.currentScore != null
                        ? p.currentScore * 100
                        : null;
                    let curColor =
                      "text-slate-700 bg-slate-100 border-slate-200";
                    if (curPct != null) {
                      if (curPct >= 80) {
                        curColor =
                          "text-emerald-700 bg-emerald-50 border-emerald-200";
                      } else if (curPct >= 65) {
                        curColor =
                          "text-amber-700 bg-amber-50 border-amber-200";
                      } else {
                        curColor =
                          "text-rose-700 bg-rose-50 border-rose-200";
                      }
                    }

                    return (
                      <tr
                        key={p.projectId}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-indigo-700">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/projects/${p.projectId}`,
                              )
                            }
                            className="hover:underline"
                          >
                            {p.projectNumber ?? `P-${p.projectId}`}
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {p.titleProject ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {p.clientName ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {p.projectManagerName ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px]">
                          <StatusBadge value={p.status} />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {p.previousScore != null
                            ? (p.previousScore * 100).toFixed(0) +
                              " %"
                            : "-"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          <span
                            className={
                              "inline-flex px-2 py-0.5 rounded-full border text-[11px] " +
                              curColor
                            }
                          >
                            {curPct != null
                              ? `${curPct.toFixed(0)} %`
                              : "-"}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/projects/${p.projectId}/quality/deliverables`,
                                )
                              }
                              className="px-2 py-0.5 rounded border border-indigo-300 bg-indigo-50 text-[10px] text-indigo-700 hover:bg-indigo-100"
                            >
                              Livrables
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/projects/${p.projectId}/quality/non-conformities`,
                                )
                              }
                              className="px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-[10px] text-amber-700 hover:bg-amber-100"
                            >
                              Non‑conformités
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/projects/${p.projectId}/quality/audit`,
                                )
                              }
                              className="px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-100"
                            >
                              Audits
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showNewAuditModal && projectsForNewAudit.length > 0 && (
          <NewAuditGlobalModal
            projects={projectsForNewAudit}
            onClose={() => setShowNewAuditModal(false)}
            onCreated={(created) => {
              // on réinjecte l’audit créé dans la liste locale
              setAudits((prev) => [created, ...prev]);
              setShowNewAuditModal(false);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}