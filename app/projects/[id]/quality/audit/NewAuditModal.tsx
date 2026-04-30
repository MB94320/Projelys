"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Audit } from "./AuditEvaluationModal";

type NewAuditModalProps = {
  projectId: number;
  projectNumber: string | null;
  onClose: () => void;
  onCreated: (audit: Audit) => void;
};

export default function NewAuditModal({
  projectId,
  projectNumber,
  onClose,
  onCreated,
}: NewAuditModalProps) {
  const [evaluationDate, setEvaluationDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd", { locale: fr }),
  );
  const [qualityFollowUp, setQualityFollowUp] = useState<string>("");
  const [outsourcing, setOutsourcing] = useState<string>("Non");
  const [xshore, setXshore] = useState<string>("Non");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!evaluationDate) {
      setError("La date d’évaluation est obligatoire.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        evaluationDate,
        qualityFollowUp:
          qualityFollowUp.trim().length > 0
            ? qualityFollowUp.trim()
            : null,
        outsourcing,
        xshore,
      };

      const res = await fetch(
        `/api/projects/${projectId}/audit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(
          data?.error ??
            "Erreur lors de la création de l’audit.",
        );
        setSubmitting(false);
        return;
      }

      const created = (await res.json()) as Audit;
      onCreated(created);
    } catch (err: any) {
      setError(
        err?.message ??
          "Erreur inconnue lors de la création de l’audit.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Nouvel audit qualité
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-sm"
          >
            ×
          </button>
        </div>

        <p className="text-xs text-slate-600">
          Projet{" "}
          <span className="font-semibold">
            {projectNumber ?? `P-${projectId}`}
          </span>
          . Les thèmes, questions, descriptions et RACI seront
          générés automatiquement.
        </p>

        {error && (
          <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-600">
                Date d’évaluation
              </label>
              <input
                type="date"
                value={evaluationDate}
                onChange={(e) => setEvaluationDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-slate-600">
                Sous-traitance
              </label>
              <select
                value={outsourcing}
                onChange={(e) => setOutsourcing(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              >
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-slate-600">
                X-shore
              </label>
              <select
                value={xshore}
                onChange={(e) => setXshore(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
              >
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-slate-600">
                Commentaires de suivi qualité (optionnel)
              </label>
              <textarea
                value={qualityFollowUp}
                onChange={(e) =>
                  setQualityFollowUp(e.target.value)
                }
                rows={3}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs resize-none"
                placeholder="Ex : points d’attention, plan d’actions, etc."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? "Création..." : "Créer l’audit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}