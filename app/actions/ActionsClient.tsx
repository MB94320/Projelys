"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";


type ActionStatus = "Ouverte" | "En cours" | "Terminée" | "Annulée";
type ActionPriority = "Basse" | "Moyenne" | "Haute";
type EfficienceStatus = "Conforme" | "Partiellement conforme" | "Non conforme";

export type ActionRow = {
  id: number;                    // ID affiché
  title: string;
  origin: string;
  priority: ActionPriority;
  progress: number;
  owner: string;
  startDate: string;
  dueDate: string;
  status: ActionStatus;
  efficience: EfficienceStatus;
  riskId?: number | null;
  riskRef?: string | null;
  projectId?: number | null;
  projectLabel?: string | null;
  closedDate?: string | null;
  comment?: string | null;
  ncId?: number | null;
  ncRef?: string | null;
  actionDbId?: number | null;    // pour /actions/[id]
};


function statusColor(status: ActionStatus) {
  switch (status) {
    case "Ouverte":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "En cours":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Terminée":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Annulée":
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function priorityColor(priority: ActionPriority) {
  switch (priority) {
    case "Basse":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200";
    case "Moyenne":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "Haute":
      return "bg-red-50 text-red-700 border border-red-200";
  }
}

function EstatusColor(status: EfficienceStatus) {
  switch (status) {
    case "Conforme":
      return "bg-green-100 text-green-700 border border-green-200";
    case "Partiellement conforme":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Non conforme":
      return "bg-red-100 text-red-700 border border-red-200";
  }
}

const ORIGIN_COLORS: Record<string, string> = {
  Commerce: "bg-pink-100 text-pink-800 border border-pink-200",
  Exigence: "bg-sky-100 text-sky-800 border border-sky-200",
  "Non-Conformité": "bg-orange-100 text-orange-800 border border-orange-200",
  Risques: "bg-purple-100 text-purple-800 border border-purple-200",
  "Revue interne": "bg-teal-100 text-teal-800 border border-teal-200",
  "Revue Client": "bg-lime-100 text-lime-800 border border-lime-200",
  Qualité: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  "Audit Interne": "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200",
  "Audit Externe": "bg-cyan-100 text-cyan-800 border border-cyan-200",
  KoM: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  CoPil: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  CoDir: "bg-rose-100 text-rose-800 border border-rose-200",
  Autres: "bg-slate-100 text-slate-800 border border-slate-200",
};

function originBadge(origin: string) {
  return (
    ORIGIN_COLORS[origin] ??
    "bg-slate-100 text-slate-800 border border-slate-200"
  );
}

export default function ActionsClient({
  initialActions,
}: {
  initialActions: ActionRow[];
}) {
  const [actions, setActions] = useState<ActionRow[]>(
    [...initialActions].sort((a, b) => a.id - b.id),
  );
  const [loadingDelete, setLoadingDelete] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOwner, setFilterOwner] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [filterDue, setFilterDue] = useState<string>("all");

  const [kpiStatusFilter, setKpiStatusFilter] = useState<ActionStatus | null>(
    null,
  );
  const [kpiOriginFilter, setKpiOriginFilter] = useState<string | null>(null);
  const [kpiOwnerFilter, setKpiOwnerFilter] = useState<string | null>(null);

  const uniqueOwners = useMemo(
    () =>
      Array.from(new Set(actions.map((a) => a.owner).filter(Boolean))).sort(),
    [actions],
  );

  const uniqueProjects = useMemo(
    () =>
      Array.from(
        new Set(
          actions
            .map((a) => a.projectLabel ?? "")
            .filter((n) => n && n.trim() !== ""),
        ),
      ).sort(),
    [actions],
  );

  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      if (kpiStatusFilter && a.status !== kpiStatusFilter) return false;
      if (kpiOriginFilter && a.origin !== kpiOriginFilter) return false;
      if (kpiOwnerFilter && a.owner !== kpiOwnerFilter) return false;

      if (filterOrigin !== "all" && a.origin !== filterOrigin) return false;
      if (
        filterPriority !== "all" &&
        a.priority !== (filterPriority as ActionPriority)
      )
        return false;
      if (
        filterStatus !== "all" &&
        a.status !== (filterStatus as ActionStatus)
      )
        return false;
      if (filterOwner !== "all" && a.owner !== filterOwner) return false;
      if (
        filterProject !== "all" &&
        (a.projectLabel ?? "") !== filterProject
      )
        return false;

      if (filterDue !== "all" && a.dueDate) {
        const d = new Date(a.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (filterDue === "past" && !(d < today)) return false;
        if (filterDue === "future" && !(d >= today)) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          a.title,
          a.owner,
          a.origin,
          a.projectLabel ?? "",
          String(a.id),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    actions,
    search,
    filterOrigin,
    filterPriority,
    filterStatus,
    filterOwner,
    filterProject,
    filterDue,
    kpiStatusFilter,
    kpiOriginFilter,
    kpiOwnerFilter,
  ]);

  const {
    total,
    closed,
    avgProgress,
    statusCounts,
    originCounts,
    ownerCounts,
    recommendations,
  } = useMemo(() => {
    const list = filteredActions;
    const total = list.length;
    const closed = list.filter((a) => a.status === "Terminée").length;
    const avgProgress =
      total > 0
        ? Math.round(
            list.reduce((s, a) => s + (a.progress ?? 0), 0) / total,
          )
        : 0;

    const statusCounts: Record<ActionStatus, number> = {
      Ouverte: 0,
      "En cours": 0,
      Terminée: 0,
      Annulée: 0,
    };

    const originCounts: Record<string, number> = {};
    const ownerCounts: Record<string, { total: number; high: number }> = {};

    
    for (const a of list) {
      statusCounts[a.status] += 1;
      const origin = a.origin || "Autres";
      originCounts[origin] = (originCounts[origin] ?? 0) + 1;

      const key = a.owner || "Non attribué";
      if (!ownerCounts[key]) ownerCounts[key] = { total: 0, high: 0 };
      ownerCounts[key].total += 1;
      if (a.priority === "Haute") ownerCounts[key].high += 1;
    }

    const recommendations: string[] = [];
    const donePct = total > 0 ? Math.round((closed / total) * 100) : 0;
    const highPriorityOpen = list.filter(
      (a) => a.priority === "Haute" && a.status !== "Terminée",
    ).length;
    const overdue = list.filter(
      (a) =>
        a.dueDate &&
        a.status !== "Terminée" &&
        new Date(a.dueDate) < new Date(),
    ).length;

    if (total === 0) {
      recommendations.push(
        "Aucune action enregistrée : vérifier que les plans d’actions sont bien formalisés dans les comités.",
      );
    } else {
      if (donePct < 50) {
        recommendations.push(
          "Taux de clôture faible : planifier un point spécifique pour prioriser et relancer les actions en retard.",
        );
      } else {
        recommendations.push(
          "Taux de clôture correct : poursuivre la dynamique en suivant les actions à forte priorité.",
        );
      }

      if (highPriorityOpen > 0) {
        recommendations.push(
          `${highPriorityOpen} action(s) de priorité haute non terminée(s) : sécuriser les responsables et les échéances.`,
        );
      }

      if (overdue > 0) {
        recommendations.push(
          `${overdue} action(s) en retard : revoir les dates d’échéance ou les moyens alloués.`,
        );
      }
    }

    return {
      total,
      closed,
      avgProgress,
      statusCounts,
      originCounts,
      ownerCounts,
      recommendations,
    };
  }, [filteredActions]);

  const originEntries = useMemo(
    () => Object.entries(originCounts).sort((a, b) => b[1] - a[1]),
    [originCounts],
  );
  const maxOriginCount =
    originEntries.length > 0
      ? Math.max(...originEntries.map(([, v]) => v))
      : 0;

  const ownerEntries = useMemo(
    () =>
      Object.entries(ownerCounts).sort(
        (a, b) => b[1].total - a[1].total,
      ),
    [ownerCounts],
  );

  const handleExportExcel = () => {
    if (filteredActions.length === 0) return;

    const rows = filteredActions.map((a) => ({
      "ID action": a.id,
      Intitulé: a.title,
      Origine: a.origin,
      Priorité: a.priority,
      "Avancement (%)": a.progress,
      Responsable: a.owner,
      "Date de création": a.startDate,
      Échéance: a.dueDate,
      "Date de clôture": a.closedDate ?? "",
      Statut: a.status,
      Efficience: a.efficience,
      "Projet (ID)": a.projectId ?? "",
      Projet: a.projectLabel ?? "",
      "Risque (ID)": a.riskId ?? "",
      "Risque (réf)": a.riskRef ?? "",
      Commentaires: a.comment ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan d'actions");
    XLSX.writeFile(wb, "Plan_actions.xlsx");
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cette action ?")) return;
    if (loadingDelete !== null) return;

    setLoadingDelete(id);
    try {
      const res = await fetch(`/api/actions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert("Erreur lors de la suppression de l'action.");
        return;
      }
      setActions((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setLoadingDelete(null);
    }
  };

  const STATUS_BAR_ORDER: ActionStatus[] = [
    "Ouverte",
    "En cours",
    "Annulée",
    "Terminée",
  ];
  const totalStatus = Object.values(statusCounts).reduce(
    (s, v) => s + v,
    0,
  );
  const maxStatusCount = Math.max(
    1,
    ...STATUS_BAR_ORDER.map((st) => statusCounts[st] ?? 0),
  );

  return (
    <section className="flex-1 overflow-y-auto space-y-4">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Export Excel
          </button>
          <Link
            href="/actions/new"
            className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Nouvelle action
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (intitulé, responsable, projet, n° d'action...)"
            className="w-full md:max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-slate-600 text-[11px]">Origine</div>
            <select
              value={filterOrigin}
              onChange={(e) => setFilterOrigin(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
            >
              <option value="all">Toutes</option>
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
            <div className="text-slate-600 text-[11px]">Priorité</div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
            >
              <option value="all">Toutes</option>
              <option value="Haute">Haute</option>
              <option value="Moyenne">Moyenne</option>
              <option value="Basse">Basse</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-slate-600 text-[11px]">Statut</div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
            >
              <option value="all">Tous</option>
              <option value="Ouverte">Ouverte</option>
              <option value="En cours">En cours</option>
              <option value="Terminée">Terminée</option>
              <option value="Annulée">Annulée</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-slate-600 text-[11px]">Ressource</div>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
            >
              <option value="all">Toutes</option>
              {uniqueOwners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-slate-600 text-[11px]">N° projet</div>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
            >
              <option value="all">Tous</option>
              {uniqueProjects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="text-slate-600 text-[11px]">Échéance</div>
            <select
              value={filterDue}
              onChange={(e) => setFilterDue(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs bg-white"
            >
              <option value="all">Toutes</option>
              <option value="past">En retard</option>
              <option value="future">À venir</option>
            </select>
          </div>
        </div>
      </div>

      {/* 1ère ligne KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Synthèse actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Synthèse des actions
          </h2>
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="text-2xl font-semibold text-slate-900">
                {total}
              </div>
              <div className="text-[11px] text-slate-500">
                Actions filtrées
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-emerald-700">
                {total > 0 ? Math.round((closed / total) * 100) : 0}%
              </div>
              <div className="text-[11px] text-slate-500">
                Terminées ({closed})
              </div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Suivi global de l’exécution des actions du portefeuille
            (avancement moyen {avgProgress}%).
          </div>
          <button
            type="button"
            onClick={() => {
              setKpiStatusFilter(null);
              setKpiOriginFilter(null);
              setKpiOwnerFilter(null);
              setFilterOrigin("all");
              setFilterPriority("all");
              setFilterStatus("all");
              setFilterOwner("all");
              setFilterProject("all");
              setFilterDue("all");
              setSearch("");
            }}
            className="mt-2 text-[10px] text-indigo-600 hover:underline"
          >
            Réinitialiser tous les filtres
          </button>
        </div>

        {/* Synthèse & recommandations */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Synthèse & recommandations
          </h2>
          <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed text-slate-600">
            {recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* Actions par responsable */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Actions par responsable
          </h2>
          {ownerEntries.length === 0 ? (
            <div className="text-[11px] text-slate-500">
              Aucun responsable identifié dans le filtre actuel.
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-md">
              <table className="min-w-full text-[11px]">
                <thead className="bg-slate-50 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      Ressource
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Nb actions
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Statut
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Priorité haute
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ownerEntries.map(([owner, info]) => {
                    const active = kpiOwnerFilter === owner;
                    const pctDone =
                      total === 0
                        ? 0
                        : Math.round(
                            ((statusCounts["Terminée"] ?? 0) /
                              Math.max(total, 1)) *
                              100,
                          );
                    return (
                      <tr
                        key={owner}
                        className={`hover:bg-slate-50 cursor-pointer ${
                          active ? "bg-indigo-50" : ""
                        }`}
                        onClick={() =>
                          setKpiOwnerFilter(active ? null : owner)
                        }
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-indigo-700 underline">
                          {owner || "Non attribué"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {info.total}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {total === 0 ? "—" : `${pctDone} % terminées`}
                        </td>
                        <td className="px-3 py-2 text-right text-rose-600 font-medium">
                          {info.high}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-[10px] text-slate-400">
            Cliquer sur une ressource filtre tous les indicateurs et la
            liste des actions sur ce responsable.
          </p>
        </div>
      </div>

      {/* 2ème ligne KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Statut des actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Statut des actions
          </h2>
          {totalStatus === 0 ? (
            <div className="text-[11px] text-slate-500">
              Aucune action dans les filtres actuels.
            </div>
          ) : (
            <>
              <div className="relative flex-1 h-40 overflow-hidden">
                <div className="absolute left-0 right-0 bottom-0 h-px bg-slate-300" />
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-300" />

                <div className="absolute inset-x-4 bottom-0 top-0 flex items-end gap-4 pb-0">
                  {STATUS_BAR_ORDER.map((st) => {
                    const count = statusCounts[st] ?? 0;
                    if (!count) return null;
                    const heightPct = (count / maxStatusCount) * 100;
                    const barColor =
                      st === "Ouverte"
                        ? "bg-rose-400"
                        : st === "En cours"
                        ? "bg-amber-400"
                        : st === "Terminée"
                        ? "bg-emerald-400"
                        : "bg-slate-400";
                    const active = kpiStatusFilter === st;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() =>
                          setKpiStatusFilter(active ? null : st)
                        }
                        className="flex-1 flex flex-col items-center gap-1 focus:outline-none"
                      >
                        <div className="w-8 flex items-end justify-center h-28">
                          <div
                            className={`w-full rounded-sm ${barColor} ${
                              active ? "ring-2 ring-indigo-500" : ""
                            } hover:brightness-110 cursor-pointer`}
                            style={{
                              height: `${Math.max(heightPct, 8)}%`,
                            }}
                            title={`${count} action(s)`}
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

              <div className="mt-2 text-[11px] text-slate-600">
                Cliquer sur une barre filtre tous les indicateurs sur le
                statut sélectionné.
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
        </div>

        {/* Origine des actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Origine des actions
          </h2>
          {originEntries.length === 0 ? (
            <div className="text-[11px] text-slate-500">
              Aucune action avec les filtres actuels.
            </div>
          ) : (
            <>
              <div className="flex flex-col">
                <div className="flex flex-1 items-end">
                  <div className="flex flex-col justify-between text-[10px] text-slate-400 pr-2 h-40">
                    <span>{maxOriginCount}</span>
                    <span>0</span>
                  </div>

                  <div className="relative flex-1 h-40 overflow-hidden">
                    <div className="absolute left-0 right-0 bottom-0 h-px bg-slate-300" />
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-300" />

                    <div className="absolute inset-x-0 bottom-0 top-0 flex items-end gap-4 pb-0">
                      {originEntries.map(([origin, count]) => {
                        const max = maxOriginCount || 1;
                        const heightPct = (count / max) * 100;
                        const active = kpiOriginFilter === origin;

                        // 1) on récupère la couleur du badge (même objet que le tableau)
                        const originClass = ORIGIN_COLORS[origin] ?? "bg-slate-100";
                        const bgToken =
                          originClass.split(" ").find((c) => c.startsWith("bg-")) ??
                          "bg-slate-100";

                        // 2) si on veut EXACTEMENT la même couleur que le badge:
                        const barColor = bgToken; // pas de .replace("100","400")

                        return (
                          <button
                            key={origin}
                            type="button"
                            onClick={() =>
                              setKpiOriginFilter(active ? null : origin)
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
                                title={`${count} action(s)`}
                              />
                            </div>
                            <span className="text-[10px] text-slate-600 text-center truncate max-w-[80px]">
                              {origin}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-slate-600">
                Cliquer sur une barre filtre tous les indicateurs et la
                liste des actions sur l’origine choisie.
              </p>
              <button
                type="button"
                onClick={() => setKpiOriginFilter(null)}
                className="mt-1 text-[10px] text-indigo-600 hover:underline"
              >
                Réinitialiser le filtre d’origine
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tableau des actions */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Liste des actions
          </h2>
          <span className="text-[11px] text-slate-500">
            {filteredActions.length} action(s) filtrée(s) /{" "}
            {actions.length} au total
          </span>
        </div>

        <div className="overflow-x-auto max-h-[250px]">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  ID
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100 min-w-[260px]">
                  Action
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Origine
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Priorité
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Avancement
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Responsable
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Projet
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Création
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Échéance
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Clôture
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Statut
                </th>
                <th className="px-3 py-2 text-left font-medium bg-slate-100">
                  Efficience
                </th>
                <th className="px-30 py-2 text-left font-medium bg-slate-100">
                  Commentaires
                </th>
                <th className="px-3 py-2 text-center font-medium bg-slate-100">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredActions.length === 0 && (
                <tr>
                  <td
                    colSpan={14}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    Aucune action pour l’instant avec ces filtres.
                  </td>
                </tr>
              )}

              {filteredActions.map((action, index) => (
                <tr key={`${action.origin}-${index}`} className="hover:bg-slate-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {action.id}
                  </td>

                  <td className="px-3 py-2 whitespace-pre-wrap align-top">
                    <div className="text-[11px] text-slate-900">
                      {action.title}
                    </div>

                    {/* Tag DAC / DAP sous le titre si présent dans le commentaire */}
                    {action.comment && (
                      (() => {
                        const isDAC = action.comment.startsWith("DAC");
                        const isDAP = action.comment.startsWith("DAP");

                        if (!isDAC && !isDAP) return null;

                        const label = isDAC ? "DAC" : "DAP";

                        return (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            {label}
                          </div>
                        );
                      })()
                    )}
                  </td>


                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${originBadge(
                        action.origin || "Autres",
                      )}`}
                    >
                      {action.origin || "Autres"}
                    </span>
                    {action.origin === "Risques" &&
                      action.projectId &&
                      action.riskId && (
                        <div className="text-[11px] text-indigo-600">
                          <Link
                            href={`/projects/${action.projectId}/risks/${action.riskId}`}
                            className="hover:underline"
                          >
                            {action.riskRef
                              ? `Voir le risque ${action.riskRef}`
                              : "Voir le risque"}
                          </Link>
                        </div>
                      )}
                    {action.origin === "Non-Conformité" &&
                      action.projectId &&
                      action.ncId && (
                        <div className="text-[11px] text-indigo-600">
                          <Link
                            href={`/projects/${action.projectId}/quality/non-conformities/${action.ncId}`}
                            className="hover:underline"
                          >
                            {action.ncRef
                              ? `Voir la non-conformité ${action.ncRef}`
                              : "Voir la non-conformité"}
                          </Link>
                        </div>
                      )}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityColor(
                        action.priority,
                      )}`}
                    >
                      {action.priority}
                    </span>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 bg-indigo-500"
                          style={{ width: `${action.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-700">
                        {action.progress}%
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    {action.owner || "-"}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap">
                    {action.projectId ? (
                      <Link
                        href={`/projects/${action.projectId}`}
                        className="text-[11px] text-slate-700 hover:underline"
                      >
                        {action.projectLabel ||
                          `Projet ${action.projectId}`}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {action.startDate}
                  </td>

                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {action.dueDate || "-"}
                  </td>

                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {action.closedDate || "-"}
                  </td>

                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(
                        action.status,
                      )}`}
                    >
                      {action.status}
                    </span>
                  </td>

                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {action.status === "Terminée" ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${EstatusColor(
                          action.efficience,
                        )}`}
                      >
                        {action.efficience}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        —
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2 whitespace-pre-wrap max-w-xs">
                    {action.comment || "—"}
                  </td>

                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      {action.actionDbId ? (
                        <Link
                          href={`/actions/${action.actionDbId}`}
                          className="text-indigo-600 hover:underline font-medium text-[11px]"
                        >
                          Mettre à jour
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Non éditable
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          action.actionDbId ? handleDelete(action.actionDbId) : undefined
                        }
                        title="Supprimer l’action"
                        className={`h-7 w-7 flex items-center justify-center rounded-full border ${
                          loadingDelete === action.actionDbId
                            ? "bg-rose-100 border-rose-200 text-rose-400 cursor-wait"
                            : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                        }`}
                        disabled={!action.actionDbId}
                      >
                        🗑
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
