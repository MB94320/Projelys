"use client";

import { useEffect, useMemo, useState } from "react";
// import { useSearchParams } from "next/navigation";
import AppShell from "../components/AppShell";
import { ChargeVsCapacityChart } from "./ChargeVsCapacityChart";
import Link from "next/link";
import { ResourceUtilizationChart } from "./ResourceUtilizationChart";

type Role =
  | "Chef de projet"
  | "Consultant"
  | "Développeur"
  | "Testeur"
  | string;
type WeekId = string;

type ApiProject = {
  id: string; // p-<id>
  projectId: number;
  number: string; // n° projet
  label: string; // libellé
  clientName: string;
};

type ApiResource = {
  id: string; // res-<name>
  name: string;
  roles: string[];
};

type ApiLoad = {
  projectId: string;
  resourceId: string;
  weekId: WeekId;
  hours: number;
};

type ApiHoliday = {
  weekId: WeekId;
  daysOff: number;
};

type ApiAbsence = {
  resourceId: string;
  weekId: WeekId;
  daysOff: number;
  type: string;
};

type LoadplanApiResponse = {
  projects: ApiProject[];
  resources: ApiResource[];
  loads: ApiLoad[];
  holidays: ApiHoliday[];
  absences: ApiAbsence[];
  allWeekIds: WeekId[];
};

type AlertLevel = "Surcharge" | "Sous-charge";

type Alert = {
  level: AlertLevel;
  resourceName: string;
  weeks: string[]; // S49, S50...
  summary: string;
  recommendation: string;
};

const BASE_WEEK_CAPACITY = 35;
const UNDERLOAD_THRESHOLD = 25;
const OVERLOAD_THRESHOLD = 35;

// -------- helpers --------

function yearFromWeek(weekId: string): number {
  const [yearStr] = weekId.split("-");
  return Number(yearStr);
}

function weekLabel(weekId: WeekId) {
  return weekId.split("-")[1] ?? weekId;
}

