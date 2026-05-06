"use client";

import { useState, useMemo } from "react";
import type { Risk } from "@prisma/client";
import Link from "next/link";
import * as XLSX from "xlsx";

type Props = {
  projectId: number;
  projectNumber: string;
  projectTitle: string;
  projectStatus: string;
  projectRiskCriticality: string | null;
  initialRisks: Risk[];
};

const impactLabels = ["Faible", "Moyen", "Sérieux", "Majeur"];
const probabilityLabels = [
  "Improbable",
  "Possible",
  "Probable",
  "Très probable",
];

const criticityColors: Record<string, string> = {
  Négligeable: "bg-indigo-100 text-indigo-700 border border-indigo-200",
  Significatif: "bg-amber-100 text-amber-700 border border-amber-200",
  Critique: "bg-rose-100 text-rose-700 border border-rose-200",
  Inacceptable: "bg-red-100 text-red-700 border border-red-200",
  Motivant: "bg-lime-200 text-lime-700 border border-lime-200",
  "A ne pas rater": "bg-green-200 text-green-700 border border-green-200",
};

// mêmes couleurs que ProjectPageClient pour les statuts projet
const statusBadgeColors: Record<string, string> = {
  Planifié: "bg-indigo-100 text-indigo-700",
  "En cours": "bg-amber-100 text-amber-700",
  Terminé: "bg-emerald-100 text-emerald-700",
  Annulé: "bg-slate-100 text-slate-700",
};

// couleurs pour le statut du risque (tableau)
const riskStatusColors: Record<string, string> = {
  Ouvert: "bg-rose-100 text-rose-700 border border-rose-200",
  "En cours": "bg-amber-100 text-amber-700 border border-amber-200",
  Traité: "bg-sky-100 text-sky-700 border border-sky-200",
  Clos: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Accepté: "bg-slate-100 text-slate-700 border border-slate-200",
};

// badge catégorie : rouge si Risque, vert si Opportunité
const categoryBadgeClass = (nature: string | null | undefined) =>
  nature === "Opportunité"
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-rose-50 text-rose-700 border border-rose-200";

// Risques
function getLevelFromScore(score: number | null): string | null {
  if (score == null) return null;
  if (score <= 3) return "Négligeable";
  if (score <= 7) return "Significatif";
  if (score <= 11) return "Critique";
  return "Inacceptable";
}

// Opportunités
function getOpportunityLevel(score: number | null): string | null {
  if (score == null) return null;
  if (score <= 3) return "Négligeable";
  if (score <= 7) return "Significatif";
  if (score <= 11) return "Motivant";
  return "A ne pas rater";
}

type NewRiskForm = {
  title: string;
  nature: "Risque" | "Opportunité";
  category: string;
  impact: number | "";
  probability: number | "";
  cause: string;
};

