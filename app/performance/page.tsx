"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import AppShell from "../components/AppShell";

type Status = "OK" | "Alerte" | "Critique" | "En cours" | "Clôturé" | string;

type ProjectPerformance = {
  id: number;
  projectNumber: string | null;
  titleProject: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  status: Status | null;
  riskCriticality: string | null;

  deliverablesCount?: number | null;
  deliveredCount?: number | null;
  deliverablesOtdRate?: number | null;
  deliverablesDodRate?: number | null;
  deliverablesOqdRate?: number | null;

  nonConformitiesCount?: number | null;
  nonConformitiesOpenCount?: number | null;
  openNonConformitiesCount?: number | null;

  previousAuditRate?: number | null;
  currentAuditRate?: number | null;

  otdGlobal?: number | null;
  oqdGlobal?: number | null;
  oqdPrevious?: number | null;
  globalConformityRate?: number | null;

  customerSatisfaction?: number | null;
  csListening?: number | null;
  csPlanning?: number | null;
  csTechnical?: number | null;
  csKpiFollowup?: number | null;
  csRiskFollowup?: number | null;

  tace?: number | null;

  budgetPlanned?: number | null;
  budgetConsumed?: number | null;
};

type SatisfactionEntry = {
  id: number;
  projectId: number;
  evaluationDate: string;
  year: number;
  month: number;
  listening: number;
  planning: number;
  technical: number;
  kpi: number;
  risk: number;
  average: number;
};

type Filters = {
  search: string;
  client: string;
  projectNumber: string;
  manager: string;
  status: string;
};

type LoadplanApiProject = {
  id: string;
  projectId: number;
  number: string;
  label: string;
  clientName: string;
};

type LoadplanApiResource = {
  id: string;
  name: string;
  roles: string[];
};

type LoadplanApiLoad = {
  projectId: string; // p-<id>
  resourceId: string;
  weekId: string;
  hours: number;
};

type LoadplanApiHoliday = {
  weekId: string;
  daysOff: number;
};

type LoadplanApiAbsence = {
  resourceId: string;
  weekId: string;
  daysOff: number;
  type: string;
};

type LoadplanApiResponse = {
  projects: LoadplanApiProject[];
  resources: LoadplanApiResource[];
  loads: LoadplanApiLoad[];
  holidays: LoadplanApiHoliday[];
  absences: LoadplanApiAbsence[];
  allWeekIds: string[];
};

type ProjectAffectation = {
  projectNumber: string;
  hours: number;
};

type TaceRow = {
  resourceId: string;
  resourceName: string;
  year: number;
  weekId: string;
  loadHours: number;
  capacityHours: number;
  tace: number;
  projectAffectations: ProjectAffectation[];
};

type RadarItem = {
  label: string;
  value: number;
  max: number;
  kind: "satisfaction";
};

type ProjectHealth = {
  projectId: number;
  projectNumber: string;
  titleProject: string;
  status: string;
  otdPct: number;
  oqdPct: number;
  auditPct: number;
  satisfactionPct: number;
  budgetConsumptionPct: number;
  ncOpen: number;
  score100: number;
  alertLevel: "Vert" | "Orange" | "Rouge";
  driftProbability: number;
  generatedActions: string[];
};