function getCurrentWeekId(): WeekId {
  const now = new Date();
  const d = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  const weekStr = weekNo.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}-S${weekStr}`;
}

function badgeClass(hours: number) {
  if (hours > OVERLOAD_THRESHOLD) return "bg-rose-100 text-rose-700";
  if (hours < UNDERLOAD_THRESHOLD) return "bg-sky-100 text-sky-700";
  return "bg-emerald-100 text-emerald-700";
}
function capacityBadgeClass(hours: number) {
  if (hours >= 35) return "bg-slate-100 text-slate-700";
  if (hours >= 28) return "bg-indigo-100 text-indigo-700";
  if (hours >= 21) return "bg-violet-100 text-violet-700";
  if (hours > 0) return "bg-rose-100 text-rose-700";
  return "bg-rose-200 text-rose-800";
}

function alertColor(level: AlertLevel) {
  if (level === "Surcharge")
    return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-sky-200 bg-sky-50 text-sky-800";
}

// --- export tableaux détaillés ---

function exportTableCharge(
  projects: ApiProject[],
  resources: ApiResource[],
  weeks: WeekId[],
  loads: ApiLoad[],
  selectedProject: string,
  filteredResources: ApiResource[],
) {
  const header = [
    "N° projet",
    "Intitulé",
    "Collaborateur",
    "Rôles",
    ...weeks.map(weekLabel),
  ];
  const rows: string[][] = [];

  projects
    .filter((p) => selectedProject === "Tous" || p.id === selectedProject)
    .forEach((p) => {
      filteredResources.forEach((r) => {
        const hasLoad = weeks.some((w) =>
          loads.some(
            (l) =>
              l.projectId === p.id && l.resourceId === r.id && l.weekId === w,
          ),
        );
        if (!hasLoad) return;

        const row: string[] = [p.number, p.label, r.name, r.roles.join(", ")];

        weeks.forEach((w) => {
          const h = loads
            .filter(
              (l) =>
                l.projectId === p.id &&
                l.resourceId === r.id &&
                l.weekId === w,
            )
            .reduce((sum, l) => sum + l.hours, 0);
          row.push(h === 0 ? "" : h.toFixed(1));
        });

        rows.push(row);
      });
    });

  return { header, rows };
}

function exportTableCapacity(
  resources: ApiResource[],
  weeks: WeekId[],
  capacityByResWeek: Map<string, number>,
) {
  const header = ["Collaborateur", "Rôles", ...weeks.map(weekLabel)];
  const rows: string[][] = [];

  resources.forEach((r) => {
    const row: string[] = [r.name, r.roles.join(", ")];
    weeks.forEach((w) => {
      const key = `${r.id}|${w}`;
      const cap = capacityByResWeek.get(key) ?? BASE_WEEK_CAPACITY;
      row.push(cap.toFixed(1));
    });
    rows.push(row);
  });

  return { header, rows };
}

function exportTableHolidaysAbsences(
  _holidays: ApiHoliday[],
  absences: ApiAbsence[],
  resources: ApiResource[],
) {
  const header = ["Semaine", "Type", "Collaborateur", "Jours"];
  const rows: string[][] = [];

  absences.forEach((a) => {
    const res = resources.find((r) => r.id === a.resourceId);
    rows.push([
      weekLabel(a.weekId),
      "Absence",
      res?.name ?? a.resourceId,
      a.daysOff.toString(),
    ]);
  });

  return { header, rows };
}

// -------- page --------

export default function LoadplanPage() {
  // filtre année : 0 = toutes les années
  const [year, setYear] = useState<number>(0);
  const [includeHolidays, setIncludeHolidays] = useState<boolean>(true);
  const [windowSize, setWindowSize] = useState<number>(12);

  // on remplace useSearchParams par une lecture via window.location.search
  const [initialProject, setInitialProject] = useState<string | null>(null);
  const [initialResourceName, setInitialResourceName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setInitialProject(params.get("projectId"));
    setInitialResourceName(params.get("resourceName"));
  }, []);

  const [apiData, setApiData] = useState<LoadplanApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedResource, setSelectedResource] = useState<string>("Tous");
  const [selectedRole, setSelectedRole] = useState<Role | "Tous">("Tous");
  const [selectedProject, setSelectedProject] = useState<string>("Tous");

  // filtre projet initial
  useEffect(() => {
    if (initialProject) {
      setSelectedProject(`p-${initialProject}`);
    }
  }, [initialProject]);

  // fetch API loadplan quand l'année ou les filtres init changent
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        // year = 0 => pas de filtre d'année envoyé à l'API
        if (year !== 0) {
          params.set("year", String(year));
        }
        if (initialProject) params.set("projectId", initialProject);
        if (initialResourceName)
          params.set("resourceName", initialResourceName);

        const res = await fetch(`/api/loadplan?${params.toString()}`);
        const json: LoadplanApiResponse = await res.json();
        setApiData(json);
      } catch (e) {
        console.error("Erreur fetch loadplan", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [year, initialProject, initialResourceName]);

  const projects = apiData?.projects ?? [];
  const resources = apiData?.resources ?? [];
  const loads = apiData?.loads ?? [];
  const holidays = apiData?.holidays ?? [];
  const absences = apiData?.absences ?? [];
  const allWeekIds = apiData?.allWeekIds ?? [];

  // années dispo d'après les semaines renvoyées par l'API
  const allYears = useMemo(() => {
    if (!allWeekIds || allWeekIds.length === 0) {
      return [0];
    }
    const years = Array.from(
      new Set(allWeekIds.map((w) => yearFromWeek(w))),
    );
    years.sort((a, b) => a - b);
    return [0, ...years]; // 0 = Toutes
  }, [allWeekIds]);

  const currentWeekId = useMemo(() => getCurrentWeekId(), []);

  // helpers jours fériés / absences / capacité
  function getHolidayDays(weekId: WeekId) {
    return holidays.find((h) => h.weekId === weekId)?.daysOff ?? 0;
  }

  function getAbsenceDays(resourceId: string, weekId: WeekId) {
    return (
      absences.find(
        (a) => a.resourceId === resourceId && a.weekId === weekId,
      )?.daysOff ?? 0
    );
  }

  function capacityHours(resourceId: string, weekId: WeekId) {
    const holidayDays = includeHolidays ? getHolidayDays(weekId) : 0;
    const daysOff = holidayDays + getAbsenceDays(resourceId, weekId);
    const effectiveDays = Math.max(0, 5 - daysOff);
    return effectiveDays * 7;
  }

  // -------- dérivés --------

  // semaines de la période (déjà filtrées par année côté API)
  const yearWeeks = useMemo(() => {
    if (!allWeekIds || allWeekIds.length === 0) return [];
    return allWeekIds;
  }, [allWeekIds]);

  // fenêtre visible de 12 semaines autour de la semaine actuelle
  const visibleWeeks = useMemo(() => {
    if (yearWeeks.length === 0) return [];

    const idx = yearWeeks.indexOf(currentWeekId);
    const size = windowSize; // 12, 26, 52

    if (idx === -1) {
      const start = Math.max(0, yearWeeks.length - size);
      return yearWeeks.slice(start);
    }

    const start = Math.max(0, idx - Math.floor(size / 4));
    const end = Math.min(yearWeeks.length, start + size);
    return yearWeeks.slice(start, end);
  }, [yearWeeks, currentWeekId, windowSize]);

  const allRoles: Role[] = useMemo(() => {
    const set = new Set<Role>();
    resources.forEach((r) =>
      r.roles.forEach((role) => {
        if (role) set.add(role as Role);
      }),
    );
    return Array.from(set);
  }, [resources]);

  const filteredResources = useMemo(() => {
    let list = [...resources];
    if (selectedResource !== "Tous") {
      list = list.filter((r) => r.id === selectedResource);
    }
    if (selectedRole !== "Tous") {
      list = list.filter((r) => r.roles.includes(selectedRole));
    }
    return list;
  }, [resources, selectedResource, selectedRole]);

  const filteredAbsences = useMemo(() => {
    if (year === 0) {
      return absences.filter((a) =>
        filteredResources.some((r) => r.id === a.resourceId),
      );
    }
    return absences.filter((a) => {
      if (yearFromWeek(a.weekId) !== year) return false;
      if (selectedResource !== "Tous" && a.resourceId !== selectedResource)
        return false;
      return filteredResources.some((r) => r.id === a.resourceId);
    });
  }, [year, selectedResource, filteredResources, absences]);

  const filteredHolidays = useMemo(() => {
    if (year === 0) return holidays;
    return holidays.filter((h) => yearFromWeek(h.weekId) === year);
  }, [year, holidays]);

  const filteredLoads = useMemo(() => {
    return loads.filter((l) => {
      if (year !== 0 && yearFromWeek(l.weekId) !== year) return false;
      if (selectedProject !== "Tous" && l.projectId !== selectedProject)
        return false;
      if (selectedResource !== "Tous" && l.resourceId !== selectedResource)
        return false;
      return true;
    });
  }, [year, selectedProject, selectedResource, loads]);

  const totalLoadByResWeek = useMemo(() => {
    const map = new Map<string, number>();
    filteredLoads.forEach((l) => {
      const key = `${l.resourceId}|${l.weekId}`;
      map.set(key, (map.get(key) || 0) + l.hours);
    });
    return map;
  }, [filteredLoads]);

  const capacityByResWeek = useMemo(() => {
    const map = new Map<string, number>();
    filteredResources.forEach((r) => {
      yearWeeks.forEach((w) => {
        map.set(`${r.id}|${w}`, capacityHours(r.id, w));
      });
    });
    return map;
  }, [yearWeeks, filteredResources, includeHolidays]);

  const weeklySummary = useMemo(() => {
    return yearWeeks.map((w) => {
      let totalLoad = 0;
      let totalCap = 0;
      filteredResources.forEach((r) => {
        const key = `${r.id}|${w}`;
        totalLoad += totalLoadByResWeek.get(key) || 0;
        totalCap += capacityByResWeek.get(key) || 0;
      });
      return {
        weekId: w,
        totalLoad,
        totalCap,
        totalLoadETP: totalLoad / BASE_WEEK_CAPACITY,
        totalCapETP: totalCap / BASE_WEEK_CAPACITY,
      };
    });
  }, [yearWeeks, filteredResources, totalLoadByResWeek, capacityByResWeek]);

  const chartData = useMemo(() => {
    return visibleWeeks.map((w) => {
      const totalHours = filteredLoads
        .filter((l) => l.weekId === w)
        .reduce((sum, l) => sum + l.hours, 0);

      const totalCapacityHours = Array.from(capacityByResWeek.entries())
        .filter(([key]) => key.endsWith(`|${w}`))
        .reduce((sum, [, cap]) => sum + cap, 0);

      const loadEtp = totalHours / BASE_WEEK_CAPACITY;
      const capacityEtp = totalCapacityHours / BASE_WEEK_CAPACITY;

      return {
        label: weekLabel(w),
        loadEtp,
        capacityEtp,
      };
    });
  }, [visibleWeeks, filteredLoads, capacityByResWeek]);

  const globalStats = useMemo(() => {
    const totalLoad = weeklySummary.reduce((s, w) => s + w.totalLoad, 0);
    const totalCap = weeklySummary.reduce((s, w) => s + w.totalCap, 0);
    const avgLoadHours =
      weeklySummary.length > 0 ? totalLoad / weeklySummary.length : 0;
    const avgLoadETP = avgLoadHours / BASE_WEEK_CAPACITY;
    const overloadWeeks = weeklySummary.filter(
      (w) => w.totalLoad > w.totalCap,
    ).length;
    const underWeeks = weeklySummary.filter(
      (w) =>
        w.totalCap > 0 &&
        w.totalLoad <
          w.totalCap * (UNDERLOAD_THRESHOLD / BASE_WEEK_CAPACITY),
    ).length;

    const utilization =
      totalCap > 0 ? Math.round((totalLoad / totalCap) * 100) : 0;

    const resourcesOver95 = (() => {
      if (filteredResources.length === 0 || yearWeeks.length === 0) return 0;
      let count = 0;
      filteredResources.forEach((r) => {
        let load = 0;
        let cap = 0;
        yearWeeks.forEach((w) => {
          const key = `${r.id}|${w}`;
          load += totalLoadByResWeek.get(key) || 0;
          cap += capacityByResWeek.get(key) || 0;
        });
        if (cap > 0 && load / cap >= 0.95) count++;
      });
      return count;
    })();

    const resourcesUnder50 = (() => {
      if (filteredResources.length === 0 || yearWeeks.length === 0) return 0;
      let count = 0;
      filteredResources.forEach((r) => {
        let load = 0;
        let cap = 0;
        yearWeeks.forEach((w) => {
          const key = `${r.id}|${w}`;
          load += totalLoadByResWeek.get(key) || 0;
          cap += capacityByResWeek.get(key) || 0;
        });
        if (cap > 0 && load / cap <= 0.5) count++;
      });
      return count;
    })();

    return {
      totalLoad,
      totalCap,
      avgLoadHours,
      avgLoadETP,
      overloadWeeks,
      underWeeks,
      nbResources: filteredResources.length,
      utilization,
      resourcesOver95,
      resourcesUnder50,
    };
  }, [
    weeklySummary,
    filteredResources.length,
    yearWeeks,
    totalLoadByResWeek,
    capacityByResWeek,
  ]);

  const utilizationByResource = useMemo(() => {
    return filteredResources.map((r) => {
      let load = 0;
      let cap = 0;
      yearWeeks.forEach((w) => {
        const key = `${r.id}|${w}`;
        load += totalLoadByResWeek.get(key) || 0;
        cap += capacityByResWeek.get(key) || 0;
      });
      const utilization =
        cap > 0 ? Math.round((load / cap) * 100) : 0;
      return {
        name: r.name,
        utilization: Math.min(utilization, 120),
      };
    });
  }, [filteredResources, yearWeeks, totalLoadByResWeek, capacityByResWeek]);

  const alertsByType = useMemo(() => {
    const overloadAlerts: Alert[] = [];
    const underloadAlerts: Alert[] = [];

    filteredResources.forEach((r) => {
      const weeksData = yearWeeks.map((w) => {
        const key = `${r.id}|${w}`;
        const load = totalLoadByResWeek.get(key) || 0;
        const cap = capacityByResWeek.get(key) ?? BASE_WEEK_CAPACITY;
        return { weekId: w, load, cap };
      });

      const overloadedWeeks = weeksData.filter((w) => w.load > w.cap);
      const underloadedWeeks = weeksData.filter(
        (w) =>
          w.cap > 0 &&
          w.load <
            w.cap * (UNDERLOAD_THRESHOLD / BASE_WEEK_CAPACITY),
      );

      if (overloadedWeeks.length > 0) {
        const labels = overloadedWeeks.map((w) => weekLabel(w.weekId));
        const shownLabels = labels.slice(0, 4);
        const extra = labels.length - shownLabels.length;
        const avgRatio =
          overloadedWeeks.reduce((s, w) => s + w.load / (w.cap || 1), 0) /
          overloadedWeeks.length;

        overloadAlerts.push({
          level: "Surcharge",
          resourceName: r.name,
          weeks: shownLabels,
          summary:
            `Charge moyenne à ${(avgRatio * 100).toFixed(0)}% de la capacité sur ${
              labels.length
            } semaine(s).` +
            (extra > 0
              ? ` Dont ${extra} semaine(s) supplémentaire(s) non listée(s).`
              : ""),
          recommendation:
            "Limiter les nouvelles affectations, déplacer des tâches vers des profils ou semaines moins chargés.",
        });
      }

      if (underloadedWeeks.length > 0) {
        const labels = underloadedWeeks.map((w) => weekLabel(w.weekId));
        const shownLabels = labels.slice(0, 4);
        const extra = labels.length - shownLabels.length;

        underloadAlerts.push({
          level: "Sous-charge",
          resourceName: r.name,
          weeks: shownLabels,
          summary:
            `${labels.length} semaine(s) significativement sous-utilisées.` +
            (extra > 0
              ? ` Dont ${extra} semaine(s) supplémentaire(s) non listée(s).`
              : ""),
          recommendation:
            "Positionner des activités de préparation, tests, documentation, formation ou support.",
        });
      }
    });

    return {
      overloads: overloadAlerts.slice(0, 10),
      underloads: underloadAlerts.slice(0, 10),
    };
  }, [filteredResources, yearWeeks, totalLoadByResWeek, capacityByResWeek]);

  // stats formation (basées sur les absences)
  const formationStats = useMemo(() => {
    const resourcesSet = new Set<string>();
    let totalFormationDays = 0;

    filteredAbsences
      .filter((a) => a.type.toLowerCase().includes("formation"))
      .forEach((a) => {
        const res = resources.find((r) => r.id === a.resourceId);
        const name = res?.name ?? a.resourceId;
        resourcesSet.add(name);
        totalFormationDays += a.daysOff;
      });

    return {
      resourcesCount: resourcesSet.size,
      totalDays: totalFormationDays,
    };
  }, [filteredAbsences, resources]);

  // -------- export CSV --------

  function exportToCsv(filename: string, rows: string[][]) {
    const processRow = (row: string[]) =>
      row.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(";");
    const csvContent = rows.map(processRow).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handleExportAll = () => {
    const weeks = visibleWeeks.length > 0 ? visibleWeeks : yearWeeks;

    const charge = exportTableCharge(
      projects,
      resources,
      weeks,
      filteredLoads,
      selectedProject,
      filteredResources,
    );
    exportToCsv("plan_charge_par_projet.csv", [
      charge.header,
      ...charge.rows,
    ]);

    const capacity = exportTableCapacity(
      filteredResources,
      weeks,
      capacityByResWeek,
    );
    exportToCsv("capacite_par_ressource.csv", [
      capacity.header,
      ...capacity.rows,
    ]);

    const holAbs = exportTableHolidaysAbsences(
      filteredHolidays,
      filteredAbsences,
      resources,
    );
    exportToCsv("conges_absences.csv", [holAbs.header, ...holAbs.rows]);
  };

  if (isLoading && !apiData) {
    return (
      <AppShell
        activeSection="loadplan"
        pageTitle="Plan de charge"
        pageSubtitle="Charge vs capacité par ressource et par projet."
      >
        <div className="p-6 text-sm text-slate-500">
          Chargement du plan de charge…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeSection="loadplan"
      pageTitle="Plan de charge"
      pageSubtitle="Charge réelle vs capacité disponible par ressource."
    >
      <section className="space-y-6">
        <div className="flex items-start justify_between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAll}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700"
            >
              Export Excel (3 tableaux)
            </button>
            <Link
              href="/loadplan/holidays"
              className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white"
            >
              Saisie congés / absences
            </Link>
          </div>
          <div />
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-xs">
            <div>
              <div className="font-semibold text-slate-700 mb-1">
                Année
              </div>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
              >
                <option value={0}>Toutes les années</option>
                {allYears
                  .filter((y) => y !== 0)
                  .map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <div className="font-semibold text-slate-700 mb-1">
                Fenêtre (semaines)
              </div>
              <select
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
              >
                <option value={4}>4 semaines</option>
                <option value={8}>8 semaines</option>
                <option value={12}>12 semaines</option>
                <option value={26}>26 semaines</option>
                <option value={52}>52 semaines</option>
              </select>
            </div>

            <div>
              <div className="font-semibold text-slate-700 mb-1">
                Ressource
              </div>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
              >
                <option value="Tous">Toutes</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="font-semibold text-slate-700 mb-1">
                Rôle / profil
              </div>
              <select
                value={selectedRole}
                onChange={(e) =>
                  setSelectedRole(
                    e.target.value === "Tous"
                      ? "Tous"
                      : (e.target.value as Role),
                  )
                }
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
              >
                <option value="Tous">Tous</option>
                {allRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="font-semibold text-slate-700 mb-1">
                Projet
              </div>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
              >
                <option value="Tous">Tous</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.number} · {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-2 text-xs">
              <input
                id="include-holidays"
                type="checkbox"
                checked={includeHolidays}
                onChange={(e) => setIncludeHolidays(e.target.checked)}
                className="h-3 w-3"
              />
              <label htmlFor="include-holidays" className="text-slate-700">
                Inclure les jours fériés dans la capacité
              </label>
            </div>
          </div>
        </div>

        {/* KPIs 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-600">
              Charge totale sur la période (h)
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {Math.round(globalStats.totalLoad)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Toutes semaines, ressources et projets filtrés.
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-600">
              Capacité totale disponible (h)
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {Math.round(globalStats.totalCap)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              35h hebdo ajustées des absences / jours fériés.
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-600">
              Charge moyenne hebdo (ETP)
            </div>
            <div className="mt-2 text-2xl font-semibold text-emerald-600">
              {globalStats.avgLoadETP.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              1 ETP = {BASE_WEEK_CAPACITY}h.
            </div>
          </div>
        </div>

        {/* KPIs 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div
            className="bg-white border border-slate-200 rounded-lg p-4"
            title="Nombre de semaines où la charge totale dépasse la capacité totale"
          >
            <div className="text-xs text-slate-600">
              Semaines en surcharge
            </div>
            <div className="mt-2 text-2xl font-semibold text-rose-600">
              {globalStats.overloadWeeks}
            </div>
          </div>
          <div
            className="bg-white border border-slate-200 rounded-lg p-4"
            title="Nombre de semaines où la charge totale est en dessous de la capacité totale"
          >
            <div className="text-xs text-slate-600">
              Semaines en sous-charge
            </div>
            <div className="mt-2 text-2xl font-semibold text-sky-600">
              {globalStats.underWeeks}
            </div>
          </div>
          <div
            className="bg-white border border-slate-200 rounded-lg p-4"
            title="Nombre de ressources filtrées"
          >
            <div className="text-xs text-slate-600">Ressources filtrées</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {globalStats.nbResources}
            </div>
          </div>
        </div>

        {/* KPIs 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className="bg-white border border-slate-200 rounded-lg p-4"
            title="Charge totale divisée par la capacité totale sur la période filtrée"
          >
            <div className="text-xs text-slate-600">
              Taux d’occupation moyen
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {globalStats.utilization}%
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Charge totale / capacité totale sur la période.
            </div>
          </div>
          <div
            className="bg-white border border-slate-200 rounded-lg p-4"
            title="Nombre de ressources dont la charge moyenne est ≥ 95% de leur capacité"
          >
            <div className="text-xs text-slate-600">
              Ressources ≥ 95% de charge
            </div>
            <div className="mt-2 text-2xl font-semibold text-rose-600">
              {globalStats.resourcesOver95}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Profils proches de la saturation continue.
            </div>
          </div>
          <div
            className="bg-white border border-slate-200 rounded-lg p-4"
            title="Nombre de ressources dont la charge moyenne est < 50% de leur capacité"
          >
            <div className="text-xs text-slate-600">
              Ressources &lt; 50% de charge
            </div>
            <div className="mt-2 text-2xl font-semibold text-sky-600">
              {globalStats.resourcesUnder50}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Profils sous-utilisés, potentiels renforts sur d’autres projets.
            </div>
          </div>
        </div>

        {/* Graphiques principaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Charge vs Capacité (ETP)
              </h2>
            </div>
            <div className="mt-2 rounded-xl border border-slate-100 bg-white p-4">
              <ChargeVsCapacityChart data={chartData} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Taux d’occupation par ressource
            </h2>
            <p className="text-[11px] text-slate-500 mb-2">
              Pourcentage moyen de charge sur la période filtrée, par
              collaborateur.
            </p>
            <ResourceUtilizationChart data={utilizationByResource} />
          </div>
        </div>

        {/* Alertes et recommandations */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Alertes & recommandations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Sous-charges */}
            <div>
              <h3 className="text-xs font-semibold text-slate-800 mb-2">
                Sous-charges
              </h3>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {alertsByType.underloads.length === 0 && (
                  <li className="text-slate-500">
                    Aucune sous-charge marquée sur la période.
                  </li>
                )}
                {alertsByType.underloads.map((a, index) => (
                  <li
                    key={index}
                    className={`border rounded-md p-3 ${alertColor(a.level)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-0.5 text-lg"
                        title="Sous-charge significative sur plusieurs semaines"
                      >
                        🔔
                      </span>
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 text-sm">
                          {a.resourceName}
                        </p>
                        <p>
                          <span className="font-medium">Semaines :</span>{" "}
                          <span>{a.weeks.join(", ")}</span>
                        </p>
                        <p>
                          <span className="font-medium">Analyse :</span>{" "}
                          <span>{a.summary}</span>
                        </p>
                        <p>
                          <span className="font-medium">Reco :</span>{" "}
                          <span>{a.recommendation}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Surcharges */}
            <div>
              <h3 className="text-xs font-semibold text-slate-800 mb-2">
                Surcharges
              </h3>
              <ul className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {alertsByType.overloads.length === 0 && (
                  <li className="text-slate-500">
                    Aucune surcharge détectée sur la période.
                  </li>
                )}
                {alertsByType.overloads.map((a, index) => (
                  <li
                    key={index}
                    className={`border rounded-md p-3 ${alertColor(a.level)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-0.5 text-lg"
                        title="Surcharge persistante, risque de saturation"
                      >
                        ⚠️
                      </span>

                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 text-sm">
                          {a.resourceName}
                        </p>
                        <p>
                          <span className="font-medium">Semaines :</span>{" "}
                          <span>{a.weeks.join(", ")}</span>
                        </p>
                        <p>
                          <span className="font-medium">Analyse :</span>{" "}
                          <span>{a.summary}</span>
                        </p>
                        <p>
                          <span className="font-medium">Reco :</span>{" "}
                          <span>{a.recommendation}</span>
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Tableau charge */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Charge réelle par semaine (h) et par projet
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    N° projet
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Intitulé
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Collaborateur
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Rôles</th>
                  {visibleWeeks.map((w) => (
                    <th
                      key={w}
                      className="px-3 py-2 text-right font-medium whitespace-nowrap"
                    >
                      {weekLabel(w)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects
                  .filter(
                    (p) =>
                      selectedProject === "Tous" || p.id === selectedProject,
                  )
                  .flatMap((p) =>
                    filteredResources.map((r) => {
                      const hasLoad = visibleWeeks.some((w) =>
                        filteredLoads.some(
                          (l) =>
                            l.projectId === p.id &&
                            l.resourceId === r.id &&
                            l.weekId === w,
                        ),
                      );
                      if (!hasLoad) return null;

                      return (
                        <tr
                          key={`${p.id}-${r.id}`}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Link
                              href={`/projects/${p.projectId}`}
                              className="text-indigo-600 hover:underline"
                            >
                              {p.number}
                            </Link>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {p.label}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {r.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {r.roles.join(", ")}
                          </td>
                          {visibleWeeks.map((w) => {
                            const isCurrent = w === currentWeekId;
                            const h = filteredLoads
                              .filter(
                                (l) =>
                                  l.projectId === p.id &&
                                  l.resourceId === r.id &&
                                  l.weekId === w,
                              )
                              .reduce((sum, l) => sum + l.hours, 0);

                            return (
                              <td
                                key={w}
                                className={`px-3 py-2 whitespace-nowrap text-right ${
                                  isCurrent ? "bg-amber-50" : ""
                                }`}
                              >
                                {h === 0 ? (
                                  "-"
                                ) : (
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeClass(
                                      h,
                                    )}`}
                                  >
                                    {h}h
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }),
                  )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tableau capacité */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Capacité disponible par semaine (h)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Collaborateur
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Rôles</th>
                  {visibleWeeks.map((w) => (
                    <th
                      key={w}
                      className="px-3 py-2 text-right font-medium whitespace-nowrap"
                    >
                      {weekLabel(w)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResources.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap">{r.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.roles.join(", ")}
                    </td>
                    {visibleWeeks.map((w) => {
                      const key = `${r.id}|${w}`;
                      const cap =
                        capacityByResWeek.get(key) ?? BASE_WEEK_CAPACITY;
                      const isCurrent = w === currentWeekId;
                      return (
                        <td
                          key={w}
                          className={`px-3 py-2 whitespace-nowrap text-right ${
                            isCurrent ? "bg-amber-50" : ""
                          }`}
                        >
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${capacityBadgeClass(
                              cap,
                            )}`}
                          >
                            <span>{cap}h</span>
                            {cap === 0 && (
                              <span className="uppercase tracking-wide">
                                OFF
                              </span>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tableau congés / absences */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Suivi des congés et absences
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Semaines avec absences déclarées pour les ressources filtrées.
              </p>
            </div>
            <Link
              href="/loadplan/holidays"
              className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white"
            >
              Saisie congés / absences
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mb-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
              <span>🙋</span>
              <span>{filteredAbsences.length} absence(s) déclarée(s)</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
              <span>📚</span>
              <span>
                {formationStats.resourcesCount} personne(s) en formation,{" "}
                {formationStats.totalDays.toFixed(1)} jour(s)
              </span>
            </span>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Semaine
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Collaborateur
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Type
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Jours
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAbsences.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      Aucune absence sur la période et les filtres
                      sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filteredAbsences.map((a, index) => {
                    const res = resources.find(
                      (r) => r.id === a.resourceId,
                    );
                    return (
                      <tr
                        key={`abs-${index}`}
                        className=" hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          {weekLabel(a.weekId)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {res?.name ?? a.resourceId}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-amber-700">
                          Absence
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          {a.daysOff}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}