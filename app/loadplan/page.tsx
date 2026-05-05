"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "../components/AppShell";
import { ChargeVsCapacityChart } from "./ChargeVsCapacityChart";
import Link from "next/link";
import { ResourceUtilizationChart } from "./ResourceUtilizationChart";

export const dynamic = "force-dynamic";

type Role =
  | "Chef de projet"
  | "Consultant"
  | "Développeur"
  | "Testeur"
  | string;

type WeekId = string;

type ApiProject = {
  id: string;
  projectId: number;
  number: string;
  label: string;
  clientName: string;
};

type ApiResource = {
  id: string;
  name: string;
  roles: string[];
};

type ApiLoad = {
  projectId: string;
  resourceId: string;
  weekId: WeekId;
  hours: number;
  role: string;
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
  role?: string;
  weeks: string[];
  summary: string;
  recommendation: string;
};

type ResourceRoleRow = {
  resourceId: string;
  resourceName: string;
  role: string;
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
  if (hours > OVERLOAD_THRESHOLD)
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200";
  if (hours < UNDERLOAD_THRESHOLD)
    return "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200";
}

function capacityBadgeClass(hours: number) {
  if (hours >= 35)
    return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100";
  if (hours >= 28)
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-100";
  if (hours >= 21)
    return "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-100";
  if (hours > 0)
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-100";
  return "bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-200";
}

function alertColor(level: AlertLevel) {
  if (level === "Surcharge")
    return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-100";
  return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-100";
}

function cardTone(value: number) {
  if (value >= 80) {
    return "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100";
  }
  if (value >= 60) {
    return "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100";
  }
  if (value >= 40) {
    return "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
  }
  return "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100";
}

// --- export tableaux détaillés ---

function exportTableCharge(
  projects: ApiProject[],
  weeks: WeekId[],
  selectedProject: string,
  rows: ResourceRoleRow[],
  filteredLoads: ApiLoad[],
) {
  const header = [
    "N° projet",
    "Intitulé",
    "Collaborateur",
    "Rôle",
    ...weeks.map(weekLabel),
  ];
  const csvRows: string[][] = [];

  projects
    .filter((p) => selectedProject === "Tous" || p.id === selectedProject)
    .forEach((p) => {
      rows.forEach((row) => {
        const hasLoad = weeks.some((w) =>
          filteredLoads.some(
            (l) =>
              l.projectId === p.id &&
              l.resourceId === row.resourceId &&
              l.role === row.role &&
              l.weekId === w,
          ),
        );
        if (!hasLoad) return;

        const csvRow: string[] = [
          p.number,
          p.label,
          row.resourceName,
          row.role,
        ];

        weeks.forEach((w) => {
          const h = filteredLoads
            .filter(
              (l) =>
                l.projectId === p.id &&
                l.resourceId === row.resourceId &&
                l.role === row.role &&
                l.weekId === w,
            )
            .reduce((sum, l) => sum + l.hours, 0);
          csvRow.push(h === 0 ? "" : h.toFixed(1));
        });

        csvRows.push(csvRow);
      });
    });

  return { header, rows: csvRows };
}

function exportTableCapacity(
  weeks: WeekId[],
  rows: ResourceRoleRow[],
  capacityByResRoleWeek: Map<string, number>,
) {
  const header = ["Collaborateur", "Rôle", ...weeks.map(weekLabel)];
  const csvRows: string[][] = [];

  rows.forEach((row) => {
    const csvRow: string[] = [row.resourceName, row.role];
    weeks.forEach((w) => {
      const cap =
        capacityByResRoleWeek.get(`${row.resourceId}|${row.role}|${w}`) ?? 0;
      csvRow.push(cap.toFixed(1));
    });
    csvRows.push(csvRow);
  });

  return { header, rows: csvRows };
}

function exportTableHolidaysAbsences(
  absences: ApiAbsence[],
  resources: ApiResource[],
) {
  const header = ["Semaine", "Type", "Collaborateur", "Jours"];
  const rows: string[][] = [];

  absences.forEach((a) => {
    const res = resources.find((r) => r.id === a.resourceId);
    rows.push([
      weekLabel(a.weekId),
      a.type,
      res?.name ?? a.resourceId,
      a.daysOff.toString(),
    ]);
  });

  return { header, rows };
}

