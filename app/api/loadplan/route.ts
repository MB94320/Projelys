// app/api/loadplan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// ----------------- Helpers semaines -----------------

function getISOWeek(date: Date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year: d.getUTCFullYear(), week: weekNo };
}

function weekIdFromDate(date: Date): string {
  const { year, week } = getISOWeek(date);
  const weekStr = week.toString().padStart(2, "0");
  return `${year}-S${weekStr}`;
}

function getWeekIdsBetween(start: Date, end: Date): string[] {
  const ids: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    ids.push(weekIdFromDate(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return Array.from(new Set(ids));
}

// ----------------- Jours fériés France -----------------

function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function getFrenchPublicHolidays(year: number): Date[] {
  const easter = calculateEaster(year);
  const easterMonday = addDays(easter, 1);
  const ascension = addDays(easter, 39);
  const pentecostMonday = addDays(easter, 50);

  return [
    new Date(Date.UTC(year, 0, 1)),
    easterMonday,
    new Date(Date.UTC(year, 4, 1)),
    new Date(Date.UTC(year, 4, 8)),
    ascension,
    pentecostMonday,
    new Date(Date.UTC(year, 6, 14)),
    new Date(Date.UTC(year, 7, 15)),
    new Date(Date.UTC(year, 10, 1)),
    new Date(Date.UTC(year, 10, 11)),
    new Date(Date.UTC(year, 11, 25)),
  ];
}

function isSameUtcDay(d1: Date, d2: Date) {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

function isWeekend(date: Date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function isFrenchPublicHoliday(date: Date) {
  const holidays = getFrenchPublicHolidays(date.getUTCFullYear());
  return holidays.some((h) => isSameUtcDay(h, date));
}

// ----------------- Types réponse -----------------

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
  projectId: string;
  resourceId: string;
  role: string;
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

// ----------------- GET /api/loadplan -----------------

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const yearParam = searchParams.get("year");
  const projectIdParam = searchParams.get("projectId");
  const resourceNameParam = searchParams.get("resourceName");
  const clientNameParam = searchParams.get("clientName");

  const year =
    yearParam && yearParam !== "0" ? Number(yearParam) : undefined;

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { tasks: true },
  });

  const filteredProjects = projects.filter((p) => {
    if (projectIdParam && p.id !== Number(projectIdParam)) return false;
    if (
      clientNameParam &&
      (p.clientName ?? "").trim() !== clientNameParam.trim()
    ) {
      return false;
    }
    return true;
  });

  const allTasks = filteredProjects.flatMap((p) => p.tasks);

  const tasksFiltered = allTasks.filter((t) => {
    if (!t.startDate || !t.endDate) return false;
    if (!t.assigneeName) return false;

    if (
      resourceNameParam &&
      t.assigneeName.trim() !== resourceNameParam.trim()
    ) {
      return false;
    }

    if (!year) return true;

    const sId = weekIdFromDate(t.startDate);
    const eId = weekIdFromDate(t.endDate);
    const sYear = Number(sId.split("-")[0]);
    const eYear = Number(eId.split("-")[0]);

    return sYear <= year && eYear >= year;
  });

  const dbResources = await prisma.resource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const resourceMap = new Map<string, LoadplanApiResource>();

  for (const r of dbResources) {
    const name = r.name.trim();
    const resId = `res-${name}`;
    resourceMap.set(resId, {
      id: resId,
      name,
      roles: r.role ? [r.role.trim()] : [],
    });
  }

  for (const t of tasksFiltered) {
    const name = t.assigneeName!.trim();
    const resId = `res-${name}`;

    if (!resourceMap.has(resId)) {
      resourceMap.set(resId, {
        id: resId,
        name,
        roles: [],
      });
    }

    const res = resourceMap.get(resId)!;
    const taskRole = t.role?.trim();

    if (taskRole && !res.roles.includes(taskRole)) {
      res.roles.push(taskRole);
    }
  }

  for (const res of resourceMap.values()) {
    res.roles = Array.from(new Set(res.roles.filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }

  const loadMap = new Map<string, LoadplanApiLoad>();

  for (const task of tasksFiltered) {
    const start = new Date(task.startDate!);
    const end = new Date(task.endDate!);
    if (end < start) continue;

    const weeks = getWeekIdsBetween(start, end);
    if (weeks.length === 0) continue;

    const totalPlanned = task.plannedWorkHours ?? 0;
    const hoursPerWeek = totalPlanned / weeks.length;

    const resName = task.assigneeName!.trim();
    const resId = `res-${resName}`;
    const projectKey = `p-${task.projectId}`;
    const role = task.role?.trim() || "Sans rôle";

    for (const w of weeks) {
      if (year && Number(w.split("-")[0]) !== year) continue;

      const key = `${projectKey}|${resId}|${role}|${w}`;
      const existing = loadMap.get(key);

      if (existing) {
        existing.hours += hoursPerWeek;
      } else {
        loadMap.set(key, {
          projectId: projectKey,
          resourceId: resId,
          role,
          weekId: w,
          hours: hoursPerWeek,
        });
      }
    }
  }

  const loads = Array.from(loadMap.values())
    .map((l) => ({
      ...l,
      hours: Math.round(l.hours * 10) / 10,
    }))
    .sort((a, b) => {
      if (a.projectId !== b.projectId) return a.projectId.localeCompare(b.projectId);
      if (a.resourceId !== b.resourceId) return a.resourceId.localeCompare(b.resourceId);
      if (a.role !== b.role) return a.role.localeCompare(b.role, "fr");
      return a.weekId.localeCompare(b.weekId);
    });

  const weekIdsFromLoads = loads.map((l) => l.weekId);

  const holidays: LoadplanApiHoliday[] = [];
  const weekIdsFromHolidays: string[] = [];

  const yearsToUse = year
    ? [year]
    : Array.from(new Set(weekIdsFromLoads.map((w) => Number(w.split("-")[0]))));

  for (const y of yearsToUse) {
    const publicHolidays = getFrenchPublicHolidays(y);
    for (const d of publicHolidays) {
      if (isWeekend(d)) continue;

      const weekId = weekIdFromDate(d);
      weekIdsFromHolidays.push(weekId);

      const existing = holidays.find((h) => h.weekId === weekId);
      if (existing) {
        existing.daysOff += 1;
      } else {
        holidays.push({ weekId, daysOff: 1 });
      }
    }
  }

  const absencesRaw = await prisma.absence.findMany({
    orderBy: { startDate: "asc" },
    include: { resource: true },
  });

  const absences: LoadplanApiAbsence[] = [];
  const weekIdsFromAbsences: string[] = [];

  for (const a of absencesRaw) {
    if (!a.resource) continue;

    const resourceName = a.resource.name.trim();

    if (resourceNameParam && resourceName !== resourceNameParam.trim()) {
      continue;
    }

    const start = new Date(a.startDate);
    const end = new Date(a.endDate);
    if (end < start) continue;

    if (year) {
      const sYear = Number(weekIdFromDate(start).split("-")[0]);
      const eYear = Number(weekIdFromDate(end).split("-")[0]);
      if (!(sYear <= year && eYear >= year)) continue;
    }

    const totalDays = a.daysCount ?? 0;
    if (totalDays <= 0) continue;

    const workingDates: Date[] = [];
    const cur = new Date(start);

    while (cur <= end) {
      const utcDate = new Date(
        Date.UTC(cur.getFullYear(), cur.getMonth(), cur.getDate()),
      );

      if (!isWeekend(utcDate) && !isFrenchPublicHoliday(utcDate)) {
        workingDates.push(utcDate);
      }

      cur.setDate(cur.getDate() + 1);
    }

    if (workingDates.length === 0) continue;

    const daysPerDate = totalDays / workingDates.length;

    for (const workDate of workingDates) {
      const weekId = weekIdFromDate(workDate);

      if (!year || Number(weekId.split("-")[0]) === year) {
        weekIdsFromAbsences.push(weekId);

        const resourceId = `res-${resourceName}`;
        const existing = absences.find(
          (x) => x.resourceId === resourceId && x.weekId === weekId,
        );

        if (existing) {
          existing.daysOff += daysPerDate;
        } else {
          absences.push({
            resourceId,
            weekId,
            daysOff: daysPerDate,
            type: a.type,
          });
        }
      }
    }

    const resId = `res-${resourceName}`;
    if (!resourceMap.has(resId)) {
      resourceMap.set(resId, {
        id: resId,
        name: resourceName,
        roles: a.resource.role ? [a.resource.role.trim()] : [],
      });
    }
  }

  const resources = Array.from(resourceMap.values())
    .filter((r) => {
      if (resourceNameParam) return r.name === resourceNameParam.trim();

      const hasLoad = loads.some((l) => l.resourceId === r.id);
      const hasAbsence = absences.some((a) => a.resourceId === r.id);
      return hasLoad || hasAbsence;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  const allWeekIds = Array.from(
    new Set([
      ...weekIdsFromLoads,
      ...weekIdsFromAbsences,
      ...weekIdsFromHolidays,
    ]),
  ).sort((a, b) => a.localeCompare(b));

  const projectsForFront: LoadplanApiProject[] = filteredProjects.map((p) => ({
    id: `p-${p.id}`,
    projectId: p.id,
    number: p.projectNumber ?? `P-${p.id}`,
    label: p.titleProject ?? p.projectNumber ?? `Projet ${p.id}`,
    clientName: p.clientName ?? "",
  }));

  const response: LoadplanApiResponse = {
    projects: projectsForFront,
    resources,
    loads,
    holidays: holidays
      .map((h) => ({
        ...h,
        daysOff: Math.round(h.daysOff * 10) / 10,
      }))
      .sort((a, b) => a.weekId.localeCompare(b.weekId)),
    absences: absences
      .map((a) => ({
        ...a,
        daysOff: Math.round(a.daysOff * 10) / 10,
      }))
      .sort((a, b) => {
        if (a.weekId !== b.weekId) return a.weekId.localeCompare(b.weekId);
        return a.resourceId.localeCompare(b.resourceId);
      }),
    allWeekIds,
  };

  return NextResponse.json(response);
}