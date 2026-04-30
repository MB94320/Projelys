"use client";

import { useMemo } from "react";

type Task = {
  id: number;
  name: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  progressPercent: number;
  status: string;
  assigneeName: string | null;
};

type ProjectWithTasks = {
  id: number;
  projectNumber: string | null;
  titleProject: string | null;
  clientName: string | null;
  startDate: Date | string | null;
  estimatedDate: Date | string | null;
  tasks: Task[];
};

type Props = {
  project: ProjectWithTasks;
};


function startOfDay(d: Date) {
  const nd = new Date(d);
  nd.setHours(0, 0, 0, 0);
  return nd;
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function getDayLetter(d: Date): string {
  const day = d.getDay();
  return ["D", "L", "M", "M", "J", "V", "S"][day] ?? "";
}

function getWeekNumber(d: Date): number {
  const date = new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
  );
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(
    Date.UTC(date.getUTCFullYear(), 0, 1),
  );
  return Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

const DAY_WIDTH = 24;

export default function ProjectGanttClient({ project }: Props) {
  const {
    days,
    displayStart,
    displayEnd,
    visibleTasks,
    chartWidth,
  } = useMemo(() => {
    const rawTasks = (project.tasks || []).filter(
      (t) => t.startDate && t.endDate,
    );

    const parsed = rawTasks.map((t) => ({
      ...t,
      start: startOfDay(new Date(t.startDate as string)),
      end: startOfDay(new Date(t.endDate as string)),
    }));

    if (parsed.length === 0) {
      const today = startOfDay(new Date());
      return {
        days: [today],
        displayStart: today,
        displayEnd: today,
        visibleTasks: [] as typeof parsed,
        chartWidth: DAY_WIDTH,
      };
    }

    const projectStart =
      project.startDate
        ? startOfDay(new Date(project.startDate as any))
        : new Date(
            Math.min(...parsed.map((t) => t.start.getTime())),
          );

    
    const minDate = new Date(
      Math.min(...parsed.map((t) => t.start.getTime())),
    );
    const maxDate = new Date(
      Math.max(...parsed.map((t) => t.end.getTime())),
    );
    const realStart = projectStart < minDate ? projectStart : minDate;
    const displayStart = realStart;
    const displayEnd = new Date(displayStart);
    displayEnd.setDate(displayStart.getDate() + 120); // ~4 mois

    const days: Date[] = [];
    const cur = new Date(displayStart);
    while (cur <= displayEnd) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const visibleTasks = parsed.filter(
      (t) => t.end >= displayStart && t.start <= displayEnd,
    );

    const chartWidth = days.length * DAY_WIDTH;

    return {
      days,
      displayStart,
      displayEnd,
      visibleTasks,
      chartWidth,
    };
  }, [project]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });

  const getTaskColor = (status: string) => {
    if (status === "Terminée") return "bg-emerald-500";     // vert
    if (status === "En cours") return "bg-amber-500";       // ambre
    if (status === "Planifiée" || status === "Planifié")
      return "bg-indigo-500";                               // bleu
    if (status === "En retard") return "bg-red-500";        // rouge
    if (status === "Annulée" || status === "Annulé")
      return "bg-slate-400";                                // gris
    return "bg-slate-300";
  };


  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-slate-500">Gantt projet</p>
          <h1 className="text-sm font-semibold text-slate-900">
            {project.titleProject ?? project.projectNumber}
          </h1>
          <p className="text-xs text-slate-500">
            Fenêtre affichée : {formatDate(displayStart)} →{" "}
            {formatDate(displayEnd)}
          </p>
        </div>
        <div className="text-[11px] text-slate-500">
          Scroll horizontal pour parcourir le planning. Week‑ends en
          gris clair.
        </div>
      </div>

      <div className="flex gap-4">
        {/* Tableau tâches à gauche */}
        <div className="w-[420px] pt-10">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="px-4 py-2 border-b border-slate-200">
              <h2 className="text-xs font-semibold text-slate-900">
                Tâches du projet
              </h2>
            </div>
            <table className="min-w-full text-[11px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-1 text-left font-medium">
                    Tâche
                  </th>
                  <th className="px-3 py-1 text-left font-medium">
                    Responsable
                  </th>
                  <th className="px-3 py-1 text-left font-medium">
                    Début
                  </th>
                  <th className="px-3 py-1 text-left font-medium">
                    Fin
                  </th>
                  <th className="px-3 py-1 text-right font-medium">
                    % av.
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((t, idx) => (
                  <tr
                    key={t.id}
                    className={
                      idx !== visibleTasks.length - 1
                        ? "border-b border-slate-100"
                        : ""
                    }
                    style={{ height: 48 }} // même hauteur que les lignes Gantt
                  >
                    <td className="px-3 py-0 align-middle">{t.name}</td>
                    <td className="px-3 py-0 align-middle">
                      {t.assigneeName ?? "N/A"}
                    </td>
                    <td className="px-3 py-0 align-middle">
                      {formatDate(t.start)}
                    </td>
                    <td className="px-3 py-0 align-middle">
                      {formatDate(t.end)}
                    </td>
                    <td className="px-3 py-0 text-right align-middle">
                      {t.progressPercent}%
                    </td>
                  </tr>
                ))}
                {visibleTasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-2 text-[11px] text-slate-500"
                    >
                      Aucune tâche dans la fenêtre affichée.
                    </td>
                  </tr>
                )}
              </tbody>

            </table>
          </div>
        </div>

        {/* Échelle + barres à droite */}
        <div className="flex-1 overflow-x-auto">
          <div
            className="min-w-max bg-white rounded-lg shadow-sm border border-slate-200"
            style={{ width: chartWidth }}
          >
            {/* Année */}
            <div className="flex text-[10px] text-slate-600 border-b border-slate-100">
              {(() => {
                const segments: { year: number; span: number }[] = [];
                let currentYear = days[0].getFullYear();
                let span = 0;
                days.forEach((d, idx) => {
                  const y = d.getFullYear();
                  if (y === currentYear) {
                    span++;
                  } else {
                    segments.push({ year: currentYear, span });
                    currentYear = y;
                    span = 1;
                  }
                  if (idx === days.length - 1) {
                    segments.push({ year: currentYear, span });
                  }
                });
                return segments.map((s, i) => (
                  <div
                    key={i}
                    style={{ width: s.span * DAY_WIDTH }}
                    className="py-1 text-center border-r border-slate-100"
                  >
                    {s.year}
                  </div>
                ));
              })()}
            </div>

            {/* Mois */}
            <div className="flex text-[10px] text-slate-600 border-b border-slate-100">
              {(() => {
                const segments: { label: string; span: number }[] = [];
                let curMonth = days[0].getMonth();
                let curYear = days[0].getFullYear();
                let span = 0;
                days.forEach((d, idx) => {
                  const m = d.getMonth();
                  const y = d.getFullYear();
                  if (m === curMonth && y === curYear) {
                    span++;
                  } else {
                    segments.push({
                      label: new Date(
                        curYear,
                        curMonth,
                        1,
                      ).toLocaleDateString("fr-FR", { month: "short" }),
                      span,
                    });
                    curMonth = m;
                    curYear = y;
                    span = 1;
                  }
                  if (idx === days.length - 1) {
                    segments.push({
                      label: new Date(
                        curYear,
                        curMonth,
                        1,
                      ).toLocaleDateString("fr-FR", {
                        month: "short",
                      }),
                      span,
                    });
                  }
                });
                return segments.map((s, i) => (
                  <div
                    key={i}
                    style={{ width: s.span * DAY_WIDTH }}
                    className="py-1 text-center border-r border-slate-100"
                  >
                    {s.label}
                  </div>
                ));
              })()}
            </div>

            {/* Semaines */}
            <div className="flex text-[10px] text-slate-600 border-b border-slate-100">
              {(() => {
                const segments: { week: number; span: number }[] = [];
                let curWeek = getWeekNumber(days[0]);
                let span = 0;
                days.forEach((d, idx) => {
                  const w = getWeekNumber(d);
                  if (w === curWeek) {
                    span++;
                  } else {
                    segments.push({ week: curWeek, span });
                    curWeek = w;
                    span = 1;
                  }
                  if (idx === days.length - 1) {
                    segments.push({ week: curWeek, span });
                  }
                });
                return segments.map((s, i) => (
                  <div
                    key={i}
                    style={{ width: s.span * DAY_WIDTH }}
                    className="py-1 text-center border-r border-slate-100"
                  >
                    S{s.week}
                  </div>
                ));
              })()}
            </div>

            {/* Jours */}
            <div className="flex text-[11px] text-slate-700 border-b border-slate-100">
              {days.map((d, idx) => {
                const isToday =
                  d.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    style={{ width: DAY_WIDTH }}
                    className={[
                      "py-1 border-r border-slate-100 text-center",
                      isWeekend(d) ? "bg-slate-50" : "",
                      isToday ? "bg-indigo-50 border-indigo-300" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="font-medium">{getDayLetter(d)}</div>
                    <div className="text-[10px] text-slate-500">
                      {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Barres Gantt */}
            <div
              className="relative"
              style={{ height: visibleTasks.length * 48 + 16 }}
            >
            {/* Fond week‑ends + jour courant */}
            {days.map((d, idx) => {
              const isToday =
                d.toDateString() === new Date().toDateString();
              return (
                <div
                  key={idx}
                  className={[
                    "absolute top-0 bottom-0",
                    isWeekend(d) ? "bg-slate-50" : "",
                    isToday ? "border border-emerald-300 bg-emerald-100" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ left: idx * DAY_WIDTH, width: DAY_WIDTH }}
                />
              );
            })}

              {/* Lignes horizontales */}
              {visibleTasks.map((t, rowIdx) => (
                <div
                  key={t.id}
                  className="absolute left-0 right-0 border-t border-slate-100"
                  style={{ top: rowIdx * 48 + 12 }}
                />
              ))}


              {/* Barres */}
              {visibleTasks.map((t, rowIdx) => {
                const start = t.start;
                const end = t.end;

                const offsetMs =
                  start.getTime() - displayStart.getTime();
                const offsetDays = Math.max(
                  0,
                  Math.floor(offsetMs / (1000 * 60 * 60 * 24)),
                );

                const durationMs = end.getTime() - start.getTime();
                const durationDays =
                  Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1;

                const left = offsetDays * DAY_WIDTH;
                const width = durationDays * DAY_WIDTH;

                return (
                  <div
                    key={t.id}
                    className="absolute h-4 rounded-full flex items-center"
                    style={{
                      top: rowIdx * 48 + 6, // milieu de la ligne de 24px
                      left,
                      width,
                    }}
                  >
                    <div
                      className={`${getTaskColor(
                        t.status,
                      )} h-4 rounded-full w-full relative`}
                    >
                      <div
                        className="h-4 rounded-full bg-white/30 absolute right-0 top-0 bottom-0"
                        style={{
                          width: `${Math.max(
                            0,
                            100 - (t.progressPercent || 0),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-600">
      <div className="flex items-center gap-1">
        <span className="inline-flex h-3 w-3 rounded-full bg-indigo-500" />
        <span>Planifié</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-flex h-3 w-3 rounded-full bg-amber-500" />
        <span>En cours</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        <span>Terminé</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-flex h-3 w-3 rounded-full bg-red-500" />
        <span>En retard</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-flex h-3 w-3 rounded-full bg-slate-400" />
        <span>Annulé</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 border border-emerald-300 bg-emerald-100" />
        <span>Jour courant</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 bg-slate-50" />
        <span>Week‑end</span>
      </div>
    </div>
</div>
  );
}
