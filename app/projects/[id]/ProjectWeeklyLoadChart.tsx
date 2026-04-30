"use client";

import { useMemo, useState } from "react";

type WeeklyLoad = {
  weekKey: string;
  year: number;
  week: number;
  planned: number;
  consumed: number;
  // pour filtrer
  resourceName: string | null;
};

type Props = {
  weeklyLoadsRaw: WeeklyLoad[];
};

export default function ProjectWeeklyLoadChart({ weeklyLoadsRaw }: Props) {
  const [assigneeFilter, setAssigneeFilter] = useState<string>("Tous");

  const assignees = useMemo(
    () =>
      Array.from(
        new Set(
          weeklyLoadsRaw
            .map((w) => w.resourceName || "Non affectée")
            .filter(Boolean),
        ),
      ).sort(),
    [weeklyLoadsRaw],
  );

  const weeklyLoads = useMemo(() => {
    if (assigneeFilter === "Tous") return aggregate(weeklyLoadsRaw);

    const filtered = weeklyLoadsRaw.filter(
      (w) => (w.resourceName || "Non affectée") === assigneeFilter,
    );
    return aggregate(filtered);
  }, [weeklyLoadsRaw, assigneeFilter]);

  function aggregate(items: WeeklyLoad[]) {
    const map = new Map<string, { weekKey: string; year: number; week: number; planned: number; consumed: number }>();
    for (const w of items) {
      const current = map.get(w.weekKey) ?? {
        weekKey: w.weekKey,
        year: w.year,
        week: w.week,
        planned: 0,
        consumed: 0,
      };
      current.planned += w.planned;
      current.consumed += w.consumed;
      map.set(w.weekKey, current);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.year === b.year ? a.week - b.week : a.year - b.year,
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Charge prévue vs consommée par semaine
        </h2>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="border border-slate-300 rounded-md px-2 py-1 text-[11px] text-slate-700 bg-white"
        >
          <option value="Tous">Toutes ressources</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <p className="text-[11px] text-slate-500 mb-2">
        Heures prévues et consommées agrégées par semaine de réalisation.
      </p>

      {weeklyLoads.length === 0 ? (
        <p className="text-[11px] text-slate-500">
          Aucune tâche avec dates permettant de calculer une répartition
          hebdomadaire.
        </p>
      ) : (
        <>
          <div className="flex gap-3 h-40 border-b border-slate-100 pb-4">
            {(() => {
              const maxVal = Math.max(
                ...weeklyLoads.map((w) =>
                  Math.max(w.planned, w.consumed),
                ),
                1,
              );
              const step = Math.max(1, Math.ceil(maxVal / 4));
              const ticks = [0, 1, 2, 3, 4].map((i) => i * step);

              return (
                <>
                  {/* Axe vertical */}
                  <div className="flex flex-col justify-between text-[10px] text-slate-500">
                    {ticks
                      .slice()
                      .reverse()
                      .map((val) => (
                        <div
                          key={val}
                          className="flex items-center gap-1"
                          style={{ height: "20%" }}
                        >
                          <span className="w-8 text-right">{val}</span>
                          <span className="h-px flex-1 bg-slate-200" />
                        </div>
                      ))}
                  </div>

                  {/* Barres */}
                  <div className="flex-1 flex items-end gap-3">
                    {weeklyLoads.map((w) => {
                      const plannedHeight =
                        (w.planned / maxVal) * 100;
                      const consumedHeight =
                        (w.consumed / maxVal) * 100;

                      return (
                        <div
                          key={w.weekKey}
                          className="flex-1 flex flex-col items-center gap-1 min-w-[24px]"
                        >
                          <div className="relative w-6 h-32 flex flex-col justify-end">
                            <div
                              className="w-full bg-indigo-400"
                              style={{
                                height: `${
                                  plannedHeight > 0 ? plannedHeight : 6
                                }%`,
                              }}
                              title={`Prévu : ${w.planned} h`}
                            />
                            <div
                              className="w-full bg-emerald-400 -mt-px"
                              style={{
                                height: `${
                                  consumedHeight > 0 ? consumedHeight : 6
                                }%`,
                              }}
                              title={`Consommé : ${w.consumed} h`}
                            />
                          </div>
                          <div className="text-[10px] text-slate-600 text-center">
                            S{w.week}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-4 rounded-sm bg-indigo-400" />
                <span>Charge prévue</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-4 rounded-sm bg-emerald-400" />
                <span>Charge consommée</span>
              </span>
            </div>
            <div>
              Max semaine :{" "}
              {Math.max(
                ...weeklyLoads.map((w) =>
                  Math.max(w.planned, w.consumed),
                ),
              )}{" "}
              h
            </div>
          </div>
        </>
      )}
    </div>
  );
}
