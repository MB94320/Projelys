"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";

type ThMiniProps = {
  children: React.ReactNode;
  className?: string;
};

function ThMini({ children, className = "" }: ThMiniProps) {
  return (
    <th
      className={
        "px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wide " +
        className
      }
    >
      {children}
    </th>
  );
}


type ProjectSynth = {
  projectId: number;
  projectNumber: string | null;
  titleProject: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  status: string | null;
  total: number;
  open: number;
};

type NonConformity = {
  id: number;
  projectId: number;
  reference: string | null;
  type: string | null;
  origin: string | null;
  description: string;
  severity: string | null;
  detectedOn: string | null;
  detectedBy: string | null;
  dueDate: string | null;
  status: string;
  closedDate: string | null;
  project: {
    id: number;
    projectNumber: string | null;
    titleProject: string | null;
    clientName: string | null;
    projectManagerName: string | null;
    status: string | null;
  } | null;
};

type KpiGlobal = {
  total: number;
  open: number;
  criticalRate: number;
  avgCloseDelay: number;
};

type BarPoint = { label: string; value: number };

type ProjectLight = {
  id: number;
  projectNumber: string | null;
  titleProject: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  status: string | null;
};

export default function GlobalNonConformitiesPage() {
  const router = useRouter();

  const [ncs, setNcs] = useState<NonConformity[]>([]);
  const [projectsSynthBase, setProjectsSynthBase] = useState<ProjectSynth[]>([]);
  const [kpiBase, setKpiBase] = useState<KpiGlobal | null>(null);
  const [barsSeverityBase, setBarsSeverityBase] = useState<BarPoint[]>([]);
  const [barsByMonthBase, setBarsByMonthBase] = useState<BarPoint[]>([]);

  const [allProjects, setAllProjects] = useState<ProjectLight[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState<string>("Tous");
  const [filterProjectNumber, setFilterProjectNumber] = useState<string>("Tous");
  const [filterPm, setFilterPm] = useState<string>("Tous");
  const [filterStatus, setFilterStatus] = useState<string>("Tous");
  const [filterSeverity, setFilterSeverity] = useState<string>("Toutes");

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [severityChartFilter, setSeverityChartFilter] = useState<string | null>(
    null,
  );
  const [monthChartFilter, setMonthChartFilter] = useState<string | null>(null);

  type NewNc = {
    reference: string;
    projectId: number | null;
    origin: string;
    type: string;
    severity: string;
    status: string;
    detectedOn: string;
    dueDate: string;
    detectedBy: string;
    description: string;
    comments: string;
  };

  const [newNc, setNewNc] = useState<NewNc>({
    reference: "",
    projectId: null,
    origin: "",
    type: "",
    severity: "",
    status: "Ouvert",
    detectedOn: "",
    dueDate: "",
    detectedBy: "",
    description: "",
    comments: "",
  });

  const NC_SEVERITY = ["Mineure", "Majeure", "Critique"];
  const NC_STATUS = ["Ouvert", "En cours", "Clôturé", "Annulé"];
  const NC_TYPES = [
    "Process",
    "Produit",
    "Client",
    "Fournisseur",
    "Système",
    "Sécurité",
    "Documentation",
  ];
  const NC_ORIGINS = [
    "Audit",
    "Livrable",
    "Réclamation client",
    "Contrôle interne",
    "Auto-contrôle",
    "Revue de projet",
  ];

  function computeNextReference(existing: NonConformity[]) {
    const year = new Date().getFullYear();
    const prefix = `NC_${year}_`;
    const refs = existing
      .map((n) => n.reference)
      .filter((r): r is string => !!r && r.startsWith(prefix));
    const lastIndex =
      refs
        .map((r) => {
          const part = r.split("_").slice(-1)[0];
          return /^\d+$/.test(part) ? Number(part) : 0;
        })
        .sort((a, b) => b - a)[0] || 0;
    const nextIndex = String(lastIndex + 1).padStart(3, "0");
    return `${prefix}${nextIndex}`;
  }

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [resGlobal, resProjects] = await Promise.all([
        fetch("/api/quality/non-conformities-global"),
        fetch("/api/projects"),
      ]);

      if (!resGlobal.ok) {
        const d = await resGlobal.json().catch(() => null);
        throw new Error(d?.error ?? "Erreur de chargement des NC globales");
      }
      if (!resProjects.ok) {
        const d = await resProjects.json().catch(() => null);
        throw new Error(d?.error ?? "Erreur de chargement des projets");
      }

      const dataGlobal = await resGlobal.json();
      const projectsData = await resProjects.json();

      setNcs(dataGlobal.ncs as NonConformity[]);
      setProjectsSynthBase(dataGlobal.projectsSynth as ProjectSynth[]);
      setKpiBase(dataGlobal.kpi as KpiGlobal);
      setBarsSeverityBase(dataGlobal.severityBars as BarPoint[]);
      setBarsByMonthBase(dataGlobal.monthBars as BarPoint[]);

      setAllProjects(
        (projectsData.projects ?? projectsData) as ProjectLight[],
      );

      setNewNc((prev) => ({
        ...prev,
        reference: computeNextReference(dataGlobal.ncs as NonConformity[]),
      }));
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredNcs = useMemo(() => {
    return ncs.filter((nc) => {
      const p = nc.project;
      if (!p) return false;

      if (filterClient !== "Tous" && p.clientName !== filterClient) return false;
      if (
        filterProjectNumber !== "Tous" &&
        p.projectNumber !== filterProjectNumber
      )
        return false;
      if (filterPm !== "Tous" && p.projectManagerName !== filterPm) return false;
      if (filterStatus !== "Tous" && nc.status !== filterStatus) return false;
      if (filterSeverity !== "Toutes" && nc.severity !== filterSeverity)
        return false;

      if (severityChartFilter && nc.severity !== severityChartFilter) {
        return false;
      }
      if (monthChartFilter) {
        if (!nc.detectedOn) return false;
        const d = new Date(nc.detectedOn);
        if (Number.isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, "0")}`;
        if (key !== monthChartFilter) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = [
          nc.reference ?? "",
          nc.description ?? "",
          nc.detectedBy ?? "",
          nc.origin ?? "",
          nc.severity ?? "",
          p.projectNumber ?? "",
          p.titleProject ?? "",
          p.clientName ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    ncs,
    filterClient,
    filterProjectNumber,
    filterPm,
    filterStatus,
    filterSeverity,
    severityChartFilter,
    monthChartFilter,
    search,
  ]);

  const kpiFiltered = useMemo(() => {
    const total = filteredNcs.length;
    const open = filteredNcs.filter((nc) => nc.status !== "Clôturé").length;
    const critical = filteredNcs.filter(
      (nc) => nc.severity === "Majeure" || nc.severity === "Critique",
    ).length;
    const criticalRate = total > 0 ? (critical / total) * 100 : 0;

    let totalDelay = 0;
    let closedCount = 0;
    for (const nc of filteredNcs) {
      if (!nc.detectedOn || !nc.closedDate) continue;
      const d1 = new Date(nc.detectedOn);
      const d2 = new Date(nc.closedDate);
      if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) continue;
      const diffDays =
        (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
      totalDelay += diffDays;
      closedCount += 1;
    }
    const avgCloseDelay = closedCount > 0 ? totalDelay / closedCount : 0;

    return { total, open, criticalRate, avgCloseDelay };
  }, [filteredNcs]);

  const barsSeverity = useMemo<BarPoint[]>(() => {
    const counts: Record<string, number> = {
      Mineure: 0,
      Majeure: 0,
      Critique: 0,
    };
    for (const nc of filteredNcs) {
      if (!nc.severity) continue;
      if (counts[nc.severity] === undefined) counts[nc.severity] = 0;
      counts[nc.severity] += 1;
    }
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
    }));
  }, [filteredNcs]);

  const barsByMonth = useMemo<BarPoint[]>(() => {
    const map = new Map<string, number>();
    for (const nc of filteredNcs) {
      if (!nc.detectedOn) continue;
      const d = new Date(nc.detectedOn);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(
        d.getMonth() + 1,
      ).padStart(2, "0")}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const keys = Array.from(map.keys()).sort();
    return keys.map((label) => ({
      label,
      value: map.get(label) ?? 0,
    }));
  }, [filteredNcs]);

  const projectsSynthFiltered: ProjectSynth[] = useMemo(() => {
    if (filteredNcs.length === 0) return [];

    const map = new Map<number, ProjectSynth>();
    for (const nc of filteredNcs) {
      const p = nc.project;
      if (!p) continue;
      if (!map.has(p.id)) {
        map.set(p.id, {
          projectId: p.id,
          projectNumber: p.projectNumber,
          titleProject: p.titleProject,
          clientName: p.clientName,
          projectManagerName: p.projectManagerName,
          status: p.status,
          total: 0,
          open: 0,
        });
      }
      const agg = map.get(p.id)!;
      agg.total += 1;
      if (nc.status !== "Clôturé") {
        agg.open += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      const na = a.projectNumber ?? "";
      const nb = b.projectNumber ?? "";
      return na.localeCompare(nb, "fr-FR", { numeric: true });
    });
  }, [filteredNcs]);

  // messages Alertes & recommandations
  const strengths: string[] = [];
  const watchPoints: string[] = [];
  const recommandations: string[] = [];

  const o = kpiFiltered.open;
  const cr = kpiFiltered.criticalRate;
  const d = kpiFiltered.avgCloseDelay;

  if (o === 0) {
    strengths.push("Aucune non-conformité ouverte sur les filtres actuels.");
  } else if (o <= 3) {
    strengths.push("Volume de NC ouvertes maîtrisé sur la période filtrée.");
  } else {
    watchPoints.push(
      "Nombre de NC ouvertes élevé, risque de surcharge du plan d’actions.",
    );
    recommandations.push(
      "Planifier un point de revue qualité pour prioriser les NC ouvertes critiques.",
    );
  }

  if (cr <= 10) {
    strengths.push("Faible proportion de NC majeures/critiques.");
  } else if (cr <= 30) {
    watchPoints.push(
      "Part significative de NC majeures/critiques à surveiller.",
    );
    recommandations.push(
      "Mettre en avant les NC critiques dans les revues projets et suivre leur traitement en priorité.",
    );
  } else {
    watchPoints.push(
      "Taux de NC majeures/critiques important, risque d’impact client fort.",
    );
    recommandations.push(
      "Déployer un plan d’actions spécifique sur les causes racines des NC critiques.",
    );
  }

  if (d <= 5) {
    strengths.push("Délai moyen de clôture des NC inférieur à 5 jours.");
  } else if (d <= 15) {
    watchPoints.push(
      "Délai moyen de clôture modéré, des améliorations sont possibles.",
    );
    recommandations.push(
      "Suivre les NC en cours dans une routine hebdomadaire pour réduire les délais.",
    );
  } else {
    watchPoints.push(
      "Délai moyen de clôture élevé, risque de dérive et de récurrence des problèmes.",
    );
    recommandations.push(
      "Mettre en place des échéances cibles et des rappels pour les actions 8D.",
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "Données insuffisantes pour dégager des points forts sur les non‑conformités.",
    );
  }
  if (watchPoints.length === 0) {
    watchPoints.push(
      "Aucun point de vigilance majeur identifié sur la période filtrée.",
    );
  }
  if (recommandations.length === 0) {
    recommandations.push(
      "Maintenir le suivi actuel des NC et capitaliser les bonnes pratiques.",
    );
  }

  function formatDate(value: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR");
  }

  async function handleExportExcel() {
    if (!filteredNcs.length) {
      alert("Aucune NC à exporter.");
      return;
    }

    const headers = [
      "Ref",
      "Projet",
      "Intitulé projet",
      "Client",
      "Chef de projet",
      "Type",
      "Origine",
      "Sévérité",
      "Responsable",
      "Date détection",
      "Échéance",
      "Date clôture",
      "Statut",
      "Description",
    ];

    const rows = filteredNcs.map((nc) => [
      nc.reference ?? `NC-${nc.id}`,
      nc.project?.projectNumber ?? "",
      nc.project?.titleProject ?? "",
      nc.project?.clientName ?? "",
      nc.project?.projectManagerName ?? "",
      nc.type ?? "",
      nc.origin ?? "",
      nc.severity ?? "",
      nc.detectedBy ?? "",
      nc.detectedOn ?? "",
      nc.dueDate ?? "",
      nc.closedDate ?? "",
      nc.status ?? "",
      (nc.description ?? "").replace(/\r?\n/g, " "),
    ]);

    const lines = [
      headers.join(";"),
      ...rows.map((r) =>
        r
          .map((v) => {
            const val = String(v ?? "");
            if (val.includes(";") || val.includes('"') || val.includes("\n")) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          })
          .join(";"),
      ),
    ];

    const csv = "\ufeff" + lines.join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Non_conformites_projets.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCreateNc(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      if (!newNc.projectId) {
        throw new Error("Merci de sélectionner un projet.");
      }
      if (!newNc.description.trim()) {
        throw new Error("Merci de renseigner la description de la NC.");
      }

      const payload = {
        reference: newNc.reference || undefined,
        type: newNc.type || null,
        origin: newNc.origin || null,
        severity: newNc.severity || null,
        status: newNc.status,
        detectedOn: newNc.detectedOn || null,
        dueDate: newNc.dueDate || null,
        detectedBy: newNc.detectedBy.trim() || null,
        description: newNc.description.trim(),
        comments: newNc.comments.trim() || null,
      };

      const res = await fetch(
        `/api/projects/${newNc.projectId}/quality?type=non-conformities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "Erreur lors de la création de la NC");
      }

      setCreating(false);
      await loadData();
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  const projectsForFilters = useMemo(() => {
    const map = new Map<number, ProjectLight>();
    for (const nc of ncs) {
      const p = nc.project;
      if (!p) continue;
      if (!map.has(p.id)) {
        map.set(p.id, {
          id: p.id,
          projectNumber: p.projectNumber,
          titleProject: p.titleProject,
          clientName: p.clientName,
          projectManagerName: p.projectManagerName,
          status: p.status,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const na = a.projectNumber ?? "";
      const nb = b.projectNumber ?? "";
      return na.localeCompare(nb, "fr-FR", { numeric: true });
    });
  }, [ncs]);

  const currentMonthLabel = monthChartFilter ?? "toute la période";

  return (
    <AppShell
      activeSection="quality"
      pageTitle="Non-conformités projets"
      pageSubtitle="Vue consolidée de toutes les non‑conformités sur l’ensemble des projets."
    >
      <div className="space-y-6">
        <Link
          href="/quality"
          className="text-xs text-indigo-600 hover:underline"
        >
          ← Retour Qualité ISO 9001
        </Link>

        {error && (
          <div className="rounded bg-rose-50 text-rose-700 px-4 py-2 text-xs border border-rose-200">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
              onClick={handleExportExcel}
            >
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Nouvelle non-conformité
            </button>
            <button
              type="button"
              onClick={() =>
                router.push("/quality/deliverables-projects")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Livrables (vue projets)
            </button>
            <button
              type="button"
              onClick={() =>
                router.push("/quality/audits-projects")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Audits (vue projets)
            </button>
            <button
              type="button"
              onClick={() =>
                window.open("/synoptique-non-conformites.pdf", "_blank")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700"
            >
              Voir le synoptique non-conformité
            </button>
          </div>
          <div className="flex items-center gap-2">
          <Link
            href="/Tutoriel/projelys-nc-tutorial.html"
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

        {/* Recherche + filtres */}
        <div className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher (N° projet, client, description NC...)"
                className="w-full md:max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs mt-2">
              <div>
                <label className="block text-slate-500 mb-1">Client</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                >
                  <option value="Tous">Tous</option>
                  {Array.from(
                    new Set(
                      projectsForFilters
                        .map((p) => p.clientName ?? "")
                        .filter((v) => v.trim() !== ""),
                    ),
                  ).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">N° projet</label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterProjectNumber}
                  onChange={(e) => setFilterProjectNumber(e.target.value)}
                >
                  <option value="Tous">Tous</option>
                  {projectsForFilters.map((p) => (
                    <option
                      key={p.id}
                      value={p.projectNumber ?? `P-${p.id}`}
                    >
                      {p.projectNumber ?? `P-${p.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">
                  Chef de projet
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterPm}
                  onChange={(e) => setFilterPm(e.target.value)}
                >
                  <option value="Tous">Tous</option>
                  {Array.from(
                    new Set(
                      projectsForFilters
                        .map((p) => p.projectManagerName ?? "")
                        .filter((v) => v.trim() !== ""),
                    ),
                  ).map((pm) => (
                    <option key={pm} value={pm}>
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">
                  Statut NC
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="Tous">Tous</option>
                  {NC_STATUS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">
                  Sévérité
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <option value="Toutes">Toutes</option>
                  {NC_SEVERITY.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            label="NC ouvertes"
            value={kpiFiltered.open}
            variant="info"
          />
          <KpiCard
            label="NC totales"
            value={kpiFiltered.total}
            variant="neutral"
          />
          <KpiCard
            label="% NC critiques"
            value={kpiFiltered.criticalRate}
            suffix="%"
            variant="warning"
          />
          <KpiCard
            label="Délai moyen de clôture"
            value={kpiFiltered.avgCloseDelay}
            suffix=" j"
            variant="danger"
          />
        </div>

        {/* Alertes & recommandations */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Alertes et recommandations – Non-conformités
            </h2>
            <span className="text-[11px] text-slate-500">
              Analyse sur la période filtrée ({currentMonthLabel})
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">✅</span>
                <span className="text-[11px] font-semibold text-emerald-900">
                  Points forts
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-emerald-900">
                {strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span className="text-[11px] font-semibold text-amber-900">
                  Points de vigilance
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-900">
                {watchPoints.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📝</span>
                <span className="text-[11px] font-semibold text-indigo-900">
                  Recommandations
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-indigo-900">
                {recommandations.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Graphiques */}
        <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <NcHistogram
            title="Répartition des NC par sévérité"
            data={barsSeverity}
            description="Répartition des non‑conformités par niveau de sévérité (mineure, majeure, critique) sur les filtres actifs."
            activeLabel={severityChartFilter}
            onBarClick={(label) =>
              setSeverityChartFilter((prev) =>
                prev === label ? null : label,
              )
            }
            onReset={() => setSeverityChartFilter(null)}
          />
          <NcHistogram
            title="NC détectées par mois"
            data={barsByMonth}
            description="Suivi des NC enregistrées au fil des mois pour l’ensemble des projets filtrés."
            activeLabel={monthChartFilter}
            onBarClick={(label) =>
              setMonthChartFilter((prev) =>
                prev === label ? null : label,
              )
            }
            onReset={() => setMonthChartFilter(null)}
          />
        </div>

        {/* Tableau projets – synthèse NC */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-slate-900">
                Projets – synthèse Non‑conformités
                </h2>
                <span className="text-[11px] text-slate-500">
                {projectsSynthFiltered.length} projets
                </span>
            </div>

            {loading ? (
                <p className="text-xs text-slate-500">
                Chargement des données projets…
                </p>
            ) : projectsSynthFiltered.length === 0 ? (
                <p className="text-xs text-slate-500">
                Aucun projet avec NC pour ces filtres.
                </p>
            ) : (
                <div className="overflow-x-auto max-h-[260px]">
                <table className="min-w-full text-xs table-fixed">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                    <tr>
                        <ThMini className="w-32">N° projet</ThMini>
                        <ThMini className="w-40">Intitulé projet</ThMini>
                        <ThMini className="w-40">Client</ThMini>
                        <ThMini className="w-36">Chef de projet</ThMini>
                        <ThMini className="w-28">Statut</ThMini>
                        <ThMini className="w-28">NC totales</ThMini>
                        <ThMini className="w-28">NC ouvertes</ThMini>
                        <ThMini className="w-44 text-center">Actions</ThMini>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {projectsSynthFiltered.map((p) => (
                        <tr key={p.projectId} className="hover:bg-slate-50">
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-indigo-700">
                            <button
                            type="button"
                            onClick={() => router.push(`/projects/${p.projectId}`)}
                            className="hover:underline"
                            >
                            {p.projectNumber ?? `P-${p.projectId}`}
                            </button>
                        </td>
                        <td className="ppx-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                            {p.titleProject ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                            {p.clientName ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                            {p.projectManagerName ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                            <StatusBadge value={p.status} />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                            {p.total}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                            {p.open}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                            <div className="inline-flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                router.push(
                                    `/projects/${p.projectId}/quality/deliverables`,
                                )
                                }
                                className="px-2 py-0.5 rounded border border-indigo-300 bg-indigo-50 text-[10px] text-indigo-700 hover:bg-indigo-100"
                            >
                                Livrables
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                router.push(
                                    `/projects/${p.projectId}/quality/non-conformities`,
                                )
                                }
                                className="px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-[10px] text-amber-700 hover:bg-amber-100"
                            >
                                Non‑conformités
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                router.push(
                                    `/projects/${p.projectId}/quality/audit`,
                                )
                                }
                                className="px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-100"
                            >
                                Audits
                            </button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            )}  
            </section>


        {/* panneau latéral nouvelle NC globale */}
        {creating && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="flex-1 bg-black/40"
              onClick={() => {
                if (!saving) setCreating(false);
              }}
            />
            <aside className="w-full max-w-3xl bg-white shadow-xl border-l border-slate-200">
              <div className="flex flex-col h-full">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Nouvelle non-conformité (tous projets)
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Sélectionner le projet puis saisir les informations principales de la NC.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      if (!saving) setCreating(false);
                    }}
                    disabled={saving}
                  >
                    Fermer
                  </button>
                </div>

                <form
                  onSubmit={handleCreateNc}
                  className="p-4 space-y-4 text-xs overflow-auto max-h-[calc(100vh-60px)]"
                >
                  <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      Identification
                    </h3>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1 col-span-3 sm:col-span-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Projet *
                        </label>
                        <select
                          className="border rounded px-2 py-1 w-full text-xs bg-white"
                          value={newNc.projectId ?? ""}
                          onChange={(e) =>
                            setNewNc((prev) => ({
                              ...prev,
                              projectId:
                                e.target.value === ""
                                  ? null
                                  : Number(e.target.value),
                            }))
                          }
                          required
                        >
                          <option value="">Sélectionner un projet</option>
                          {allProjects
                            .slice()
                            .sort((a, b) => {
                              const na = a.projectNumber ?? "";
                              const nb = b.projectNumber ?? "";
                              return na.localeCompare(nb, "fr-FR", {
                                numeric: true,
                              });
                            })
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.projectNumber ?? `P-${p.id}`} –{" "}
                                {p.titleProject ?? ""}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="space-y-1 col-span-3 sm:col-span-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Référence chrono
                        </label>
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full text-xs bg-slate-100 text-slate-500"
                          value={newNc.reference}
                          disabled
                        />
                      </div>

                      <div className="space-y-1 col-span-3 sm:col-span-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Responsable / pilote NC
                        </label>
                        <input
                          className="border rounded px-2 py-1 w-full text-xs bg-white"
                          value={newNc.detectedBy}
                          onChange={(e) =>
                            setNewNc((prev) => ({
                              ...prev,
                              detectedBy: e.target.value,
                            }))
                          }
                          placeholder="Nom du pilote ou de l’équipe 8D"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Origine
                        </label>
                        <select
                          className="border rounded px-2 py-1 w-full text-xs bg-white"
                          value={newNc.origin}
                          onChange={(e) =>
                            setNewNc((prev) => ({
                              ...prev,
                              origin: e.target.value,
                            }))
                          }
                        >
                          <option value="">Sélectionner</option>
                          {NC_ORIGINS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Type de NC
                        </label>
                        <select
                          className="border rounded px-2 py-1 w-full text-xs bg-white"
                          value={newNc.type}
                          onChange={(e) =>
                            setNewNc((prev) => ({
                              ...prev,
                              type: e.target.value,
                            }))
                          }
                        >
                          <option value="">Sélectionner</option>
                          {NC_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Sévérité
                        </label>
                        <select
                          className="border rounded px-2 py-1 w-full text-xs bg-white"
                          value={newNc.severity}
                          onChange={(e) =>
                            setNewNc((prev) => ({
                              ...prev,
                              severity: e.target.value,
                            }))
                          }
                        >
                          <option value="">Sélectionner</option>
                          {NC_SEVERITY.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Statut
                        </label>
                        <select
                          className="border rounded px-2 py-1 w-full text-xs bg-white"
                          value={newNc.status}
                          onChange={(e) =>
                            setNewNc((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                        >
                          {NC_STATUS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Date de détection
                        </label>
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full text-xs"
                          value={newNc.detectedOn}
                          onChange={(e) =>
                            setNewNc((prev) => ({
                              ...prev,
                              detectedOn: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Échéance de traitement
                        </label>
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full text-xs"
                          value={newNc.dueDate}
                          onChange={(e) =>
                            setNewNc((prev) => ({
                              ...prev,
                              dueDate: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      Description de la non-conformité
                    </h3>
                    <textarea
                      className="border rounded px-2 py-1 w-full text-xs h-20"
                      value={newNc.description}
                      onChange={(e) =>
                        setNewNc((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      required
                      placeholder="Décrire l’objet de la NC, le contexte, les exigences impactées, les conséquences potentielles…"
                    />
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      Commentaires / notes internes
                    </h3>
                    <textarea
                      className="border rounded px-2 py-1 w-full text-xs h-16"
                      value={newNc.comments}
                      onChange={(e) =>
                        setNewNc((prev) => ({
                          ...prev,
                          comments: e.target.value,
                        }))
                      }
                      placeholder="Compléter avec des informations utiles pour le suivi interne."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        if (!saving) setCreating(false);
                      }}
                      disabled={saving}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saving ? "Enregistrement..." : "Enregistrer la NC"}
                    </button>
                  </div>
                </form>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* Composants auxiliaires */

type KpiCardProps = {
  label: string;
  value: number;
  suffix?: string;
  variant?: "info" | "neutral" | "warning" | "danger";
};

function KpiCard({
  label,
  value,
  suffix = "",
  variant = "neutral",
}: KpiCardProps) {
  let container = "bg-slate-50 border-slate-200";
  if (variant === "info") container = "bg-indigo-50 border-indigo-200";
  if (variant === "warning") container = "bg-amber-50 border-amber-200";
  if (variant === "danger") container = "bg-rose-50 border-rose-200";

  const display = Number.isFinite(value) ? value.toFixed(1) : "0";

  return (
    <div className={`rounded-lg border px-4 py-3 shadow-sm ${container}`}>
      <div className="text-[11px] font-medium uppercase text-slate-700">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">
        {display}
        {suffix}
      </div>
    </div>
  );
}

type NcHistogramProps = {
  title: string;
  data: { label: string; value: number }[];
  description: string;
  activeLabel: string | null;
  onBarClick?: (label: string | null) => void;
  onReset: () => void;
};

function NcHistogram({
  title,
  data,
  description,
  activeLabel,
  onBarClick,
  onReset,
}: NcHistogramProps) {
  const maxCount = data.reduce((m, p) => (p.value > m ? p.value : m), 0);
  const safeMax = maxCount === 0 ? 1 : maxCount;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-900 mb-2">
        {title}
      </h2>

      {data.length === 0 ? (
        <div className="text-[11px] text-slate-500">
          Aucune donnée avec les filtres actuels.
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            <div className="flex flex-1 items-end">
              <div className="flex flex-col justify-between text-[10px] text-slate-400 pr-2 h-40">
                <span>{safeMax}</span>
                <span>0</span>
              </div>

              <div className="relative flex-1 h-40 overflow-hidden">
                <div className="absolute left-0 right-0 bottom-0 h-px bg-slate-300" />
                <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-300" />

                <div className="absolute inset-x-4 bottom-0 top-0 flex items-end gap-4 pb-0">
                  {data.map((item) => {
                    const heightPct = safeMax
                      ? (item.value / safeMax) * 100
                      : 0;
                    const active = activeLabel === item.label;

                    const lower = item.label.toLowerCase();
                    let barColor = "bg-indigo-400";
                    if (lower.includes("critique")) barColor = "bg-rose-400";
                    else if (lower.includes("majeur"))
                      barColor = "bg-amber-400";
                    else if (lower.includes("mineur"))
                      barColor = "bg-emerald-400";

                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() =>
                          onBarClick &&
                          onBarClick(active ? null : item.label)
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
                            title={`${item.value} NC`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-2 px-4 flex gap-4 justify-start">
              {data.map((item) => (
                <div
                  key={item.label}
                  className="flex-1 min-w-[70px] flex flex-col items-center"
                >
                  <span className="text-[10px] text-slate-600 text-center truncate max-w-[80px]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-600 space-y-1">
            <p>{description}</p>
            {onBarClick && (
              <p>
                Cliquer sur une barre filtre tous les indicateurs, le tableau
                et les recommandations sur la valeur sélectionnée.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onReset}
            className="mt-1 text-[10px] text-indigo-600 hover:underline"
          >
            Réinitialiser le filtre graphique
          </button>
        </>
      )}
    </div>
  );
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  const v = (value ?? "").toLowerCase();

  let classes =
    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-700";

  if (v.includes("en cours") || v.includes("ouvert")) {
    classes =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-amber-200 bg-amber-50 text-amber-800";
  } else if (v.includes("termin") || v.includes("clôt") || v.includes("clos")) {
    classes =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-emerald-200 bg-emerald-50 text-emerald-800";
  } else if (v.includes("annul")) {
    classes =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-slate-200 bg-slate-50 text-slate-600";
  } else if (v.includes("critique") || v.includes("bloqué")) {
    classes =
      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border border-rose-200 bg-rose-50 text-rose-800";
  }

  return <span className={classes}>{value ?? "—"}</span>;
}
