"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/app/components/AppShell";

type Deliverable = {
  id: number;
  projectId: number;
  reference: string | null;
  title: string;
  type: string | null;
  description: string | null;
  owner: string | null;
  clientReference: string | null;
  internalVersion: string | null;
  clientVersion: string | null;
  contractualDate: string | null;
  revisedDate: string | null;
  deliveredDate: string | null;
  validatedDate: string | null;
  progress: number | null;
  status: string;
  qualityStatus: string | null;
  validatedBy: string | null;
  comments: string | null;
  linkDoc: string | null;
  createdAt: string;
  updatedAt: string;
};

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

const DELIVERABLE_TYPES = [
  "Livrable projet",
  "Livrable contractuel",
  "Jalon",
  "Rapport",
  "Spécification",
];

const DELIVERABLE_STATUS = [
  "Non commencé",
  "En cours",
  "Livré",
  "En validation",
  "Validé",
  "Refusé",
  "Accepté avec réserves",
  "Annulé",
];

type NewDeliverable = {
  reference: string;
  type: string;
  projectId: number | null;
  title: string;
  description: string;
  owner: string;
  clientReference: string;
  contractualDate: string;
  revisedDate: string;
  deliveredDate: string;
  validatedDate: string;
  progress: number;
  status: string;
};

type BarPoint = { label: string; value: number; extra?: number };

