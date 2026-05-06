"use client";

import { useMemo, useState, useEffect } from "react";
import type { Risk } from "@prisma/client";
import Link from "next/link";

type Props = {
  projectId: number;
  projectNumber: string;
  projectTitle: string;
  projectStatus: string;
  risk: Risk;
};

type RiskAction = {
  id: number;
  title: string;
  owner: string | null;
  dueDate: string | null;
  status: string;
  priority: string | null;
};

const statusBadgeColors: Record<string, string> = {
  Planifié: "bg-indigo-100 text-indigo-700",
  "En cours": "bg-amber-100 text-amber-700",
  Terminé: "bg-emerald-100 text-emerald-700",
  Annulé: "bg-slate-100 text-slate-700",
};

const criticityColors: Record<string, string> = {
  Négligeable:
    "bg-emerald-50 text-emerald-700 border border-emerald-100",
  Significatif:
    "bg-sky-50 text-sky-700 border border-sky-100",
  Critique:
    "bg-amber-50 text-amber-700 border border-amber-100",
  Inacceptable:
    "bg-rose-50 text-rose-700 border border-rose-100",
  Motivant:
    "bg-lime-50 text-lime-700 border border-lime-100",
  "A ne pas rater":
    "bg-green-50 text-green-700 border border-green-100",
};

const impactOptions = [
  { value: 1, label: "1 - Faible" },
  { value: 2, label: "2 - Moyen" },
  { value: 3, label: "3 - Sérieux" },
  { value: 4, label: "4 - Majeur" },
];

const probabilityOptions = [
  { value: 1, label: "1 - Improbable" },
  { value: 2, label: "2 - Possible" },
  { value: 3, label: "3 - Probable" },
  { value: 4, label: "4 - Très probable" },
];

// mêmes catégories que lors de la création (à adapter si besoin)
const categoryOptions = [
  "Planning",
  "Budget",
  "Qualité",
  "Ressources",
  "Client",
  "Technique",
  "Contractuel",
  "Sécurité",
  "Autre",
];

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Coefficient d’impact valorisé selon le niveau
function getLevelCoefficient(level: string | null | undefined): number {
  if (!level) return 0;
  switch (level) {
    case "Négligeable":
      return 0.25;
    case "Significatif":
      return 0.5;
    case "Critique":
      return 0.75;
    case "Inacceptable":
    case "Motivant":
    case "A ne pas rater":
      return 1;
    default:
      return 0;
  }
}