// -------- composant interne avec useSearchParams --------

function LoadplanPageInner() {
  const [year, setYear] = useState<number>(0);
  const [includeHolidays, setIncludeHolidays] = useState<boolean>(true);

  const [weekWindowStart, setWeekWindowStart] = useState<number>(0);
  const [weekWindowSize, setWeekWindowSize] = useState<number>(12);

  const searchParams = useSearchParams();
  const initialProject = searchParams.get("projectId");
  const initialResourceName = searchParams.get("resourceName");

  const [apiData, setApiData] = useState<LoadplanApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedResource, setSelectedResource] = useState<string>("Tous");
  const [selectedRole, setSelectedRole] = useState<Role | "Tous">("Tous");
  const [selectedProject, setSelectedProject] = useState<string>("Tous");
  const [selectedClient, setSelectedClient] = useState<string>("Tous");
  const [openedCard, setOpenedCard] = useState<string | null>(null);

  useEffect(() => {
    if (initialProject) {
      setSelectedProject(`p-${initialProject}`);
    }
  }, [initialProject]);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (year !== 0) params.set("year", String(year));
        if (initialProject) params.set("projectId", initialProject);
        if (initialResourceName) {
          params.set("resourceName", initialResourceName);
        }
        if (selectedClient !== "Tous") {
          params.set("clientName", selectedClient);
        }

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
  }, [year, initialProject, initialResourceName, selectedClient]);

  const projects = apiData?.projects ?? [];
  const resources = apiData?.resources ?? [];
  const loads = apiData?.loads ?? [];
  const holidays = apiData?.holidays ?? [];
  const absences = apiData?.absences ?? [];
  const allWeekIds = apiData?.allWeekIds ?? [];

  const allYears = useMemo(() => {
    if (!allWeekIds || allWeekIds.length === 0) {
      return [0];
    }
    const years = Array.from(new Set(allWeekIds.map((w) => yearFromWeek(w))));
    years.sort((a, b) => a - b);
    return [0, ...years];
  }, [allWeekIds]);

  const currentWeekId = useMemo(() => getCurrentWeekId(), []);

  const yearWeeks = useMemo(() => {
    if (!allWeekIds || allWeekIds.length === 0) return [];
    return allWeekIds;
  }, [allWeekIds]);

  useEffect(() => {
    if (!yearWeeks.length) return;

    const idx = yearWeeks.indexOf(currentWeekId);
    if (idx === -1) {
      setWeekWindowStart(
        Math.max(0, Math.floor((yearWeeks.length - weekWindowSize) / 2)),
      );
      return;
    }

    const centered = Math.max(0, idx - Math.floor(weekWindowSize / 2));
    const bounded = Math.min(
      centered,
      Math.max(0, yearWeeks.length - weekWindowSize),
    );
    setWeekWindowStart(bounded);
  }, [currentWeekId, yearWeeks, weekWindowSize]);

  const visibleWeeks = useMemo(() => {
    if (yearWeeks.length === 0) return [];
    const start = Math.min(
      Math.max(0, weekWindowStart),
      Math.max(0, yearWeeks.length - weekWindowSize),
    );
    const end = Math.min(yearWeeks.length, start + weekWindowSize);
    return yearWeeks.slice(start, end);
  }, [yearWeeks, weekWindowStart, weekWindowSize]);

  const allRoles: Role[] = useMemo(() => {
    const set = new Set<Role>();
    resources.forEach((r) =>
      r.roles.forEach((role) => {
        if (role) set.add(role as Role);
      }),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [resources]);

  const allClients = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.clientName?.trim()) set.add(p.clientName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedProject !== "Tous" && p.id !== selectedProject) return false;
      if (selectedClient !== "Tous" && p.clientName !== selectedClient) {
        return false;
      }
      return true;
    });
  }, [projects, selectedProject, selectedClient]);

  const filteredProjectIds = useMemo(
    () => new Set(filteredProjects.map((p) => p.id)),
    [filteredProjects],
  );

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

  const filteredResourceIds = useMemo(
    () => new Set(filteredResources.map((r) => r.id)),
    [filteredResources],
  );

  const filteredAbsences = useMemo(() => {
    return absences.filter((a) => {
      if (year === 0) {
        return filteredResourceIds.has(a.resourceId);
      }
      return yearFromWeek(a.weekId) === year && filteredResourceIds.has(a.resourceId);
    });
  }, [absences, year, filteredResourceIds]);

  const filteredHolidays = useMemo(() => {
    if (year === 0) return holidays;
    return holidays.filter((h) => yearFromWeek(h.weekId) === year);
  }, [year, holidays]);

  const filteredLoads = useMemo(() => {
    return loads.filter((l) => {
      if (year !== 0 && yearFromWeek(l.weekId) !== year) return false;
      if (!filteredProjectIds.has(l.projectId)) return false;
      if (!filteredResourceIds.has(l.resourceId)) return false;
      if (selectedRole !== "Tous" && l.role !== selectedRole) return false;
      return true;
    });
  }, [year, filteredProjectIds, filteredResourceIds, selectedRole, loads]);

  // --- capa / absences ---

  function getHolidayDays(weekId: WeekId) {
    return includeHolidays
      ? filteredHolidays.find((h) => h.weekId === weekId)?.daysOff ?? 0
      : 0;
  }

  function getAbsenceDays(resourceId: string, weekId: WeekId) {
    return filteredAbsences
      .filter((a) => a.resourceId === resourceId && a.weekId === weekId)
      .reduce((sum, a) => sum + a.daysOff, 0);
  }

  function capacityHours(resourceId: string, weekId: WeekId) {
    const holidayDays = getHolidayDays(weekId);
    const daysOff = holidayDays + getAbsenceDays(resourceId, weekId);
    const effectiveDays = Math.max(0, 5 - daysOff);
    return effectiveDays * 7;
  }

  // --- base : charge totale et capa totale par ressource/semaine, indépendants du filtre rôle ---

  const baseTotalLoadByResWeek = useMemo(() => {
    const map = new Map<string, number>();
    loads
      .filter((l) => (year === 0 ? true : yearFromWeek(l.weekId) === year))
      .forEach((l) => {
        const key = `${l.resourceId}|${l.weekId}`;
        map.set(key, Math.round(((map.get(key) || 0) + l.hours) * 10) / 10);
      });
    return map;
  }, [loads, year]);

  const capacityByResWeek = useMemo(() => {
    const map = new Map<string, number>();
    resources.forEach((r) => {
      yearWeeks.forEach((w) => {
        map.set(`${r.id}|${w}`, capacityHours(r.id, w));
      });
    });
    return map;
  }, [yearWeeks, resources, includeHolidays, filteredAbsences, filteredHolidays]);

  // --- répartition figée de la capacité par rôle, indépendante du filtre rôle ---

  const baseCapacityByResRoleWeek = useMemo(() => {
    const map = new Map<string, number>();

    resources.forEach((r) => {
      yearWeeks.forEach((w) => {
        const totalCap =
          capacityByResWeek.get(`${r.id}|${w}`) ?? BASE_WEEK_CAPACITY;

        // tous les rôles réellement chargés sur cette ressource/semaine
        const rolesOnWeek = new Set<string>();
        loads
          .filter(
            (l) =>
              l.resourceId === r.id &&
              (year === 0 || yearFromWeek(l.weekId) === year) &&
              l.weekId === w,
          )
          .forEach((l) => rolesOnWeek.add(l.role || "Sans rôle"));

        const roleList =
          rolesOnWeek.size > 0
            ? Array.from(rolesOnWeek)
            : r.roles.length > 0
              ? r.roles
              : ["Sans rôle"];

        const divisor = roleList.length || 1;
        const capPerRole = Math.round((totalCap / divisor) * 10) / 10;

        roleList.forEach((role) => {
          map.set(`${r.id}|${role}|${w}`, capPerRole);
        });
      });
    });

    return map;
  }, [resources, yearWeeks, capacityByResWeek, loads, year]);

  // --- dérivés filtrés par ressource/projet/rôle ---

  const rolesByResWeek = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filteredLoads.forEach((l) => {
      const key = `${l.resourceId}|${l.weekId}`;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(l.role || "Sans rôle");
    });
    return map;
  }, [filteredLoads]);

  const resourceRoleRows = useMemo<ResourceRoleRow[]>(() => {
    const rowsMap = new Map<string, ResourceRoleRow>();

    filteredResources.forEach((r) => {
      const matchingLoads = filteredLoads.filter((l) => l.resourceId === r.id);
      const roles =
        selectedRole === "Tous"
          ? Array.from(new Set(matchingLoads.map((l) => l.role || "Sans rôle")))
          : [selectedRole];

      const finalRoles = roles.length
        ? roles
        : r.roles.length
          ? r.roles
          : ["Sans rôle"];

      finalRoles.forEach((role) => {
        const key = `${r.id}|${role}`;
        rowsMap.set(key, {
          resourceId: r.id,
          resourceName: r.name,
          role,
        });
      });
    });

    return Array.from(rowsMap.values()).sort((a, b) => {
      if (a.resourceName !== b.resourceName) {
        return a.resourceName.localeCompare(b.resourceName, "fr");
      }
      return a.role.localeCompare(b.role, "fr");
    });
  }, [filteredResources, filteredLoads, selectedRole]);

  const loadByResRoleWeek = useMemo(() => {
    const map = new Map<string, number>();
    filteredLoads.forEach((l) => {
      const key = `${l.resourceId}|${l.role}|${l.weekId}`;
      map.set(key, Math.round(((map.get(key) || 0) + l.hours) * 10) / 10);
    });
    return map;
  }, [filteredLoads]);

  const totalLoadByResWeek = useMemo(() => {
    const map = new Map<string, number>();
    filteredLoads.forEach((l) => {
      const key = `${l.resourceId}|${l.weekId}`;
      map.set(key, Math.round(((map.get(key) || 0) + l.hours) * 10) / 10);
    });
    return map;
  }, [filteredLoads]);

  // capacité par rôle côté UI : on réutilise la répartition figée mais seulement pour les lignes visibles
  const capacityByResRoleWeek = useMemo(() => {
    const map = new Map<string, number>();
    resourceRoleRows.forEach((row) => {
      yearWeeks.forEach((w) => {
        const key = `${row.resourceId}|${row.role}|${w}`;
        const cap = baseCapacityByResRoleWeek.get(key) ?? 0;
        map.set(key, cap);
      });
    });
    return map;
  }, [resourceRoleRows, yearWeeks, baseCapacityByResRoleWeek]);

  const weeklySummary = useMemo(() => {
    return yearWeeks.map((w) => {
      let totalLoad = 0;
      let totalCap = 0;
      resourceRoleRows.forEach((row) => {
      totalLoad += loadByResRoleWeek.get(`${row.resourceId}|${row.role}|${w}`) || 0;
      totalCap += capacityByResRoleWeek.get(`${row.resourceId}|${row.role}|${w}`) || 0;
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
      const weekly = weeklySummary.find((x) => x.weekId === w);
      const loadEtp = weekly ? weekly.totalLoadETP : 0;
      const capacityEtp = weekly ? weekly.totalCapETP : 0;
      return {
        label: weekLabel(w),
        loadEtp,
        capacityEtp,
      };
    });
  }, [visibleWeeks, weeklySummary]);

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

    let resourcesOver95 = 0;
    let resourcesUnder50 = 0;
    const overList: string[] = [];
    const underList: string[] = [];

    filteredResources.forEach((r) => {
      let load = 0;
      let cap = 0;
      yearWeeks.forEach((w) => {
        const key = `${r.id}|${w}`;
        load += totalLoadByResWeek.get(key) || 0;
        cap += capacityByResWeek.get(key) || 0;
      });
      if (cap > 0 && load / cap >= 0.95) {
        resourcesOver95++;
        overList.push(r.name);
      }
      if (cap > 0 && load / cap <= 0.5) {
        resourcesUnder50++;
        underList.push(r.name);
      }
    });

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
      overList,
      underList,
    };
  }, [
    weeklySummary,
    filteredResources,
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

    resourceRoleRows.forEach((row) => {
      const weeksData = yearWeeks.map((w) => {
        const load =
          loadByResRoleWeek.get(`${row.resourceId}|${row.role}|${w}`) || 0;
        const cap =
          capacityByResRoleWeek.get(`${row.resourceId}|${row.role}|${w}`) || 0;
        return { weekId: w, load, cap };
      });

      const overloadedWeeks = weeksData.filter(
        (w) => w.cap > 0 && w.load > w.cap,
      );
      const underloadedWeeks = weeksData.filter(
        (w) =>
          w.cap > 0 &&
          w.load <
            w.cap * (UNDERLOAD_THRESHOLD / BASE_WEEK_CAPACITY),
      );

      if (overloadedWeeks.length > 0) {
        overloadAlerts.push({
          level: "Surcharge",
          resourceName: row.resourceName,
          role: row.role,
          weeks: overloadedWeeks.map((w) => weekLabel(w.weekId)).slice(0, 4),
          summary: `Surcharge détectée sur ${overloadedWeeks.length} semaine(s) pour ce rôle.`,
          recommendation:
            "Déplacer une partie de la charge vers un autre rôle, une autre ressource ou une autre semaine.",
        });
      }

      if (underloadedWeeks.length > 0) {
        underloadAlerts.push({
          level: "Sous-charge",
          resourceName: row.resourceName,
          role: row.role,
          weeks: underloadedWeeks.map((w) => weekLabel(w.weekId)).slice(0, 4),
          summary: `Sous-charge détectée sur ${underloadedWeeks.length} semaine(s) pour ce rôle.`,
          recommendation:
            "Affecter davantage d’activités utiles sur ce rôle ou regrouper la charge.",
        });
      }
    });

    return {
      overloads: overloadAlerts.slice(0, 10),
      underloads: underloadAlerts.slice(0, 10),
    };
  }, [resourceRoleRows, yearWeeks, loadByResRoleWeek, capacityByResRoleWeek]);

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
      filteredProjects,
      weeks,
      selectedProject,
      resourceRoleRows,
      filteredLoads,
    );
    exportToCsv("plan_charge_par_projet_role.csv", [
      charge.header,
      ...charge.rows,
    ]);

    const capacity = exportTableCapacity(
      weeks,
      resourceRoleRows,
      capacityByResRoleWeek,
    );
    exportToCsv("capacite_par_ressource_role.csv", [
      capacity.header,
      ...capacity.rows,
    ]);

    const holAbs = exportTableHolidaysAbsences(
      filteredAbsences,
      resources,
    );
    exportToCsv("conges_absences.csv", [holAbs.header, ...holAbs.rows]);
  };

  const avgUtil = globalStats.utilization;

  if (isLoading && !apiData) {
    return (
      <AppShell
        activeSection="loadplan"
        pageTitle="Plan de charge"
        pageSubtitle="Charge vs capacité par ressource et par projet."
      >
        <div className="p-6 text-sm text-slate-500 dark:text-slate-300">
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAll}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              Export Excel (3 tableaux)
            </button>
            <Link
              href="/loadplan/holidays"
              className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white dark:bg-indigo-500"
            >
              Saisie congés / absences
            </Link>
          </div>
          <div />

          <div className="flex items-center gap-2">
                    <Link
                      href="/Tutoriel/projelys-loadplan-tutorial.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white dark:bg-indigo-500">
                        ?
                      </span>
                      <span>Tutoriel</span>
                    </Link>
                  </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-7">
            <div>
              <div className="mb-1 font-semibold text-slate-700 dark:text-slate-200">
                Année
              </div>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
              <div className="mb-1 font-semibold text-slate-700 dark:text-slate-200">
                Fenêtre (semaines)
              </div>
              <select
                value={weekWindowSize}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  setWeekWindowSize(size);
                  setWeekWindowStart((prev) =>
                    Math.min(prev, Math.max(0, yearWeeks.length - size)),
                  );
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value={4}>4 semaines</option>
                <option value={8}>8 semaines</option>
                <option value={12}>12 semaines</option>
                <option value={26}>26 semaines</option>
                <option value={52}>52 semaines</option>
              </select>
            </div>

            <div>
              <div className="mb-1 font-semibold text-slate-700 dark:text-slate-200">
                Ressource
              </div>
              <select
                value={selectedResource}
                onChange={(e) => setSelectedResource(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
              <div className="mb-1 font-semibold text-slate-700 dark:text-slate-200">
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
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
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
              <div className="mb-1 font-semibold text-slate-700 dark:text-slate-200">
                Projet
              </div>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Tous">Tous</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.number} · {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-1 font-semibold text-slate-700 dark:text-slate-200">
                Client
              </div>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Tous">Tous</option>
                {allClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs md:mt-0">
              <input
                id="include-holidays"
                type="checkbox"
                checked={includeHolidays}
                onChange={(e) => setIncludeHolidays(e.target.checked)}
                className="h-3 w-3"
              />
              <label
                htmlFor="include-holidays"
                className="text-slate-700 dark:text-slate-200"
              >
                Inclure les jours fériés
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              setWeekWindowStart((prev) => Math.max(0, prev - weekWindowSize))
            }
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            disabled={weekWindowStart === 0}
          >
            ◀ Semaines précédentes
          </button>
          <button
            type="button"
            onClick={() =>
              setWeekWindowStart((prev) =>
                Math.min(
                  prev + weekWindowSize,
                  Math.max(0, yearWeeks.length - weekWindowSize),
                ),
              )
            }
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            disabled={weekWindowStart + weekWindowSize >= yearWeeks.length}
          >
            Semaines suivantes ▶
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Charge totale sur la période (h)
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {Math.round(globalStats.totalLoad)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Toutes semaines, ressources et projets filtrés.
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Capacité totale disponible (h)
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {Math.round(globalStats.totalCap)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              35h hebdo ajustées des absences / jours fériés.
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Charge moyenne hebdo (ETP)
            </div>
            <div className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-300">
              {globalStats.avgLoadETP.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              1 ETP = {BASE_WEEK_CAPACITY}h.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Semaines en surcharge
            </div>
            <div className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-300">
              {globalStats.overloadWeeks}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Semaines en sous-charge
            </div>
            <div className="mt-2 text-2xl font-semibold text-sky-600 dark:text-sky-300">
              {globalStats.underWeeks}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Ressources filtrées
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {globalStats.nbResources}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setOpenedCard(openedCard === "util" ? null : "util")}
            className={`rounded-lg border p-4 text-left ${cardTone(avgUtil)}`}
          >
            <div className="text-xs">Taux d’occupation moyen</div>
            <div className="mt-2 text-2xl font-semibold">{avgUtil}%</div>
            <div className="mt-1 text-xs opacity-80">
              Charge totale / capacité totale sur la période.
            </div>
            {openedCard === "util" && (
              <div className="mt-3 text-xs opacity-90">
                {filteredResources.length > 0
                  ? filteredResources.map((r) => r.name).join(", ")
                  : "Aucune ressource filtrée."}
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpenedCard(openedCard === "over" ? null : "over")}
            className="rounded-lg border border-slate-200 bg-white p-4 text-left dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Ressources ≥ 95% de charge
            </div>
            <div className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-300">
              {globalStats.resourcesOver95}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Profils proches de la saturation continue.
            </div>
            {openedCard === "over" && (
              <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                {globalStats.overList.length
                  ? globalStats.overList.join(", ")
                  : "Aucune ressource au-dessus de 95% en moyenne."}
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpenedCard(openedCard === "under" ? null : "under")}
            className="rounded-lg border border-slate-200 bg-white p-4 text-left dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Ressources &lt; 50% de charge
            </div>
            <div className="mt-2 text-2xl font-semibold text-sky-600 dark:text-sky-300">
              {globalStats.resourcesUnder50}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Profils sous-utilisés.
            </div>
            {openedCard === "under" && (
              <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                {globalStats.underList.length
                  ? globalStats.underList.join(", ")
                  : "Aucune ressource en-dessous de 50% en moyenne."}
              </div>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Charge vs Capacité (ETP)
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setWeekWindowStart((prev) =>
                      Math.max(0, prev - weekWindowSize),
                    )
                  }
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  disabled={weekWindowStart === 0}
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWeekWindowStart((prev) =>
                      Math.min(
                        prev + weekWindowSize,
                        Math.max(0, yearWeeks.length - weekWindowSize),
                      ),
                    )
                  }
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  disabled={weekWindowStart + weekWindowSize >= yearWeeks.length}
                >
                  ▶
                </button>
              </div>
            </div>
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <ChargeVsCapacityChart data={chartData} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Taux d’occupation par ressource
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setWeekWindowStart((prev) =>
                      Math.max(0, prev - weekWindowSize),
                    )
                  }
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  disabled={weekWindowStart === 0}
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWeekWindowStart((prev) =>
                      Math.min(
                        prev + weekWindowSize,
                        Math.max(0, yearWeeks.length - weekWindowSize),
                      ),
                    )
                  }
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  disabled={weekWindowStart + weekWindowSize >= yearWeeks.length}
                >
                  ▶
                </button>
              </div>
            </div>
            <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
              Pourcentage moyen de charge sur la période filtrée, par collaborateur.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <ResourceUtilizationChart data={utilizationByResource} />
            </div>
          </div>
        </div>

        <div
          id="alerts-section"
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
            Alertes & recommandations
          </h2>
          <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                Sous-charges
              </h3>
              <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {alertsByType.underloads.length === 0 && (
                  <li className="text-slate-500 dark:text-slate-400">
                    Aucune sous-charge marquée sur la période.
                  </li>
                )}
                {alertsByType.underloads.map((a, index) => (
                  <li
                    key={index}
                    className={`rounded-md border p-3 ${alertColor(a.level)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-lg">🔔</span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {a.resourceName} · {a.role}
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

            <div>
              <h3 className="mb-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
                Surcharges
              </h3>
              <ul className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {alertsByType.overloads.length === 0 && (
                  <li className="text-slate-500 dark:text-slate-400">
                    Aucune surcharge détectée sur la période.
                  </li>
                )}
                {alertsByType.overloads.map((a, index) => (
                  <li
                    key={index}
                    className={`rounded-md border p-3 ${alertColor(a.level)}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-lg">⚠️</span>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {a.resourceName} · {a.role}
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

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Charge réelle par semaine (h) et par projet
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setWeekWindowStart((prev) => Math.max(0, prev - weekWindowSize))
                }
                className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                disabled={weekWindowStart === 0}
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() =>
                  setWeekWindowStart((prev) =>
                    Math.min(
                      prev + weekWindowSize,
                      Math.max(0, yearWeeks.length - weekWindowSize),
                    ),
                  )
                }
                className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                disabled={weekWindowStart + weekWindowSize >= yearWeeks.length}
              >
                ▶
              </button>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <table className="min-w-full bg-white text-xs dark:bg-slate-950">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">N° projet</th>
                  <th className="px-3 py-2 text-left font-medium">Intitulé</th>
                  <th className="px-3 py-2 text-left font-medium">Collaborateur</th>
                  <th className="px-3 py-2 text-left font-medium">Rôle</th>
                  {visibleWeeks.map((w) => (
                    <th
                      key={w}
                      className="whitespace-nowrap px-3 py-2 text-right font-medium"
                    >
                      {weekLabel(w)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProjects
                  .flatMap((p) =>
                    resourceRoleRows.map((row) => {
                      const hasLoad = visibleWeeks.some((w) =>
                        filteredLoads.some(
                          (l) =>
                            l.projectId === p.id &&
                            l.resourceId === row.resourceId &&
                            l.role === row.role &&
                            l.weekId === w,
                        ),
                      );
                      if (!hasLoad) return null;

                      return (
                        <tr
                          key={`${p.id}-${row.resourceId}-${row.role}`}
                          className="bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                        >
                          <td className="whitespace-nowrap px-3 py-2">
                            <Link
                              href={`/projects/${p.projectId}`}
                              className="text-indigo-600 hover:underline dark:text-indigo-300"
                            >
                              {p.number}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-50">
                            {p.label}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-50">
                            {row.resourceName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-700 dark:text-slate-200">
                            {row.role}
                          </td>
                          {visibleWeeks.map((w) => {
                            const isCurrent = w === currentWeekId;
                            const h = filteredLoads
                              .filter(
                                (l) =>
                                  l.projectId === p.id &&
                                  l.resourceId === row.resourceId &&
                                  l.role === row.role &&
                                  l.weekId === w,
                              )
                              .reduce((sum, l) => sum + l.hours, 0);

                            return (
                              <td
                                key={w}
                                className={`whitespace-nowrap px-3 py-2 text-right ${
                                  isCurrent
                                    ? "bg-amber-50 dark:bg-amber-900/30"
                                    : ""
                                }`}
                              >
                                {h === 0 ? (
                                  <span className="text-slate-400 dark:text-slate-500">
                                    -
                                  </span>
                                ) : (
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass(
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
                  )
                  .filter(Boolean)
                  .slice(0, 300)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Capacité disponible par semaine (h)
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  setWeekWindowStart((prev) => Math.max(0, prev - weekWindowSize))
                }
                className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                disabled={weekWindowStart === 0}
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() =>
                  setWeekWindowStart((prev) =>
                    Math.min(
                      prev + weekWindowSize,
                      Math.max(0, yearWeeks.length - weekWindowSize),
                    ),
                  )
                }
                className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                disabled={weekWindowStart + weekWindowSize >= yearWeeks.length}
              >
                ▶
              </button>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <table className="min-w-full bg-white text-xs dark:bg-slate-950">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Collaborateur</th>
                  <th className="px-3 py-2 text-left font-medium">Rôle</th>
                  {visibleWeeks.map((w) => (
                    <th
                      key={w}
                      className="whitespace-nowrap px-3 py-2 text-right font-medium"
                    >
                      {weekLabel(w)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {resourceRoleRows.slice(0, 300).map((row) => (
                  <tr
                    key={`${row.resourceId}-${row.role}`}
                    className="bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-50">
                      {row.resourceName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700 dark:text-slate-200">
                      {row.role}
                    </td>
                    {visibleWeeks.map((w) => {
                      const cap =
                        capacityByResRoleWeek.get(
                          `${row.resourceId}|${row.role}|${w}`,
                        ) ?? 0;
                      const isCurrent = w === currentWeekId;
                      return (
                        <td
                          key={w}
                          className={`whitespace-nowrap px-3 py-2 text-right ${
                            isCurrent
                              ? "bg-amber-50 dark:bg-amber-900/30"
                              : ""
                          }`}
                        >
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${capacityBadgeClass(
                              cap,
                            )}`}
                          >
                            <span>{cap}h</span>
                            {cap === 0 && (
                              <span className="uppercase tracking-wide">OFF</span>
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

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Suivi des congés et absences
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Semaines avec absences déclarées pour les ressources filtrées.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setWeekWindowStart((prev) => Math.max(0, prev - weekWindowSize))
                }
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                disabled={weekWindowStart === 0}
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() =>
                  setWeekWindowStart((prev) =>
                    Math.min(
                      prev + weekWindowSize,
                      Math.max(0, yearWeeks.length - weekWindowSize),
                    ),
                  )
                }
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                disabled={weekWindowStart + weekWindowSize >= yearWeeks.length}
              >
                ▶
              </button>
              <Link
                href="/loadplan/holidays"
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs text-white dark:bg-indigo-500"
              >
                Saisie congés / absences
              </Link>
            </div>
          </div>

          <div className="mb-2 flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span>🙋</span>
              <span>{filteredAbsences.length} absence(s) déclarée(s)</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span>📚</span>
              <span>
                {formationStats.resourcesCount} personne(s) en formation,{" "}
                {formationStats.totalDays.toFixed(1)} jour(s)
              </span>
            </span>
          </div>

          <div className="overflow-x-auto overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
            <table className="min-w-full bg-white text-xs dark:bg-slate-950">
              <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Semaine</th>
                  <th className="px-3 py-2 text-left font-medium">Collaborateur</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Jours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAbsences.length === 0 ? (
                  <tr className="bg-white dark:bg-slate-950">
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-slate-500 dark:text-slate-400"
                    >
                      Aucune absence sur la période et les filtres sélectionnés.
                    </td>
                  </tr>
                ) : (
                  filteredAbsences.slice(0, 100).map((a, index) => {
                    const res = resources.find((r) => r.id === a.resourceId);
                    return (
                      <tr
                        key={`abs-${index}`}
                        className="bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900"
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-50">
                          {weekLabel(a.weekId)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-900 dark:text-slate-50">
                          {res?.name ?? a.resourceId}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-amber-700 dark:text-amber-300">
                          {a.type}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-slate-900 dark:text-slate-50">
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

export default function LoadplanPage() {
  return (
    <Suspense
      fallback={
        <AppShell
          activeSection="loadplan"
          pageTitle="Plan de charge"
          pageSubtitle="Charge réelle vs capacité disponible par ressource."
        >
          <div className="p-6 text-sm text-slate-500 dark:text-slate-300">
            Chargement du plan de charge…
          </div>
        </AppShell>
      }
    >
      <LoadplanPageInner />
    </Suspense>
  );
}