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

export default function HolidaysPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterYear, setFilterYear] = useState<number | "Tous">("Tous");
  const [error, setError] = useState<string | null>(null);

  // ---- helpers ----

  function computeFullDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 < d1) return 0;
    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  function computeDaysCount(
    start: string,
    end: string,
    duration: AbsenceDuration,
  ): number {
    const fullDays = computeFullDays(start, end);
    if (fullDays === 0) return 0;
    if (duration === "FULL_DAY") return fullDays;
    return fullDays * 0.5;
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
          data.map((a) => ({
            id: a.id,
            resourceName: a.resourceName ?? "",
            type: a.type as AbsenceType,
            startDate: new Date(a.startDate).toISOString().slice(0, 10),
            endDate: new Date(a.endDate).toISOString().slice(0, 10),
            daysCount: a.daysCount ?? 0,
            comment: a.comment ?? "",
            duration:
              a.duration === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY",
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          })),
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

      setAbsences((prev) => [
        ...prev,
        {
          id: created.id,
          resourceName: created.resourceName ?? "",
          type: (created.type as AbsenceType) ?? "Congés payés",
          startDate,
          endDate,
          daysCount: created.daysCount ?? 1,
          comment: created.comment ?? "",
          duration:
            created.duration === "HALF_DAY" ? "HALF_DAY" : "FULL_DAY",
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

      setAbsences((prev) =>
        prev.map((a) =>
          a.id === absence.id
            ? {
                id: updated.id,
                resourceName: updated.resourceName ?? "",
                type: updated.type as AbsenceType,
                startDate: new Date(updated.startDate)
                  .toISOString()
                  .slice(0, 10),
                endDate: new Date(updated.endDate)
                  .toISOString()
                  .slice(0, 10),
                daysCount: updated.daysCount ?? daysCount,
                comment: updated.comment ?? "",
                duration:
                  updated.duration === "HALF_DAY"
                    ? "HALF_DAY"
                    : "FULL_DAY",
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Saisie congés / absences
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Renseigne les absences par collaborateur. Le nombre de jours peut
            être en journée entière ou en 1/2 journée.
          </p>
        </div>
        <Link
          href="/loadplan"
          className="text-xs text-indigo-600 hover:underline"
        >
          ← Retour au plan de charge
        </Link>
      </div>

      {/* Bandeau synthèse */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">
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
              className="border border-slate-300 rounded-md px-2 py-1 text-xs"
            >
              <option value="Tous">Toutes</option>
              {yearsAvailable.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
            <span className="text-xs">📅</span>
            {absencesFiltered.length} enregistrement(s)
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
            <span className="text-xs">🔢</span>
            {totalDays.toFixed(1)} jour(s) d’absence au total
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
            <span className="text-xs">📚</span>
            {(daysByType.get("Formation") ?? 0).toFixed(1)} jour(s) de
            formation
          </span>
        </div>
      </div>

      {/* Tableau d'édition */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Absences détaillées
          </h2>
          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            + Ajouter une absence
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-slate-500">Chargement…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-2 py-2 text-left">Ressource</th>
                    <th className="px-2 py-2 text-left">
                      Type d&apos;absence
                    </th>
                    <th className="px-2 py-2 text-left">Durée</th>
                    <th className="px-2 py-2 text-left">Début</th>
                    <th className="px-2 py-2 text-left">Fin</th>
                    <th className="px-2 py-2 text-right">Nb jours</th>
                    <th className="px-2 py-2 text-left">
                      Commentaire
                    </th>
                    <th className="px-2 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {absencesFiltered.length === 0 ? (
                    <tr>
                      <td
                        className="px-2 py-4 text-center text-slate-400"
                        colSpan={8}
                      >
                        Aucune absence. Clique sur « Ajouter une
                        absence » pour créer la première ligne.
                      </td>
                    </tr>
                  ) : (
                    absencesFiltered.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-2 py-1">
                          <input
                            className="w-full border border-slate-200 rounded px-1 py-0.5"
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
                            className="w-full border border-slate-200 rounded px-1 py-0.5"
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
                            className="w-full border border-slate-200 rounded px-1 py-0.5"
                            value={a.duration}
                            onChange={(e) =>
                              handleUpdateLocal(a.id, {
                                duration:
                                  e.target.value as AbsenceDuration,
                              })
                            }
                            onBlur={() => handleSaveRow(a)}
                          >
                            <option value="FULL_DAY">
                              Journée entière
                            </option>
                            <option value="HALF_DAY">
                              1/2 journée
                            </option>
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="date"
                            className="border border-slate-200 rounded px-1 py-0.5"
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
                            className="border border-slate-200 rounded px-1 py-0.5"
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
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {a.daysCount.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            className="w-full border border-slate-200 rounded px-1 py-0.5"
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
                            className="text-[11px] text-rose-600 hover:underline"
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
              <div className="mt-2 text-[11px] text-slate-400">
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
