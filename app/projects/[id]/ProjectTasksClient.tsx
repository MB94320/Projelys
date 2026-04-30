"use client";

import { useEffect, useState } from "react";

type Task = {
  id: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  plannedWorkHours: number;
  consumedWorkHours: number;
  progressPercent: number;
  status: string;
  assigneeName: string | null;
  role: string | null;
};

type Props = {
  projectId: number;
};

const STATUS_OPTIONS = [
  "Planifiée",
  "En cours",
  "Terminée",
  "En retard",
  "Annulée",
];

const ROLE_OPTIONS = [
  "",
  "Chef de projet",
  "Consultant",
  "Développeur",
  "Testeur",
  "MOA",
  "Architecte",
];

export default function ProjectTasksClient({ projectId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // --- Chargement des tâches ---
  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      if (!res.ok) {
        throw new Error("Erreur lors du chargement des tâches");
      }
      const data = await res.json();
      setTasks(
        data.map((t: any) => ({
          ...t,
          startDate: t.startDate ? t.startDate.slice(0, 10) : null,
          endDate: t.endDate ? t.endDate.slice(0, 10) : null,
        })),
      );
    } catch {
      setError("Impossible de charger les tâches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  // --- Mise à jour locale d'une tâche + retour de la tâche mise à jour ---
  const updateLocalTask = (id: number, patch: Partial<Task>): Task | null => {
    let updated: Task | null = null;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const merged = { ...t, ...patch };
        updated = merged;
        return merged;
      }),
    );
    return updated;
  };

  // --- Création d'une tâche ---
  const handleCreate = async () => {
    try {
      setCreating(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Nouvelle tâche",
          plannedWorkHours: 7,
          progressPercent: 0,
          status: "Planifiée",
          role: "",
        }),
      });
      if (!res.ok) throw new Error();
      const task = await res.json();
      setTasks((prev) => [
        ...prev,
        {
          ...task,
          startDate: task.startDate ? task.startDate.slice(0, 10) : null,
          endDate: task.endDate ? task.endDate.slice(0, 10) : null,
        },
      ]);
    } catch {
      setError("Erreur lors de la création de la tâche.");
    } finally {
      setCreating(false);
    }
  };

  // --- Sauvegarde d'une tâche ---
  const handleSave = async (task: Task) => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!res.ok) throw new Error();
      // on peut recharger pour être sûr d'avoir les valeurs DB
      await load();
    } catch {
      setError("Erreur lors de l’enregistrement d’une tâche.");
    } finally {
      setSaving(false);
    }
  };

  // --- Suppression d'une tâche ---
  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Erreur lors de la suppression de la tâche.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Titre + boutons (Refresh + Ajouter) */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Tâches du projet
        </h2>
        <div className="flex gap-2">          
          <button
            type="button"
            onClick={handleCreate}
            className="px-3 py-1 rounded-md bg-indigo-600 text-white text-[11px]"
          >
            {creating ? "Création..." : "Ajouter une tâche"}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 mb-2">
        Chaque tâche dispose de dates, d’une charge prévue (heures), d’un
        avancement (%) et d’un statut. La charge consommée sera alimentée plus
        tard par les pointages d’heures. Le rôle permet d’identifier le profil
        (chef de projet, développeur, consultant…).
      </p>

      {loading ? (
        <div className="text-xs text-slate-500">Chargement…</div>
      ) : tasks.length === 0 ? (
        <div className="text-xs text-slate-500">
          Aucune tâche pour ce projet. Ajoute une première tâche pour préparer
          le Gantt.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-[11px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-2 py-1 text-left">Tâche</th>
                <th className="px-2 py-1 text-left">Responsable</th>
                <th className="px-2 py-1 text-left">Rôle / profil</th>
                <th className="px-2 py-1 text-left">Début</th>
                <th className="px-2 py-1 text-left">Fin</th>
                <th className="px-2 py-1 text-right">Charge prévue (h)</th>
                <th className="px-2 py-1 text-right">
                  Charge consommée (h)
                </th>
                <th className="px-2 py-1 text-right">Avancement (%)</th>
                <th className="px-2 py-1 text-left">Statut</th>
                <th className="px-2 py-1 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.id}>
                  {/* Nom de la tâche */}
                  <td className="px-2 py-1">
                    <input
                      className="w-full border border-slate-200 rounded px-1 py-0.5"
                      value={t.name}
                      onChange={(e) =>
                        updateLocalTask(t.id, { name: e.target.value })
                      }
                      onBlur={() => {
                        const updated = tasks.find((x) => x.id === t.id);
                        if (updated) handleSave(updated);
                      }}
                    />
                  </td>

                  {/* Responsable */}
                  <td className="px-2 py-1">
                    <input
                      className="w-full border border-slate-200 rounded px-1 py-0.5"
                      value={t.assigneeName ?? ""}
                      onChange={(e) =>
                        updateLocalTask(t.id, {
                          assigneeName: e.target.value,
                        })
                      }
                      onBlur={() => {
                        const updated = tasks.find((x) => x.id === t.id);
                        if (updated) handleSave(updated);
                      }}
                    />
                  </td>

                  {/* Rôle / profil */}
                  <td className="px-2 py-1">
                    <select
                      className="w-full border border-slate-200 rounded px-1 py-0.5"
                      value={t.role ?? ""}
                      onChange={(e) =>
                        updateLocalTask(t.id, {
                          role: e.target.value || null,
                        })
                      }
                      onBlur={() => {
                        const updated = tasks.find((x) => x.id === t.id);
                        if (updated) handleSave(updated);
                      }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r === "" ? "—" : r}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Date début */}
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      className="border border-slate-200 rounded px-1 py-0.5"
                      value={t.startDate ?? ""}
                      onChange={(e) =>
                        updateLocalTask(t.id, {
                          startDate: e.target.value || null,
                        })
                      }
                      onBlur={() => {
                        const updated = tasks.find((x) => x.id === t.id);
                        if (updated) handleSave(updated);
                      }}
                    />
                  </td>

                  {/* Date fin */}
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      className="border border-slate-200 rounded px-1 py-0.5"
                      value={t.endDate ?? ""}
                      onChange={(e) =>
                        updateLocalTask(t.id, {
                          endDate: e.target.value || null,
                        })
                      }
                      onBlur={() => {
                        const updated = tasks.find((x) => x.id === t.id);
                        if (updated) handleSave(updated);
                      }}
                    />
                  </td>

                  {/* Charge prévue */}
                  <td className="px-2 py-1 text-right">
                    <input
                      type="number"
                      min={0}
                      className="w-20 border border-slate-200 rounded px-1 py-0.5 text-right"
                      value={t.plannedWorkHours}
                      onChange={(e) =>
                        updateLocalTask(t.id, {
                          plannedWorkHours: Number(e.target.value) || 0,
                        })
                      }
                      onBlur={() => {
                        const updated = tasks.find((x) => x.id === t.id);
                        if (updated) handleSave(updated);
                      }}
                    />
                  </td>

                  {/* Charge consommée */}
                  <td className="px-2 py-1 text-right">
                    <input
                      type="number"
                      min={0}
                      className="w-20 border border-slate-200 rounded px-1 py-0.5 text-right"
                      value={t.consumedWorkHours}
                      onChange={(e) =>
                        updateLocalTask(t.id, {
                          consumedWorkHours: Number(e.target.value) || 0,
                        })
                      }
                      onBlur={() => {
                        const updated = tasks.find((x) => x.id === t.id);
                        if (updated) handleSave(updated);
                      }}
                    />
                  </td>

                  {/* Avancement */}
                  <td className="px-2 py-1 text-right">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-16 border border-slate-200 rounded px-1 py-0.5 text-right"
                      value={t.progressPercent}
                      onChange={(e) =>
                        updateLocalTask(t.id, {
                          progressPercent: Number(e.target.value) || 0,
                        })
                      }
                      onBlur={() => {
                        const updated = tasks.find((x) => x.id === t.id);
                        if (updated) handleSave(updated);
                      }}
                    />
                  </td>

                  {/* Statut */}
                  <td className="px-2 py-1">
                    <select
                      className="border border-slate-200 rounded px-1 py-0.5"
                      value={t.status}
                      onChange={(e) =>
                        updateLocalTask(t.id, { status: e.target.value })
                      }
                      onBlur={() => {
                        const updated = tasks.find((x) => x.id === t.id);
                        if (updated) handleSave(updated);
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id)}
                      className="text-[11px] text-rose-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {saving && (
        <div className="mt-1 text-[11px] text-slate-400">
          Enregistrement en cours…
        </div>
      )}
      {error && (
        <div className="mt-1 text-[11px] text-rose-600">{error}</div>
      )}
    </div>
  );
}