function ThMini({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-slate-600 ${className}`}
    >
      {children}
    </th>
  );
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function toRatio(value: number | null | undefined) {
  const v = Number(value ?? 0);
  if (!Number.isFinite(v)) return 0;
  if (v > 1) return v / 100;
  if (v < 0) return 0;
  return v;
}

function percent100(value: number | null | undefined) {
  return Math.round(toRatio(value) * 100);
}

function formatPercent(value: number | null | undefined) {
  return `${percent100(value)}%`;
}

function formatRatio(value: number | null | undefined, max = 5) {
  return `${Number(value ?? 0).toFixed(1)} / ${max}`;
}

function statusPillColor(status: Status | null | undefined) {
  const s = normalize(status);
  if (!s) return "bg-slate-100 text-slate-700";
  if (s.includes("critique")) return "bg-red-100 text-red-700";
  if (s.includes("alerte")) return "bg-orange-100 text-orange-700";
  if (s.includes("en cours")) return "bg-amber-100 text-amber-700";
  if (s.includes("clôturé") || s.includes("cloture"))
    return "bg-slate-100 text-slate-700";
  return "bg-emerald-100 text-emerald-700";
}

function satisfactionTextColor(note: number | null | undefined) {
  const n = Number(note ?? 0);
  if (n < 3.5) return "text-red-600";
  if (n < 4.5) return "text-orange-500";
  return "text-emerald-600";
}

function kpiColorFromPct(valuePct: number) {
  if (valuePct < 90) return "text-red-600";
  if (valuePct < 95) return "text-orange-500";
  return "text-emerald-600";
}

function kpiBgColorFromPct(valuePct: number) {
  if (valuePct < 90) return "bg-red-500";
  if (valuePct < 95) return "bg-orange-500";
  return "bg-emerald-500";
}

function budgetDeltaColor(delta: number | null | undefined) {
  const d = delta ?? 0;
  if (d > 0.05) return "text-red-600";
  if (d > -0.05) return "text-orange-500";
  return "text-emerald-600";
}

function riskBadgeColor(risk: string | null | undefined) {
  const r = normalize(risk);
  if (!r) return "bg-slate-200 text-slate-700";
  if (r.includes("crit")) return "bg-red-500 text-white";
  if (r.includes("élev") || r.includes("eleve"))
    return "bg-orange-500 text-white";
  if (r.includes("moyen")) return "bg-amber-400 text-slate-900";
  return "bg-emerald-500 text-white";
}

function getProjectDisplayNumber(p: ProjectPerformance) {
  return p.projectNumber?.trim() ? p.projectNumber : `P-${p.id}`;
}

// Version enrichie de la synthèse radar
function buildRadarSynthesis(items: RadarItem[]) {
  const strengths: string[] = [];
  const improvements: string[] = [];

  const pushUnique = (arr: string[], text: string) => {
    if (!arr.includes(text)) arr.push(text);
  };

  items.forEach((item) => {
    const pct = item.max > 0 ? (item.value / item.max) * 100 : 0;

    if (item.label === "Écoute client") {
      if (pct >= 90) {
        pushUnique(
          strengths,
          "La relation client est jugée excellente, les attentes sont bien comprises et réintégrées dans le pilotage projet."
        );
      } else if (pct >= 80) {
        pushUnique(
          strengths,
          "L’écoute client est satisfaisante, les échanges sont réguliers et structurés."
        );
      } else if (pct < 70) {
        pushUnique(
          improvements,
          "Renforcer l’écoute client : planifier des points réguliers, formaliser les besoins et sécuriser les validations."
        );
      } else {
        pushUnique(
          improvements,
          "Consolider l’écoute client en systématisant les retours après livrables et réunions clés."
        );
      }
    }

    if (item.label === "Planification") {
      if (pct >= 90) {
        pushUnique(
          strengths,
          "La planification est robuste, les jalons et les charges sont maîtrisés avec peu d’écarts."
        );
      } else if (pct >= 80) {
        pushUnique(
          strengths,
          "La planification est globalement tenue, avec des écarts limités et maîtrisés."
        );
      } else if (pct < 70) {
        pushUnique(
          improvements,
          "Revoir la planification : clarifier le chemin critique, fiabiliser les estimations de charge et partager un planning à jour."
        );
      } else {
        pushUnique(
          improvements,
          "Consolider la planification en renforçant la mise à jour des jalons et l’anticipation des dérives."
        );
      }
    }

    if (item.label === "Compétence technique") {
      if (pct >= 90) {
        pushUnique(
          strengths,
          "Le niveau technique de l’équipe est perçu comme très élevé, avec des solutions adaptées et robustes."
        );
      } else if (pct >= 80) {
        pushUnique(
          strengths,
          "Les compétences techniques couvrent correctement le besoin et sécurisent les sujets clés."
        );
      } else if (pct < 70) {
        pushUnique(
          improvements,
          "Renforcer les compétences techniques sur les domaines critiques via formation ciblée, binômage et revues d’expertise."
        );
      } else {
        pushUnique(
          improvements,
          "Consolider le socle technique via coaching, revues par les pairs et capitalisation d’expérience."
        );
      }
    }

    if (item.label === "Suivi indicateurs") {
      if (pct >= 90) {
        pushUnique(
          strengths,
          "Le pilotage par les indicateurs est mature : les KPI sont fiables, suivis et utilisés pour décider."
        );
      } else if (pct >= 80) {
        pushUnique(
          strengths,
          "Les indicateurs sont globalement suivis et partagés, ce qui soutient le pilotage opérationnel."
        );
      } else if (pct < 70) {
        pushUnique(
          improvements,
          "Structurer le suivi des KPI : définir les indicateurs clés, les fréquences de revue et des plans d’action associés."
        );
      } else {
        pushUnique(
          improvements,
          "Mieux exploiter les indicateurs existants en les intégrant davantage dans les revues projet."
        );
      }
    }

    if (item.label === "Suivi risques") {
      if (pct >= 90) {
        pushUnique(
          strengths,
          "La maîtrise des risques est très bonne : le registre est à jour et les actions de réduction sont efficaces."
        );
      } else if (pct >= 80) {
        pushUnique(
          strengths,
          "Le suivi des risques est satisfaisant, avec des plans d’action globalement suivis."
        );
      } else if (pct < 70) {
        pushUnique(
          improvements,
          "Renforcer la gestion des risques : alimenter le registre, prioriser les risques critiques et suivre les actions régulièrement."
        );
      } else {
        pushUnique(
          improvements,
          "Consolider le suivi des risques en alignant l’équipe sur les principales menaces et opportunités."
        );
      }
    }
  });

  if (strengths.length === 0) {
    strengths.push(
      "Aucun point fort majeur n’a été identifié sur la période ; maintenir un pilotage régulier pour faire émerger les axes positifs."
    );
  }

  if (improvements.length === 0) {
    improvements.push(
      "Aucun axe d’amélioration prioritaire n’a été détecté ; conserver le niveau d’exigence actuel et poursuivre la démarche de progrès continu."
    );
  }

  return {
    strengths: Array.from(new Set(strengths)),
    improvements: Array.from(new Set(improvements)),
  };
}

function makeCsv(rows: (string | number)[][], filename: string) {
  const csv =
    "\uFEFF" +
    rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function monthNameFr(month: string) {
  const map: Record<string, string> = {
    "01": "Janvier",
    "02": "Février",
    "03": "Mars",
    "04": "Avril",
    "05": "Mai",
    "06": "Juin",
    "07": "Juillet",
    "08": "Août",
    "09": "Septembre",
    "10": "Octobre",
    "11": "Novembre",
    "12": "Décembre",
  };
  return map[month] ?? month;
}

function computeProjectHealth(p: ProjectPerformance): ProjectHealth {
  const otdPct = percent100(p.deliverablesOtdRate ?? p.otdGlobal ?? 0);
  const oqdPct = percent100(p.deliverablesOqdRate ?? p.oqdGlobal ?? 0);
  const auditPct = percent100(p.currentAuditRate ?? p.globalConformityRate ?? 0);
  const satisfactionPct = Math.round(
    (Number(p.customerSatisfaction ?? 0) / 5) * 100
  );

  const planned = Number(p.budgetPlanned ?? 0);
  const consumed = Number(p.budgetConsumed ?? 0);
  const budgetConsumptionPct =
    planned > 0 ? Math.round((consumed / planned) * 100) : 0;

  const costScore =
    planned <= 0
      ? 70
      : consumed <= planned
      ? 100
      : clamp(100 - ((consumed - planned) / planned) * 200, 0, 100);

  const ncOpen = Number(
    (p as any).openNonConformitiesCount ?? p.nonConformitiesOpenCount ?? 0
  );
  const ncPenalty = clamp(ncOpen * 6, 0, 35);

  const score100 = clamp(
    Math.round(
      otdPct * 0.3 +
        oqdPct * 0.25 +
        auditPct * 0.2 +
        satisfactionPct * 0.15 +
        costScore * 0.1 -
        ncPenalty
    ),
    0,
    100
  );

  const driftRaw =
    Math.max(0, 90 - otdPct) * 0.25 +
    Math.max(0, 90 - oqdPct) * 0.2 +
    Math.max(0, 90 - auditPct) * 0.2 +
    Math.max(0, 70 - satisfactionPct) * 0.15 +
    Math.max(0, budgetConsumptionPct - 100) * 0.2 +
    ncOpen * 3;

  const driftProbability = clamp(Math.round(driftRaw), 0, 100);

  const alertLevel: "Vert" | "Orange" | "Rouge" =
    score100 < 60 || driftProbability >= 70
      ? "Rouge"
      : score100 < 80 || driftProbability >= 40
      ? "Orange"
      : "Vert";

  const generatedActions: string[] = [];
  if (otdPct < 90)
    generatedActions.push(
      "Revoir le planning détaillé, les jalons et le chemin critique sous 48h."
    );
  if (oqdPct < 90)
    generatedActions.push(
      "Lancer une revue qualité ciblée sur les livrables non conformes."
    );
  if (auditPct < 90)
    generatedActions.push(
      "Mettre à jour le plan d’actions d’audit avec responsable et échéance."
    );
  if (satisfactionPct < 70)
    generatedActions.push(
      "Programmer un point client et formaliser 3 actions d’amélioration."
    );
  if (budgetConsumptionPct > 100)
    generatedActions.push(
      "Arbitrer les dépenses et recalculer le reste à faire budgétaire."
    );
  if (ncOpen > 0) {
    generatedActions.push(
      "Prioriser la clôture des NC ouvertes avec suivi hebdomadaire."
    );
  }
  if (generatedActions.length === 0) {
    generatedActions.push(
      "Maintenir le rythme actuel et sécuriser les prochains jalons."
    );
  }

  return {
    projectId: p.id,
    projectNumber: getProjectDisplayNumber(p),
    titleProject: p.titleProject ?? "-",
    status: String(p.status ?? "-"),
    otdPct,
    oqdPct,
    auditPct,
    satisfactionPct,
    budgetConsumptionPct,
    ncOpen,
    score100,
    alertLevel,
    driftProbability,
    generatedActions,
  };
}

export default function PerformancePage() {
  const [projects, setProjects] = useState<ProjectPerformance[]>([]);
  const [satisfactions, setSatisfactions] = useState<SatisfactionEntry[]>([]);
  const [loadplan, setLoadplan] = useState<LoadplanApiResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingLoadplan, setLoadingLoadplan] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    client: "Tous",
    projectNumber: "Tous",
    manager: "Tous",
    status: "Tous",
  });

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [savingCs, setSavingCs] = useState(false);
  const [csMessage, setCsMessage] = useState<string | null>(null);
  const [showSatisfactionModal, setShowSatisfactionModal] = useState(false);
  const [showPerformanceHelp, setShowPerformanceHelp] = useState(false);
  const [evaluationDate, setEvaluationDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [csForm, setCsForm] = useState({
    listening: 3,
    planning: 3,
    technical: 3,
    kpi: 3,
    risk: 3,
  });

  const currentYear = new Date().getFullYear();
  const [taceResourceFilter, setTaceResourceFilter] = useState("Tous");
  const [taceYearFilter, setTaceYearFilter] = useState(String(currentYear));
  const [taceWeekFilter, setTaceWeekFilter] = useState("Tous");
  const [taceHorizon, setTaceHorizon] = useState<"4" | "8" | "12" | "all">(
    "all"
  );

  const [radarProjectFilter, setRadarProjectFilter] = useState("Tous");
  const [radarYearFilter, setRadarYearFilter] = useState(String(currentYear));
  const [radarMonthFilter, setRadarMonthFilter] = useState("Tous");

  const [alertsColorFilter, setAlertsColorFilter] = useState<
    "all" | "Vert" | "Orange" | "Rouge"
  >("all");

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (!res.ok)
        throw new Error("Erreur lors du chargement des projets");
      const data = await res.json();
      setProjects((data.projects ?? data) as ProjectPerformance[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSatisfactions = async () => {
    try {
      const res = await fetch("/api/projects/satisfaction");
      if (!res.ok)
        throw new Error(
          "Erreur lors du chargement de l’historique satisfaction"
        );
      const data = await res.json();
      setSatisfactions(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) {
      console.error(e);
      setSatisfactions([]);
    }
  };

  const loadLoadplan = async (year: number) => {
    try {
      setLoadingLoadplan(true);
      const res = await fetch(`/api/loadplan?year=${year}`);
      if (!res.ok)
        throw new Error("Erreur lors du chargement du loadplan");
      const data = (await res.json()) as LoadplanApiResponse;
      setLoadplan(data);
    } catch (e) {
      console.error(e);
      setLoadplan(null);
    } finally {
      setLoadingLoadplan(false);
    }
  };

  useEffect(() => {
    loadProjects();
    loadSatisfactions();
  }, []);

  useEffect(() => {
    loadLoadplan(Number(taceYearFilter));
  }, [taceYearFilter]);

  const allProjectsForFilters = useMemo(() => projects, [projects]);

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return projects.filter((p) => {
      const text = [
        getProjectDisplayNumber(p),
        p.titleProject ?? "",
        p.clientName ?? "",
        p.projectManagerName ?? "",
        p.status ?? "",
      ]
        .join(" ")
        .toLowerCase();

      if (search && !text.includes(search)) return false;
      if (filters.client !== "Tous" && p.clientName !== filters.client)
        return false;
      if (
        filters.projectNumber !== "Tous" &&
        getProjectDisplayNumber(p) !== filters.projectNumber
      )
        return false;
      if (
        filters.manager !== "Tous" &&
        p.projectManagerName !== filters.manager
      )
        return false;
      if (filters.status !== "Tous" && p.status !== filters.status)
        return false;
      return true;
    });
  }, [projects, filters]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (selectedProject) {
      setCsForm({
        listening: Math.round(selectedProject.csListening ?? 3) || 3,
        planning: Math.round(selectedProject.csPlanning ?? 3) || 3,
        technical: Math.round(selectedProject.csTechnical ?? 3) || 3,
        kpi: Math.round(selectedProject.csKpiFollowup ?? 3) || 3,
        risk: Math.round(selectedProject.csRiskFollowup ?? 3) || 3,
      });
    }
  }, [selectedProject]);

  const csAverage = useMemo(
    () =>
      (csForm.listening +
        csForm.planning +
        csForm.technical +
        csForm.kpi +
        csForm.risk) /
      5,
    [csForm]
  );

  const globalStats = useMemo(() => {
    const base = filtered.length > 0 ? filtered : projects;
    if (base.length === 0) {
      return {
        avgSatisfaction: 0,
        otd: 0,
        oqd: 0,
        conformity: 0,
        criticalProjectsCount: 0,
        budgetPlannedTotal: 0,
        budgetConsumedTotal: 0,
        budgetDelta: 0,
      };
    }

    const n = base.length;
    const budgetPlannedTotal = base.reduce(
      (s, p) => s + Number(p.budgetPlanned ?? 0),
      0
    );
    const budgetConsumedTotal = base.reduce(
      (s, p) => s + Number(p.budgetConsumed ?? 0),
      0
    );

    return {
      avgSatisfaction:
        base.reduce(
          (s, p) => s + Number(p.customerSatisfaction ?? 0),
          0
        ) / n,
      otd:
        base.reduce(
          (s, p) =>
            s + toRatio(p.deliverablesOtdRate ?? p.otdGlobal ?? 0),
          0
        ) / n,
      oqd:
        base.reduce(
          (s, p) =>
            s + toRatio(p.deliverablesOqdRate ?? p.oqdGlobal ?? 0),
          0
        ) / n,
      conformity:
        base.reduce(
          (s, p) =>
            s +
            toRatio(
              p.currentAuditRate ?? p.globalConformityRate ?? 0
            ),
          0
        ) / n,
      criticalProjectsCount: base.filter((p) =>
        /(critique|inacceptable)/i.test(
          String(p.riskCriticality ?? "")
        )
      ).length,
      budgetPlannedTotal,
      budgetConsumedTotal,
      budgetDelta:
        budgetPlannedTotal === 0
          ? 0
          : (budgetConsumedTotal - budgetPlannedTotal) /
            budgetPlannedTotal,
    };
  }, [filtered, projects]);

  const rawTaceRows = useMemo(() => {
    if (!loadplan) return [];
    const hoursPerDay = 7;

    const holidaysByWeek: Record<string, number> = {};
    loadplan.holidays.forEach((h) => {
      holidaysByWeek[h.weekId] =
        (holidaysByWeek[h.weekId] ?? 0) + h.daysOff * hoursPerDay;
    });

    const absencesByResWeek: Record<string, number> = {};
    loadplan.absences.forEach((a) => {
      const key = `${a.resourceId}|${a.weekId}`;
      absencesByResWeek[key] =
        (absencesByResWeek[key] ?? 0) + a.daysOff * hoursPerDay;
    });

    const loadsByResWeek: Record<string, number> = {};
    const loadsByResWeekProject: Record<
      string,
      Record<string, number>
    > = {};

    loadplan.loads.forEach((l) => {
      const key = `${l.resourceId}|${l.weekId}`;
      loadsByResWeek[key] = (loadsByResWeek[key] ?? 0) + l.hours;
      if (!loadsByResWeekProject[key]) loadsByResWeekProject[key] = {};
      loadsByResWeekProject[key][l.projectId] =
        (loadsByResWeekProject[key][l.projectId] ?? 0) + l.hours;
    });

    const rows: TaceRow[] = [];

    for (const resource of loadplan.resources) {
      for (const weekId of loadplan.allWeekIds) {
        const year = Number(weekId.slice(0, 4)) || currentYear;
        const key = `${resource.id}|${weekId}`;
        const loadHours = loadsByResWeek[key] ?? 0;
        const holidayHours = holidaysByWeek[weekId] ?? 0;
        const absenceHours = absencesByResWeek[key] ?? 0;
        const capacityHours = Math.max(
          0,
          35 - holidayHours - absenceHours
        );

        if (loadHours === 0 && capacityHours === 35) continue;

        const tace = capacityHours > 0 ? loadHours / capacityHours : 0;

        const projectAffectations = Object.entries(
          loadsByResWeekProject[key] ?? {}
        )
          .map(([projectId, hours]) => {
            const project = loadplan.projects.find(
              (p) => String(p.projectId) === String(projectId)
            );
            return {
              projectNumber:
                project?.number ?? `P-${projectId}`,
              hours: Math.round(Number(hours) * 10) / 10,
            };
          })
          .sort((a, b) =>
            a.projectNumber.localeCompare(b.projectNumber)
          );

        rows.push({
          resourceId: resource.id,
          resourceName: resource.name,
          year,
          weekId,
          loadHours,
          capacityHours,
          tace,
          projectAffectations,
        });
      }
    }

    return rows.sort((a, b) =>
      a.weekId === b.weekId
        ? a.resourceName.localeCompare(b.resourceName)
        : a.weekId.localeCompare(b.weekId)
    );
  }, [loadplan, currentYear]);

  const taceWeeksForYear = useMemo(
    () =>
      Array.from(
        new Set(
          rawTaceRows
            .filter((r) => String(r.year) === taceYearFilter)
            .map((r) => r.weekId)
        )
      ).sort(),
    [rawTaceRows, taceYearFilter]
  );

  const filteredTaceRows = useMemo(() => {
    const rowsForYear = rawTaceRows.filter(
      (r) => String(r.year) === taceYearFilter
    );

    let rows = rowsForYear.filter((r) => {
      if (
        taceResourceFilter !== "Tous" &&
        r.resourceName !== taceResourceFilter
      )
        return false;
      if (
        taceWeekFilter !== "Tous" &&
        r.weekId !== taceWeekFilter
      )
        return false;
      return true;
    });

    if (taceHorizon !== "all") {
      const horizon = Number(taceHorizon);
      const sortedWeeks = Array.from(
        new Set(rowsForYear.map((r) => r.weekId))
      ).sort();
      rows = rows.filter((r) =>
        sortedWeeks.slice(0, horizon).includes(r.weekId)
      );
    }

    return rows;
  }, [
    rawTaceRows,
    taceResourceFilter,
    taceYearFilter,
    taceWeekFilter,
    taceHorizon,
  ]);

  const taceGlobal = useMemo(() => {
    if (filteredTaceRows.length === 0) return 0;
    const load = filteredTaceRows.reduce(
      (s, r) => s + r.loadHours,
      0
    );
    const cap = filteredTaceRows.reduce(
      (s, r) => s + r.capacityHours,
      0
    );
    return cap > 0 ? load / cap : 0;
  }, [filteredTaceRows]);

  const radarYearOptions = useMemo(
    () =>
      Array.from(
        new Set(satisfactions.map((s) => String(s.year)))
      ).sort(),
    [satisfactions]
  );

  const radarMonthOptions = useMemo(
    () =>
      Array.from(
        new Set(
          satisfactions
            .filter(
              (s) =>
                radarYearFilter === "Tous" ||
                String(s.year) === radarYearFilter
            )
            .map((s) => String(s.month).padStart(2, "0"))
        )
      ).sort(),
    [satisfactions, radarYearFilter]
  );

  const radarProjectOptions = useMemo(
    () =>
      Array.from(
        new Set(satisfactions.map((s) => s.projectId))
      ).sort((a, b) => a - b),
    [satisfactions]
  );

  const radarEntries = useMemo(() => {
    let list = satisfactions.slice();
    if (radarProjectFilter !== "Tous") {
      list = list.filter(
        (s) => String(s.projectId) === radarProjectFilter
      );
    }
    if (radarYearFilter !== "Tous") {
      list = list.filter(
        (s) => String(s.year) === radarYearFilter
      );
    }
    if (radarMonthFilter !== "Tous") {
      list = list.filter(
        (s) =>
          String(s.month).padStart(2, "0") === radarMonthFilter
      );
    }
    return list;
  }, [
    satisfactions,
    radarProjectFilter,
    radarYearFilter,
    radarMonthFilter,
  ]);

  const radarData: RadarItem[] = useMemo(() => {
    if (radarEntries.length === 0) {
      return [
        {
          label: "Écoute client",
          value: 0,
          max: 5,
          kind: "satisfaction",
        },
        {
          label: "Planification",
          value: 0,
          max: 5,
          kind: "satisfaction",
        },
        {
          label: "Compétence technique",
          value: 0,
          max: 5,
          kind: "satisfaction",
        },
        {
          label: "Suivi indicateurs",
          value: 0,
          max: 5,
          kind: "satisfaction",
        },
        {
          label: "Suivi risques",
          value: 0,
          max: 5,
          kind: "satisfaction",
        },
      ];
    }

    const avg = (key: keyof SatisfactionEntry) =>
      radarEntries.reduce(
        (sum, p) => sum + Number(p[key] ?? 0),
        0
      ) / radarEntries.length;

    return [
      {
        label: "Écoute client",
        value: avg("listening"),
        max: 5,
        kind: "satisfaction",
      },
      {
        label: "Planification",
        value: avg("planning"),
        max: 5,
        kind: "satisfaction",
      },
      {
        label: "Compétence technique",
        value: avg("technical"),
        max: 5,
        kind: "satisfaction",
      },
      {
        label: "Suivi indicateurs",
        value: avg("kpi"),
        max: 5,
        kind: "satisfaction",
      },
      {
        label: "Suivi risques",
        value: avg("risk"),
        max: 5,
        kind: "satisfaction",
      },
    ];
  }, [radarEntries]);

  const radarSynthesis = useMemo(
    () => buildRadarSynthesis(radarData),
    [radarData]
  );

  const satisfactionHistogramData = useMemo(() => {
    const groups: Record<
      string,
      { label: string; count: number; total: number }
    > = {};
    radarEntries.forEach((e) => {
      const month = String(e.month).padStart(2, "0");
      const key = `${e.year}-${month}`;
      if (!groups[key]) {
        groups[key] = {
          label: `${monthNameFr(month)} ${e.year}`,
          count: 0,
          total: 0,
        };
      }
      groups[key].count += 1;
      groups[key].total += Number(e.average ?? 0);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        label: v.label,
        moyenne: Number((v.total / v.count).toFixed(2)),
        evaluations: v.count,
      }));
  }, [radarEntries]);

  const projectHealthList = useMemo(
    () =>
      filtered
        .map((p) => computeProjectHealth(p))
        .sort((a, b) => a.score100 - b.score100),
    [filtered]
  );

  const portfolioHealth = useMemo(() => {
    if (projectHealthList.length === 0) {
      return {
        avgScore: 0,
        redAlerts: 0,
        orangeAlerts: 0,
        greenAlerts: 0,
      };
    }
    return {
      avgScore: Math.round(
        projectHealthList.reduce(
          (sum, p) => sum + p.score100,
          0
        ) / projectHealthList.length
      ),
      redAlerts: projectHealthList.filter(
        (p) => p.alertLevel === "Rouge"
      ).length,
      orangeAlerts: projectHealthList.filter(
        (p) => p.alertLevel === "Orange"
      ).length,
      greenAlerts: projectHealthList.filter(
        (p) => p.alertLevel === "Vert"
      ).length,
    };
  }, [projectHealthList]);

  const filteredAlerts = useMemo(
    () =>
      projectHealthList.filter((p) =>
        alertsColorFilter === "all"
          ? true
          : p.alertLevel === alertsColorFilter
      ),
    [projectHealthList, alertsColorFilter]
  );

  const topAlerts = useMemo(
    () => filteredAlerts.slice(0, 50),
    [filteredAlerts]
  );

  const saveCustomerSatisfaction = async () => {
    if (!selectedProjectId) {
      setCsMessage("Veuillez sélectionner un projet.");
      return;
    }

    try {
      setSavingCs(true);
      setCsMessage(null);

      const res = await fetch(
        `/api/projects/${selectedProjectId}/satisfaction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evaluationDate,
            listening: csForm.listening,
            planning: csForm.planning,
            technical: csForm.technical,
            kpi: csForm.kpi,
            risk: csForm.risk,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error ?? "Erreur d'enregistrement");

      setCsMessage("Évaluation enregistrée avec succès.");
      setShowSatisfactionModal(false);
      await loadProjects();
      await loadSatisfactions();
    } catch (e: any) {
      console.error(e);
      setCsMessage(
        e?.message ?? "Erreur lors de l'enregistrement."
      );
    } finally {
      setSavingCs(false);
    }
  };

  const exportProjectsCsv = () => {
    const headers = [
      "N° PROJET",
      "INTITULÉ PROJET",
      "CLIENT",
      "CHEF DE PROJET",
      "STATUT",
      "SATISFACTION (/5)",
      "OTD (%)",
      "DoD (j)",
      "OQD (%)",
      "NC PROJET",
      "NC OUVERTES",
      "SCORE AUDIT (%)",
      "SCORE PROJET (/100)",
      "ALERTE",
      "PROBA DÉRIVE (%)",
    ];

    const rows = filtered.map((p) => {
      const health = computeProjectHealth(p);
      const ncOpen = Number(
        (p as any).openNonConformitiesCount ??
          p.nonConformitiesOpenCount ??
          0
      );
      return [
        getProjectDisplayNumber(p),
        p.titleProject ?? "-",
        p.clientName ?? "-",
        p.projectManagerName ?? "-",
        p.status ?? "-",
        Number(p.customerSatisfaction ?? 0).toFixed(1),
        percent100(
          p.deliverablesOtdRate ?? p.otdGlobal ?? 0
        ),
        Number(p.deliverablesDodRate ?? 0).toFixed(1),
        percent100(
          p.deliverablesOqdRate ?? p.oqdGlobal ?? 0
        ),
        Number(p.nonConformitiesCount ?? 0),
        ncOpen,
        percent100(
          p.currentAuditRate ??
            p.globalConformityRate ??
            0
        ),
        health.score100,
        health.alertLevel,
        health.driftProbability,
      ];
    });

    makeCsv([headers, ...rows], "performance_projets.csv");
  };

  const exportTaceCsv = () => {
    const headers = [
      "SEMAINE",
      "RESSOURCE",
      "TACE (%)",
      "CAPACITÉ (H)",
      "CHARGE (H)",
      "PROJET AFFECTÉ",
      "HEURES / PROJET",
    ];

    const rows = filteredTaceRows.map((r) => [
      r.weekId,
      r.resourceName,
      Math.round(r.tace * 1000) / 10,
      Math.round(r.capacityHours * 10) / 10,
      Math.round(r.loadHours * 10) / 10,
      r.projectAffectations
        .map((p) => p.projectNumber)
        .join(" | "),
      r.projectAffectations
        .map((p) => `${p.hours}h`)
        .join(" | "),
    ]);

    makeCsv([headers, ...rows], "performance_tace.csv");
  };

  const effortBars = useMemo(
    () => [
      {
        name: "Capacité",
        value:
          Math.round(
            filteredTaceRows.reduce(
              (s, r) => s + r.capacityHours,
              0
            ) * 10
          ) / 10,
      },
      {
        name: "Charge",
        value:
          Math.round(
            filteredTaceRows.reduce(
              (s, r) => s + r.loadHours,
              0
            ) * 10
          ) / 10,
      },
    ],
    [filteredTaceRows]
  );

  const alertsChartData = useMemo(
    () =>
      projectHealthList
        .slice()
        .sort((a, b) => b.driftProbability - a.driftProbability)
        .slice(0, 8)
        .map((h) => ({
          project: h.projectNumber,
          score: h.score100,
          drift: h.driftProbability,
        })),
    [projectHealthList]
  );

  return (
    <AppShell
      activeSection="performance"
      pageTitle="Performance opérationnelle"
      pageSubtitle="Synthèse qualité, satisfaction, scoring projet et charge d'équipe."
    >
      <section className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={exportProjectsCsv}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Export Excel projets
        </button>

        <button
          onClick={exportTaceCsv}
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Export Excel TACE
        </button>
        
        <button
          onClick={() => {
            setEvaluationDate(
              new Date().toISOString().slice(0, 10)
            );
            setShowSatisfactionModal(true);
          }}
          className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Nouvelle évaluation satisfaction
        </button>

        <button
          onClick={() => setShowPerformanceHelp(true)}
          className="px-3 py-1.5 text-xs rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700"
        >
          Synoptique & méthode
        </button>

      </section>

      <section className="bg-white rounded-lg shadow-sm p-3 border border-slate-200 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                search: e.target.value,
              }))
            }
            placeholder="Rechercher (N° projet, client, chef de projet, statut...)"
            className="w-full md:max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm outline-none focus:outline-none focus:ring-0 focus:border-slate-300"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs mt-3">
          <div>
            <label className="block text-slate-500 mb-1">
              Client
            </label>
            <select
              className="w-full rounded-md border border-slate-300 px-2 py-1"
              value={filters.client}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  client: e.target.value,
                }))
              }
            >
              <option value="Tous">Tous</option>
              {Array.from(
                new Set(
                  allProjectsForFilters
                    .map((p) => p.clientName ?? "")
                    .filter((v) => v.trim() !== "")
                )
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
              value={filters.projectNumber}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  projectNumber: e.target.value,
                }))
              }
            >
              <option value="Tous">Tous</option>
              {allProjectsForFilters.map((p) => (
                <option
                  key={p.id}
                  value={getProjectDisplayNumber(p)}
                >
                  {getProjectDisplayNumber(p)}
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
              value={filters.manager}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  manager: e.target.value,
                }))
              }
            >
              <option value="Tous">Tous</option>
              {Array.from(
                new Set(
                  allProjectsForFilters
                    .map(
                      (p) => p.projectManagerName ?? ""
                    )
                    .filter((v) => v.trim() !== "")
                )
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
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value,
                }))
              }
            >
              <option value="Tous">Tous</option>
              {Array.from(
                new Set(
                  allProjectsForFilters
                    .map((p) => p.status ?? "")
                    .filter((v) => v.trim() !== "")
                )
              ).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({
                  search: "",
                  client: "Tous",
                  projectNumber: "Tous",
                  manager: "Tous",
                  status: "Tous",
                })
              }
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">
            Satisfaction client
          </div>
          <div
            className={`text-3xl font-semibold ${satisfactionTextColor(
              globalStats.avgSatisfaction
            )}`}
          >
            {globalStats.avgSatisfaction.toFixed(1)} / 5
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${
                  (globalStats.avgSatisfaction / 5) * 100
                }%`,
                backgroundColor:
                  globalStats.avgSatisfaction < 3.5
                    ? "#dc2626"
                    : globalStats.avgSatisfaction < 4.5
                    ? "#f97316"
                    : "#059669",
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">
            OTD
          </div>
          <div
            className={`text-3xl font-semibold ${kpiColorFromPct(
              percent100(globalStats.otd)
            )}`}
          >
            {formatPercent(globalStats.otd)}
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-2 rounded-full ${kpiBgColorFromPct(
                percent100(globalStats.otd)
              )}`}
              style={{
                width: `${toRatio(globalStats.otd) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">
            OQD
          </div>
          <div
            className={`text-3xl font-semibold ${kpiColorFromPct(
              percent100(globalStats.oqd)
            )}`}
          >
            {formatPercent(globalStats.oqd)}
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-2 rounded-full ${kpiBgColorFromPct(
                percent100(globalStats.oqd)
              )}`}
              style={{
                width: `${toRatio(globalStats.oqd) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">
            Conformité audits
          </div>
          <div
            className={`text-3xl font-semibold ${kpiColorFromPct(
              percent100(globalStats.conformity)
            )}`}
          >
            {formatPercent(globalStats.conformity)}
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-2 rounded-full ${kpiBgColorFromPct(
                percent100(globalStats.conformity)
              )}`}
              style={{
                width: `${
                  toRatio(globalStats.conformity) * 100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">
            Score portefeuille /100
          </div>
          <div
            className={`text-3xl font-semibold ${
              portfolioHealth.avgScore < 60
                ? "text-red-600"
                : portfolioHealth.avgScore < 80
                ? "text-orange-500"
                : "text-emerald-600"
            }`}
          >
            {portfolioHealth.avgScore}
          </div>
          <div className="text-[11px] mt-1 text-slate-500">
            Vert : {portfolioHealth.greenAlerts}·Orange :{" "}
            {portfolioHealth.orangeAlerts}·Rouge :{" "}
            {portfolioHealth.redAlerts}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">
            Projets critiques
          </div>
          <div className="text-2xl font-semibold text-red-600">
            {globalStats.criticalProjectsCount}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">
            Charge vs capacité (h)
          </div>
          <div className="text-2xl font-semibold text-slate-900">
            {Math.round(effortBars[1].value).toLocaleString(
              "fr-FR"
            )}{" "}
            h
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Capacité :{" "}
            {Math.round(effortBars[0].value).toLocaleString(
              "fr-FR"
            )}{" "}
            h
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">
            Budget prévu et consommé
          </div>
          <div className="text-2xl font-semibold text-slate-900">
            {Math.round(
              globalStats.budgetConsumedTotal
            ).toLocaleString("fr-FR")}{" "}
            €
          </div>
          <div
            className={`text-[11px] mt-1 font-medium ${budgetDeltaColor(
              globalStats.budgetDelta
            )}`}
          >
            {globalStats.budgetDelta >= 0 ? "+" : ""}
            {Math.round(globalStats.budgetDelta * 100)} % vs
            budget
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-xs font-medium text-slate-500 mb-1">
            Alertes automatiques
          </div>
          <div className="text-2xl font-semibold text-slate-900">
            {topAlerts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Projets visibles selon le filtre de criticité.
          </div>
        </div>
      </section>

      <section className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 mb-4">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Radar satisfaction
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Evaluation de la satisfaction client.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs w-full md:w-auto">
            <select
              className="rounded-md border border-slate-300 px-2 py-1"
              value={radarYearFilter}
              onChange={(e) => {
                setRadarYearFilter(e.target.value);
                setRadarMonthFilter("Tous");
              }}
            >
              <option value="Tous">Toutes les années</option>
              {radarYearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-slate-300 px-2 py-1"
              value={radarMonthFilter}
              onChange={(e) =>
                setRadarMonthFilter(e.target.value)
              }
            >
              <option value="Tous">Tous les mois</option>
              {radarMonthOptions.map((m) => (
                <option key={m} value={m}>
                  {monthNameFr(m)}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-slate-300 px-2 py-1"
              value={radarProjectFilter}
              onChange={(e) =>
                setRadarProjectFilter(e.target.value)
              }
            >
              <option value="Tous">Tous les projets</option>
              {radarProjectOptions.map((id) => {
                const p = projects.find(
                  (x) => x.id === id
                );
                return (
                  <option key={id} value={String(id)}>
                    {p
                      ? getProjectDisplayNumber(p)
                      : `Projet ${id}`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={radarData.map((d) => ({
                subject: d.label,
                value: d.value,
                fullMark: d.max,
              }))}
              outerRadius="72%"
            >
              <PolarGrid />
              <PolarAngleAxis
                dataKey="subject"
                tick={{
                  fontSize: 12,
                  fill: "#334155",
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{
                  fontSize: 11,
                  fill: "#64748b",
                }}
              />
              <Radar
                name="Satisfaction"
                dataKey="value"
                stroke="#4f46e5"
                fill="#4f46e5"
                fillOpacity={0.28}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-2">
              <span>✅</span>
              <span>Points forts</span>
            </div>
            {radarSynthesis.strengths.length === 0 ? (
              <div className="text-[11px] text-slate-500">
                Aucun point fort majeur détecté.
              </div>
            ) : (
              <ul className="space-y-1 text-[11px] text-slate-700">
                {radarSynthesis.strengths.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-2">
              <span>⚠️</span>
              <span>Axes d’amélioration</span>
            </div>
            {radarSynthesis.improvements.length === 0 ? (
              <div className="text-[11px] text-slate-500">
                Aucun axe d’amélioration majeur détecté.
              </div>
            ) : (
              <ul className="space-y-1 text-[11px] text-slate-700">
                {radarSynthesis.improvements.map(
                  (s, i) => (
                    <li key={i}>• {s}</li>
                  )
                )}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="text-sm font-semibold text-slate-900 mb-1">
          Histogramme évolution satisfaction
        </div>
        <div className="text-xs text-slate-500 mb-4">
          Moyenne mensuelle des évaluations de la satisfaction client.
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={satisfactionHistogramData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
              />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="moyenne"
                name="Moyenne /5"
                fill="#4f46e5"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="text-sm font-semibold text-slate-900 mb-1">
          TACE équipe 
        </div>
        <div className="text-xs text-slate-500 mt-1 mb-4">
          Taux d'occupation congés exclus.
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-4">
          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={taceResourceFilter}
            onChange={(e) =>
              setTaceResourceFilter(e.target.value)
            }
          >
            <option value="Tous">
              Ressource : Tous
            </option>
            {Array.from(
              new Set(
                rawTaceRows.map(
                  (r) => r.resourceName
                )
              )
            ).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={taceYearFilter}
            onChange={(e) => {
              setTaceYearFilter(e.target.value);
              setTaceWeekFilter("Tous");
            }}
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(
              (y) => (
                <option key={y} value={String(y)}>
                  Année : {y}
                </option>
              )
            )}
          </select>

          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={taceWeekFilter}
            onChange={(e) =>
              setTaceWeekFilter(e.target.value)
            }
          >
            <option value="Tous">
              Semaine : Toutes
            </option>
            {taceWeeksForYear.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-slate-300 px-2 py-1"
            value={taceHorizon}
            onChange={(e) =>
              setTaceHorizon(
                e.target.value as
                  | "4"
                  | "8"
                  | "12"
                  | "all"
              )
            }
          >
            <option value="all">
              Horizon : complet
            </option>
            <option value="4">4 semaines</option>
            <option value="8">8 semaines</option>
            <option value="12">12 semaines</option>
          </select>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1">
            <div className="h-[260px] relative">
              {!loadingLoadplan ? (
                <>
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "TACE",
                            value: Math.min(
                              taceGlobal * 100,
                              100
                            ),
                          },
                          {
                            name: "Reste",
                            value: Math.max(
                              0,
                              100 -
                                Math.min(
                                  taceGlobal *
                                    100,
                                  100
                                )
                            ),
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={75}
                        outerRadius={105}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell
                          fill={
                            taceGlobal >= 1
                              ? "#dc2626"
                              : taceGlobal >= 0.6
                              ? "#16a34a"
                              : "#2563eb"
                          }
                        />
                        <Cell fill="#E2E8F0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className={`text-3xl font-semibold ${
                        taceGlobal >= 1
                          ? "text-red-600"
                          : taceGlobal >= 0.6
                          ? "text-emerald-600"
                          : "text-blue-600"
                      }`}
                    >
                      {Math.round(
                        taceGlobal * 1000
                      ) / 10}
                      %
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      TACE global filtré
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  Chargement...
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="overflow-x-auto overflow-y-auto max-h-[320px] border border-slate-200 rounded-lg">
              <table className="min-w-full text-xs table-fixed">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <ThMini className="w-32">
                      Semaine
                    </ThMini>
                    <ThMini className="w-40">
                      Ressource
                    </ThMini>
                    <ThMini className="w-24">
                      TACE
                    </ThMini>
                    <ThMini className="w-28">
                      Capacité (h)
                    </ThMini>
                    <ThMini className="w-28">
                      Charge (h)
                    </ThMini>
                    <ThMini className="w-40">
                      Projet affecté
                    </ThMini>
                    <ThMini className="w-28">
                      Heures
                    </ThMini>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTaceRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-4 text-center text-slate-500"
                      >
                        Aucune ligne TACE pour les
                        filtres sélectionnés.
                      </td>
                    </tr>
                  )}

                  {filteredTaceRows.map(
                    (r, idx) => (
                      <tr
                        key={`${r.resourceId}-${r.weekId}-${idx}`}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {r.weekId}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {r.resourceName}
                        </td>
                        <td
                          className={`px-3 py-2 whitespace-nowrap text-[11px] font-semibold ${
                            r.tace >= 1
                              ? "text-red-600"
                              : r.tace >= 0.6
                              ? "text-emerald-600"
                              : "text-blue-600"
                          }`}
                        >
                          {Math.round(
                            r.tace * 1000
                          ) / 10}
                          %
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {Math.round(
                            r.capacityHours *
                              10
                          ) / 10}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {Math.round(
                            r.loadHours *
                              10
                          ) / 10}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-slate-700 align-top font-medium">
                          {r
                            .projectAffectations
                            .length === 0 ? (
                            "-"
                          ) : (
                            <div className="space-y-1">
                              {r.projectAffectations.map(
                                (p, i) => (
                                  <div
                                    key={`${p.projectNumber}-${i}`}
                                  >
                                    {
                                      p.projectNumber
                                    }
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-slate-700 align-top">
                          {r
                            .projectAffectations
                            .length === 0 ? (
                            "-"
                          ) : (
                            <div className="space-y-1">
                              {r.projectAffectations.map(
                                (p, i) => (
                                  <div
                                    key={`${p.projectNumber}-${i}`}
                                  >
                                    {p.hours}
                                    h
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-900 mb-1">
                Alertes automatiques & prédiction de dérive
              </div>
              <div className="text-xs text-slate-500">
                Visualisation des  projets les plus exposés selon le score projet /100 et la probabilité de dérive.
              </div>

              <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                <div className="font-semibold mb-1">
                  Comment lire cet indicateur ?
                </div>
                <p>
                  Le score projet (/100) agrège OTD, OQD, conformité audits, satisfaction client, coût et pénalité liée aux NC ouvertes. 
                  La probabilité de dérive (%) est une estimation heuristique basée sur les écarts aux cibles et le volume de NC ouvertes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                onClick={() =>
                  setAlertsColorFilter(
                    alertsColorFilter === "Vert"
                      ? "all"
                      : "Vert"
                  )
                }
                className={`rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-800 text-left ${
                  alertsColorFilter === "Vert"
                    ? "ring-2 ring-emerald-400"
                    : ""
                }`}
              >
                <div className="font-semibold text-[10px] uppercase">
                  Projets verts
                </div>
                <div className="text-base font-semibold">
                  {portfolioHealth.greenAlerts}
                </div>
              </button>

              <button
                onClick={() =>
                  setAlertsColorFilter(
                    alertsColorFilter === "Orange"
                      ? "all"
                      : "Orange"
                  )
                }
                className={`rounded-md border border-orange-200 bg-orange-50 px-2 py-1.5 text-orange-800 text-left ${
                  alertsColorFilter === "Orange"
                    ? "ring-2 ring-orange-400"
                    : ""
                }`}
              >
                <div className="font-semibold text-[10px] uppercase">
                  Projets orange
                </div>
                <div className="text-base font-semibold">
                  {portfolioHealth.orangeAlerts}
                </div>
              </button>

              <button
                onClick={() =>
                  setAlertsColorFilter(
                    alertsColorFilter === "Rouge"
                      ? "all"
                      : "Rouge"
                  )
                }
                className={`rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-800 text-left ${
                  alertsColorFilter === "Rouge"
                    ? "ring-2 ring-rose-400"
                    : ""
                }`}
              >
                <div className="font-semibold text-[10px] uppercase">
                  Projets rouges
                </div>
                <div className="text-base font-semibold">
                  {portfolioHealth.redAlerts}
                </div>
              </button>
            </div>
          </div>

          <div className="h-[260px] max-w-5xl mx-auto w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={alertsChartData}
                margin={{
                  top: 10,
                  right: 16,
                  left: 0,
                  bottom: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="project"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="score"
                  name="Score projet /100"
                  fill="#059669"
                  maxBarSize={24}
                />
                <Bar
                  yAxisId="right"
                  dataKey="drift"
                  name="Prob. dérive %"
                  fill="#f97316"
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${
              topAlerts.length > 3
                ? "max-h-[340px] overflow-y-auto pr-1"
                : ""
            }`}
          >
            {topAlerts.length === 0 && (
              <div className="md:col-span-3 text-[11px] text-slate-500">
                Aucun projet en alerte pour les
                filtres actuels.
              </div>
            )}

            {topAlerts.map((h) => (
              <div
                key={h.projectId}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-slate-800">
                    <Link
                      href={`/projects/${h.projectId}`}
                      className="text-indigo-700 hover:underline"
                    >
                      {h.projectNumber}
                    </Link>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      h.alertLevel === "Rouge"
                        ? "bg-red-100 text-red-700"
                        : h.alertLevel === "Orange"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {h.alertLevel}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 mb-1 line-clamp-1">
                  {h.titleProject}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1">
                  <span>
                    Score :{" "}
                    <span
                      className={
                        h.score100 < 60
                          ? "text-red-600 font-semibold"
                          : h.score100 < 80
                          ? "text-orange-500 font-semibold"
                          : "text-emerald-600 font-semibold"
                      }
                    >
                      {h.score100}/100
                    </span>
                  </span>
                  <span>
                    Dérive estimée :{" "}
                    <span
                      className={
                        h.driftProbability >= 70
                          ? "text-red-600 font-semibold"
                          : h.driftProbability >= 40
                          ? "text-orange-500 font-semibold"
                          : "text-emerald-600 font-semibold"
                      }
                    >
                      {h.driftProbability} %
                    </span>
                  </span>
                </div>

                <ul className="space-y-0.5 text-[10px] text-slate-700">
                  {h.generatedActions
                    .slice(0, 3)
                    .map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-slate-900">
            Projets – synthèse qualité & satisfaction
          </h2>
          <span className="text-[11px] text-slate-500">
            {filtered.length} projet(s) affiché(s) /{" "}
            {projects.length} au total
          </span>
        </div>

        <div className="overflow-x-auto max-h-[260px]">
          <table className="min-w-full text-xs table-fixed">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <ThMini className="w-32">
                  N° projet
                </ThMini>
                <ThMini className="w-40">
                  Intitulé projet
                </ThMini>
                <ThMini className="w-36">
                  Chef de projet
                </ThMini>
                <ThMini className="w-28">
                  Statut
                </ThMini>
                <ThMini className="w-28">
                  Satisf.
                </ThMini>
                <ThMini className="w-28">
                  OTD
                </ThMini>
                <ThMini className="w-28">
                  DoD
                </ThMini>
                <ThMini className="w-28">
                  OQD
                </ThMini>
                <ThMini className="w-32">
                  NC projet
                </ThMini>
                <ThMini className="w-32">
                  NC ouvertes
                </ThMini>
                <ThMini className="w-32">
                  Score audit
                </ThMini>
                <ThMini className="w-28">
                  Risque
                </ThMini>
                <ThMini className="w-24">
                  Score /100
                </ThMini>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    Aucun projet ne correspond à
                    votre recherche.
                  </td>
                </tr>
              )}

              {filtered.map((p) => {
                const health = computeProjectHealth(p);
                const ncOpen = Number(
                  (p as any)
                    .openNonConformitiesCount ??
                    p.nonConformitiesOpenCount ??
                    0
                );

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-3 py-2 text-[11px] text-indigo-700 whitespace-nowrap">
                      <Link
                        href={`/projects/${p.id}`}
                        className="hover:underline"
                      >
                        {getProjectDisplayNumber(p)}
                      </Link>
                    </td>

                    <td className="px-3 py-2 text-[11px] text-slate-800 whitespace-nowrap">
                      {p.titleProject ?? "-"}
                    </td>

                    <td className="px-3 py-2 text-[11px] text-slate-700 whitespace-nowrap">
                      {p.projectManagerName ??
                        "—"}
                    </td>

                    <td className="px-3 py-2 text-[11px] whitespace-nowrap">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          statusPillColor(p.status),
                        ].join(" ")}
                      >
                        {p.status ?? "-"}
                      </span>
                    </td>

                    <td
                      className={`px-3 py-2 text-[11px] whitespace-nowrap ${satisfactionTextColor(
                        p.customerSatisfaction
                      )}`}
                    >
                      {Number(
                        p.customerSatisfaction ?? 0
                      ).toFixed(1)}{" "}
                      / 5
                    </td>

                    <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                      {formatPercent(
                        p.deliverablesOtdRate ??
                          p.otdGlobal ??
                          0
                      )}
                    </td>

                    <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                      {Number(
                        p.deliverablesDodRate ?? 0
                      ).toFixed(1)}{" "}
                      j
                    </td>

                    <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                      {formatPercent(
                        p.deliverablesOqdRate ??
                          p.oqdGlobal ??
                          0
                      )}
                    </td>

                    <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                      {Number(
                        p.nonConformitiesCount ??
                          0
                      )}
                    </td>

                    <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                      {ncOpen}
                    </td>

                    <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                      {formatPercent(
                        p.currentAuditRate ??
                          p.globalConformityRate ??
                          0
                      )}
                    </td>

                    <td className="px-3 py-2 text-[11px] text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${riskBadgeColor(
                          p.riskCriticality
                        )}`}
                      >
                        {p.riskCriticality ??
                          "N/A"}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                      <span
                        className={
                          health.score100 < 60
                            ? "text-red-600 font-semibold"
                            : health.score100 < 80
                            ? "text-orange-500 font-semibold"
                            : "text-emerald-600 font-semibold"
                        }
                      >
                        {health.score100}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {showPerformanceHelp && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Synoptique – Performance opérationnelle
                </h3>
                <p className="text-[11px] text-slate-500">
                  Aide à la lecture des indicateurs et
                  logique de calcul.
                </p>
              </div>
              <button
                className="text-slate-500 hover:text-slate-700"
                onClick={() =>
                  setShowPerformanceHelp(false)
                }
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-[11px] text-slate-700">
              <div>
                <div className="font-semibold text-slate-900 mb-1">
                  1. KPIs de synthèse
                </div>
                <p>
                  Les tuiles du haut agrègent la
                  satisfaction client moyenne (/5),
                  l’OTD, l’OQD, la conformité audits et
                  le score portefeuille. Les seuils
                  visuels sont alignés sur la logique
                  de statut de la page.
                </p>
              </div>

              <div>
                <div className="font-semibold text-slate-900 mb-1">
                  2. Score projet /100
                </div>
                <p>
                  Le score projet combine OTD, OQD,
                  conformité audits, satisfaction
                  client, maîtrise des coûts et
                  pénalité sur les NC ouvertes afin
                  d’obtenir une lecture synthétique de
                  la santé du projet.
                </p>
              </div>

              <div>
                <div className="font-semibold text-slate-900 mb-1">
                  3. Dérive prédictive
                </div>
                <p>
                  La probabilité de dérive est une
                  estimation heuristique fondée sur
                  l’écart aux objectifs et sur le
                  nombre de NC ouvertes. Elle permet
                  d’anticiper les projets à
                  surveiller avant dégradation
                  visible.
                </p>
              </div>

              <div>
                <div className="font-semibold text-slate-900 mb-1">
                  4. Radar satisfaction
                </div>
                <p>
                  Le radar restitue l’écoute client,
                  la planification, la compétence
                  technique, le suivi des KPI et le
                  suivi des risques sur une échelle de
                  1 à 5.
                </p>
              </div>

              <div>
                <div className="font-semibold text-slate-900 mb-1">
                  5. TACE
                </div>
                <p>
                  Le TACE compare la charge planifiée
                  à la capacité disponible après prise
                  en compte des jours fériés et
                  absences. Les couleurs sont : bleu
                  en dessous de 60%, vert entre 60% et
                  100%, rouge à partir de 100%.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSatisfactionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Nouvelle évaluation satisfaction
                </h3>
                <p className="text-[11px] text-slate-500">
                  Historique prêt backend avec date,
                  mois et année de référence.
                </p>
              </div>
              <button
                className="text-slate-500 hover:text-slate-700"
                onClick={() =>
                  setShowSatisfactionModal(false)
                }
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Projet
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  value={selectedProjectId ?? ""}
                  onChange={(e) =>
                    setSelectedProjectId(
                      e.target.value
                        ? Number(e.target.value)
                        : null
                    )
                  }
                >
                  <option value="">
                    Sélectionner
                  </option>
                  {projects.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                    >
                      {getProjectDisplayNumber(
                        p
                      )}{" "}
                      -{" "}
                      {p.titleProject ??
                        "-"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Date d’évaluation
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                  value={evaluationDate}
                  onChange={(e) =>
                    setEvaluationDate(
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                {
                  key: "listening",
                  label: "Écoute client",
                },
                {
                  key: "planning",
                  label: "Planification",
                },
                {
                  key: "technical",
                  label: "Technique",
                },
                { key: "kpi", label: "KPI" },
                {
                  key: "risk",
                  label: "Risques",
                },
              ].map((item) => (
                <div key={item.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {item.label}
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
                    value={
                      (csForm as any)[
                        item.key
                      ]
                    }
                    onChange={(e) =>
                      setCsForm(
                        (prev) => ({
                          ...prev,
                          [item.key]:
                            Number(
                              e.target.value
                            ),
                        })
                      )
                    }
                  >
                    {[1, 2, 3, 4, 5].map(
                      (n) => (
                        <option
                          key={n}
                          value={n}
                        >
                          {n}/5
                        </option>
                      )
                    )}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500">
                  Note moyenne
                </div>
                <div
                  className={`text-lg font-semibold ${satisfactionTextColor(
                    csAverage
                  )}`}
                >
                  {csAverage.toFixed(1)} / 5
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded-md border border-slate-300 px-3 py-2 text-xs"
                  onClick={() =>
                    setShowSatisfactionModal(false)
                  }
                >
                  Annuler
                </button>
                <button
                  disabled={
                    savingCs ||
                    !selectedProjectId
                  }
                  onClick={saveCustomerSatisfaction}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-xs text-white disabled:bg-slate-400"
                >
                  {savingCs
                    ? "Enregistrement..."
                    : "Enregistrer"}
                </button>
              </div>
            </div>

            {csMessage && (
              <div className="mt-3 text-[11px] text-slate-600">
                {csMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}