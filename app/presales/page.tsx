"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type PresaleStatus =
  | "Tous"
  | "Qualification"
  | "Offre envoyée"
  | "Gagnée"
  | "Perdue"
  | "Annulée";

type Presale = {
  id: string;
  opportunityNumber: string;
  clientName: string;
  label: string;
  amountKeur: number;
  probabilityPercent: number;
  status: PresaleStatus;
};

const presales: Presale[] = [
  {
    id: "o-2025-001",
    opportunityNumber: "O-2025-001",
    clientName: "Client A",
    label: "Refonte portail client",
    amountKeur: 250,
    probabilityPercent: 60,
    status: "Qualification",
  },
  {
    id: "o-2025-002",
    opportunityNumber: "O-2025-002",
    clientName: "Client B",
    label: "TMA Applicative",
    amountKeur: 180,
    probabilityPercent: 80,
    status: "Offre envoyée",
  },
  {
    id: "o-2025-003",
    opportunityNumber: "O-2025-003",
    clientName: "Client C",
    label: "Projet ERP – déploiement",
    amountKeur: 420,
    probabilityPercent: 40,
    status: "Qualification",
  },
  {
    id: "o-2024-010",
    opportunityNumber: "O-2024-010",
    clientName: "Client D",
    label: "Audit organisation SI",
    amountKeur: 60,
    probabilityPercent: 90,
    status: "Gagnée",
  },
];

type SortKey =
  | "opportunityNumber"
  | "client"
  | "amount"
  | "probability"
  | "status";

