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
    new Date(Date.UTC(year, 0, 1)),   // 1er janvier
    easterMonday,                     // Lundi de Pâques
    new Date(Date.UTC(year, 4, 1)),   // 1er mai
    new Date(Date.UTC(year, 4, 8)),   // 8 mai
    ascension,                        // Ascension
    pentecostMonday,                  // Lundi de Pentecôte
    new Date(Date.UTC(year, 6, 14)),  // 14 juillet
    new Date(Date.UTC(year, 7, 15)),  // 15 août
    new Date(Date.UTC(year, 10, 1)),  // Toussaint
    new Date(Date.UTC(year, 10, 11)), // 11 novembre
    new Date(Date.UTC(year, 11, 25)), // Noël
  ];
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
  id: string; // res-<name>
  name: string;
  roles: string[];
};

type LoadplanApiLoad = {
  projectId: string; // p-<id>
  resourceId: string; // res-<name>
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
  type: string; // ex: "Congés payés", "Formation", ...
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

  const year =
    yearParam && yearParam !== "0" ? Number(yearParam) : undefined;

  // 1) Projets + tâches
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: { tasks: true },
  });

  const filteredProjects = projectIdParam
    ? projects.filter((p) => p.id === Number(projectIdParam))
    : projects;

  const allTasks = filteredProjects.flatMap((p) => p.tasks);

  const tasksFiltered = allTasks.filter((t) => {
    if (!t.startDate || !t.endDate) return false;
    if (!t.assigneeName) return false;

    if (resourceNameParam && t.assigneeName !== resourceNameParam)
      return false;

    if (!year) return true;

    const sId = weekIdFromDate(t.startDate);
    const eId = weekIdFromDate(t.endDate);
    const sYear = Number(sId.split("-")[0]);
    const eYear = Number(eId.split("-")[0]);

    return sYear <= year && eYear >= year;
  });

  // 2) Ressources : base Resource + rôles venant des tâches
  const dbResources = await prisma.resource.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const resourceMap = new Map<string, LoadplanApiResource>();

  // ressources de la table Resource
  for (const r of dbResources) {
    const name = r.name.trim();
    const resId = `res-${name}`;
    resourceMap.set(resId, {
      id: resId,
      name,
      roles: r.role ? [r.role] : [],
    });
  }

  // compléments à partir des tâches
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
    if (t.role && !res.roles.includes(t.role)) {
      res.roles.push(t.role);
    }
  }

  // 3) Charges par projet / ressource / semaine
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

    for (const w of weeks) {
      const key = `${projectKey}|${resId}|${w}`;
      const existing = loadMap.get(key);
      const hours = hoursPerWeek;

      if (existing) {
        existing.hours += hours;
      } else {
        loadMap.set(key, {
          projectId: projectKey,
          resourceId: resId,
          weekId: w,
          hours,
        });
      }
    }
  }

  const loads = Array.from(loadMap.values()).map((l) => ({
    ...l,
    hours: Math.round(l.hours * 10) / 10,
  }));

  const weekIdsFromLoads = loads.map((l) => l.weekId);

    // 4) Jours fériés + absences (avec Resource)
  const holidays: LoadplanApiHoliday[] = [];
  const weekIdsFromHolidays: string[] = [];

  // on ajoute les jours fériés pour l'année sélectionnée
  const yearsToUse = year ? [year] : Array.from(
    new Set([
      ...weekIdsFromLoads.map((w) => Number(w.split("-")[0])),
    ]),
  );

  for (const y of yearsToUse) {
    const publicHolidays = getFrenchPublicHolidays(y);
    for (const d of publicHolidays) {
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

    const start = new Date(a.startDate);
    const end = new Date(a.endDate);
    if (end < start) continue;

    const totalDays = a.daysCount ?? 0;
    if (totalDays <= 0) continue;

    const totalDates =
      Math.floor(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    const daysPerDate = totalDates > 0 ? totalDays / totalDates : 0;

    const cur = new Date(start);
    while (cur <= end) {
      const weekId = weekIdFromDate(cur);
      weekIdsFromAbsences.push(weekId);

      const resourceId = `res-${a.resource.name.trim()}`;

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

      cur.setDate(cur.getDate() + 1);
    }

    const resId = `res-${a.resource.name.trim()}`;
    if (!resourceMap.has(resId)) {
      resourceMap.set(resId, {
        id: resId,
        name: a.resource.name.trim(),
        roles: a.resource.role ? [a.resource.role] : [],
      });
    }
  }



  const resources = Array.from(resourceMap.values());

  const allWeekIds = Array.from(
  new Set([
    ...weekIdsFromLoads,
    ...weekIdsFromAbsences,
    ...weekIdsFromHolidays,
  ]),
  ).sort();



  // 5) Projets pour le front
  const projectsForFront: LoadplanApiProject[] = filteredProjects.map(
    (p) => ({
      id: `p-${p.id}`,
      projectId: p.id,
      number: p.projectNumber ?? `P-${p.id}`,
      label: p.titleProject ?? p.projectNumber ?? `Projet ${p.id}`,
      clientName: p.clientName ?? "",
    }),
  );

  const response: LoadplanApiResponse = {
    projects: projectsForFront,
    resources,
    loads,
    holidays,
    absences,
    allWeekIds,
  };

  return NextResponse.json(response);
}
