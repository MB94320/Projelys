"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";

type ActionStatus = "Ouverte" | "En cours" | "Terminée" | "Annulée";
type ActionPriority = "Basse" | "Moyenne" | "Haute";
type EfficienceStatus =
  | "Conforme"
  | "Partiellement conforme"
  | "Non conforme";

type ActionDetail = {
  id: number;
  title: string;
  origin: string;
  priority: string | null;
  progress: number | null;
  owner: string | null;
  startDate: string | null;
  createdAt: string;
  dueDate: string | null;
  closedDate: string | null;
  status: string;
  description: string | null;
  efficience: string | null;
  project?: { id: number; projectNumber: string | null } | null;
  risk?: { id: number; ref: string | null; projectId: number | null } | null;
};

export default function ActionEditPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id as string | undefined;
  const actionId = idParam ? Number(idParam) : null;

  const [loadedAction, setLoadedAction] = useState<ActionDetail | null>(null);

  const [origin, setOrigin] = useState("Autres");
  const [priority, setPriority] =
    useState<ActionPriority>("Moyenne");

  const [status, setStatus] = useState<ActionStatus>("En cours");
  const [progress, setProgress] = useState(0);
  const [owner, setOwner] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [closedDate, setClosedDate] = useState("");
  const [efficience, setEfficience] =
    useState<EfficienceStatus>("Conforme");
  const [comment, setComment] = useState("");
  const [projectNumber, setProjectNumber] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!actionId) {
      setMessage("Identifiant d’action invalide.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/actions/${actionId}`);
        if (!res.ok) {
          setMessage("Action introuvable.");
          setLoading(false);
          return;
        }

        const data = (await res.json()) as ActionDetail;
        setLoadedAction(data);

        setOrigin(data.origin ?? "Autres");
        const prio = data.priority as ActionPriority | null;
        setPriority(prio ?? "Moyenne");

        const normalizedStatus =
          (data.status as ActionStatus) === "Ouverte" ||
          (data.status as ActionStatus) === "En cours" ||
          (data.status as ActionStatus) === "Terminée" ||
          (data.status as ActionStatus) === "Annulée"
            ? (data.status as ActionStatus)
            : "En cours";
        setStatus(normalizedStatus);

        setProgress(data.progress ?? 0);
        setOwner(data.owner ?? "");

        setStartDate(
          data.startDate
            ? data.startDate.substring(0, 10)
            : data.createdAt.substring(0, 10),
        );
        setDueDate(data.dueDate ? data.dueDate.substring(0, 10) : "");
        setClosedDate(
          data.closedDate ? data.closedDate.substring(0, 10) : "",
        );
        setComment(data.description ?? "");
        setEfficience(
          (data.efficience as EfficienceStatus | null) ?? "Conforme",
        );
        setProjectNumber(data.project?.projectNumber ?? "");
      } catch (err) {
        console.error(err);
        setMessage("Erreur lors du chargement de l’action.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [actionId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    if (!loadedAction || !actionId) {
      setMessage("Impossible d’enregistrer : action introuvable.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const body = {
        origin,
        priority,
        status,
        progress,
        owner,
        startDate: startDate || null,
        dueDate: dueDate || null,
        closedDate:
          status === "Terminée" || status === "Annulée"
            ? closedDate || null
            : null,
        efficience:
          status === "Terminée" ? efficience : null,
        comment: comment.trim() || null,
        projectNumber: projectNumber.trim() || null,
      };

      const res = await fetch(`/api/actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Erreur lors de la mise à jour.");
      }

      router.push("/actions");
    } catch (err: any) {
      console.error(err);
      setMessage(err.message ?? "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/actions");
  }

  if (loading) {
    return (
      <section className="max-w-3xl mx-auto">
        <p className="text-xs text-slate-500">
          Chargement de l’action...
        </p>
      </section>
    );
  }

  if (!loadedAction) {
    return (
      <section className="max-w-3xl mx-auto">
        <p className="text-xs text-rose-600">
          Action introuvable ou erreur de chargement.
        </p>
      </section>
    );
  }

  const showClosureBlock =
    status === "Terminée" || status === "Annulée";

  return (
    <section className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">
        Mise à jour de l’action #{loadedAction.id}
      </h1>
      <p className="text-xs text-slate-500 mb-1">
        {loadedAction.title}
      </p>

      {message && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSave}
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
                value={loadedAction.title}
                disabled
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs"
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

        {/* Commentaire général accessible tout le temps */}
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

        {/* Clôture (Terminée ou Annulée) */}
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

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}
