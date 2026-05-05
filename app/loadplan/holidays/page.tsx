"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const ABSENCE_TYPES = [
  "Congés payés",
  "RTT",
  "Maladie",
  "Formation",
  "Autre",
] as const;

type AbsenceType = (typeof ABSENCE_TYPES)[number];
type AbsenceDuration = "FULL_DAY" | "HALF_DAY";

type Absence = {
  id: number;
  resourceName: string;
  type: AbsenceType;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  daysCount: number;
  comment: string | null;
  duration: AbsenceDuration;
  createdAt?: string;
  updatedAt?: string;
};

// ------- Jours fériés France (mêmes helpers que l’API) -------

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

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

// Calcule le nombre de jours ouvrés complets (lun–ven) entre deux dates, en retirant les jours fériés
function computeFullWorkingDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const d1 = new Date(start);
  const d2 = new Date(end);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 0;

  const yearStart = d1.getUTCFullYear();
  const yearEnd = d2.getUTCFullYear();
  const holidays: Date[] = [];

  for (let y = yearStart; y <= yearEnd; y++) {
    holidays.push(...getFrenchPublicHolidays(y));
  }

  let current = new Date(
    Date.UTC(d1.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate()),
  );
  const last = new Date(
    Date.UTC(d2.getUTCFullYear(), d2.getUTCMonth(), d2.getUTCDate()),
  );

  let workingDays = 0;

  while (current <= last) {
    const day = current.getUTCDay(); // 0-6, 0=dimanche
    const isWeekend = day === 0 || day === 6;

    const isHoliday = holidays.some((h) => isSameDay(h, current));

    if (!isWeekend && !isHoliday) {
      workingDays += 1;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return workingDays;
}

export default function HolidaysPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterYear, setFilterYear] = useState<number | "Tous">("Tous");
  const [error, setError] = useState<string | null>(null);

  function computeDaysCount(
    start: string,
    end: string,
    duration: AbsenceDuration,
  ): number {
    const fullWorkingDays = computeFullWorkingDays(start, end);
    if (fullWorkingDays === 0) return 0;
    if (duration === "FULL_DAY") return fullWorkingDays;
    return fullWorkingDays * 0.5;
  }

  // ---- chargement initial ----

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/holidays");
        const data: any[] = await res.json();
        setAbsences(
          data.map((a) => {
            const start = new Date(a.startDate);
            const end = new Date(a.endDate);
            const startStr = start.toISOString().slice(0, 10);
            const endStr = end.toISOString().slice(0, 10);

            const duration: AbsenceDuration =
              a.duration === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY";

            const computedDays = computeDaysCount(
              startStr,
              endStr,
              duration,
            );

            return {
              id: a.id,
              resourceName: a.resourceName ?? "",
              type: a.type as AbsenceType,
              startDate: startStr,
              endDate: endStr,
              daysCount: computedDays,
              comment: a.comment ?? "",
              duration,
              createdAt: a.createdAt,
              updatedAt: a.updatedAt,
            };
          }),
        );
      } catch {
        setError("Impossible de charger les absences.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ---- CRUD ----

  const handleAddRow = async () => {
    try {
      setSaving(true);
      setError(null);
      const today = new Date().toISOString().slice(0, 10);

      const payload = {
        resourceName: "",
        type: "Congés payés",
        startDate: today,
        endDate: today,
        daysCount: 1,
        duration: "FULL_DAY" as AbsenceDuration,
        comment: "",
      };

      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const created = (await res.json()) as any;

      const startDate = created.startDate
        ? new Date(created.startDate).toISOString().slice(0, 10)
        : today;
      const endDate = created.endDate
        ? new Date(created.endDate).toISOString().slice(0, 10)
        : today;

      const duration: AbsenceDuration =
        created.duration === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY";

      const computedDays = computeDaysCount(startDate, endDate, duration);

      setAbsences((prev) => [
        ...prev,
        {
          id: created.id,
          resourceName: created.resourceName ?? "",
          type: (created.type as AbsenceType) ?? "Congés payés",
          startDate,
          endDate,
          daysCount: computedDays,
          comment: created.comment ?? "",
          duration,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        },
      ]);
    } catch {
      setError("Erreur lors de la création d’une absence.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateLocal = (id: number, patch: Partial<Absence>) => {
    setAbsences((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const updated: Absence = { ...a, ...patch };
        if (
          patch.startDate !== undefined ||
          patch.endDate !== undefined ||
          patch.duration !== undefined
        ) {
          updated.daysCount = computeDaysCount(
            updated.startDate,
            updated.endDate,
            updated.duration,
          );
        }
        return updated;
      }),
    );
  };

  const handleSaveRow = async (absence: Absence) => {
    try {
      setSaving(true);
      setError(null);

      const daysCount = computeDaysCount(
        absence.startDate,
        absence.endDate,
        absence.duration,
      );

      const payload = {
        id: absence.id,
        resourceName: absence.resourceName,
        type: absence.type,
        startDate: absence.startDate,
        endDate: absence.endDate,
        daysCount,
        duration: absence.duration,
        comment: absence.comment,
      };

      const res = await fetch("/api/holidays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const updated = await res.json();

      const startStr = new Date(updated.startDate)
        .toISOString()
        .slice(0, 10);
      const endStr = new Date(updated.endDate)
        .toISOString()
        .slice(0, 10);

      const duration: AbsenceDuration =
        updated.duration === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY";

      const recomputedDays = computeDaysCount(startStr, endStr, duration);

      setAbsences((prev) =>
        prev.map((a) =>
          a.id === absence.id
            ? {
                id: updated.id,
                resourceName: updated.resourceName ?? "",
                type: updated.type as AbsenceType,
                startDate: startStr,
                endDate: endStr,
                daysCount: recomputedDays,
                comment: updated.comment ?? "",
                duration,
                createdAt: updated.createdAt,
                updatedAt: updated.updatedAt,
              }
            : a,
        ),
      );
    } catch {
      setError("Erreur lors de l’enregistrement de l’absence.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette absence ?")) return;
    try {
      setSaving(true);
      setError(null);
      await fetch(`/api/holidays?id=${id}`, {
        method: "DELETE",
      });
      setAbsences((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Erreur lors de la suppression de l’absence.");
    } finally {
      setSaving(false);
    }
  };

  // ---- dérivés ----

  const yearsAvailable = useMemo(() => {
    const set = new Set<number>();
    absences.forEach((a) => {
      if (a.startDate) set.add(Number(a.startDate.slice(0, 4)));
    });
    return Array.from(set).sort();
  }, [absences]);

  const absencesFiltered = useMemo(() => {
    if (filterYear === "Tous") return absences;
    return absences.filter(
      (a) => a.startDate.slice(0, 4) === String(filterYear),
    );
  }, [absences, filterYear]);

  const totalDays = useMemo(
    () =>
      absencesFiltered.reduce(
        (sum, a) => sum + (a.daysCount || 0),
        0,
      ),
    [absencesFiltered],
  );

  const daysByType = useMemo(() => {
    const map = new Map<AbsenceType, number>();
    ABSENCE_TYPES.forEach((t) => map.set(t, 0));
    absencesFiltered.forEach((a) => {
      map.set(
        a.type,
        (map.get(a.type) || 0) + (a.daysCount || 0),
      );
    });
    return map;
  }, [absencesFiltered]);

  // ---- rendu ----

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Saisie congés / absences
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Renseigne les absences par collaborateur. Le nombre de jours est
            calculé en jours ouvrés (lun–ven), hors jours fériés.
          </p>
        </div>
        <Link
          href="/loadplan"
          className="text-xs text-indigo-600 dark:text-indigo-300 hover:underline"
        >
          ← Retour au plan de charge
        </Link>
      </div>

      {/* Bandeau synthèse */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 mb-4 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap gap-3 items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Filtre année :
            </span>
            <select
              value={filterYear}
              onChange={(e) =>
                setFilterYear(
                  e.target.value === "Tous"
                    ? "Tous"
                    : Number(e.target.value),
                )
              }
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md px-2 py-1 text-xs"
            >
              <option value="Tous">Toutes</option>
              {yearsAvailable.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-200">
            <span className="text-xs">📅</span>
            {absencesFiltered.length} enregistrement(s)
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-200">
            <span className="text-xs">🔢</span>
            {totalDays.toFixed(1)} jour(s) d’absence (ouvrés) au total
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-slate-700 dark:text-slate-200">
            <span className="text-xs">📚</span>
            {(daysByType.get("Formation") ?? 0).toFixed(1)} jour(s) de
            formation
          </span>
        </div>
      </div>

      {/* Tableau d'édition */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Absences détaillées
          </h2>
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            + Ajouter une absence
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Chargement…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 text-left">Ressource</th>
                    <th className="px-2 py-2 text-left">
                      Type d&apos;absence
                    </th>
                    <th className="px-2 py-2 text-left">Durée</th>
                    <th className="px-2 py-2 text-left">Début</th>
                    <th className="px-2 py-2 text-left">Fin</th>
                    <th className="px-2 py-2 text-right">Nb jours ouvrés</th>
                    <th className="px-2 py-2 text-left">Commentaire</th>
                    <th className="px-2 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {absencesFiltered.length === 0 ? (
                    <tr>
                      <td
                        className="px-2 py-4 text-center text-slate-400 dark:text-slate-500"
                        colSpan={8}
                      >
                        Aucune absence. Clique sur « Ajouter une absence »
                        pour créer la première ligne.
                      </td>
                    </tr>
                  ) : (
                    absencesFiltered.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/70"
                      >
                        <td className="px-2 py-1">
                          <input
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-1 py-0.5 text-slate-900 dark:text-slate-100"
                            value={a.resourceName}
                            placeholder="Nom du collaborateur"
                            onChange={(e) =>
                              handleUpdateLocal(a.id, {
                                resourceName: e.target.value,
                              })
                            }
                            onBlur={() => handleSaveRow(a)}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-1 py-0.5 text-slate-900 dark:text-slate-100"
                            value={a.type}
                            onChange={(e) =>
                              handleUpdateLocal(a.id, {
                                type: e.target.value as AbsenceType,
                              })
                            }
                            onBlur={() => handleSaveRow(a)}
                          >
                            {ABSENCE_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-1 py-0.5 text-slate-900 dark:text-slate-100"
                            value={a.duration}
                            onChange={(e) =>
                              handleUpdateLocal(a.id, {
                                duration: e.target.value as AbsenceDuration,
                              })
                            }
                            onBlur={() => handleSaveRow(a)}
                          >
                            <option value="FULL_DAY">
                              Journée entière
                            </option>
                            <option value="HALF_DAY">1/2 journée</option>
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="date"
                            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-1 py-0.5 text-slate-900 dark:text-slate-100"
                            value={a.startDate}
                            onChange={(e) =>
                              handleUpdateLocal(a.id, {
                                startDate: e.target.value,
                              })
                            }
                            onBlur={() => handleSaveRow(a)}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="date"
                            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-1 py-0.5 text-slate-900 dark:text-slate-100"
                            value={a.endDate}
                            onChange={(e) =>
                              handleUpdateLocal(a.id, {
                                endDate: e.target.value,
                              })
                            }
                            onBlur={() => handleSaveRow(a)}
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100">
                            {a.daysCount.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-1 py-0.5 text-slate-900 dark:text-slate-100"
                            value={a.comment ?? ""}
                            placeholder="Optionnel"
                            onChange={(e) =>
                              handleUpdateLocal(a.id, {
                                comment: e.target.value,
                              })
                            }
                            onBlur={() => handleSaveRow(a)}
                          />
                        </td>
                        <td className="px-2 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDelete(a.id)}
                            className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {saving && (
              <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                Enregistrement en cours…
              </div>
            )}
            {error && (
              <div className="mt-2 text-[11px] text-rose-600">
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}