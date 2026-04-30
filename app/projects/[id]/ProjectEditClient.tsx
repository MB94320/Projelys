"use client";

import { useState } from "react";

type Project = {
  id: number;
  projectNumber: string | null;
  titleProject: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  startDate: Date | string | null;
  estimatedDate: Date | string | null;
  status: string | null;
  riskCriticality: string | null;
  progressPercent: number | null;
  comments: string | null;
  plannedLoadDays: number | null;   // utilisé comme heures
  consumedLoadDays: number | null;  // utilisé comme heures
};

type Props = {
  project: Project;
};

// helper pour formater une date en YYYY-MM-DD
function toInputDate(value: Date | string | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function ProjectEditClient({ project }: Props) {
  const plannedHours = project.plannedLoadDays ?? 0;
  const consumedHours = project.consumedLoadDays ?? 0;

  const [form, setForm] = useState<Project>({
    ...project,
    startDate: toInputDate(project.startDate),
    estimatedDate: toInputDate(project.estimatedDate),
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canEdit = editing && !saving;

  const updateField = (field: keyof Project, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: value as any,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error ?? "Erreur lors de l'enregistrement"
        );
      }

      const json = await res.json();
      const updated = json.project as Project;

      // resynchroniser le formulaire avec les données renvoyées par l'API
      setForm({
        ...updated,
        startDate: toInputDate(updated.startDate),
        estimatedDate: toInputDate(updated.estimatedDate),
      });

      setMessage("Projet mis à jour avec succès.");
      setEditing(false);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Erreur inconnue lors de l'enregistrement"
      );
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleCancel = () => {
    setForm({
      ...project,
      startDate: toInputDate(project.startDate),
      estimatedDate: toInputDate(project.estimatedDate),
    });
    setEditing(false);
    setMessage(null);
  };

  return (
    <div className="space-y-3 text-xs">
      {/* barre d'actions */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          Informations générales
        </h2>
        <div className="flex gap-2">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-1 rounded-md bg-indigo-600 text-white text-[11px]"
            >
              ✎ Éditer
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1 rounded-md bg-emerald-600 text-white text-[11px] disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "✓ Enregistrer"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-3 py-1 rounded-md bg-slate-200 text-slate-800 text-[11px]"
              >
                ✕ Annuler
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
          {message}
        </div>
      )}

      {/* grille de champs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-500 mb-1">N° projet</label>
          <input
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50"
            value={form.projectNumber ?? ""}
            onChange={(e) => updateField("projectNumber", e.target.value)}
            disabled={true}
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">
            Intitulé du projet
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50"
            value={form.titleProject ?? ""}
            onChange={(e) => updateField("titleProject", e.target.value)}
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">Client</label>
          <input
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50"
            value={form.clientName ?? ""}
            onChange={(e) => updateField("clientName", e.target.value)}
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">
            Chef de projet
          </label>
          <input
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50"
            value={form.projectManagerName ?? ""}
            onChange={(e) =>
              updateField("projectManagerName", e.target.value)
            }
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">Date de début</label>
          <input
            type="date"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50"
            value={(form.startDate as string) ?? ""}
            onChange={(e) => updateField("startDate", e.target.value)}
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">
            Date d&apos;échéance
          </label>
          <input
            type="date"
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50"
            value={(form.estimatedDate as string) ?? ""}
            onChange={(e) => updateField("estimatedDate", e.target.value)}
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">
            Charge prévue (heures)
          </label>
          <input
            type="number"
            value={plannedHours}
            disabled
            className="w-full rounded-md border border-slate-200 bg-slate-50 text-slate-500 px-2 py-1 text-sm cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">
            Charge consommée (heures)
          </label>
          <input
            type="number"
            value={consumedHours}
            disabled
            className="w-full rounded-md border border-slate-200 bg-slate-50 text-slate-500 px-2 py-1 text-sm cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-slate-500 mb-1">Statut</label>
          <select
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50"
            value={form.status ?? ""}
            onChange={(e) => updateField("status", e.target.value)}
            disabled={!canEdit}
          >
            <option value="">Non renseigné</option>
            <option value="Planifié">Planifié</option>
            <option value="En cours">En cours</option>
            <option value="Terminé">Terminé</option>
            <option value="Annulé">Annulé</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 mb-1">
            Criticité risque
          </label>
          <select
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50"
            value={form.riskCriticality ?? ""}
            onChange={(e) =>
              updateField("riskCriticality", e.target.value)
            }
            disabled={!canEdit}
          >
            <option value="">Non renseigné</option>
            <option value="Négligeable">Négligeable</option>
            <option value="Significatif">Significatif</option>
            <option value="Critique">Critique</option>
            <option value="Inacceptable">Inacceptable</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-500 mb-1">
            % avancement (calculé)
          </label>
          <input
            type="number"
            value={project.progressPercent ?? 0}
            disabled
            className="w-full rounded-md border border-slate-200 bg-slate-50 text-slate-500 px-2 py-1 text-sm cursor-not-allowed"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-slate-500 mb-1">Commentaires</label>
          <textarea
            className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white disabled:bg-slate-50 h-16"
            value={form.comments ?? ""}
            onChange={(e) => updateField("comments", e.target.value)}
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );
}