// check‑list de risques par catégorie (pense‑mémoire)
const categorySuggestions: Record<string, string[]> = {
  Planning: [
    "Retard sur la disponibilité des prérequis (spécifications, données…).",
    "Dépendance forte à un autre projet en retard.",
    "Planning trop ambitieux par rapport à la capacité.",
    "Multiplication des interruptions et changements de priorités.",
    "Fenêtre de déploiement très contrainte (gel, blackout…).",
  ],
  Budget: [
    "Sous‑estimation des charges de développement.",
    "Coûts licences / infra plus élevés que prévu.",
    "Surcoût lié à la sous‑traitance ou aux intérimaires.",
    "Indexation ou inflation non prises en compte.",
    "Pénalités contractuelles en cas de retard.",
  ],
  Qualité: [
    "Taux de défauts élevé en recette ou en production.",
    "Non‑respect des exigences réglementaires.",
    "Spécifications incomplètes ou instables.",
    "Absence ou faiblesse des tests automatiques.",
    "Manque de processus de revue / validation.",
  ],
  Ressources: [
    "Disponibilité limitée des ressources clés.",
    "Turnover ou départ d’un expert critique.",
    "Compétences insuffisantes sur une technologie clé.",
    "Conflit de charge avec d’autres projets.",
    "Maladie longue durée ou absence prolongée.",
  ],
  Client: [
    "Décideurs peu disponibles pour arbitrage.",
    "Changements fréquents de priorités côté client.",
    "Résistance au changement des utilisateurs finaux.",
    "Communication insuffisante avec les parties prenantes.",
    "Conflits entre sponsors ou directions métiers.",
  ],
  Technique: [
    "Technologie nouvelle ou peu maîtrisée.",
    "Dépendance à un fournisseur ou API externe instable.",
    "Problèmes de performance ou de scalabilité.",
    "Complexité d’intégration avec le SI existant.",
    "Sécurité / cybersécurité insuffisamment adressée.",
  ],
  Contractuel: [
    "Clauses contractuelles ambiguës ou défavorables.",
    "Droits d’usage/licences mal cadrés.",
    "Risque de non‑conformité RGPD / juridique.",
    "Difficulté à faire évoluer le périmètre contractuel.",
    "Plan de réversibilité incomplet.",
  ],
  Sécurité: [
    "Non‑respect des règles HSE / sécurité physique.",
    "Données sensibles mal protégées.",
    "Accès trop larges aux environnements de prod.",
    "Absence de plan de continuité ou de reprise.",
    "Risque d’incident de sécurité majeur.",
  ],
  Autre: [
    "Risque d’image ou de réputation.",
    "Risque lié au contexte géopolitique / économique.",
    "Risque d’obsolescence rapide de la solution.",
  ],
};

