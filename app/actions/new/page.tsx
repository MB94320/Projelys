"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ActionStatus = "Ouverte" | "En cours" | "Terminée" | "Annulée";
type ActionPriority = "Basse" | "Moyenne" | "Haute";
type EfficienceStatus =
  | "Conforme"
  | "Partiellement conforme"
  | "Non conforme";

export default function NewActionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [origin, setOrigin] = useState("Risques");
  const [priority, setPriority] =
    useState<ActionPriority>("Moyenne");
  const [owner, setOwner] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [closedDate, setClosedDate] = useState("");
  const [status, setStatus] = useState<ActionStatus>("Ouverte");
  const [progress, setProgress] = useState(0);
  const [efficience, setEfficience] =
    useState<EfficienceStatus>("Conforme");
  const [comment, setComment] = useState("");
  const [projectNumber, setProjectNumber] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showClosureBlock =
    status === "Terminée" || status === "Annulée";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage(null);

      const body = {
        title,
        origin,
        priority,
        owner,
        startDate: startDate || null,
        dueDate: dueDate || null,
        closedDate:
          status === "Terminée" || status === "Annulée"
            ? closedDate || null
            : null,
        status,
        progress,
        efficience:
          status === "Terminée" ? efficience : null,
        comment: comment.trim() || null,
        projectNumber: projectNumber.trim() || null,
      };

      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Erreur lors de la création.");
      }

      router.push("/actions");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message ?? "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">
        Nouvelle action
      </h1>

      {message && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-slate-200 p-4 space-y-4"
      >
        {/* Informations générales */}
        <div>
          <h2 className="text-xs font-semibold text-slate-700 mb-2">
            Informations générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1 md:col-span-2">
              <label className="text-slate-600">
                Intitulé de l’action
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600">Origine</label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="Commerce">Commerce</option>
                <option value="Exigence">Exigence</option>
                <option value="Non-Conformité">Non-Conformité</option>
                <option value="Risques">Risques</option>
                <option value="Revue interne">Revue interne</option>
                <option value="Revue Client">Revue Client</option>
                <option value="Qualité">Qualité</option>
                <option value="Audit Interne">Audit Interne</option>
                <option value="Audit Externe">Audit Externe</option>
                <option value="KoM">KoM</option>
                <option value="CoPil">CoPil</option>
                <option value="CoDir">CoDir</option>
                <option value="Autres">Autres</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-600">Priorité</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as ActionPriority)
                }
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="Haute">Haute</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Basse">Basse</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-600">
                N° projet (optionnel)
              </label>
              <input
                type="text"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600">Responsable</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600">Échéance</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
        </div>

        {/* Pilotage */}
        <div>
          <h2 className="text-xs font-semibold text-slate-700 mb-2">
            Pilotage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-600">Statut</label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ActionStatus)
                }
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="Ouverte">Ouverte</option>
                <option value="En cours">En cours</option>
                <option value="Terminée">Terminée</option>
                <option value="Annulée">Annulée</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-600">
                Avancement : {progress} %
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Commentaires */}
        <div>
          <h2 className="text-xs font-semibold text-slate-700 mb-2">
            Commentaires
          </h2>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            placeholder="Commentaire sur l’action, décisions de pilotage, etc."
          />
        </div>

        {/* Clôture */}
        {showClosureBlock && (
          <div>
            <h2 className="text-xs font-semibold text-slate-700 mb-2">
              Clôture
              {status === "Terminée" && " ISO 9001"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600">
                  Date de clôture
                </label>
                <input
                  type="date"
                  value={closedDate}
                  onChange={(e) => setClosedDate(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {status === "Terminée" && (
                <div className="space-y-1">
                  <label className="text-slate-600">Efficience</label>
                  <select
                    value={efficience}
                    onChange={(e) =>
                      setEfficience(
                        e.target.value as EfficienceStatus,
                      )
                    }
                    className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="Conforme">Conforme</option>
                    <option value="Partiellement conforme">
                      Partiellement conforme
                    </option>
                    <option value="Non conforme">Non conforme</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.push("/actions")}
            className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Création..." : "Créer"}
          </button>
        </div>
      </form>
    </section>
  );
}