export default function ProjectDeliverablesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routeProjectId = Number(params.id);

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [filterOwner, setFilterOwner] = useState<string>("Tous");
  const [filterStatus, setFilterStatus] = useState<string>("Tous");
  const [filterType, setFilterType] = useState<string>("Tous");
  const [filterDueDate, setFilterDueDate] = useState<string>("Toutes");

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editDeliverable, setEditDeliverable] = useState<Deliverable | null>(
    null,
  );
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState<number | null>(null);

  const [editProgress, setEditProgress] = useState<number>(0);
  const [editProgressComment, setEditProgressComment] = useState<string>("");

  const [newDeliverable, setNewDeliverable] = useState<NewDeliverable>({
    reference: "",
    type: "",
    projectId: routeProjectId || null,
    title: "",
    description: "",
    owner: "",
    clientReference: "",
    contractualDate: "",
    revisedDate: "",
    deliveredDate: "",
    validatedDate: "",
    progress: 0,
    status: "Non commencé",
  });

  // Filtre graphique par mois (clé "YYYY-MM" ou null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // ---------- Chargement données ----------

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [projRes, delivRes] = await Promise.all([
        fetch("/api/projects"),
        fetch(`/api/quality/deliverables?projectId=${routeProjectId}`),
      ]);

      if (!projRes.ok) {
        throw new Error("Erreur de chargement des projets");
      }
      if (!delivRes.ok) {
        const d = await delivRes.json().catch(() => null);
        throw new Error(d?.error ?? "Erreur de chargement des livrables");
      }

      const projData = (await projRes.json()) as Project[];
      const delivData = (await delivRes.json()) as Deliverable[];

      setProjects(projData);
      setDeliverables(delivData);

      const proj = projData.find((p) => p.id === routeProjectId) ?? null;
      setCurrentProject(proj);

      const nextRef = computeNextReference(delivData, "Liv");
      setNewDeliverable((prev) => ({
        ...prev,
        projectId: routeProjectId || prev.projectId,
        reference: nextRef,
      }));
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!routeProjectId) return;
    loadData();
  }, [routeProjectId]);

  // ---------- Référence auto ----------

  function computeNextReference(
    existing: Deliverable[],
    prefixBare: "Liv" | "NC",
  ): string {
    const year = new Date().getFullYear();
    const prefix = `${prefixBare}_${year}_`;
    const refs = existing
      .map((d) => d.reference)
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

  const projectLabel =
    currentProject?.projectNumber ??
    (currentProject ? `P-${currentProject.id}` : `P-${routeProjectId}`);

  // ---------- Export Excel ----------

  function handleExportExcel() {
    if (!deliverables.length) {
      alert("Aucun livrable à exporter.");
      return;
    }

    const headers = [
      "Id",
      "Projet",
      "Référence",
      "Intitulé",
      "Type",
      "Responsable",
      "Référence client",
      "Date contractuelle",
      "Date prévue",
      "Date livrée",
      "Date validation",
      "Statut",
      "Dernière mise à jour",
      "Commentaires",
    ];

    const rows = deliverables.map((d) => [
      d.id,
      d.projectId,
      d.reference ?? "",
      d.title ?? "",
      d.type ?? "",
      d.owner ?? "",
      d.clientReference ?? "",
      d.contractualDate ?? "",
      d.revisedDate ?? "",
      d.deliveredDate ?? "",
      d.validatedDate ?? "",
      d.status ?? "",
      (d.comments ?? "").replace(/\r?\n/g, " "),
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
    link.download = `Livrables_${projectLabel}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Création livrable ----------

  async function handleCreateDeliverable(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      if (!newDeliverable.title.trim()) {
        throw new Error("Merci de renseigner l'intitulé du livrable.");
      }

      const projectIdToUse = routeProjectId || newDeliverable.projectId;
      if (!projectIdToUse) {
        throw new Error("Projet introuvable pour ce livrable.");
      }

      const payload = {
        reference:
          newDeliverable.reference && newDeliverable.reference !== ""
            ? newDeliverable.reference
            : undefined,
        title: newDeliverable.title.trim(),
        type: newDeliverable.type || null,
        description: newDeliverable.description.trim() || null,
        owner: newDeliverable.owner.trim() || null,
        clientReference: newDeliverable.clientReference.trim() || null,
        contractualDate: newDeliverable.contractualDate || null,
        revisedDate: newDeliverable.revisedDate || null,
        deliveredDate: newDeliverable.deliveredDate || null,
        validatedDate: newDeliverable.validatedDate || null,
        progress: newDeliverable.progress ?? 0,
        status: newDeliverable.status,
      };

      const res = await fetch(
        `/api/quality/deliverables?projectId=${projectIdToUse}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.error ?? "Erreur lors de la création du livrable",
        );
      }

      setCreating(false);
      await loadData();
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Mise à jour livrable ----------

  function openEdit(d: Deliverable) {
    setEditDeliverable(d);
    setEditProgress(0);
    setEditProgressComment("");
  }

  async function handleUpdateDeliverable(e: React.FormEvent) {
    e.preventDefault();
    if (!editDeliverable) return;

    try {
      setSavingUpdate(true);
      setError(null);

      const payload = {
        title: editDeliverable.title,
        type: editDeliverable.type,
        owner: editDeliverable.owner,
        contractualDate: editDeliverable.contractualDate,
        revisedDate: editDeliverable.revisedDate,
        deliveredDate: editDeliverable.deliveredDate,
        validatedDate: editDeliverable.validatedDate,
        progress: editDeliverable.progress ?? 0,
        status: editDeliverable.status,
        comments: editDeliverable.comments,
      };

      const res = await fetch(
        `/api/quality/deliverables?id=${editDeliverable.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "Erreur lors de la mise à jour");
      }

      setEditDeliverable(null);
      await loadData();
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setSavingUpdate(false);
    }
  }

  // ---------- Suppression ----------

  async function handleDeleteDeliverable(d: Deliverable) {
    const ok = window.confirm(
      `Supprimer le livrable "${d.reference ?? d.title}" ?`,
    );
    if (!ok) return;

    try {
      setLoadingDelete(d.id);
      setError(null);
      const res = await fetch(
        `/api/quality/deliverables?id=${d.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Erreur lors de la suppression");
      }
      await loadData();
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setLoadingDelete(null);
    }
  }

  // ---------- Helpers UI ----------

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fr-FR");
  }

  function statusBadge(status: string) {
    let color =
      "bg-slate-100 text-slate-700 border border-slate-200";

    if (
      status === "Validé" ||
      status === "Livré" ||
      status === "Accepté avec réserves"
    ) {
      color =
        "bg-emerald-100 text-emerald-700 border border-emerald-200";
    } else if (status === "En cours" || status === "En validation") {
      color =
        "bg-amber-100 text-amber-700 border border-amber-200";
    } else if (status === "Non commencé") {
      color = "bg-blue-100 text-blue-700 border-blue-200";
    } else if (status === "Refusé") {
      color = "bg-rose-100 text-rose-700 border-rose-200";
    } else if (status === "Annulé") {
      color = "bg-slate-50 text-slate-400 border border-slate-200";
    }

    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] ${color}`}>
        {status}
      </span>
    );
  }

  const toInputDate = (val: string | null) =>
    val ? val.slice(0, 10) : "";

  // ---------- Filtres tableau ----------

  const filteredDeliverables = useMemo(() => {
    const list = deliverables.filter((d) => {
      if (filterStatus !== "Tous" && d.status !== filterStatus) {
        return false;
      }
      if (filterType !== "Tous" && d.type !== filterType) {
        return false;
      }
      if (filterOwner !== "Tous" && d.owner !== filterOwner) {
        return false;
      }

      if (filterDueDate !== "Toutes") {
        if (!d.contractualDate) return false;
        const today = new Date();
        const due = new Date(d.contractualDate);
        if (Number.isNaN(due.getTime())) return false;

        if (filterDueDate === "En retard") {
          if (d.status === "Validé" || d.status === "Livré") {
            const done = d.deliveredDate ? new Date(d.deliveredDate) : null;
            if (done && done <= due) return false;
          } else if (today <= due) {
            return false;
          }
        }

        if (filterDueDate === "À venir (30 j)") {
          const in30 = new Date();
          in30.setDate(today.getDate() + 30);
          if (due < today || due > in30) {
            return false;
          }
        }
      }

      if (search.trim()) {
        const needle = search.toLowerCase();
        const haystack =
          `${d.reference ?? ""} ${d.title ?? ""} ${d.owner ?? ""} ${
            d.clientReference ?? ""
          }`.toLowerCase();
        if (!haystack.includes(needle)) {
          return false;
        }
      }

      return true;
    });

    // tri par réf
    return list.sort((a: Deliverable, b: Deliverable) => {
      const ra = a.reference ?? "";
      const rb = b.reference ?? "";
      return ra.localeCompare(rb, "fr-FR", {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [deliverables, filterStatus, filterType, filterOwner, filterDueDate, search]);

  // ---------- Filtre graphique par mois ----------

  // le tableau DOIT réagir au clic sur une barre → on filtre les lignes sur le même mois
  const filteredDeliverablesForTable = useMemo(() => {
    if (!selectedMonth) return filteredDeliverables;
    return filteredDeliverables.filter((d) => {
      const dateStr = d.revisedDate ?? d.contractualDate;
      if (!dateStr) return false;
      const dt = new Date(dateStr);
      if (Number.isNaN(dt.getTime())) return false;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0",
      )}`;
      return key === selectedMonth;
    });
  }, [filteredDeliverables, selectedMonth]);

  const deliverablesForCharts = useMemo(() => {
    if (!selectedMonth) return filteredDeliverables;
    return filteredDeliverablesForTable;
  }, [filteredDeliverables, filteredDeliverablesForTable, selectedMonth]);

  // ---------- Données graphiques ----------

  // Volume = livrables livrés (deliveredDate)
  function buildMonthlyCounts(items: Deliverable[]): BarPoint[] {
    const map = new Map<string, number>();

    for (const d of items) {
      const dateStr = d.deliveredDate;
      if (!dateStr) continue;
      const dDate = new Date(dateStr);
      if (Number.isNaN(dDate.getTime())) continue;

      const key = `${dDate.getFullYear()}-${String(
        dDate.getMonth() + 1,
      ).padStart(2, "0")}`;

      map.set(key, (map.get(key) ?? 0) + 1);
    }

    const sortedKeys = Array.from(map.keys()).sort();
    return sortedKeys.map((k) => ({
      label: k,
      value: map.get(k) ?? 0,
    }));
  }

  function buildMonthlyRate(
    items: Deliverable[],
    metric: "otd" | "oqd" | "dod",
  ): BarPoint[] {
    const bucket: Record<string, { planned: Deliverable[] }> = {};

    for (const d of items) {
      const dateStr = d.revisedDate ?? d.contractualDate;
      if (!dateStr) continue;
      const dDate = new Date(dateStr);
      if (Number.isNaN(dDate.getTime())) continue;

      const key = `${dDate.getFullYear()}-${String(
        dDate.getMonth() + 1,
      ).padStart(2, "0")}`;

      if (!bucket[key]) bucket[key] = { planned: [] };
      bucket[key].planned.push(d);
    }

    const keys = Object.keys(bucket).sort();

    return keys.map((k) => {
      const list = bucket[k].planned;
      const delivered = list.filter((d) => d.deliveredDate);

      if (metric === "otd") {
        const onTime = delivered.filter((d) => {
          const refDate =
            d.revisedDate ?? d.contractualDate ?? d.deliveredDate;
          if (!refDate || !d.deliveredDate) return false;
          return new Date(d.deliveredDate) <= new Date(refDate);
        });
        const value =
          delivered.length === 0
            ? 0
            : (onTime.length / delivered.length) * 100;
        return { label: k, value, extra: delivered.length };
      }

      if (metric === "oqd") {
        const evaluated = delivered.filter(
          (d) => d.status === "Validé" || d.status === "Refusé",
        );
        const validated = evaluated.filter((d) => d.status === "Validé");
        const value =
          evaluated.length === 0
            ? 0
            : (validated.length / evaluated.length) * 100;
        return { label: k, value, extra: validated.length };
      }

      const late = delivered.filter((d) => {
        const refDate =
          d.revisedDate ?? d.contractualDate ?? d.deliveredDate;
        if (!refDate || !d.deliveredDate) return false;
        return new Date(d.deliveredDate) > new Date(refDate);
      });

      let dodMonth = 0;
      if (late.length > 0) {
        const totalDays = late.reduce((sum, d) => {
          const refDate =
            d.revisedDate ?? d.contractualDate ?? d.deliveredDate;
          if (!refDate || !d.deliveredDate) return sum;
          const diff =
            new Date(d.deliveredDate).getTime() -
            new Date(refDate).getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }, 0);
        dodMonth = totalDays / late.length;
      }
      return { label: k, value: dodMonth, extra: late.length };
    });
  }

  const barsCount = useMemo(
    () => buildMonthlyCounts(deliverablesForCharts),
    [deliverablesForCharts],
  );
  const barsOtd = useMemo(
    () => buildMonthlyRate(deliverablesForCharts, "otd"),
    [deliverablesForCharts],
  );
  const barsOqd = useMemo(
    () => buildMonthlyRate(deliverablesForCharts, "oqd"),
    [deliverablesForCharts],
  );
  const barsDod = useMemo(
    () => buildMonthlyRate(deliverablesForCharts, "dod"),
    [deliverablesForCharts],
  );

  // ---------- KPI locaux + score avancé ----------

  const localKpi = useMemo<QualityKpi & { planningReliability: number }>(() => {
    const items = deliverablesForCharts;
    const delivered = items.filter((d) => d.deliveredDate);
    const total = items.length;

    const onTime = delivered.filter((d) => {
      const refDate =
        d.revisedDate ?? d.contractualDate ?? d.deliveredDate;
      if (!refDate || !d.deliveredDate) return false;
      return new Date(d.deliveredDate) <= new Date(refDate);
    });

    const evaluated = delivered.filter(
      (d) => d.status === "Validé" || d.status === "Refusé",
    );
    const validated = evaluated.filter((d) => d.status === "Validé");

    const late = delivered.filter((d) => {
      const refDate =
        d.revisedDate ?? d.contractualDate ?? d.deliveredDate;
      if (!refDate || !d.deliveredDate) return false;
      return new Date(d.deliveredDate) > new Date(refDate);
    });

    let dod = 0;
    if (late.length > 0) {
      const totalDays = late.reduce((sum, d) => {
        const refDate =
          d.revisedDate ?? d.contractualDate ?? d.deliveredDate;
        if (!refDate || !d.deliveredDate) return sum;
        const diff =
          new Date(d.deliveredDate).getTime() -
          new Date(refDate).getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }, 0);
      dod = totalDays / late.length;
    }

    const otd =
      delivered.length === 0
        ? 0
        : (onTime.length / delivered.length) * 100;
    const oqd =
      evaluated.length === 0
        ? 0
        : (validated.length / evaluated.length) * 100;

    // Score de fiabilité planning (mélange volume, OTD, DoD)
    const volumeFactor = Math.min(delivered.length / (total || 1), 1);
    const dodPenalty = dod > 0 ? Math.max(0, 1 - dod / 10) : 1; // au‑delà de 10 j de retard moyen, grosse pénalité
    const planningReliability = Math.round(
      ((otd / 100) * 0.5 + volumeFactor * 0.3 + dodPenalty * 0.2) * 100,
    );

    return {
      deliverables: {
        total,
        delivered: delivered.length,
        onTime: onTime.length,
        otd,
        oqd,
        dod,
      },
      nonConformities: {
        total: 0,
        open: 0,
        critical: 0,
        criticalRate: 0,
        avgCloseDelay: 0,
      },
      planningReliability,
    };
  }, [deliverablesForCharts]);

  const currentMonthLabel = selectedMonth ?? "toute la période";

  // ---------- Rendu ----------

  return (
    <AppShell
      activeSection="quality"
      pageTitle={`Livrables – ${projectLabel}`}
      pageSubtitle="Suivi détaillé des livrables qualité du projet."
    >
      <div className="space-y-6">
        <Link
          href={"/quality/deliverables-projects"}
          className="text-xs text-indigo-600 hover:underline"
        >
          ← Retour vue livrables projets
        </Link>

        {error && (
          <div className="rounded bg-rose-50 text-rose-700 px-4 py-2 text-xs border border-rose-200">
            {error}
          </div>
        )}

        {/* Actions haut de page */}
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
              Nouveau livrable
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(`/projects/${routeProjectId}/quality/non-conformities`)
              }
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Voir les NC du projet
            </button>

            <button
              type="button"
              onClick={() => router.push(`/projects/${routeProjectId}/quality/audit`)}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Voir les audits
            </button>

            <button
              type="button"
              onClick={() =>
                window.open("/synoptique-livrables.pdf", "_blank")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700"
            >
              Voir le synoptique livrables
            </button>
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
                placeholder="Rechercher (réf, intitulé, responsable...)"
                className="w-full md:max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs mt-2">
              <div>
                <label className="block text-slate-500 mb-1">
                  Responsable
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                >
                  <option value="Tous">Tous</option>
                  {Array.from(
                    new Set(
                      deliverables
                        .map((d) => d.owner ?? "")
                        .filter((v) => v.trim() !== ""),
                    ),
                  ).map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">
                  Statut
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="Tous">Tous les statuts</option>
                  {DELIVERABLE_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">
                  Type
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="Tous">Tous les types</option>
                  {DELIVERABLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">
                  Date d’échéance
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterDueDate}
                  onChange={(e) => setFilterDueDate(e.target.value)}
                >
                  <option value="Toutes">Toutes</option>
                  <option value="En retard">En retard</option>
                  <option value="À venir (30 j)">À venir (30 j)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* KPI principaux + score avancé */}
        <section className="grid gap-4 md:grid-cols-5">
          <KpiCard
            label="Livrables livrés"
            value={localKpi.deliverables.delivered}
            suffix=""
            loading={false}
            variant="success"
          />
          <KpiCard
            label="OTD"
            value={localKpi.deliverables.otd}
            suffix="%"
            loading={false}
            variant="info"
          />
          <KpiCard
            label="OQD"
            value={localKpi.deliverables.oqd}
            suffix="%"
            loading={false}
            variant="info"
          />
          <KpiCard
            label="DoD"
            value={localKpi.deliverables.dod}
            suffix=" j"
            loading={false}
            variant="warning"
          />
          <KpiCard
            label="Fiabilité planning"
            value={localKpi.planningReliability}
            suffix="/100"
            loading={false}
            variant={localKpi.planningReliability >= 80 ? "success" : "warning"}
          />
        </section>

        {/* Graphiques + analyses sous chaque graphe */}
        <section className="grid gap-4 lg:grid-cols-2">
          <BarChart
            title="Nb de livrables par mois"
            data={barsCount}
            unit=""
            selectedLabel={selectedMonth}
            onBarClick={(label) =>
              setSelectedMonth((prev) => (prev === label ? null : label))
            }
            integerYAxis
            description={`Suivi des livrables livrés par mois pour ${currentMonthLabel}.`}
            hint="Cliquer sur une barre pour filtrer tous les indicateurs, les graphiques et le tableau sur le mois concerné."
            onResetFilter={() => setSelectedMonth(null)}
          />
          <BarChart
            title="OTD par mois (%)"
            data={barsOtd}
            unit="%"
            selectedLabel={selectedMonth}
            onBarClick={(label) =>
              setSelectedMonth((prev) => (prev === label ? null : label))
            }
            description="Respect des délais de livraison par mois."
            hint="Les valeurs faibles d’OTD indiquent un risque de dérive planning. Surveiller les mois en dessous de 80 %."
            onResetFilter={() => setSelectedMonth(null)}
          />
          <BarChart
            title="OQD par mois (%)"
            data={barsOqd}
            unit="%"
            selectedLabel={selectedMonth}
            onBarClick={(label) =>
              setSelectedMonth((prev) => (prev === label ? null : label))
            }
            description="Qualité des livrables évalués (validés vs refusés)."
            hint="Le texte au‑dessus de chaque barre indique le pourcentage et le nombre de livrables validés."
            onResetFilter={() => setSelectedMonth(null)}
          />
          <BarChart
            title="DoD par mois (j)"
            data={barsDod}
            unit=" j"
            selectedLabel={selectedMonth}
            onBarClick={(label) =>
              setSelectedMonth((prev) => (prev === label ? null : label))
            }
            description="Profondeur moyenne des retards de livraison."
            hint="Au‑delà de 5 j de retard moyen, prévoir des plans d’action correctifs sur la chaîne de validation."
            onResetFilter={() => setSelectedMonth(null)}
          />
        </section>

        {/* Tableau livrables (réagit au filtre mois) */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Livrables du projet
            </h2>
            <span className="text-[11px] text-slate-500">
              {filteredDeliverablesForTable.length} livrables filtrés
            </span>
          </div>

          {loading ? (
            <p className="text-xs text-slate-500">
              Chargement des livrables…
            </p>
          ) : filteredDeliverablesForTable.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aucun livrable qualité pour ce projet avec ces filtres.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[260px]">
              <table className="min-w-full text-xs table-fixed">
                <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-32">
                      Réf
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-32">
                      N° projet
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-64">
                      Intitulé
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                      Responsable
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                      Date contractuelle
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                      Date fin Màj (échéance revue)
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                      Date réalisée
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                      Date validation
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                      Avancement
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100 w-40">
                      Statut
                    </th>
                    <th className="px-3 py-2 text-left font-medium bg-slate-100">
                      Commentaires
                    </th>
                    <th className="px-3 py-2 text-center font-medium bg-slate-100 w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeliverablesForTable.map((d) => {
                    const proj = projects.find((p) => p.id === d.projectId);
                    const projNum =
                      proj?.projectNumber ?? `P-${proj?.id ?? d.projectId}`;
                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-800">
                          <button
                            type="button"
                            onClick={() => openEdit(d)}
                            className="text-indigo-600 hover:underline"
                          >
                            {d.reference ?? "—"}
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-800">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/projects/${d.projectId}`)
                            }
                            className="text-indigo-600 hover:underline"
                          >
                            {projNum}
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-800">
                          {d.title}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {d.type ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {d.owner ?? "—"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {formatDate(d.contractualDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {formatDate(d.revisedDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {formatDate(d.deliveredDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          {formatDate(d.validatedDate)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-1.5 bg-indigo-500"
                                style={{
                                  width: `${Math.min(
                                    Math.max(d.progress ?? 0, 0),
                                    100,
                                  )}%`,
                                }}
                              />
                            </div>
                            <span>
                              {d.progress != null ? `${d.progress}%` : "0%"}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          {statusBadge(d.status)}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="whitespace-pre-wrap max-w-[420px] text-[11px] text-slate-800">
                            {d.comments ?? "—"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(d)}
                              className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] text-slate-700"
                            >
                              MaJ livrable
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDeliverable(d)}
                              title="Supprimer le livrable"
                              className={`h-7 w-7 flex items-center justify-center rounded-full border ${
                                loadingDelete === d.id
                                  ? "bg-rose-100 border-rose-200 text-rose-400 cursor-wait"
                                  : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                              }`}
                              disabled={loadingDelete === d.id}
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Panneau latéral création livrable */}
        {creating && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="flex-1 bg-black/40"
              onClick={() => setCreating(false)}
            />
            <aside className="w-full max-w-md bg-white shadow-xl border-l border-slate-200 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Nouveau livrable
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Saisie guidée avec aide-mémoire qualité.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-700"
                  onClick={() => setCreating(false)}
                >
                  Fermer
                </button>
              </div>

              <form
                onSubmit={handleCreateDeliverable}
                className="space-y-4 text-xs"
              >
                {/* Identification */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
                  <h3 className="text-[11px] font-semibold text-slate-800">
                    Identification
                  </h3>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Référence (auto)
                    </label>
                    <input
                      className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-100 text-slate-500 text-xs"
                      value={newDeliverable.reference}
                      disabled
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      N° projet
                    </label>
                    <input
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-slate-100 text-slate-700"
                      value={projectLabel}
                      disabled
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Type
                    </label>
                    <select
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                      value={newDeliverable.type}
                      onChange={(e) =>
                        setNewDeliverable((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                    >
                      <option value="">Sélectionner</option>
                      {DELIVERABLE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Intitulé du livrable *
                    </label>
                    <input
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                      value={newDeliverable.title}
                      onChange={(e) =>
                        setNewDeliverable((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Description / contenu attendu
                    </label>
                    <textarea
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white h-20"
                      value={newDeliverable.description}
                      onChange={(e) =>
                        setNewDeliverable((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Responsabilités & planning */}
                <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-white">
                  <h3 className="text-[11px] font-semibold text-slate-800">
                    Responsabilités & planning
                  </h3>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        Responsable
                      </label>
                      <input
                        className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                        value={newDeliverable.owner}
                        onChange={(e) =>
                          setNewDeliverable((prev) => ({
                            ...prev,
                            owner: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        Référence client
                      </label>
                      <input
                        className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                        value={newDeliverable.clientReference}
                        onChange={(e) =>
                          setNewDeliverable((prev) => ({
                            ...prev,
                            clientReference: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        Date contractuelle
                      </label>
                      <input
                        type="date"
                        className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                        value={newDeliverable.contractualDate}
                        onChange={(e) =>
                          setNewDeliverable((prev) => ({
                            ...prev,
                            contractualDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        Date de fin Màj (échéance revue)
                      </label>
                      <input
                        type="date"
                        className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                        value={newDeliverable.revisedDate}
                        onChange={(e) =>
                          setNewDeliverable((prev) => ({
                            ...prev,
                            revisedDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        Date réalisée (si déjà livrée)
                      </label>
                      <input
                        type="date"
                        className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                        value={newDeliverable.deliveredDate}
                        onChange={(e) =>
                          setNewDeliverable((prev) => ({
                            ...prev,
                            deliveredDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        Date validation (si déjà validé)
                      </label>
                      <input
                        type="date"
                        className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                        value={newDeliverable.validatedDate}
                        onChange={(e) =>
                          setNewDeliverable((prev) => ({
                            ...prev,
                            validatedDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Statut initial
                    </label>
                    <select
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                      value={newDeliverable.status}
                      onChange={(e) =>
                        setNewDeliverable((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                    >
                      {DELIVERABLE_STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    className="border border-slate-300 rounded px-3 py-1 text-xs bg-white hover:bg-slate-50"
                    onClick={() => setCreating(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-indigo-600 px-4 py-1.5 text-xs text-white disabled:opacity-50"
                  >
                    {saving ? "Enregistrement…" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        )}

        {/* Panneau latéral maj livrable */}
        {editDeliverable && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="flex-1 bg-black/40"
              onClick={() => setEditDeliverable(null)}
            />
            <aside className="w-full max-w-md bg-white shadow-xl border-l border-slate-200 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <h2 className="text-sm font-semibold text-slate-900">
                    MaJ livrable
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Référence{" "}
                    {editDeliverable.reference ??
                      `LIV-${editDeliverable.id}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-700"
                  onClick={() => setEditDeliverable(null)}
                >
                  Fermer
                </button>
              </div>

              <form
                onSubmit={handleUpdateDeliverable}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Intitulé
                  </label>
                  <input
                    className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                    value={editDeliverable.title}
                    onChange={(e) =>
                      setEditDeliverable((prev) =>
                        prev ? { ...prev, title: e.target.value } : prev,
                      )
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Responsable
                  </label>
                  <input
                    className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                    value={editDeliverable.owner ?? ""}
                    onChange={(e) =>
                      setEditDeliverable((prev) =>
                        prev ? { ...prev, owner: e.target.value } : prev,
                      )
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Statut
                  </label>
                  <select
                    className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                    value={editDeliverable.status}
                    onChange={(e) =>
                      setEditDeliverable((prev) =>
                        prev ? { ...prev, status: e.target.value } : prev,
                      )
                    }
                  >
                    {DELIVERABLE_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Date contractuelle
                    </label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                      value={toInputDate(editDeliverable.contractualDate)}
                      onChange={(e) =>
                        setEditDeliverable((prev) =>
                          prev
                            ? { ...prev, contractualDate: e.target.value }
                            : prev,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Date de fin Màj (échéance revue)
                    </label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                      value={toInputDate(editDeliverable.revisedDate)}
                      onChange={(e) =>
                        setEditDeliverable((prev) =>
                          prev
                            ? { ...prev, revisedDate: e.target.value }
                            : prev,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Date réalisée
                    </label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                      value={toInputDate(editDeliverable.deliveredDate)}
                      onChange={(e) =>
                        setEditDeliverable((prev) =>
                          prev
                            ? { ...prev, deliveredDate: e.target.value }
                            : prev,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Date validation
                    </label>
                    <input
                      type="date"
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                      value={toInputDate(editDeliverable.validatedDate)}
                      onChange={(e) =>
                        setEditDeliverable((prev) =>
                          prev
                            ? { ...prev, validatedDate: e.target.value }
                            : prev,
                        )
                      }
                    />
                  </div>
                </div>

                {/* Avancement */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Avancement (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={editDeliverable.progress ?? 0}
                    onChange={(e) =>
                      setEditDeliverable((prev) =>
                        prev
                          ? {
                              ...prev,
                              progress: Number(e.target.value) || 0,
                            }
                          : prev,
                      )
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Commentaires
                  </label>
                  <textarea
                    className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white h-24"
                    value={editDeliverable.comments ?? ""}
                    onChange={(e) =>
                      setEditDeliverable((prev) =>
                        prev ? { ...prev, comments: e.target.value } : prev,
                      )
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    className="border border-slate-300 rounded px-3 py-1 text-xs bg-white hover:bg-slate-50"
                    onClick={() => setEditDeliverable(null)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={savingUpdate}
                    className="rounded bg-indigo-600 px-4 py-1.5 text-xs text-white disabled:opacity-50"
                  >
                    {savingUpdate ? "Mise à jour…" : "Enregistrer"}
                  </button>
                </div>
              </form>
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ---------- Composants KPI & Graphiques ----------

type KpiCardProps = {
  label: string;
  value: number;
  suffix?: string;
  loading: boolean;
  variant?: "success" | "info" | "warning";
};

function KpiCard({
  label,
  value,
  suffix = "",
  loading,
  variant = "info",
}: KpiCardProps) {
  let container = "bg-slate-50 border-slate-200";
  if (variant === "success") container = "bg-emerald-50 border-emerald-200";
  if (variant === "info") container = "bg-indigo-50 border-indigo-200";
  if (variant === "warning") container = "bg-amber-50 border-amber-200";

  const display = Number.isFinite(value) ? value.toFixed(1) : "0";

  return (
    <div className={`rounded-lg border px-4 py-3 shadow-sm ${container}`}>
      <div className="text-[11px] font-medium uppercase text-slate-700">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">
        {loading ? "…" : `${display}${suffix}`}
      </div>
    </div>
  );
}

type BarChartProps = {
  title: string;
  data: { label: string; value: number; extra?: number }[];
  unit?: string;
  selectedLabel?: string | null;
  onBarClick?: (label: string) => void;
  integerYAxis?: boolean;
  description: string;
  hint: string;
  onResetFilter: () => void;
};

function BarChart({
  title,
  data,
  unit,
  selectedLabel,
  onBarClick,
  integerYAxis = false,
  description,
  hint,
  onResetFilter,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold mb-2 text-slate-900">
          {title}
        </div>
        <div className="text-xs text-slate-400">Pas de données.</div>
      </div>
    );
  }

  const max = data.reduce((m, p) => (p.value > m ? p.value : m), 0);
  const safeMax = max === 0 ? 1 : max;
  const isOqdChart = title.toLowerCase().includes("oqd");
  const isPercentChart = title.includes("%");
  const isDaysChart = title.toLowerCase().includes("dod");

  // Ticks Y : 0 / 50 / 100 pour les %, 0 / milieu / max pour les autres
  let yTicks: number[] = [];
  if (isPercentChart) {
    yTicks = [0, 50, 100];
  } else if (integerYAxis || isDaysChart) {
    const maxInt = Math.max(1, Math.ceil(safeMax));
    const mid = Math.round(maxInt / 2);
    yTicks = [0, mid, maxInt];
  } else {
    const mid = safeMax / 2;
    yTicks = [0, mid, safeMax];
  }

  const formatTick = (v: number) => {
    if (isPercentChart) return `${v}%`;
    if (isDaysChart) return `${v} j`;
    return integerYAxis ? v.toString() : v.toFixed(1);
  };

  const formatValue = (v: number) => {
    if (isPercentChart || isDaysChart || integerYAxis) {
      return `${Math.round(v)}${unit ?? ""}`;
    }
    return `${v.toFixed(1)}${unit ?? ""}`;
  };

  return (
    <div className="border border-slate-200 rounded-lg bg-white p-4 shadow-sm flex flex-col gap-2">
      <div className="text-sm font-semibold text-slate-900">
        {title}
      </div>

      {/* Zone graphique : axes X et Y collés en (0;0) */}
      <div className="flex items-stretch gap-0.5">
        {/* Axe Y visible, très proche de l’aire des barres */}
        <div className="relative h-40 flex flex-col justify-between text-[10px] text-slate-400 pr-1">
          {/* ligne verticale exactement au bord de l’aire des barres */}
          <div className="absolute right-0 top-0 bottom-0 border-l border-slate-200" />
          {yTicks
            .slice()
            .reverse()
            .map((tick, index) => (
              <div
                key={`${tick}-${index}`}
                className="flex-1 flex items-center justify-end pr-1"
              >
                <span>{formatTick(tick)}</span>
              </div>
            ))}
        </div>

        {/* Aire barres + axe X */}
        <div className="flex-1 flex flex-col">
          <div className="relative h-40">
            {/* Axe X au niveau 0, recollé sur Y */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200" />

            {/* Barres posées sur l’axe X */}
            <div className="absolute inset-0 flex items-end justify-evenly px-4 pb-1">
              {data.map((p) => {
                const maxHeight = 110;
                const rawH = (p.value / safeMax) * maxHeight;
                const h = rawH < 20 ? 20 : rawH;

                const baseValue = formatValue(p.value);
                const displayValue =
                  isOqdChart && p.extra != null
                    ? `${baseValue} – ${p.extra} liv.`
                    : p.extra != null &&
                      title.toLowerCase().includes("otd")
                    ? `${baseValue} – ${p.extra} liv.`
                    : baseValue;

                const isSelected = selectedLabel === p.label;

                return (
                  <div
                    key={p.label}
                    className="flex flex-col items-center justify-end cursor-pointer"
                    onClick={() => onBarClick?.(p.label)}
                  >
                    <div className="text-[11px] text-slate-900 mb-1 text-center whitespace-nowrap">
                      {displayValue}
                    </div>
                    <div
                      className={`w-6 rounded-md border shadow-sm ${
                        isSelected
                          ? "bg-indigo-500 border-indigo-600"
                          : "bg-indigo-300 border-indigo-400 hover:bg-indigo-400"
                      }`}
                      style={{ height: `${h}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Labels X centrés sous chaque barre */}
          <div className="mt-1 flex items-center justify-evenly px-4">
            {data.map((p) => (
              <div
                key={p.label}
                className="w-6 text-[10px] text-slate-600 text-center"
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analyse + reset */}
      <div className="mt-2 text-[11px] text-slate-600 space-y-1">
        <p>{description}</p>
        <p>{hint}</p>
        <button
          type="button"
          onClick={onResetFilter}
          className="mt-1 text-indigo-600 hover:text-indigo-700 underline"
        >
          Réinitialiser le filtre graphique
        </button>
      </div>
    </div>
  );
}
