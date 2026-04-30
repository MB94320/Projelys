"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type RiskWithProject = any; // à typer plus tard avec Prisma

const riskLevelOrder = [
  "Négligeable",
  "Significatif",
  "Critique",
  "Inacceptable",
];

const opportunityLevelOrder = [
  "Négligeable",
  "Motivant",
  "A ne pas rater",
];

const probabilityOrder = [
  "Improbable",
  "Possible",
  "Probable",
  "Très probable",
];

const impactOrder = ["Faible", "Moyen", "Sérieux", "Majeur"];

// matrice de référence 4x4 (impact x probabilité)
const defaultLevelMatrix: Record<string, string> = {
  "Faible__Improbable": "Négligeable",
  "Faible__Possible": "Négligeable",
  "Faible__Probable": "Négligeable",
  "Faible__Très probable": "Significatif",

  "Moyen__Improbable": "Négligeable",
  "Moyen__Possible": "Significatif",
  "Moyen__Probable": "Significatif",
  "Moyen__Très probable": "Critique",

  "Sérieux__Improbable": "Négligeable",
  "Sérieux__Possible": "Significatif",
  "Sérieux__Probable": "Critique",
  "Sérieux__Très probable": "Inacceptable",

  "Majeur__Improbable": "Significatif",
  "Majeur__Possible": "Critique",
  "Majeur__Probable": "Inacceptable",
  "Majeur__Très probable": "Inacceptable",
};

type MatrixCell = { count: number; level: string | null };

// mapping codes 1–4 -> libellés de la matrice
const impactMap: Record<number, string> = {
  1: "Faible",
  2: "Moyen",
  3: "Sérieux",
  4: "Majeur",
};

const probMap: Record<number, string> = {
  1: "Improbable",
  2: "Possible",
  3: "Probable",
  4: "Très probable",
};

// couleurs barres statuts (aligné avec Actions)
const riskStatusBarColors: Record<string, string> = {
  Ouvert: "bg-rose-400",
  "En cours": "bg-amber-400",
  Traité: "bg-sky-400",
  Clos: "bg-emerald-400",
  Accepté: "bg-slate-400",
  "Non renseigné": "bg-slate-300",
};

// normalisation des libellés venant de la base
function normalizeImpact(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return impactMap[value] ?? null;
  }

  const v = String(value).trim().toLowerCase();
  if (v.startsWith("faible")) return "Faible";
  if (v.startsWith("moyen")) return "Moyen";
  if (v.startsWith("serieux") || v.startsWith("sérieux")) return "Sérieux";
  if (v.startsWith("majeur")) return "Majeur";
  return null;
}

function normalizeProb(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return probMap[value] ?? null;
  }

  const v = String(value).trim().toLowerCase();
  if (v.startsWith("improb")) return "Improbable";
  if (v.startsWith("possib")) return "Possible";
  if (v.startsWith("probab")) return "Probable";
  if (v.startsWith("très prob") || v.startsWith("tres prob"))
    return "Très probable";
  return null;
}

type GlobalRisksClientProps = {
  risks: RiskWithProject[];
};

