"use client";

import Link from "next/link";
import { useMemo } from "react";
import { projects, Project } from "./_data/projects";

type Presale = {
  id: string;
  opportunityNumber: string;
  clientName: string;
  label: string;
  amountKeur: number;
  probabilityPercent: number;
  status: "Qualification" | "Offre envoyée" | "Gagnée" | "Perdue" | "Annulée";
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
];

function getStatusColor(status: Presale["status"]) {
  switch (status) {
    case "Gagnée":
      return "bg-emerald-100 text-emerald-700";
    case "Perdue":
    case "Annulée":
      return "bg-rose-100 text-rose-700";
    case "Offre envoyée":
      return "bg-blue-100 text-blue-700";
    case "Qualification":
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getRiskBadgeClasses(risk: Project["riskCriticality"]) {
  switch (risk) {
    case "Critique":
      return "bg-rose-100 text-rose-700";
    case "Inacceptable":
      return "bg-red-100 text-red-700";
    case "Significatif":
      return "bg-amber-100 text-amber-700";
    case "Négligeable":
    default:
      return "bg-emerald-100 text-emerald-700";
  }
}

export default function Home() {
  const totalProjects = projects.length;

  const projectsAtRisk = useMemo(
    () =>
      projects.filter(
        (p: Project) =>
          p.riskCriticality === "Critique" ||
          p.riskCriticality === "Inacceptable"
      ),
    []
  );

  const activePresalesAmount = useMemo(
    () =>
      presales
        .filter(
          (p: Presale) =>
            p.status === "Qualification" || p.status === "Offre envoyée"
        )
        .reduce(
          (sum, p) => sum + p.amountKeur * (p.probabilityPercent / 100),
          0
        ),
    []
  );

  // Si tu n'as pas d'info de délais dans Project, on met juste 0 pour l'instant
  const onTimeRatio = 0;

  const riskDistribution = useMemo(() => {
    const counts: Record<Project["riskCriticality"], number> = {
      Négligeable: 0,
      Significatif: 0,
      Critique: 0,
      Inacceptable: 0,
    };
    projects.forEach((p: Project) => {
      counts[p.riskCriticality] = (counts[p.riskCriticality] || 0) + 1;
    });
    return counts;
  }, []);

  const recentProjects = useMemo(
    () => [...projects].slice(0, 5),
    []
  );

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


      {/* CONTENU PRINCIPAL : MENU + DASHBOARD */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* MENU LATÉRAL */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col">
          <nav className="space-y-1 text-sm">
            <Link
              href="/"className="flex items-center justify-between rounded-md px-3 py-2 bg-indigo-50 text-indigo-700 font-medium"><span>Tableau de bord</span>
            </Link>
            <Link
              href="/projects"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Projets</span>
            </Link>
            <Link
              href="/presales"className="flex items-center justify-between rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"><span>Avant-vente</span>
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

        {/* CONTENU DASHBOARD */}
        <section className="flex-1 p-6 overflow-y-auto">


          {/* Titre + résumé */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Tableau de bord</h1>
              <p className="text-sm text-slate-500 mt-1">Vue synthétique du portefeuille projets, du pipeline avant-vente et des risques.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700">Export Excel</button>
            </div>
          </div>

          {/* KPIs principaux */}
          
              {/* KPIs ID PROJET */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-xs text-slate-500">Projets actifs</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900">{totalProjects}</div>
                    <div className="mt-1 text-xs text-slate-500">Dont {projectsAtRisk.length} en risque.</div>
                  </div>

                  
              {/* KPIs ID AVANT VENTE */}
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-xs text-slate-500">Pipeline pondéré (k€)</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900"> {Math.round(activePresalesAmount)}</div>
                    <div className="mt-1 text-xs text-slate-500">Opportunités en cours (pondérées par la probabilité).</div>
                  </div>

              {/* KPIs ID RISQUE */}
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-xs text-slate-500">Projets à risque</div>
                    <div className="mt-2 text-2xl font-semibold text-rose-600">{projectsAtRisk.length}</div>
                    <div className="mt-1 text-xs text-slate-500">Critique ou inacceptables.</div>
                  </div>

              {/* KPIs ID PERFORMANCE */}
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-xs text-slate-500">Respect délais moyen</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900">{onTimeRatio ? `${Math.round(onTimeRatio * 100)}%` : "N/A"}</div>
                    <div className="mt-1 text-xs text-slate-500">À affiner quand on aura les données de délais.</div>
                  </div>
                </div>

              {/* KPIs PIPELINE AVANT VENTE + RISQUE PROJETS */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

                    {/* PIPELINE AVANT VENTE */}
                        <div className="bg-white rounded-lg shadow-sm p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-slate-900">Pipeline avant-vente</h2>
                            <Link href="/presales"className="text-xs text-indigo-600 hover:underline">Voir le détail</Link>
                          </div>
                          <div className="space-y-2 text-xs">
                            {presales.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center justify-between gap-3 border rounded-md px-3 py-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">{p.opportunityNumber}</span>
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                                  </div>
                                  <div className="text-slate-700 truncate">{p.label} – {p.clientName}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-slate-900">{p.amountKeur} k€</div>
                                  <div className="text-xs text-slate-500">Probabilité {p.probabilityPercent}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                    {/* Répartition des projets par criticité */}
                        <div className="bg-white rounded-lg shadow-sm p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-slate-900">Répartition des projets par criticité</h2>
                          </div>

                        <div className="space-y-3 text-xs">
                          {(["Négligeable", "Significatif", "Critique", "Inacceptable"] as const).map((level) => {
                            const count = riskDistribution[level] || 0;
                            const percent = totalProjects? Math.round((count / totalProjects) * 100): 0;const barColor =level === "Critique" || level === "Inacceptable"? "bg-rose-500": level === "Significatif"? "bg-amber-500": "bg-emerald-500";
                            return (
                              <div key={level}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-700">{level}</span>
                                    <span className="text-slate-400">({count} projet(s)) </span>
                                  </div>
                                  <span className="text-slate-700">{percent}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full ${barColor}`}
                                    style={{ width: `${percent}%` }}>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

          {/* PORTEFEUILLE PROJET */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Portefeuille projet</h2>
              <Link
                href="/projects"className="text-xs text-indigo-600 hover:underline">Voir le portefeuille complet
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium"> N° Projet</th>
                    <th className="px-3 py-2 text-left font-medium">Client</th>
                    <th className="px-3 py-2 text-left font-medium">Chef</th>
                    <th className="px-3 py-2 text-left font-medium ">Intitulé du projet</th>
                    <th className="px-3 py-2 text-left font-medium">Avancement</th>
                    <th className="px-3 py-2 text-left font-medium">Criticité</th>
                    <th className="px-3 py-2 text-right font-medium">Échéance</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Link
                          href={`/projects/${p.id}`}
                          className="text-indigo-600 hover:underline font-medium">{p.projectNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{p.clientName}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{p.projectManagerName}</td>
                      <td className="px-3 py-2">{p.label}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500"style={{ width: `${p.progressPercent}%` }}></div>
                          </div>
                          <span className="text-xs text-slate-500">{p.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getRiskBadgeClasses(p.riskCriticality)}`}>{p.riskCriticality}</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-slate-500">{p.estimatedDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 text-xs text-slate-500 text-right">{recentProjects.length} projet(s) récents affichés sur{" "}{totalProjects}.</div>
          </div>
        </section>
      </main>
    </div>
  );
}
