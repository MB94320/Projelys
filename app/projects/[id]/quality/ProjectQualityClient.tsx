"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";

type Project = {
  id: number;
  titleProject: string | null;
  projectNumber: string | null;
};

type QualityKpi = {
  deliverables: {
    total: number;
    delivered: number;
    onTime: number;
    otd: number;
    oqd: number;
    dod: number;
  };
  nonConformities: {
    total: number;
    open: number;
    critical: number;
    criticalRate: number;
    avgCloseDelay: number;
  };
};

type Props = {
  projectId: number;
};

type SimpleDeliverable = {
  id: number;
  projectId: number;
  reference: string | null;
  title: string;
  type: string | null;
  status: string;
};

type SimpleNc = {
  id: number;
  projectId: number;
  reference: string | null;
  type: string | null;
  origin: string | null;
  severity: string | null;
  status: string;
};

export default function ProjectQualityClient({ projectId }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [kpi, setKpi] = useState<QualityKpi | null>(null);
  const [deliverables, setDeliverables] = useState<SimpleDeliverable[]>([]);
  const [ncs, setNcs] = useState<SimpleNc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Chargement données ----------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [projRes, delivRes, ncRes] = await Promise.all([
          fetch("/api/projects"),
          fetch(
            `/api/projects/${projectId}/quality?type=deliverables`,
          ),
          fetch(
            `/api/projects/${projectId}/quality?type=non-conformities`,
          ),
        ]);

        if (!projRes.ok) {
          throw new Error("Erreur de chargement des projets.");
        }
        if (!delivRes.ok) {
          throw new Error(
            "Erreur de chargement des livrables projet.",
          );
        }
        if (!ncRes.ok) {
          throw new Error(
            "Erreur de chargement des non-conformités projet.",
          );
        }

        const allProjects = (await projRes.json()) as Project[];
        const delivData =
          (await delivRes.json()) as SimpleDeliverable[];
        const ncData = (await ncRes.json()) as SimpleNc[];

        if (cancelled) return;

        const current = allProjects.find(
          (p) => p.id === projectId,
        );
        setProject(current ?? null);
        setDeliverables(delivData);
        setNcs(ncData);
      } catch (e: any) {
        if (cancelled) return;
        setError(
          e?.message ??
            "Erreur lors du chargement des données qualité projet.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadKpi() {
      try {
        setLoadingKpi(true);
        const res = await fetch(
          `/api/projects/${projectId}/quality?type=kpi`,
        );
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          throw new Error(
            d?.error ??
              "Erreur lors du calcul des KPI qualité projet.",
          );
        }
        const data = (await res.json()) as QualityKpi;
        if (!cancelled) setKpi(data);
      } catch (e: any) {
        if (cancelled) return;
        setError(
          (prev) =>
            prev ??
            e?.message ??
            "Erreur lors du calcul des KPI qualité projet.",
        );
      } finally {
        if (!cancelled) setLoadingKpi(false);
      }
    }

    load();
    loadKpi();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ---------- Dérivés ----------

  const title =
    project?.projectNumber || project?.titleProject
      ? `${project?.projectNumber ?? ""} ${
          project?.titleProject ?? ""
        }`
      : `Projet ${projectId}`;

  const deliveredOnTime = useMemo(() => {
    if (!kpi || !kpi.deliverables) return 0;
    return kpi.deliverables.onTime ?? 0;
  }, [kpi]);

  const openCriticalNc = useMemo(() => {
    if (!ncs || !ncs.length) return 0;
    return ncs.filter(
      (nc) => nc.status !== "Clôturé" && nc.severity === "Critique",
    ).length;
  }, [ncs]);

  const lastDeliverables = useMemo(
    () => deliverables.slice(0, 5),
    [deliverables],
  );

  const lastNc = useMemo(
    () => ncs.slice(0, 5),
    [ncs],
  );

  // ---------- Rendu ----------

  return (
    <AppShell
      activeSection="quality"
      pageTitle={`Qualité – ${title}`}
      pageSubtitle="Vue synthétique des livrables, non-conformités et KPI qualité."
    >
      <div className="space-y-6">
        {error && (
          <div className="rounded bg-red-100 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Bandeau navigation qualité */}
        <section className="flex flex-wrap items-start justify-between gap-4">
          
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href={`/projects/${projectId}/quality`}
              className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-indigo-800"
            >
              Synthèse Qualité
            </Link>
            <Link
              href="/quality/deliverables"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-11px text-slate-700 hover:bg-slate-50"
            >
              Vue globale livrables
            </Link>
            <Link
              href="/quality/non-conformities"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-11px text-slate-700 hover:bg-slate-50"
            >
              Vue globale non-conformités
            </Link>
            <Link
              href="/quality/audits"
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Vue globale audits internes
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href={`/projects/${projectId}/quality/deliverables`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Livrables qualité
            </Link>
            <Link
              href={`/projects/${projectId}/quality/non-conformities`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Non-conformités & 8D
            </Link>
            <Link
              href={`/projects/${projectId}/quality/audits`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Audits internes
            </Link>            
          </div>
        </section>

        {/* KPI synthèse */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Livrables planifiés"
            value={kpi?.deliverables?.total ?? 0}
            loading={loadingKpi}
          />
          <KpiCard
            label="Livrables livrés"
            value={kpi?.deliverables?.delivered ?? 0}
            loading={loadingKpi}
          />
          <KpiCard
            label="Livrables à l'heure (OTD)"
            value={deliveredOnTime}
            loading={loadingKpi}
          />
          <KpiCard
            label="NC ouvertes critiques"
            value={openCriticalNc}
            loading={loadingKpi}
          />
        </section>

        {/* 2 colonnes : livrables récents / NC récentes */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Livrables récents */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Derniers livrables qualité
              </h2>
              <Link
                href={`/projects/${projectId}/quality/deliverables`}
                className="text-11px text-indigo-600 hover:underline"
              >
                Voir tous les livrables
              </Link>
            </div>
            {loading ? (
              <p className="text-11px text-slate-500">
                Chargement des livrables…
              </p>
            ) : lastDeliverables.length === 0 ? (
              <p className="text-11px text-slate-500">
                Aucun livrable qualité enregistré pour ce projet.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-md">
                <table className="min-w-full text-xs table-fixed">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium bg-slate-100 w-32">
                        Réf
                      </th>
                      <th className="px-3 py-2 text-left font-medium bg-slate-100 w-64">
                        Intitulé
                      </th>
                      <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lastDeliverables.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 whitespace-nowrap text-11px text-slate-800">
                          {d.reference ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-11px text-slate-800">
                          {d.title}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-11px text-slate-700">
                          {d.type ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <StatusBadge status={d.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* NC récentes */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Dernières non-conformités
              </h2>
              <Link
                href={`/projects/${projectId}/quality/non-conformities`}
                className="text-11px text-indigo-600 hover:underline"
              >
                Voir toutes les NC
              </Link>
            </div>
            {loading ? (
              <p className="text-11px text-slate-500">
                Chargement des non-conformités…
              </p>
            ) : lastNc.length === 0 ? (
              <p className="text-11px text-slate-500">
                Aucune non-conformité enregistrée pour ce projet.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-56 border border-slate-200 rounded-md">
                <table className="min-w-full text-xs table-fixed">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium bg-slate-100 w-32">
                        Réf
                      </th>
                      <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                        Origine
                      </th>
                      <th className="px-3 py-2 text-left font-medium bg-slate-100 w-32">
                        Sévérité
                      </th>
                      <th className="px-3 py-2 text-left font-medium bg-slate-100 w-32">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lastNc.map((nc) => (
                      <tr key={nc.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 whitespace-nowrap text-11px text-slate-800">
                          {nc.reference ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-11px text-slate-700">
                          {nc.type ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-11px text-slate-700">
                          {nc.origin ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <SeverityBadge severity={nc.severity} />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <NcStatusBadge status={nc.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Aide-mémoire qualité projet */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Aide-mémoire qualité projet
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-11px text-slate-700">
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-800">
                Livrables (OTD / OQD / DoD)
              </h3>
              <ul className="list-disc pl-4 space-y-1">
                <li>Planifier les livrables contractuels et internes.</li>
                <li>Suivre les dates prévues vs contractuelles.</li>
                <li>
                  Utiliser la vue Livrables pour analyser OTD, OQD et DoD.
                </li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-800">
                Non-conformités & insatisfactions
              </h3>
              <ul className="list-disc pl-4 space-y-1">
                <li>Déclarer systématiquement les NC significatives.</li>
                <li>Suivre les NC critiques ouvertes en priorité.</li>
                <li>
                  Documenter les causes racines et actions dans la page NC.
                </li>
              </ul>
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-800">
                Boucle PDCA projet
              </h3>
              <ul className="list-disc pl-4 space-y-1">
                <li>Plan : définir objectifs qualité projet.</li>
                <li>Do : exécuter le plan et produire les livrables.</li>
                <li>
                  Check / Act : exploiter les KPI et NC pour améliorer.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

// ---------- Composants UI ----------

type KpiCardProps = {
  label: string;
  value: number;
  loading: boolean;
};

function KpiCard({ label, value, loading }: KpiCardProps) {
  const display =
    typeof value === "number" && (value as any).toFixed
      ? (value as any).toFixed(1)
      : value;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-medium uppercase text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">
        {loading ? "…" : display}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color =
    "bg-gray-100 text-gray-800 border border-gray-200";
  if (status === "Validé" || status === "Livré" || status === "Accepté avec réserves") {
    color = "bg-emerald-100 text-emerald-700 border border-emerald-200";
  } else if (status === "En cours" || status === "En validation") {
    color = "bg-amber-100 text-amber-700 border border-amber-200";
  } else if (status === "Refusé") {
    color = "bg-rose-100 text-rose-800 border border-rose-200";
  } else if (status === "Non commencé") {
    color = "bg-slate-100 text-slate-700 border border-slate-200";
  } else if (status === "Annulé") {
    color = "bg-gray-100 text-gray-500 border border-gray-200";
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${color}`}>
      {status}
    </span>
  );
}

function NcStatusBadge({ status }: { status: string }) {
  let color =
    "bg-gray-100 text-gray-800 border border-gray-200";
  if (status === "Clôturé") {
    color = "bg-emerald-100 text-emerald-700 border border-emerald-200";
  } else if (status === "En cours") {
    color = "bg-amber-100 text-amber-700 border border-amber-200";
  } else if (status === "Ouvert") {
    color = "bg-blue-100 text-blue-700 border border-blue-200";
  } else if (status === "Annulé") {
    color = "bg-gray-100 text-gray-500 border border-gray-200";
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${color}`}>
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) {
    return <span className="text-11px text-slate-400">—</span>;
  }
  let color =
    "bg-gray-100 text-gray-800 border border-gray-200";
  if (severity === "Critique") {
    color = "bg-rose-100 text-rose-800 border border-rose-200";
  } else if (severity === "Majeure") {
    color = "bg-amber-100 text-amber-700 border border-amber-200";
  } else if (severity === "Mineure") {
    color = "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs ${color}`}>
      {severity}
    </span>
  );
}