export default function GlobalRisksClient({ risks }: GlobalRisksClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // valeurs initiales des filtres lues dans l’URL
  const initialNature =
    (searchParams.get("nature") as "all" | "risks" | "opportunities") ??
    "all";

  const initialProject =
    searchParams.get("projectId") !== null
      ? Number(searchParams.get("projectId"))
      : "all";

  const initialPm = searchParams.get("pm") ?? "all";

  const [natureFilter, setNatureFilter] = useState<
    "all" | "risks" | "opportunities"
  >(initialNature);

  const [projectFilter, setProjectFilter] = useState<number | "all">(
    initialProject,
  );

  const [pmFilter, setPmFilter] = useState<string | "all">(
    initialPm === "all" ? "all" : initialPm,
  );

  // filtres KPI interactifs
  const [kpiCategoryFilter, setKpiCategoryFilter] = useState<string | null>(
    null,
  );
  const [kpiStatusFilter, setKpiStatusFilter] = useState<string | null>(null);
  const [kpiLevelFilter, setKpiLevelFilter] = useState<string | null>(null);

  const all = risks ?? [];

  // helper URL
  const updateSearchParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?");
  };

  const handleNatureChange = (
    value: "all" | "risks" | "opportunities",
  ) => {
    setNatureFilter(value);
    updateSearchParam("nature", value === "all" ? null : value);
  };

  const handleProjectChange = (value: string) => {
    const next = value === "all" ? "all" : Number(value);
    setProjectFilter(next);
    updateSearchParam(
      "projectId",
      next === "all" ? null : String(next),
    );
  };

  const handlePmChange = (value: string) => {
    const next = value === "all" ? "all" : value;
    setPmFilter(next);
    updateSearchParam("pm", next === "all" ? null : next);
  };

  // Options de filtres
  const projectOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const r of all) {
      if (!r.projectId || !r.project) continue;
      const label =
        r.project.projectNumber ??
        r.project.titleProject ??
        `Projet #${r.projectId}`;
      map.set(r.projectId, label);
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [all]);

  const pmOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of all) {
      const pm = r.project?.projectManagerName;
      if (pm) set.add(pm);
    }
    return Array.from(set).sort();
  }, [all]);

  // Jeu filtré
  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (natureFilter === "risks" && r.nature !== "Risque") return false;
      if (
        natureFilter === "opportunities" &&
        r.nature !== "Opportunité"
      )
        return false;
      if (projectFilter !== "all" && r.projectId !== projectFilter)
        return false;
      if (
        pmFilter !== "all" &&
        r.project?.projectManagerName !== pmFilter
      )
        return false;

      if (kpiCategoryFilter && r.category !== kpiCategoryFilter)
        return false;
      if (
        kpiStatusFilter &&
        (r.status ?? "Non renseigné") !== kpiStatusFilter
      )
        return false;
      if (
        kpiLevelFilter &&
        (r.updateLevel ?? r.initialLevel ?? "Non défini") !==
          kpiLevelFilter
      )
        return false;

      return true;
    });
  }, [
    all,
    natureFilter,
    projectFilter,
    pmFilter,
    kpiCategoryFilter,
    kpiStatusFilter,
    kpiLevelFilter,
  ]);

  // Séparation risques / opportunités
  const onlyRisks = filtered.filter((r) => r.nature === "Risque");
  const onlyOpp = filtered.filter((r) => r.nature === "Opportunité");

  const totalRisks = onlyRisks.length;
  const totalOpp = onlyOpp.length;

  // Répartition par catégorie (risques uniquement)
  const riskCategoryCounts: Record<string, number> = {};
  for (const r of onlyRisks) {
    const cat = r.category ?? "Non renseignée";
    riskCategoryCounts[cat] = (riskCategoryCounts[cat] ?? 0) + 1;
  }
  const categoryEntries = Object.entries(riskCategoryCounts).sort(
    (a, b) => b[1] - a[1],
  );
  const maxCategoryCount =
    categoryEntries.length > 0
      ? Math.max(...categoryEntries.map(([, v]) => v))
      : 0;
  const totalCategoryCount = categoryEntries.reduce(
    (s, [, v]) => s + v,
    0,
  );
  const paretoPoints = categoryEntries.map(([cat, count], idx) => {
    const cum = categoryEntries
      .slice(0, idx + 1)
      .reduce((s, [, v]) => s + v, 0);
    const cumPct = totalCategoryCount
      ? (cum / totalCategoryCount) * 100
      : 0;
    return { cat, count, cumPct };
  });

  // Répartition par statut (risques uniquement)
  const riskStatusCounts: Record<string, number> = {};
  for (const r of onlyRisks) {
    const st = r.status ?? "Non renseigné";
    riskStatusCounts[st] = (riskStatusCounts[st] ?? 0) + 1;
  }
  const riskStatusOrder: string[] = [
    "Ouvert",
    "En cours",
    "Traité",
    "Clos",
    "Accepté",
  ];

  const totalRiskStatus = riskStatusOrder.reduce(
    (sum, st) => sum + (riskStatusCounts[st] ?? 0),
    0,
  );

  const highRisks = onlyRisks.filter((r) => {
    const lvl = r.updateLevel ?? r.initialLevel ?? null;
    return lvl === "Critique" || lvl === "Inacceptable";
  }).length;

  const oppMotivant = onlyOpp.filter(
    (o) => (o.updateLevel ?? o.initialLevel) === "Motivant",
  ).length;
  const oppANePasRater = onlyOpp.filter(
    (o) => (o.updateLevel ?? o.initialLevel) === "A ne pas rater",
  ).length;

  // Impacts globaux
  const totalPotentialImpact = onlyRisks.reduce(
    (s, r) =>
      s +
      (r.updatePotentialImpact ??
        r.initialPotentialImpact ??
        0),
    0,
  );
  const totalValuatedImpact = onlyRisks.reduce(
    (s, r) =>
      s +
      (r.updateValuatedImpact ??
        r.initialValuatedImpact ??
        0),
    0,
  );

  // Répartition risques
  const levelCounts: Record<string, number> = {};
  for (const r of onlyRisks) {
    const lvl = r.updateLevel ?? r.initialLevel ?? "Non défini";
    levelCounts[lvl] = (levelCounts[lvl] ?? 0) + 1;
  }

  // Répartition opportunités
  const oppLevelCounts: Record<string, number> = {};
  for (const o of onlyOpp) {
    const lvl = o.updateLevel ?? o.initialLevel ?? "Non défini";
    oppLevelCounts[lvl] = (oppLevelCounts[lvl] ?? 0) + 1;
  }

  const totalRiskLevels = Object.values(levelCounts).reduce(
    (s, v) => s + v,
    0,
  );
  const totalOppLevels = Object.values(oppLevelCounts).reduce(
    (s, v) => s + v,
    0,
  );

  // Matrice globale (compte + criticité dominante)
  const matrix: Record<string, MatrixCell> = {};
  for (const r of onlyRisks) {
    const impactRaw = r.updateImpact ?? r.initialImpact;
    const probRaw = r.updateProbability ?? r.initialProbability;

    const impact = normalizeImpact(impactRaw);
    const prob = normalizeProb(probRaw);
    if (!impact || !prob) continue;

    const key = `${impact}__${prob}`;
    const level = r.updateLevel ?? r.initialLevel ?? null;

    if (!matrix[key]) {
      matrix[key] = { count: 0, level };
    }
    matrix[key].count += 1;

    if (level && matrix[key].level) {
      const idxNew = riskLevelOrder.indexOf(level);
      const idxOld = riskLevelOrder.indexOf(matrix[key].level!);
      if (idxNew > idxOld) matrix[key].level = level;
    } else if (level && !matrix[key].level) {
      matrix[key].level = level;
    }
  }

  // KPIs par projet
  const perProject: Record<
    number,
    {
      id: number;
      label: string;
      risks: number;
      highRisks: number;
      opportunities: number;
    }
  > = {};

  for (const r of all) {
    if (!r.projectId || !r.project) continue;
    if (!perProject[r.projectId]) {
      perProject[r.projectId] = {
        id: r.project.id,
        label:
          r.project.projectNumber ??
          r.project.titleProject ??
          `Projet #${r.projectId}`,
        risks: 0,
        highRisks: 0,
        opportunities: 0,
      };
    }
  }

  for (const r of filtered) {
    if (!r.projectId || !r.project) continue;
    const slot = perProject[r.projectId];
    if (!slot) continue;
    if (r.nature === "Risque") {
      slot.risks += 1;
      const lvl = r.updateLevel ?? r.initialLevel ?? null;
      if (lvl === "Critique" || lvl === "Inacceptable") {
        slot.highRisks += 1;
      }
    } else if (r.nature === "Opportunité") {
      slot.opportunities += 1;
    }
  }

  const projectCards = Object.values(perProject).sort((a, b) =>
    b.highRisks !== a.highRisks
      ? b.highRisks - a.highRisks
      : b.risks - a.risks,
  );

  const maxStatusCount = Math.max(
    1,
    ...riskStatusOrder.map((st) => riskStatusCounts[st] ?? 0),
  );

  return (
    <>
      {/* Bandeau haut */}
      <div className="mb-4 flex items-center justify_between text-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/projects"
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
          >
            ← Retour au portefeuille
          </Link>
        </div>
      </div>

      {/* Filtres rapides */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1">
          <span className="text-slate-600">Nature :</span>
          <select
            value={natureFilter}
            onChange={(e) =>
              handleNatureChange(
                e.target.value as "all" | "risks" | "opportunities",
              )
            }
            className="border border-slate-300 rounded-md px-2 py-1 text-[11px] bg-white"
          >
            <option value="all">Risques & opportunités</option>
            <option value="risks">Risques uniquement</option>
            <option value="opportunities">
              Opportunités uniquement
            </option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-600">Projet :</span>
          <select
            value={projectFilter === "all" ? "all" : String(projectFilter)}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-[11px] bg-white"
          >
            <option value="all">Tous</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-slate-600">Chef de projet :</span>
          <select
            value={pmFilter === "all" ? "all" : pmFilter}
            onChange={(e) => handlePmChange(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-[11px] bg-white"
          >
            <option value="all">Tous</option>
            {pmOptions.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPIs globaux */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Synthèse risques
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Nombre de risques
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {totalRisks}
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Risques critiques
              </div>
              <div className="text-sm font-semibold text-rose-700">
                {highRisks}
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Impact potentiel total
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {totalPotentialImpact.toLocaleString("fr-FR")} €
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-2">
              <div className="text-[10px] text-slate-500">
                Impact valorisé total
              </div>
              <div className="text-sm font-semibold text-slate-800">
                {totalValuatedImpact.toLocaleString("fr-FR")} €
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Les impacts sont calculés à partir des valeurs mises à jour
            quand elles existent, sinon à partir des valeurs initiales.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-emerald-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Synthèse opportunités
          </h2>
          <div className="flex flex-col gap-2 text-xs">
            <div className="bg-emerald-50 rounded-md p-2">
              <div className="text-[10px] text-emerald-700">
                Nombre d’opportunités
              </div>
              <div className="text-sm font-semibold text-emerald-800">
                {totalOpp}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-md p-2">
              <div className="text-[10px] text-emerald-700">
                Motivantes
              </div>
              <div className="text-sm font-semibold text-emerald-800">
                {oppMotivant}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-md p-2">
              <div className="text-[10px] text-emerald-700">
                À ne pas rater
              </div>
              <div className="text-sm font-semibold text-emerald-800">
                {oppANePasRater}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Les opportunités prises en compte sont : « Motivant » et
            « À ne pas rater ».
          </p>
        </div>

        {/* Répartition criticité risques */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Répartition des risques
          </h2>
          <div className="mt-1 h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {riskLevelOrder.map((lvl) => {
              const count = levelCounts[lvl] ?? 0;
              if (!totalRiskLevels || count === 0) return null;
              const width = (count / totalRiskLevels) * 100;
              const cls =
                lvl === "Négligeable"
                  ? "bg-emerald-400"
                  : lvl === "Significatif"
                  ? "bg-amber-400"
                  : lvl === "Critique"
                  ? "bg-rose-400"
                  : "bg-red-500";
              return (
                <div
                  key={lvl}
                  className={`h-full ${cls}`}
                  style={{ width: `${width}%` }}
                  title={`${lvl} : ${count}`}
                />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            {riskLevelOrder.map((lvl) => (
              <div
                key={lvl}
                className={`flex items-center gap-2 cursor-pointer ${
                  kpiLevelFilter === lvl
                    ? "bg-indigo-50 rounded px-1"
                    : ""
                }`}
                onClick={() =>
                  setKpiLevelFilter(
                    kpiLevelFilter === lvl ? null : lvl,
                  )
                }
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    lvl === "Négligeable"
                      ? "bg-emerald-400"
                      : lvl === "Significatif"
                      ? "bg-amber-400"
                      : lvl === "Critique"
                      ? "bg-rose-400"
                      : "bg-red-500"
                  }`}
                />
                <span className="truncate">{lvl}</span>
                <span className="ml-auto font-medium">
                  {levelCounts[lvl] ?? 0}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Vue consolidée de l’ensemble des risques sur l'ensemble des
            projets.
          </p>
          <button
            type="button"
            onClick={() => setKpiLevelFilter(null)}
            className="mt-1 text-[10px] text-indigo-600 hover:underline"
          >
            Réinitialiser le filtre de niveau
          </button>
        </div>

        {/* Répartition niveaux opportunités */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Répartition des opportunités
          </h2>
          <div className="mt-1 h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {opportunityLevelOrder.map((lvl) => {
              const count = oppLevelCounts[lvl] ?? 0;
              if (!totalOppLevels || count === 0) return null;
              const width = (count / totalOppLevels) * 100;
              const cls =
                lvl === "Motivant"
                  ? "bg-sky-400"
                  : lvl === "A ne pas rater"
                  ? "bg-emerald-500"
                  : "bg-emerald-300";
              return (
                <div
                  key={lvl}
                  className={`h-full ${cls}`}
                  style={{ width: `${width}%` }}
                  title={`${lvl} : ${count}`}
                />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            {opportunityLevelOrder.map((lvl) => (
              <div key={lvl} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    lvl === "Motivant"
                      ? "bg-sky-400"
                      : lvl === "A ne pas rater"
                      ? "bg-emerald-500"
                      : "bg-emerald-300"
                  }`}
                />
                <span className="truncate">{lvl}</span>
                <span className="ml-auto font-medium">
                  {oppLevelCounts[lvl] ?? 0}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-500">
            Vue globale des niveaux d'opportunités sur l’ensemble des
            projets.
          </p>
        </div>
      </div>

      {/* Bloc histogramme catégories + statuts */}
      <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Histogramme vertical par catégorie*/}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Répartition des risques par catégorie
          </h2>
          {categoryEntries.length === 0 ? (
            <div className="text-[11px] text-slate-500">
              Aucun risque avec les filtres actuels.
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <div className="flex flex-1 items-end">
                  <div className="flex flex-col justify-between text-[10px] text-slate-400 pr-2 h-40">
                    <span>{maxCategoryCount}</span>
                    <span>0</span>
                  </div>

                  <div className="relative flex-1 h-40 overflow-hidden">
                    <div className="absolute left-0 right-0 bottom-0 h-px bg-slate-300" />
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-300" />

                    <div className="absolute inset-x-4 bottom-0 top-0 flex items-end gap-4 pb-0">
                      {paretoPoints.map((item) => {
                      const heightPct = maxCategoryCount
                        ? (item.count / maxCategoryCount) * 100
                        : 0;
                      const active = kpiCategoryFilter === item.cat;

                      const catLower = item.cat.toLowerCase();

                      let barColor = "bg-indigo-400"; // couleur par défaut
                      if (catLower.includes("qual")) barColor = "bg-pink-400";
                      else if (catLower.includes("coût") || catLower.includes("cout"))
                        barColor = "bg-amber-400";
                      else if (catLower.includes("délai") || catLower.includes("delai"))
                        barColor = "bg-sky-400";
                      else if (catLower.includes("ressource"))
                        barColor = "bg-violet-400";
                      else if (catLower.includes("technique"))
                        barColor = "bg-emerald-400";

                      return (
                        <button
                          key={item.cat}
                          type="button"
                          onClick={() =>
                            setKpiCategoryFilter(active ? null : item.cat)
                          }
                          className="flex flex-col items-center justify-end gap-1 flex-1 min-w-[70px] focus:outline-none"
                        >
                          <div className="w-8 flex items-end justify-center h-32">
                            <div
                              className={`w-6 rounded-sm ${barColor} ${
                                active ? "ring-2 ring-indigo-500" : ""
                              } hover:brightness-110 cursor-pointer`}
                              style={{
                                height: `${Math.max(heightPct, 15)}%`,
                              }}
                              title={`${item.count} risque(s)`}
                            />
                          </div>
                        </button>
                      );
                    })}

                    </div>
                  </div>
                </div>

                <div className="mt-2 px-4 flex gap-4 justify-start">
                  {paretoPoints.map((item) => (
                    <div
                      key={item.cat}
                      className="flex-1 min-w-[70px] flex flex-col items-center"
                    >
                      <span className="text-[10px] text-slate-600 text-center truncate max-w-[80px]">
                        {item.cat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-600 space-y-1">
                <p>
                  L'indicateur montre la répartition des risques selon leur
                  statut (ouvert, en cours, traité, clos, accepté, etc.).
                </p>
                <p>
                  Cliquer sur une barre filtre tous les indicateurs 
                  et la liste des risques sur la catégorie sélectionnée
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKpiCategoryFilter(null)}
                className="mt-1 text-[10px] text-indigo-600 hover:underline"
              >
                Réinitialiser le filtre catégorie
              </button>
            </>
          )}
        </div>

        {/* Histogramme des statuts des risques */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Statuts des risques
          </h2>
          {totalRiskStatus === 0 ? (
            <div className="text-[11px] text-slate-500">
              Aucun risque avec un statut dans les filtres actuels.
            </div>
          ) : (
            <>
              <div className="h-40 relative mb-3">
                <div className="absolute left-0 right-0 bottom-0 h-px bg-slate-300" />
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-300" />

                <div className="absolute left-0 right-0 bottom-0 top-0 flex items-end gap-4">
                  {riskStatusOrder.map((st) => {
                    const count = riskStatusCounts[st] ?? 0;
                    if (!count) return null;
                    const heightPct =
                      (count / maxStatusCount) * 100;
                    const barColor =
                      riskStatusBarColors[st] ?? "bg-slate-400";
                    const active = kpiStatusFilter === st;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() =>
                          setKpiStatusFilter(
                            active ? null : st,
                          )
                        }
                        className="flex-1 flex flex-col items-center gap-1 focus:outline-none"
                      >
                        <div className="w-8 flex items-end justify-center h-28">
                          <div
                            className={`w-6 rounded-sm ${barColor} ${
                              active
                                ? "ring-2 ring-indigo-500"
                                : ""
                            } hover:brightness-110 cursor-pointer`}
                            style={{
                              height: `${Math.max(
                                heightPct,
                                15,
                              )}%`,
                            }}
                            title={`${count} risque(s)`}
                          />
                        </div>
                        <span className="text-[10px] text-slate-700 truncate max-w-[70px]">
                          {st}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="absolute left-1 bottom-6 flex flex-col justify-between h-28 text-[9px] text-slate-400">
                  <span>{maxStatusCount}</span>
                  <span>0</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600">
                Cliquer sur une barre filtre tous les indicateurs et la
                liste des risques sur le statut sélectionné.
              </div>
              <button
                type="button"
                onClick={() => setKpiStatusFilter(null)}
                className="mt-1 text-[10px] text-indigo-600 hover:underline"
              >
                Réinitialiser le filtre de statut
              </button>
            </>
          )}

          <div className="mt-2 text-[11px] text-slate-600 space-y-1">
            <p>
              L'indicateur montre la répartition des risques selon leur
              statut (ouvert, en cours, traité, clos, accepté, etc.).
            </p>
          </div>
        </div>
      </div>

      {/* Matrice globale risques */}
      <div className="mb-4 bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Matrice des risques (impact × probabilité)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-slate-200 text-[11px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 px-2 py-1 text-left">
                  Impact \ Probabilité
                </th>
                {probabilityOrder.map((p) => (
                  <th
                    key={p}
                    className="border border-slate-200 px-2 py-1 text-center"
                  >
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {impactOrder.map((impact) => (
                <tr key={impact}>
                  <td className="border border-slate-200 px-2 py-1 font-medium">
                    {impact}
                  </td>
                  {probabilityOrder.map((prob) => {
                    const key = `${impact}__${prob}`;
                    const cell = matrix[key];
                    const count = cell?.count ?? 0;
                    const levelFromData = cell?.level ?? null;
                    const defaultLevel =
                      defaultLevelMatrix[key] ?? "Négligeable";

                    // max(criticité par défaut, criticité issue des risques)
                    let displayLevel = defaultLevel;
                    if (levelFromData) {
                      const idxDefault =
                        riskLevelOrder.indexOf(defaultLevel);
                      const idxData =
                        riskLevelOrder.indexOf(levelFromData);
                      displayLevel =
                        idxData > idxDefault
                          ? levelFromData
                          : defaultLevel;
                    }

                    const bgClass =
                      displayLevel === "Négligeable"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : displayLevel === "Significatif"
                        ? "bg-sky-50 text-sky-700 border border-sky-100"
                        : displayLevel === "Critique"
                        ? "bg-amber-50 text-amber-700 border border-amber-100"
                        : "bg-rose-50 text-rose-700 border border-rose-100";

                    return (
                      <td
                        key={prob}
                        className={`border border-slate-200 px-2 py-1 text-center ${bgClass}`}
                      >
                        <div className="text-base font-semibold">
                          {count}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {displayLevel}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projets les plus exposés */}
      <div className="mb-4 bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Projets les plus exposés
          </h2>
          <span className="text-[11px] text-slate-500">
            Classement par nombre de risques critiques puis total de
            risques.
          </span>
        </div>
        {projectCards.length === 0 ? (
          <div className="text-[11px] text-slate-500">
            Aucun risque ou opportunité renseigné avec les filtres
            actuels.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {projectCards.map((p) => (
              <div
                key={p.id}
                className="rounded-md border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/40 flex flex-col gap-2"
              >
                <div className="text-[11px] text-slate-500">
                  Projet
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {p.label}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">
                    Risques&nbsp;:{" "}
                    <span className="font-semibold">
                      {p.risks}
                    </span>
                  </span>
                  <span className="text-rose-600">
                    Critiques&nbsp;:{" "}
                    <span className="font-semibold">
                      {p.highRisks}
                    </span>
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  Opportunités&nbsp;:{" "}
                  <span className="font-semibold">
                    {p.opportunities}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex-1 text-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50"
                  >
                    Voir le projet
                  </Link>
                  <Link
                    href={`/projects/${p.id}/risks`}
                    className="flex-1 text-center rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] text-indigo-700 hover:bg-indigo-100"
                  >
                    Voir les risques
                  </Link>
                  <Link
                    href={`/actions?projectId=${p.id}`}
                    className="flex-1 text-center rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-100"
                  >
                    Plan d’actions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