function getStatusColor(status: PresaleStatus) {
  switch (status) {
    case "Gagnée":
      return "bg-emerald-100 text-emerald-700";
    case "Perdue":
    case "Annulée":
      return "bg-rose-100 text-rose-700";
    case "Offre envoyée":
      return "bg-indigo-100 text-indigo-700";
    case "Qualification":
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function PresalesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PresaleStatus>("Tous");
  const [sortKey, setSortKey] = useState<SortKey>("opportunityNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const filteredPresales = useMemo(() => {
    let result = [...presales];

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.opportunityNumber.toLowerCase().includes(s) ||
          o.clientName.toLowerCase().includes(s) ||
          o.label.toLowerCase().includes(s)
      );
    }

    if (statusFilter !== "Tous") {
      result = result.filter((o) => o.status === statusFilter);
    }

    result.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";

      switch (sortKey) {
        case "client":
          va = a.clientName;
          vb = b.clientName;
          break;
        case "amount":
          va = a.amountKeur;
          vb = b.amountKeur;
          break;
        case "probability":
          va = a.probabilityPercent;
          vb = b.probabilityPercent;
          break;
        case "status":
          va = a.status;
          vb = b.status;
          break;
        case "opportunityNumber":
        default:
          va = a.opportunityNumber;
          vb = b.opportunityNumber;
          break;
      }

      if (va < vb) return sortDirection === "asc" ? -1 : 1;
      if (va > vb) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [search, statusFilter, sortKey, sortDirection]);

  const totalPipeline = useMemo(
    () => presales.reduce((sum, o) => sum + o.amountKeur, 0),
    []
  );

  const weightedPipeline = useMemo(
    () =>
      presales.reduce(
        (sum, o) => sum + o.amountKeur * (o.probabilityPercent / 100),0),
    []
  );

  const wonAmount = useMemo(
    () =>
      presales
        .filter((o) => o.status === "Gagnée")
        .reduce((sum, o) => sum + o.amountKeur, 0),
    []
  );

  const winRate = useMemo(() => {
    const considered = presales.filter(
      (o) => o.status === "Gagnée" || o.status === "Perdue"
    );
    if (considered.length === 0) return 0;
    const won = considered.filter((o) => o.status === "Gagnée").length;
    return Math.round((won / considered.length) * 100);
  }, []);

  const handleSortClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">


      {/* HEADER GLOBAL (MB / Mohamed Benchekor) */}
      <header className="w-full bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-semibold">P</span>
          <div>
            <div className="text-sm font-semibold text-slate-900">Projelys</div>
            <div className="text-xs text-slate-500">Pilotage du portefeuille projets</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <button className="px-2 py-1 rounded border border-slate-200 bg-slate-50">FR</button>
          <button className="px-2 py-1 rounded border border-slate-200">EN</button>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">MB</span>
            <span>Mohamed Benchekor</span>
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL : MENU + AVANT-VENTE */}
      <main className="flex flex-1 overflow-hidden">
        
        
        {/* MENU LATÉRAL */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col">
          <nav className="space-y-1 text-sm">
            <Link
              href="/"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Tableau de bord</span>
            </Link>
            <Link
              href="/projects"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50" ><span>Projets</span>
            </Link>
            <Link
              href="/presales"className="flex items-center justify-between rounded-md px-3 py-2 bg-indigo-50 text-indigo-700 font-medium"><span>Avant-vente</span>
            </Link>
            <Link
              href="/loadplan"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Plan de charge</span>
            </Link>
            <Link
              href="/performance"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Performance</span>
            </Link>
            <Link
              href="/skills"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Compétences & ressources</span>
            </Link>
            <Link
              href="/risk"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Risques & opportunités</span>
            </Link>
            <Link
              href="/finance"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Finances</span>
            </Link>
            <Link
              href="/actions"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Plan d'actions</span>
            </Link>
            <Link
              href="/quality"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Qualité ISO 9001</span>
            </Link>
          </nav>
          <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
            <div className="font-semibold text-slate-700 mb-1"></div>
          </div>
        </aside>


       {/* CONTENU AVANT-VENTE */}
       <section className="flex-1 p-6 overflow-y-auto">


          {/* Titre + résumé */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Pipeline avant-vente</h1>
              <p className="text-sm text-slate-500 mt-1">Suivi des opportunités commerciales, de leur probabilité et de leur statut.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700">Export Excel</button>
              <button className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white">Nouvelle opportunité</button>
            </div>
          </div>


          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-xs text-slate-500">Montant total pipeline (k€)</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900"> {totalPipeline} </div>
              <div className="mt-1 text-xs text-slate-500"> Toutes les opportunités, quel que soit le statut.</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-xs text-slate-500">Pipeline pondéré (k€)</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{Math.round(weightedPipeline)}</div>
              <div className="mt-1 text-xs text-slate-500">Montant pondéré par la probabilité.</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-xs text-slate-500">Affaires gagnées (k€)</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-600">{wonAmount}</div>
              <div className="mt-1 text-xs text-slate-500">Opportunités avec statut \"Gagnée\".</div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-xs text-slate-500">Taux de gain (%)</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {winRate}%
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Sur les affaires gagnées / perdues.
              </div>
            </div>
          </div>

          
        {/* Filtres + recherche */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
            <div className="flex flex-col gap-3">
              
              {/* 1re ligne : recherche seule */}
              <div>
                <input
                  type="text"
                  placeholder="Rechercher une opportunité (n° affaire, client, intitulé)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm"
                />
              </div>

              {/* 2e ligne : tous les filtres alignés à gauche */}
              <div className="flex flex-wrap gap-2 text-xs items-center">
                <span className="text-slate-600">Filtre statut :</span>
                {(
                  ["Tous", "Qualification", "Offre envoyée", "Gagnée", "Perdue", "Annulée"] as PresaleStatus[]).map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={[
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        statusFilter === filter? "bg-indigo-600 text-white border-indigo-600": "bg-slate-50 text-slate-700 border-slate-300",
                      ].join(" ")}>
                      {filter === "Tous"
                        ? `Tous (${presales.length})`
                        : `${filter} (${
                            presales.filter(
                              (o: Presale) => o.status === filter
                            ).length
                          })`}
                    </button>
                ))}
              </div>
            </div>
          </div>


          {/* Tableau */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900"> Matrice des opportunités</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium cursor-pointer select-none"onClick={() => handleSortClick("opportunityNumber")}>N° Opportunité{sortIndicator("opportunityNumber")}</th>
                    <th className="px-3 py-2 text-left font-medium cursor-pointer select-none"onClick={() => handleSortClick("client")}>Client{sortIndicator("client")}</th>
                    <th className="px-3 py-2 text-left font-medium">Intitulé</th>
                    <th className="px-3 py-2 text-right font-medium cursor-pointer select-none"onClick={() => handleSortClick("amount")}>Montant (k€){sortIndicator("amount")}</th>
                    <th className="px-3 py-2 text-right font-medium cursor-pointer select-none"onClick={() => handleSortClick("probability")}>Probabilité{sortIndicator("probability")}</th>
                    <th className="px-3 py-2 text-left font-medium cursor-pointer select-none"onClick={() => handleSortClick("status")}>Statut{sortIndicator("status")}</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-100">
                  {filteredPresales.length === 0 && (
                    <tr>
                      <td colSpan={6}className="px-3 py-4 text-center text-slate-500">Aucune opportunité ne correspond à votre recherche.</td>
                    </tr>
                  )}

                  {filteredPresales.map((o) => (
                    <tr 
                      key={o.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-indigo-600 hover:underline font-medium">{o.opportunityNumber}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{o.clientName}</td>
                      <td className="px-3 py-2">{o.label}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">{o.amountKeur} k€</td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">{o.probabilityPercent}%</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(o.status)}`}> {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-slate-500 text-right">
              {filteredPresales.length} opportunité(s) affichée(s) sur{" "}
              {presales.length}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