export default function RiskDetailClient({
  projectId,
  projectNumber,
  projectTitle,
  projectStatus,
  risk,
}: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "actions">("info");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: risk.title,
    nature: (risk.nature as "Risque" | "Opportunité") ?? "Risque",
    category: risk.category ?? "",
    status: risk.status ?? "Ouvert",
    initialImpact: risk.initialImpact ?? null,
    initialProbability: risk.initialProbability ?? null,
    initialPotentialImpact: risk.initialPotentialImpact ?? null,
    updateImpact: risk.updateImpact ?? null,
    updateProbability: risk.updateProbability ?? null,
    updatePotentialImpact: risk.updatePotentialImpact ?? null,
    cause: risk.cause ?? "",
    comments: risk.comments ?? "",
  });

  const statusClass =
    projectStatus && statusBadgeColors[projectStatus]
      ? statusBadgeColors[projectStatus]
      : "bg-slate-100 text-slate-700";

  const initialLevel = risk.initialLevel ?? null;
  const updatedLevel = risk.updateLevel ?? null;
  const level = updatedLevel ?? initialLevel;

  const levelClass =
    (level && criticityColors[level]) ||
    "bg-slate-50 text-slate-700 border border-slate-100";

  const refAuto = `${projectNumber || "P"}-${
    risk.nature === "Opportunité" ? "O" : "R"
  }-${risk.id}`;

  // Impact potentiel utilisé pour le calcul : priorité à la valeur mise à jour
  const effectivePotential =
    form.updatePotentialImpact ?? form.initialPotentialImpact ?? null;

  const computedValuatedImpact = useMemo(() => {
    if (effectivePotential == null) return null;
    const coef = getLevelCoefficient(level);
    if (coef === 0) return null;
    return Math.round(effectivePotential * coef);
  }, [effectivePotential, level]);

  const displayedImpactValuated =
    computedValuatedImpact ??
    risk.updateValuatedImpact ??
    risk.initialValuatedImpact ??
    null;

  const displayedImpactPotential =
    form.updatePotentialImpact ??
    form.initialPotentialImpact ??
    risk.updatePotentialImpact ??
    risk.initialPotentialImpact ??
    null;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/risks/${risk.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            nature: form.nature,
            category: form.category.trim() || null,
            status: form.status,
            initialImpact:
              typeof form.initialImpact === "number"
                ? form.initialImpact
                : null,
            initialProbability:
              typeof form.initialProbability === "number"
                ? form.initialProbability
                : null,
            initialPotentialImpact:
              typeof form.initialPotentialImpact === "number"
                ? form.initialPotentialImpact
                : null,
            updateImpact:
              typeof form.updateImpact === "number"
                ? form.updateImpact
                : null,
            updateProbability:
              typeof form.updateProbability === "number"
                ? form.updateProbability
                : null,
            updatePotentialImpact:
              typeof form.updatePotentialImpact === "number"
                ? form.updatePotentialImpact
                : null,
            // on enregistre aussi l’impact valorisé recalculé
            updateValuatedImpact: computedValuatedImpact,
            cause: form.cause.trim() || null,
            comments: form.comments.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error ?? "Erreur lors de la mise à jour du risque"
        );
      }

      const updated = (await res.json()) as Risk;

      setForm({
        title: updated.title,
        nature:
          (updated.nature as "Risque" | "Opportunité") ?? "Risque",
        category: updated.category ?? "",
        status: updated.status ?? "Ouvert",
        initialImpact: updated.initialImpact ?? null,
        initialProbability: updated.initialProbability ?? null,
        initialPotentialImpact: updated.initialPotentialImpact ?? null,
        updateImpact: updated.updateImpact ?? null,
        updateProbability: updated.updateProbability ?? null,
        updatePotentialImpact: updated.updatePotentialImpact ?? null,
        cause: updated.cause ?? "",
        comments: updated.comments ?? "",
      });
      setEditing(false);
      setMessage("Fiche risque mise à jour avec succès.");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Erreur inconnue lors de la mise à jour"
      );
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };
  const [actions, setActions] = useState<RiskAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [creatingAction, setCreatingAction] = useState(false);
  const [newAction, setNewAction] = useState({
    title: "",
    owner: "",
    dueDate: "",
    priority: "Moyenne",
    status: "ouvert",
  });

  // charge systématiquement les actions quand on arrive sur l’onglet
  const loadActions = async () => {
    if (loadingActions) return;
    setLoadingActions(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/risks/${risk.id}/actions`,
      );
      if (!res.ok) throw new Error("Erreur lors du chargement des actions");
      const data = (await res.json()) as any[];
      const mapped: RiskAction[] = data.map((a) => ({
        id: a.id,
        title: a.title,
        owner: a.owner,
        dueDate: a.dueDate
          ? new Date(a.dueDate).toISOString().slice(0, 10)
          : null,
        status: a.status,
        priority: a.priority,
      }));
      setActions(mapped);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Erreur inconnue lors du chargement des actions",
      );
    } finally {
      setLoadingActions(false);
    }
  };

  useEffect(() => {
  if (activeTab === "actions") {
    loadActions();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeTab, projectId, risk.id]);



  const handleCreateAction = async () => {
    if (!newAction.title.trim()) {
      setMessage("Merci de renseigner au minimum un intitulé pour l’action.");
      return;
    }
    try {
      const res = await fetch(
        `/api/projects/${projectId}/risks/${risk.id}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newAction.title.trim(),
            owner: newAction.owner.trim() || null,
            dueDate: newAction.dueDate || null,
            priority: newAction.priority,
            status: newAction.status,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error ?? "Erreur lors de la création de l’action",
        );
      }
      const created = await res.json();
      setActions((prev) => [
        ...prev,
        {
          id: created.id,
          title: created.title,
          owner: created.owner,
          dueDate: created.dueDate
            ? new Date(created.dueDate).toISOString().slice(0, 10)
            : null,
          status: created.status,
          priority: created.priority,
        },
      ]);
      setNewAction({
        title: "",
        owner: "",
        dueDate: "",
        priority: "Moyenne",
        status: "ouvert",
      });
      setCreatingAction(false);
      setMessage("Action créée avec succès.");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Erreur inconnue lors de la création de l’action",
      );
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bandeau haut */}
      <div className="flex items-start justify-between text-xs text-slate-500 mb-2">
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">
            {projectNumber || "Projet"} – {projectTitle || ""}
          </span>
          <span>
            Fiche {risk.nature ?? "Risque"} – {risk.title}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}
          >
            {projectStatus}
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700">
            Réf&nbsp;: {risk.ref ?? refAuto}
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700">
            Nature&nbsp;: {risk.nature ?? "Risque"}
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
            Impact valorisé&nbsp;: {formatCurrency(displayedImpactValuated)}
          </span>
        </div>
      </div>

      {/* Boutons navigation + édition */}
      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center gap-2">
          <Link
            href={`/projects/${projectId}`}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
          >
            ← Retour fiche projet
          </Link>
          <Link
            href={`/projects/${projectId}/risks`}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
          >
            Vue risques & opportunités
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {message && (
            <span className="text-[11px] text-slate-600">
              {message}
            </span>
          )}
          {editing ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setForm({
                    title: risk.title,
                    nature:
                      (risk.nature as "Risque" | "Opportunité") ??
                      "Risque",
                    category: risk.category ?? "",
                    status: risk.status ?? "Ouvert",
                    initialImpact: risk.initialImpact ?? null,
                    initialProbability: risk.initialProbability ?? null,
                    initialPotentialImpact:
                      risk.initialPotentialImpact ?? null,
                    updateImpact: risk.updateImpact ?? null,
                    updateProbability: risk.updateProbability ?? null,
                    updatePotentialImpact:
                      risk.updatePotentialImpact ?? null,
                    cause: risk.cause ?? "",
                    comments: risk.comments ?? "",
                  });
                  setEditing(false);
                }}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-3 py-1.5 rounded-md bg-indigo-600 text-xs text-white disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="px-3 py-1.5 rounded-md bg-indigo-600 text-xs text-white"
            >
              Modifier
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/Tutoriel/projelys-risk-detail-tutorial.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white dark:bg-indigo-500">
              ?
            </span>
            <span>Tutoriel</span>
          </Link>
        </div>
      </div>

      {/* Mini KPI sur une ligne – blocs colorés */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Criticité */}
        <div className="rounded-lg shadow-sm p-3 border bg-emerald-50 text-emerald-900 border-emerald-100">
          <div className="text-[11px] text-emerald-700 mb-1">
            Criticité
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-emerald-700/80">Initiale</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                  initialLevel
                    ? criticityColors[initialLevel] ??
                      "bg-white/70 text-slate-700 border border-emerald-100"
                    : "bg-white/70 text-slate-700 border border-emerald-100"
                }`}
              >
                {initialLevel ?? "Non évaluée"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-dashed border-emerald-200 mt-1">
              <span className="text-emerald-700/80">Mise à jour</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${
                  updatedLevel
                    ? criticityColors[updatedLevel] ??
                      "bg-white/70 text-slate-700 border border-emerald-100"
                    : "bg-white/70 text-slate-700 border border-emerald-100"
                }`}
              >
                {updatedLevel ?? "Non évaluée"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-emerald-700/80">Statut</span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 font-medium bg-white/70 text-emerald-800 border border-emerald-100">
                {risk.status ?? "Non renseigné"}
              </span>
            </div>
          </div>
        </div>

        {/* Impact potentiel */}
        <div className="rounded-lg shadow-sm p-3 border bg-sky-50 text-sky-900 border-sky-100">
          <div className="text-[11px] text-sky-700">Impact potentiel</div>
          <div className="mt-1 text-sm font-semibold">
            {formatCurrency(displayedImpactPotential)}
          </div>
          <div className="mt-0.5 text-[11px] text-sky-700/80">
            Ordre de grandeur des conséquences sur le chiffre d’affaires,
            les coûts ou la qualité si le risque se matérialise.
          </div>
        </div>

        {/* Impact valorisé */}
        <div className="rounded-lg shadow-sm p-3 border bg-amber-50 text-amber-900 border-amber-100">
          <div className="text-[11px] text-amber-700">Impact valorisé</div>
          <div className="mt-1 text-sm font-semibold">
            {formatCurrency(displayedImpactValuated)}
          </div>
          <div className="mt-0.5 text-[11px] text-amber-700/80">
            Estimation probabilisée de l’impact : fraction de l’impact
            potentiel selon la criticité du risque ou de l’opportunité.
          </div>
        </div>

        {/* Statut du risque */}
        <div className="rounded-lg shadow-sm p-3 border bg-violet-50 text-violet-900 border-violet-100">
          <div className="text-[11px] text-violet-700">
            Statut du risque
          </div>
          <div className="mt-1 text-sm font-semibold">
            {form.status}
          </div>
          <div className="mt-0.5 text-[11px] text-violet-700/80">
            Dernière mise à jour le{" "}
            {risk.statusDate
              ? new Date(risk.statusDate).toLocaleDateString("fr-FR")
              : "-"}
            .
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="mt-4">
        <div className="border-b border-slate-200 flex gap-4 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`pb-2 px-1 -mb-px border-b-2 ${
              activeTab === "info"
                ? "border-indigo-500 text-indigo-600 font-medium"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Informations générales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("actions")}
            className={`pb-2 px-1 -mb-px border-b-2 ${
              activeTab === "actions"
                ? "border-indigo-500 text-indigo-600 font-medium"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Plan d’actions
          </button>
        </div>

        {activeTab === "info" && (
          <div className="bg-white rounded-b-lg border border-slate-200 border-t-0 p-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Colonne gauche : données générales */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold text-slate-700 uppercase">
                    Données générales
                  </h3>
                </div>

                <div>
                  <div className="text-slate-500 mb-0.5">Intitulé</div>
                  {editing ? (
                    <input
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                      value={form.title}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <div className="text-slate-900 text-sm">
                      {form.title}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-500 mb-0.5">Nature</div>
                    {editing ? (
                      <select
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={form.nature}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            nature: e.target
                              .value as (typeof form)["nature"],
                          }))
                        }
                      >
                        <option value="Risque">Risque</option>
                        <option value="Opportunité">Opportunité</option>
                      </select>
                    ) : (
                      <div className="text-slate-900 text-sm">
                        {form.nature}
                      </div>
                    )}
                  </div>
                  {/* Statut éditable */}
                  <div>
                    <div className="text-slate-500 mb-0.5">Statut</div>
                    {editing ? (
                      <select
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={form.status}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            status: e.target.value,
                          }))
                        }
                      >
                        <option value="Ouvert">Ouvert</option>
                        <option value="En cours">En cours</option>
                        <option value="Traité">Traité</option>
                        <option value="Clos">Clos</option>
                        <option value="Accepté">Accepté</option>
                      </select>
                    ) : (
                      <div className="text-slate-900 text-sm">
                        {form.status}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-slate-500 mb-0.5">Catégorie</div>
                  {editing ? (
                    <select
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                      value={form.category}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                    >
                      <option value="">Sélectionner…</option>
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-slate-900 text-sm">
                      {form.category || "-"}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-slate-500 mb-0.5">Cause</div>
                  {editing ? (
                    <textarea
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs h-20"
                      value={form.cause}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          cause: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <div className="text-slate-900 text-sm whitespace-pre-wrap">
                      {form.cause || "-"}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-slate-500 mb-0.5">Commentaires</div>
                  {editing ? (
                    <textarea
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs h-20"
                      value={form.comments}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          comments: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <div className="text-slate-900 text-sm whitespace-pre-wrap">
                      {form.comments || "-"}
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite : évaluation & impact */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold text-slate-700 uppercase">
                    Évaluation & impact
                  </h3>
                  <span
                    className="text-[10px] text-slate-400"
                    title={
                      "Impact : mesure la gravité des conséquences sur le chiffre d’affaires, les coûts, la qualité ou l’image si le risque survient (1=impact limité, 4=impact majeur pour le projet ou l’entreprise).\n\n" +
                      "Probabilité : mesure la chance que le risque se produise (1=peu probable, 4=quasi certain). Combinez les deux pour positionner la criticité dans la matrice et orienter les priorités de traitement."
                    }
                  >
                    Aide impact / probabilité
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-500 mb-0.5">
                      Impact initial
                    </div>
                    {editing ? (
                      <select
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={form.initialImpact ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            initialImpact:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }))
                        }
                      >
                        <option value="">-</option>
                        {impactOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-slate-900 text-sm">
                        {form.initialImpact
                          ? impactOptions.find(
                              (o) => o.value === form.initialImpact
                            )?.label ?? form.initialImpact
                          : "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-0.5">
                      Probabilité initiale
                    </div>
                    {editing ? (
                      <select
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={form.initialProbability ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            initialProbability:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }))
                        }
                      >
                        <option value="">-</option>
                        {probabilityOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-slate-900 text-sm">
                        {form.initialProbability
                          ? probabilityOptions.find(
                              (o) => o.value === form.initialProbability
                            )?.label ?? form.initialProbability
                          : "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-0.5">
                      Impact mis à jour
                    </div>
                    {editing ? (
                      <select
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={form.updateImpact ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            updateImpact:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }))
                        }
                      >
                        <option value="">-</option>
                        {impactOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-slate-900 text-sm">
                        {form.updateImpact
                          ? impactOptions.find(
                              (o) => o.value === form.updateImpact
                            )?.label ?? form.updateImpact
                          : "-"}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-0.5">
                      Probabilité mise à jour
                    </div>
                    {editing ? (
                      <select
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={form.updateProbability ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            updateProbability:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }))
                        }
                      >
                        <option value="">-</option>
                        {probabilityOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-slate-900 text-sm">
                        {form.updateProbability
                          ? probabilityOptions.find(
                              (o) => o.value === form.updateProbability
                            )?.label ?? form.updateProbability
                          : "-"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-500 mb-0.5">
                      Impact potentiel (€)
                    </div>
                    {editing ? (
                      <input
                        type="number"
                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        value={form.initialPotentialImpact ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            initialPotentialImpact:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          }))
                        }
                      />
                    ) : (
                      <div className="text-slate-900 text-sm">
                        {formatCurrency(form.initialPotentialImpact)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-slate-500 mb-0.5">
                      Impact valorisé maj (€)
                    </div>
                    <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                      {formatCurrency(computedValuatedImpact)}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      Calcul automatique à partir de l’impact potentiel
                      et du niveau de criticité mis à jour.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        
        
        {activeTab === "actions" && (
        <div className="bg-white rounded-b-lg border border-slate-200 border-t-0 p-4 mt-0 text-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-slate-700 uppercase">
              Plan d’actions
            </h3>
            <button
              type="button"
              onClick={() => setCreatingAction(true)}
              className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-[11px]"
            >
              + Nouvelle action
            </button>
          </div>

          {loadingActions ? (
            <p className="text-slate-500 text-[11px]">Chargement des actions...</p>
          ) : actions.length === 0 ? (
            <p className="text-slate-500 text-[11px]">
              Aucune action définie pour ce risque / cette opportunité.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium">Action</th>
                    <th className="px-2 py-1 text-left font-medium">Responsable</th>
                    <th className="px-2 py-1 text-left font-medium">Échéance</th>
                    <th className="px-2 py-1 text-left font-medium">Priorité</th>
                    <th className="px-2 py-1 text-left font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actions.map((a) => (
                    <tr key={a.id}>
                      <td className="px-2 py-1">{a.title}</td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {a.owner || "-"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {a.dueDate || "-"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {a.priority || "-"}
                      </td>
                      <td className="px-2 py-1 whitespace-nowrap">
                        {a.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {creatingAction && (
            <div className="mt-4 border-t border-slate-200 pt-3 space-y-2">
              <div>
                <label className="block mb-1 text-slate-500">Intitulé *</label>
                <input
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                  value={newAction.title}
                  onChange={(e) =>
                    setNewAction((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1 text-slate-500">Responsable</label>
                  <input
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={newAction.owner}
                    onChange={(e) =>
                      setNewAction((prev) => ({ ...prev, owner: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Échéance</label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={newAction.dueDate}
                    onChange={(e) =>
                      setNewAction((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 text-slate-500">Priorité</label>
                  <select
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={newAction.priority}
                    onChange={(e) =>
                      setNewAction((prev) => ({
                        ...prev,
                        priority: e.target.value,
                      }))
                    }
                  >
                    <option value="Basse">Basse</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-[11px]"
                  onClick={() => setCreatingAction(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-[11px]"
                  onClick={handleCreateAction}
                >
                  Enregistrer l’action
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