export default function ProjectRisksClient({
  projectId,
  projectNumber,
  projectTitle,
  projectStatus,
  projectRiskCriticality,
  initialRisks,
}: Props) {
  const [risks, setRisks] = useState<Risk[]>(initialRisks);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [newRisk, setNewRisk] = useState<NewRiskForm>({
    title: "",
    nature: "Risque",
    category: "",
    impact: "",
    probability: "",
    cause: "",
  });

  // filtres tableau
  const [filterNature, setFilterNature] =
    useState<"all" | "Risque" | "Opportunité">("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  // ---- KPIs & matrices ----
  const {
    totalOpen,
    highRisks,
    opportunities,
    matrix,
    riskLevelCounts,
    opportunityLevelCounts,
    riskFinancialImpact,
    opportunityFinancialPotential,
    categoryHistogram,
  } = useMemo(() => {
    const open = risks.filter(
      (r) => r.status !== "Clos" && r.status !== "Accepté",
    );

    const high = open.filter((r) => {
      const level = (r.updateLevel ?? r.initialLevel) ?? null;
      return (
        r.nature !== "Opportunité" &&
        (level === "Critique" || level === "Inacceptable")
      );
    });

    const opp = open.filter((r) => r.nature === "Opportunité");

    const m: number[][] = Array.from({ length: 4 }, () =>
      Array(4).fill(0),
    );

    const riskCounts: Record<string, number> = {
      Négligeable: 0,
      Significatif: 0,
      Critique: 0,
      Inacceptable: 0,
    };

    const oppCounts: Record<string, number> = {
      Négligeable: 0,
      Significatif: 0,
      Motivant: 0,
      "A ne pas rater": 0,
    };

    let riskImpact = 0;
    let oppPotential = 0;

    const catCounts: Record<string, number> = {};

    for (const r of open) {
      const impact = (r.updateImpact ?? r.initialImpact) ?? null;
      const prob = (r.updateProbability ?? r.initialProbability) ?? null;
      const score = (r.updateScore ?? r.initialScore) ?? null;

      let level: string | null = null;
      if (r.nature === "Opportunité") {
        level =
          r.updateLevel ??
          r.initialLevel ??
          (score != null ? getOpportunityLevel(score) : null);
      } else {
        level =
          r.updateLevel ??
          r.initialLevel ??
          (score != null ? getLevelFromScore(score) : null);
      }

      if (
        r.nature !== "Opportunité" &&
        typeof impact === "number" &&
        impact >= 1 &&
        impact <= 4 &&
        typeof prob === "number" &&
        prob >= 1 &&
        prob <= 4
      ) {
        m[impact - 1][prob - 1] += 1;
      }

      if (
        r.nature !== "Opportunité" &&
        level &&
        riskCounts[level] !== undefined
      ) {
        riskCounts[level] += 1;
      }

      if (
        r.nature === "Opportunité" &&
        level &&
        oppCounts[level] !== undefined
      ) {
        oppCounts[level] += 1;
      }

      if (r.nature !== "Opportunité") {
        const valued =
          r.updateValuatedImpact ??
          r.initialValuatedImpact ??
          0;
        riskImpact += valued;

        const cat = r.category ?? "Non renseignée";
        catCounts[cat] = (catCounts[cat] ?? 0) + 1;
      }

      if (
        r.nature === "Opportunité" &&
        (level === "Motivant" || level === "A ne pas rater")
      ) {
        const valued =
          r.updateValuatedImpact ??
          r.initialValuatedImpact ??
          0;
        oppPotential += valued;
      }
    }

    return {
      totalOpen: open.length,
      highRisks: high.length,
      opportunities: opp.length,
      matrix: m,
      riskLevelCounts: riskCounts,
      opportunityLevelCounts: oppCounts,
      riskFinancialImpact: riskImpact,
      opportunityFinancialPotential: oppPotential,
      categoryHistogram: catCounts,
    };
  }, [risks]);

  // filtres pour le tableau + tri ID
  const filteredTableRisks = useMemo(() => {
    return risks
      .slice()
      .sort((a, b) => a.id - b.id)
      .filter((r) => {
        if (filterNature !== "all" && r.nature !== filterNature) return false;
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (
          filterCategory !== "all" &&
          (r.category ?? "Non renseignée") !== filterCategory
        ) {
          return false;
        }

        if (filterLevel !== "all") {
          const score = r.updateScore ?? r.initialScore ?? null;
          const level =
            r.nature === "Opportunité"
              ? r.updateLevel ?? getOpportunityLevel(score)
              : r.updateLevel ?? getLevelFromScore(score);
          if (level !== filterLevel) return false;
        }

        return true;
      });
  }, [risks, filterNature, filterStatus, filterCategory, filterLevel]);

  const statusBadgeClass =
    projectStatus && statusBadgeColors[projectStatus]
      ? statusBadgeColors[projectStatus]
      : "bg-slate-100 text-slate-700";

  const riskBadgeClass =
    projectRiskCriticality &&
    criticityColors[projectRiskCriticality]
      ? criticityColors[projectRiskCriticality]
      : "bg-slate-100 text-slate-700 border border-slate-200";

  // listes pour filtres tableau
  const allStatuses = Array.from(
    new Set(risks.map((r) => r.status ?? "Ouvert")),
  ).sort();
  const allCategories = Array.from(
    new Set(risks.map((r) => r.category ?? "Non renseignée")),
  ).sort();

  // ---- Création d'un nouveau risque / opportunité ----
  const handleCreateRisk = async () => {
    if (
      !newRisk.title.trim() ||
      !newRisk.category.trim() ||
      newRisk.impact === "" ||
      newRisk.probability === ""
    ) {
      setMessage(
        "Merci de renseigner au minimum l’intitulé, la catégorie, l’impact et la probabilité.",
      );
      return;
    }

    const impactNum = Number(newRisk.impact);
    const probNum = Number(newRisk.probability);

    if (
      !Number.isFinite(impactNum) ||
      impactNum < 1 ||
      impactNum > 4 ||
      !Number.isFinite(probNum) ||
      probNum < 1 ||
      probNum > 4
    ) {
      setMessage(
        "Impact et probabilité doivent être compris entre 1 et 4.",
      );
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRisk.title.trim(),
          nature: newRisk.nature,
          category: newRisk.category.trim(),
          initialImpact: impactNum,
          initialProbability: probNum,
          cause: newRisk.cause.trim() || null,
          status: "Ouvert",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(
          err?.error ?? "Erreur lors de la création du risque",
        );
      }

      const created = (await res.json()) as Risk;
      setRisks((prev) => [...prev, created]);

      setNewRisk({
        title: "",
        nature: "Risque",
        category: "",
        impact: "",
        probability: "",
        cause: "",
      });
      setCreating(false);
      setMessage("Risque / opportunité créé(e) avec succès.");
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Erreur inconnue lors de la création",
      );
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // ---- Export Excel ----
  const handleExportRisksToExcel = () => {
    if (risks.length === 0) return;

    const rows = risks.map((r) => ({
      "ID risque": r.id,
      Réf:
        r.ref ??
        `${projectNumber || "P"}-${
          r.nature === "Opportunité" ? "O" : "R"
        }-${r.id}`,
      Nature: r.nature ?? "",
      Intitulé: r.title,
      Catégorie: r.category ?? "",
      Statut: r.status ?? "",
      "Criticité initiale": r.initialLevel ?? "",
      "Criticité mise à jour": r.updateLevel ?? "",
      "Impact initial": r.initialImpact ?? "",
      "Probabilité initiale": r.initialProbability ?? "",
      "Impact maj": r.updateImpact ?? "",
      "Probabilité maj": r.updateProbability ?? "",
      "Impact potentiel initial (€)": r.initialPotentialImpact ?? "",
      "Impact valorisé initial (€)": r.initialValuatedImpact ?? "",
      "Impact potentiel maj (€)": r.updatePotentialImpact ?? "",
      "Impact valorisé maj (€)": r.updateValuatedImpact ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Risques projet");
    XLSX.writeFile(wb, `Risques_${projectNumber || projectId}.xlsx`);
  };

  // histogramme texte catégories
  const categoryEntries = Object.entries(categoryHistogram);
  const maxCategoryCount =
    categoryEntries.length > 0
      ? Math.max(...categoryEntries.map(([, v]) => v))
      : 0;

  // synthèse automatique à partir des KPIs
  const recommendations: string[] = [];
  if (highRisks > 0) {
    recommendations.push(
      "Présence de risques élevés : prévoir un point spécifique en comité et formaliser des actions de mitigation.",
    );
  } else if (totalOpen > 0) {
    recommendations.push(
      "Aucun risque critique identifié, mais poursuivre la mise à jour régulière des risques et des plans d’actions.",
    );
  }
  if (riskFinancialImpact > 0) {
    recommendations.push(
      "L’impact financier global des risques justifie de suivre les actions associées dans le plan d’actions.",
    );
  }
  if (opportunities > 0 && opportunityFinancialPotential > 0) {
    recommendations.push(
      "Des opportunités à fort potentiel existent : vérifier qu’elles sont bien intégrées dans le plan de valorisation.",
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "Aucun risque ouvert : rester vigilant et revoir périodiquement le registre des risques.",
    );
  }

  const statusBadgeClassForRisk = (status: string | null) =>
    (status && riskStatusColors[status]) ||
    "bg-slate-50 text-slate-700 border border-slate-200";

  return (
    <div className="space-y-4 relative">
      {/* Bandeau haut local */}
      <div className="flex items-start justify-between mb-2 text-xs text-slate-500">
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">
            {projectNumber || "Projet"} – {projectTitle || ""}
          </span>
          <span>Vue Risques & opportunités (projet)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass}`}
          >
            {projectStatus}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${riskBadgeClass}`}
          >
            {projectRiskCriticality ?? "Criticité non renseignée"}
          </span>
        </div>
      </div>

      {/* Lien retour fiche projet + boutons */}
      <div className="mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
          >
            ← Retour fiche projet
          </Link>

          <button
            type="button"
            onClick={handleExportRisksToExcel}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Export Excel
          </button>

          <Link
            href="/risks-opportunities"
            className="px-3 py-1.5 rounded-md border border-indigo-200 bg-indigo-50 text-xs text-indigo-700 hover:bg-indigo-100"
          >
            Vue globale risques
          </Link>

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white"
          >
            + Nouveau risque / opportunité
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/Tutoriel/projelys-risk-XXXX-tutorial.html"
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

      {/* 5 cartes KPI : 3 risques + 2 opportunités */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Risques & opp ouverts */}
        <div className="rounded-lg shadow-sm p-4 border bg-indigo-50 text-indigo-700">
          <div className="text-[11px] text-slate-600">
            Risques & opportunités ouverts
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {totalOpen}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Tous statuts sauf Clos / Accepté.
          </div>
        </div>

        {/* Risques élevés */}
        <div className="rounded-lg shadow-sm p-4 border bg-rose-50 text-rose-700 border-rose-200">
          <div className="text-[11px]">Risques élevés</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {highRisks}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Critique ou Inacceptable (hors opportunités).
          </div>
        </div>

        {/* Répartition criticité risques */}
        <div className="rounded-lg shadow-sm p-4 border bg-slate-50 text-slate-700">
          <div className="text-[11px] mb-1">Répartition risques</div>
          <div className="mt-1 text-sm space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Négligeable</span>
              <span>{riskLevelCounts["Négligeable"]}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Significatif</span>
              <span>{riskLevelCounts["Significatif"]}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Critique</span>
              <span>{riskLevelCounts["Critique"]}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Inacceptable</span>
              <span>{riskLevelCounts["Inacceptable"]}</span>
            </div>
          </div>
        </div>

        {/* Compteur opportunités */}
        <div className="rounded-lg shadow-sm p-4 border bg-emerald-50 text-emerald-700 border-emerald-200">
          <div className="text-[11px]">Opportunités</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {opportunities}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Nature = Opportunité.
          </div>
        </div>

        {/* Répartition opportunités */}
        <div className="rounded-lg shadow-sm p-4 border bg-slate-50 text-slate-700">
          <div className="text-[11px] mb-1">Répartition opportunités</div>
          <div className="mt-1 text-sm space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Négligeable</span>
              <span>{opportunityLevelCounts["Négligeable"]}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Significatif</span>
              <span>{opportunityLevelCounts["Significatif"]}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Motivant</span>
              <span>{opportunityLevelCounts["Motivant"]}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>A ne pas rater</span>
              <span>{opportunityLevelCounts["A ne pas rater"]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matrice + synthèse */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Matrice des risques (impact × probabilité)
          </h2>
          {message && (
            <div className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
              {message}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <div className="inline-block rounded-lg border border-slate-300 overflow-hidden bg-slate-50">
              {/* Header probabilité */}
              <div className="grid grid-cols-5 min-w-[700px]">
                <div className="bg-slate-100 border-b border-slate-300 flex items-center justify-center text-[11px] font-semibold">
                  Impact \ Probabilité
                </div>
                {probabilityLabels.map((label) => (
                  <div
                    key={label}
                    className="bg-slate-100 border-b border-l border-slate-300 flex items-center justify-center py-1 text-[11px] font-semibold"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* 4 lignes impact */}
              {impactLabels.map((impactLabel, i) => (
                <div
                  key={impactLabel}
                  className="grid grid-cols-5 min-w-[700px]"
                >
                  {/* Libellé impact */}
                  <div className="bg-slate-100 border-t border-slate-300 flex items-center justify-center px-2 text-[11px] font-semibold">
                    {impactLabel}
                  </div>

                  {/* 4 cellules */}
                  {probabilityLabels.map((_, j) => {
                    const count = matrix[i][j];
                    const score = (i + 1) * (j + 1);
                    const level = getLevelFromScore(score);

                    let bg =
                      "bg-emerald-50 text-emerald-700 border border-emerald-100";
                    if (level === "Significatif") {
                      bg =
                        "bg-sky-50 text-sky-700 border border-sky-100";
                    } else if (level === "Critique") {
                      bg =
                        "bg-amber-50 text-amber-700 border border-amber-100";
                    } else if (level === "Inacceptable") {
                      bg =
                        "bg-rose-50 text-rose-700 border border-rose-100";
                    }

                    return (
                      <button
                        key={`${i}-${j}`}
                        type="button"
                        className={`flex flex-col items-center justify-center py-2 border-l border-t ${bg} hover:ring-2 hover:ring-indigo-400/60 focus:outline-none`}
                        onClick={() => {
                          setMessage(
                            `Cellule impact ${impactLabels[i]} / probabilité ${probabilityLabels[j]} (score ${score}).`,
                          );
                        }}
                      >
                        <span className="text-base font-semibold leading-none">
                          {count}
                        </span>
                        <span className="text-[9px] opacity-80 mt-0.5">
                          {level ?? ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Synthèse & recommandations à partir de la matrice / KPIs */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Synthèse & recommandations
          </h2>
          <div className="text-xs text-slate-600 space-y-1 mb-2">
            <div>
              <span className="font-semibold">
                {totalOpen}{" "}
              </span>
              risques & opportunités ouverts, dont{" "}
              <span className="font-semibold">{highRisks}</span>{" "}
              risque(s) critique(s) ou inacceptable(s).
            </div>
            <div>
              Impact financier risques&nbsp;:
              <span className="font-semibold">
                {" "}
                {riskFinancialImpact.toLocaleString("fr-FR")} €
              </span>
              .
            </div>
            <div>
              Potentiel financier opportunités&nbsp;:
              <span className="font-semibold text-emerald-700">
                {" "}
                {opportunityFinancialPotential.toLocaleString("fr-FR")} €
              </span>
              .
            </div>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Zone KPIs complémentaires (financiers, graphiques...) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg shadow-sm p-4 border bg-white text-slate-700">
          <div className="text-[11px] mb-1">
            Impact financier risques
          </div>
          <div className="text-xl font-semibold text-slate-900">
            {riskFinancialImpact.toLocaleString("fr-FR")} €
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Somme des impacts valorisés (maj ou initial) des risques
            ouverts.
          </div>
        </div>
        <div className="rounded-lg shadow-sm p-4 border bg-white text-slate-700">
          <div className="text-[11px] mb-1">
            Potentiel financier opportunités
          </div>
          <div className="text-xl font-semibold text-emerald-700">
            {opportunityFinancialPotential.toLocaleString("fr-FR")} €
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Somme des impacts valorisés des opportunités ouvertes de
            niveau « Motivant » ou « À ne pas rater ».
          </div>
        </div>
        <div className="rounded-lg shadow-sm p-4 border bg-white text-slate-700">
          <div className="text-[11px] mb-1">
            Graphiques par catégorie
          </div>
          {categoryEntries.length === 0 ? (
            <div className="text-sm text-slate-500">
              Aucun risque / opportunité ouvert pour le moment.
            </div>
          ) : (
            <div className="space-y-1 text-[11px]">
              {categoryEntries.map(([cat, count]) => {
                const ratio =
                  maxCategoryCount > 0
                    ? (count / maxCategoryCount) * 100
                    : 0;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="w-28 truncate">{cat}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-2 bg-indigo-400"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[11px]">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 text-[10px] text-slate-400">
            Histogramme des risques & opportunités ouverts
            par catégorie.
          </div>
        </div>
      </div>

      {/* Tableau des risques + opportunités */}
      <div className="mt-4 bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Liste des risques & opportunités du projet
          </h2>
          <span className="text-[11px] text-slate-500">
            {filteredTableRisks.length} enregistrement(s) filtré(s) /{" "}
            {risks.length} au total
          </span>
        </div>

        {/* filtres tableau */}
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="text-slate-600">Nature :</span>
            <select
              value={filterNature}
              onChange={(e) =>
                setFilterNature(
                  e.target.value as "all" | "Risque" | "Opportunité",
                )
              }
              className="border border-slate-300 rounded-md px-2 py-1 bg-white"
            >
              <option value="all">Toutes</option>
              <option value="Risque">Risques</option>
              <option value="Opportunité">Opportunités</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-600">Statut :</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 bg-white"
            >
              <option value="all">Tous</option>
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-600">Catégorie :</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 bg-white"
            >
              <option value="all">Toutes</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-600">Criticité :</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="border border-slate-300 rounded-md px-2 py-1 bg-white"
            >
              <option value="all">Toutes</option>
              <option value="Négligeable">Négligeable</option>
              <option value="Significatif">Significatif</option>
              <option value="Critique">Critique</option>
              <option value="Inacceptable">Inacceptable</option>
              <option value="Motivant">Motivant</option>
              <option value="A ne pas rater">A ne pas rater</option>
            </select>
          </div>
        </div>

        {/* tableau scrollable avec entête figée */}
        <div className="overflow-x-auto">
          <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-md">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Réf</th>
                  <th className="px-3 py-2 text-left font-medium">
                    Nature
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Intitulé
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Catégorie
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Statut
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Criticité / priorité
                  </th>
                  <th className="px-3 py-2 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredTableRisks.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      Aucun risque pour l’instant avec ces filtres.
                    </td>
                  </tr>
                )}
                {filteredTableRisks.map((r) => {
                  const score = r.updateScore ?? r.initialScore ?? null;

                  let level: string | null = null;
                  if (r.nature === "Opportunité") {
                    level =
                      r.updateLevel ?? getOpportunityLevel(score);
                  } else {
                    level = r.updateLevel ?? getLevelFromScore(score);
                  }

                  const levelClass =
                    (level && criticityColors[level]) ||
                    "bg-slate-50 text-slate-700 border border-slate-100";

                  const refAuto = `${projectNumber || "P"}-${
                    r.nature === "Opportunité" ? "O" : "R"
                  }-${r.id}`;

                  return (
                    <tr key={r.id}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {r.id}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {r.ref ?? refAuto}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryBadgeClass(
      r.nature,
    )}`}
  >
    {r.nature ?? "Risque"}
  </span>
</td>

                      <td className="px-3 py-2">{r.title}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryBadgeClass(
                            r.nature,
                          )}`}
                        >
                          {r.category ?? "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClassForRisk(
                            r.status ?? "Ouvert",
                          )}`}
                        >
                          {r.status ?? "Ouvert"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${levelClass}`}
                        >
                          {level ?? "N/A"}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap flex gap-2">
                        <Link
                          href={`/projects/${projectId}/risks/${r.id}`}
                          className="text-[11px] text-indigo-600 hover:underline"
                        >
                          Fiche risque
                        </Link>
                        <Link
                          href={`/actions?riskId=${r.id}`}
                          className="text-[11px] text-sky-600 hover:underline"
                        >
                          Plan d’actions
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Panneau création risque + check‑list */}
      {creating && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20">
          <div className="w-full max-w-3xl h-full bg-white shadow-xl border-l border-slate-200 grid grid-cols-1 md:grid-cols-3">
            {/* formulaire */}
            <div className="md:col-span-2 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Nouveau risque / opportunité
                </h2>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  ✕ Fermer
                </button>
              </div>
              <div className="p-4 space-y-3 text-xs overflow-auto">
                <div>
                  <label className="block text-slate-500 mb-1">
                    Intitulé *
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                    value={newRisk.title}
                    onChange={(e) =>
                      setNewRisk((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">
                      Nature *
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                      value={newRisk.nature}
                      onChange={(e) =>
                        setNewRisk((prev) => ({
                          ...prev,
                          nature: e.target
                            .value as NewRiskForm["nature"],
                        }))
                      }
                    >
                      <option value="Risque">Risque</option>
                      <option value="Opportunité">Opportunité</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">
                      Catégorie *
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                      value={newRisk.category}
                      onChange={(e) =>
                        setNewRisk((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                    >
                      <option value="">Sélectionner</option>
                      <option value="Planning">
                        Planning / délais
                      </option>
                      <option value="Budget">Budget / coûts</option>
                      <option value="Qualité">
                        Qualité / performance
                      </option>
                      <option value="Ressources">
                        Ressources / capacité
                      </option>
                      <option value="Client">
                        Client / parties prenantes
                      </option>
                      <option value="Technique">
                        Technique / solution
                      </option>
                      <option value="Contractuel">
                        Contractuel / juridique
                      </option>
                      <option value="Sécurité">
                        Sécurité / conformité
                      </option>
                      <option value="Autre">
                        Autre (spécifier dans la cause)
                      </option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">
                      Impact *
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                      value={newRisk.impact}
                      onChange={(e) =>
                        setNewRisk((prev) => ({
                          ...prev,
                          impact:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        }))
                      }
                    >
                      <option value="">Sélectionner</option>
                      <option value={1}>1 - Faible</option>
                      <option value={2}>2 - Moyen</option>
                      <option value={3}>3 - Sérieux</option>
                      <option value={4}>4 - Majeur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">
                      Probabilité *
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                      value={newRisk.probability}
                      onChange={(e) =>
                        setNewRisk((prev) => ({
                          ...prev,
                          probability:
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                        }))
                      }
                    >
                      <option value="">Sélectionner</option>
                      <option value={1}>1 - Improbable</option>
                      <option value={2}>2 - Possible</option>
                      <option value={3}>3 - Probable</option>
                      <option value={4}>4 - Très probable</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">
                    Cause (résumé)
                  </label>
                  <textarea
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs h-20"
                    value={newRisk.cause}
                    onChange={(e) =>
                      setNewRisk((prev) => ({
                        ...prev,
                        cause: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCreateRisk}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-xs text-white disabled:opacity-60"
                >
                  {saving ? "Création..." : "Créer"}
                </button>
              </div>
            </div>

            {/* pense‑mémoire */}
            <div className="flex-1 overflow-auto border-l border-slate-200 bg-slate-50 flex flex-col">
              <div className="px-3 py-2 border-b border-slate-200 text-[11px] font-semibold text-slate-800">
                Check‑list de risques par catégorie
              </div>
              <div className="flex-1 overflow-auto p-3 space-y-3 text-[11px]">
                {Object.entries(categorySuggestions).map(
                  ([cat, items]) => {
                    const suggestedTitle = `Risque ${cat.toLowerCase()} : ${
                      items[0] ?? ""
                    }`;

                    return (
                      <div
                        key={cat}
                        className="bg-white border border-slate-200 rounded-md p-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-slate-800">
                            {cat}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-[10px] text-indigo-600 hover:underline"
                              onClick={() =>
                                setNewRisk((prev) => ({
                                  ...prev,
                                  category: cat,
                                }))
                              }
                            >
                              Utiliser
                            </button>
                            <button
                              type="button"
                              className="text-[10px] text-sky-600 hover:underline"
                              onClick={() =>
                                setNewRisk((prev) => ({
                                  ...prev,
                                  category: cat,
                                  title:
                                    prev.title &&
                                    !prev.title.startsWith(
                                      "Risque",
                                    )
                                      ? prev.title
                                      : suggestedTitle,
                                }))
                              }
                            >
                              Proposer un intitulé
                            </button>
                          </div>
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                          {items.map((text) => (
                            <li
                              key={text}
                              className="cursor-pointer hover:text-indigo-700"
                              onClick={() =>
                                setNewRisk((prev) => ({
                                  ...prev,
                                  category: cat,
                                  cause: prev.cause
                                    ? `${prev.cause}\n${text}`
                                    : text,
                                }))
                              }
                            >
                              {text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
