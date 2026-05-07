"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

type DeliverableWithProject = {
  id: number;
  projectId: number;
  reference: string | null;
  title: string;
  type: string | null;
  description: string | null;
  owner: string | null;
  clientReference: string | null;
  contractualDate: string | null;
  revisedDate: string | null;
  deliveredDate: string | null;
  validatedDate: string | null;
  progress: number | null;
  status: string;
  comments: string | null;
  project: {
    id: number;
    projectNumber: string | null;
    titleProject: string | null;
    clientName: string | null;
    projectManagerName: string | null;
    status: string | null;
  } | null;
};

type GlobalKpiLike = {
  deliverables: {
    total: number;
    delivered: number;
    onTime: number;
    otd: number;
    oqd: number;
    dod: number;
  };
};

type MonthlyPoint = { label: string; value: number; extra?: number };

type ProjectSynth = {
  projectId: number;
  projectNumber: string | null;
  titleProject: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  status: string | null;
  total: number;
  delivered: number;
  otd: number;
  oqd: number;
  dod: number;
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
  projectId: number | null;
  reference: string;
  type: string;
  title: string;
  description: string;
  owner: string;
  clientReference: string;
  contractualDate: string;
  revisedDate: string;
  deliveredDate: string;
  validatedDate: string;
  status: string;
};

type ProjectLight = {
  id: number;
  projectNumber: string | null;
  titleProject: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  status: string | null;
};

export default function GlobalDeliverablesPage() {
  const router = useRouter();

  const [deliverables, setDeliverables] = useState<DeliverableWithProject[]>([]);
  const [projectsSynthBase, setProjectsSynthBase] = useState<ProjectSynth[]>([]);
  const [monthlyCountBase, setMonthlyCountBase] = useState<MonthlyPoint[]>([]);
  const [monthlyOtdBase, setMonthlyOtdBase] = useState<MonthlyPoint[]>([]);
  const [monthlyOqdBase, setMonthlyOqdBase] = useState<MonthlyPoint[]>([]);
  const [monthlyDodBase, setMonthlyDodBase] = useState<MonthlyPoint[]>([]);

  const [allProjects, setAllProjects] = useState<ProjectLight[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState<string>("Tous");
  const [filterProjectNumber, setFilterProjectNumber] = useState<string>("Tous");
  const [filterPm, setFilterPm] = useState<string>("Tous");
  const [filterStatus, setFilterStatus] = useState<string>("Tous");

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const [newDeliverable, setNewDeliverable] = useState<NewDeliverable>({
    projectId: null,
    reference: "",
    type: "",
    title: "",
    description: "",
    owner: "",
    clientReference: "",
    contractualDate: "",
    revisedDate: "",
    deliveredDate: "",
    validatedDate: "",
    status: "Non commencé",
  });

  function computeNextReference(existing: DeliverableWithProject[]) {
    const year = new Date().getFullYear();
    const prefix = `Liv_${year}_`;
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

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [resGlobal, resProjects] = await Promise.all([
        fetch("/api/quality/deliverables-global"),
        fetch("/api/projects"),
      ]);

      if (!resGlobal.ok) {
        const d = await resGlobal.json().catch(() => null);
        throw new Error(d?.error ?? "Erreur de chargement des livrables globaux");
      }
      if (!resProjects.ok) {
        const d = await resProjects.json().catch(() => null);
        throw new Error(d?.error ?? "Erreur de chargement des projets");
      }

      const dataGlobal = await resGlobal.json();
      const dataProjects = await resProjects.json();

      setDeliverables(dataGlobal.deliverables as DeliverableWithProject[]);
      setProjectsSynthBase(dataGlobal.projectsSynth as ProjectSynth[]);
      setMonthlyCountBase(dataGlobal.monthly.count as MonthlyPoint[]);
      setMonthlyOtdBase(dataGlobal.monthly.otd as MonthlyPoint[]);
      setMonthlyOqdBase(dataGlobal.monthly.oqd as MonthlyPoint[]);
      setMonthlyDodBase(dataGlobal.monthly.dod as MonthlyPoint[]);

      setAllProjects(
        (dataProjects.projects ?? dataProjects) as ProjectLight[],
      );

      setNewDeliverable((prev) => ({
        ...prev,
        reference: computeNextReference(dataGlobal.deliverables),
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

  // Projets ayant au moins un livrable
  const projectsFromDeliverables: ProjectLight[] = useMemo(() => {
    const map = new Map<number, ProjectLight>();
    for (const d of deliverables) {
      const p = d.project;
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
  }, [deliverables]);

  const projectsForFilters = projectsFromDeliverables;

  // Livrables filtrés (filtres + recherche)
  const filteredDeliverables = useMemo(() => {
    return deliverables.filter((d) => {
      const p = d.project;
      if (!p) return false;

      if (filterClient !== "Tous" && p.clientName !== filterClient) return false;
      if (
        filterProjectNumber !== "Tous" &&
        p.projectNumber !== filterProjectNumber
      )
        return false;
      if (
        filterPm !== "Tous" &&
        p.projectManagerName !== filterPm
      )
        return false;
      if (filterStatus !== "Tous" && p.status !== filterStatus) return false;

      if (search.trim()) {
        const needle = search.toLowerCase();
        const haystack = `${d.reference ?? ""} ${d.title ?? ""} ${
          p.projectNumber ?? ""
        } ${(p.titleProject ?? "") + " " + (p.clientName ?? "")}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [deliverables, filterClient, filterProjectNumber, filterPm, filterStatus, search]);

  // Recalcul des séries mensuelles à partir des livrables filtrés
  const { monthlyCount, monthlyOtd, monthlyOqd, monthlyDod } = useMemo(() => {
    if (filteredDeliverables.length === 0) {
      return {
        monthlyCount: [] as MonthlyPoint[],
        monthlyOtd: [] as MonthlyPoint[],
        monthlyOqd: [] as MonthlyPoint[],
        monthlyDod: [] as MonthlyPoint[],
      };
    }

    type Bucket = {
      delivered: number;
      deliveredItems: DeliverableWithProject[];
      onTime: number;
      evaluated: number;
      validated: number;
      lateItems: DeliverableWithProject[];
    };

    const monthly: Record<string, Bucket> = {};

    const toMonthKey = (date: Date | null): string | null => {
      if (!date || Number.isNaN(date.getTime())) return null;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    };

    for (const d of filteredDeliverables) {
      const deliveredDate = d.deliveredDate ? new Date(d.deliveredDate) : null;
      const key = toMonthKey(deliveredDate);
      if (!key) continue;

      if (!monthly[key]) {
        monthly[key] = {
          delivered: 0,
          deliveredItems: [],
          onTime: 0,
          evaluated: 0,
          validated: 0,
          lateItems: [],
        };
      }

      const b = monthly[key];
      if (d.deliveredDate) {
        b.delivered += 1;
      }

      const hasDeadline = d.contractualDate || d.revisedDate;
      if (d.deliveredDate && hasDeadline) {
        b.deliveredItems.push(d);

        const refDate =
          d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
        const deliveredTime = new Date(d.deliveredDate!).getTime();
        const refTime = new Date(refDate).getTime();

        if (deliveredTime <= refTime) {
          b.onTime += 1;
        } else {
          b.lateItems.push(d);
        }

        const isEvaluated =
          d.status === "Validé" || d.status === "Refusé";
        if (isEvaluated) {
          b.evaluated += 1;
          if (d.status === "Validé") {
            b.validated += 1;
          }
        }
      }
    }

    const monthlyCount: MonthlyPoint[] = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, b]) => ({
        label,
        value: b.delivered,
      }));

    const monthlyOtd: MonthlyPoint[] = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, b]) => {
        const value = b.deliveredItems.length
          ? (b.onTime / b.deliveredItems.length) * 100
          : 0;
        return {
          label,
          value,
          extra: b.deliveredItems.length,
        };
      });

    const monthlyOqd: MonthlyPoint[] = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, b]) => {
        const value = b.evaluated
          ? (b.validated / b.evaluated) * 100
          : 0;
        return {
          label,
          value,
          extra: b.validated,
        };
      });

    const monthlyDod: MonthlyPoint[] = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, b]) => {
        let dodMonth = 0;
        if (b.lateItems.length > 0) {
          const totalDays = b.lateItems.reduce((sum, d) => {
            const refDate =
              d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
            const diff =
              new Date(d.deliveredDate!).getTime() -
              new Date(refDate).getTime();
            return sum + diff / (1000 * 60 * 60 * 24);
          }, 0);
          dodMonth = totalDays / b.lateItems.length;
        }
        return {
          label,
          value: dodMonth,
          extra: b.lateItems.length,
        };
      });

    return { monthlyCount, monthlyOtd, monthlyOqd, monthlyDod };
  }, [filteredDeliverables]);

  // Filtre supplémentaire par mois pour les KPI (comme ta page livrables projet)
  const filteredForCharts = useMemo(() => {
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

  const currentKpi: GlobalKpiLike = useMemo(() => {
    const items = filteredForCharts;
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
      delivered.length === 0 ? 0 : (onTime.length / delivered.length) * 100;
    const oqd =
      evaluated.length === 0 ? 0 : (validated.length / evaluated.length) * 100;

    return {
      deliverables: {
        total,
        delivered: delivered.length,
        onTime: onTime.length,
        otd,
        oqd,
        dod,
      },
    };
  }, [filteredForCharts]);

  // Synthèse projets recalculée sur les livrables filtrés
  const projectsSynthFiltered: ProjectSynth[] = useMemo(() => {
    if (filteredDeliverables.length === 0) return [];

    const byProject = new Map<number, ProjectSynth>();
    const buckets = new Map<
      number,
      {
        deliveredItems: DeliverableWithProject[];
        onTime: number;
        evaluated: number;
        validated: number;
        lateItems: DeliverableWithProject[];
      }
    >();

    for (const d of filteredDeliverables) {
      const p = d.project;
      if (!p) continue;

      if (!byProject.has(p.id)) {
        byProject.set(p.id, {
          projectId: p.id,
          projectNumber: p.projectNumber,
          titleProject: p.titleProject,
          clientName: p.clientName,
          projectManagerName: p.projectManagerName,
          status: p.status,
          total: 0,
          delivered: 0,
          otd: 0,
          oqd: 0,
          dod: 0,
        });
      }

      if (!buckets.has(p.id)) {
        buckets.set(p.id, {
          deliveredItems: [],
          onTime: 0,
          evaluated: 0,
          validated: 0,
          lateItems: [],
        });
      }

      const synth = byProject.get(p.id)!;
      synth.total += 1;
      if (d.deliveredDate) {
        synth.delivered += 1;
      }

      const bucket = buckets.get(p.id)!;
      const hasDeadline = d.contractualDate || d.revisedDate;
      if (d.deliveredDate && hasDeadline) {
        bucket.deliveredItems.push(d);

        const refDate =
          d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
        const deliveredTime = new Date(d.deliveredDate!).getTime();
        const refTime = new Date(refDate).getTime();

        if (deliveredTime <= refTime) {
          bucket.onTime += 1;
        } else {
          bucket.lateItems.push(d);
        }

        const isEvaluated =
          d.status === "Validé" || d.status === "Refusé";
        if (isEvaluated) {
          bucket.evaluated += 1;
          if (d.status === "Validé") {
            bucket.validated += 1;
          }
        }
      }
    }

    for (const [projectId, bucket] of buckets.entries()) {
      const s = byProject.get(projectId);
      if (!s) continue;

      s.otd = bucket.deliveredItems.length
        ? (bucket.onTime / bucket.deliveredItems.length) * 100
        : 0;
      s.oqd = bucket.evaluated
        ? (bucket.validated / bucket.evaluated) * 100
        : 0;

      if (bucket.lateItems.length > 0) {
        const totalDays = bucket.lateItems.reduce((sum, d) => {
          const refDate =
            d.revisedDate ?? d.contractualDate ?? d.deliveredDate!;
          const diff =
            new Date(d.deliveredDate!).getTime() -
            new Date(refDate).getTime();
          return sum + diff / (1000 * 60 * 60 * 24);
        }, 0);
        s.dod = totalDays / bucket.lateItems.length;
      } else {
        s.dod = 0;
      }
    }

    return Array.from(byProject.values()).sort((a, b) => {
      const na = a.projectNumber ?? "";
      const nb = b.projectNumber ?? "";
      return na.localeCompare(nb, "fr-FR", { numeric: true });
    });
  }, [filteredDeliverables]);

  const currentMonthLabel = selectedMonth ?? "toute la période";

  function handleExportExcel() {
    if (!filteredDeliverables.length) {
      alert("Aucun livrable à exporter.");
      return;
    }

    const headers = [
      "Id",
      "N° projet",
      "Projet",
      "Client",
      "Chef de projet",
      "Référence livrable",
      "Intitulé livrable",
      "Type",
      "Responsable",
      "Date contractuelle",
      "Date prévue",
      "Date livrée",
      "Date validation",
      "Statut",
      "Commentaires",
    ];

    const rows = filteredDeliverables.map((d) => [
      d.id,
      d.project?.projectNumber ?? "",
      d.project?.titleProject ?? "",
      d.project?.clientName ?? "",
      d.project?.projectManagerName ?? "",
      d.reference ?? "",
      d.title ?? "",
      d.type ?? "",
      d.owner ?? "",
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
    link.download = "Livrables_projets.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCreateDeliverable(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      if (!newDeliverable.projectId) {
        throw new Error("Merci de sélectionner un projet.");
      }
      if (!newDeliverable.title.trim()) {
        throw new Error("Merci de renseigner l'intitulé du livrable.");
      }

      const payload = {
        reference: newDeliverable.reference || undefined,
        title: newDeliverable.title.trim(),
        type: newDeliverable.type || null,
        description: newDeliverable.description.trim() || null,
        owner: newDeliverable.owner.trim() || null,
        clientReference: newDeliverable.clientReference.trim() || null,
        contractualDate: newDeliverable.contractualDate || null,
        revisedDate: newDeliverable.revisedDate || null,
        deliveredDate: newDeliverable.deliveredDate || null,
        validatedDate: newDeliverable.validatedDate || null,
        progress: 0,
        status: newDeliverable.status,
      };

      const res = await fetch(
        `/api/quality/deliverables?projectId=${newDeliverable.projectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "Erreur lors de la création du livrable");
      }

      setCreating(false);
      await loadData();
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  // Blocs alertes / recommandations (logique simple basée sur les KPI globaux filtrés)
  const strengths: string[] = [];
  const watchPoints: string[] = [];
  const recommandations: string[] = [];

  const otd = currentKpi.deliverables.otd;
  const oqd = currentKpi.deliverables.oqd;
  const dod = currentKpi.deliverables.dod;

  if (otd >= 95) {
    strengths.push(
      "Respect excellent des délais de livraison (OTD ≥ 95 %).",
    );
  } else if (otd >= 90) {
    strengths.push("OTD global satisfaisant, proche de la cible (≥ 90 %).");
    watchPoints.push("Rester vigilant sur les dérives de délais sur certains projets.");
    recommandations.push(
      "Analyser les projets en dessous de 90 % d’OTD et planifier des actions correctives.",
    );
  } else {
    watchPoints.push("OTD global en dessous de la cible (90 %).");
    recommandations.push(
      "Identifier les causes majeures de retard (ressources, périmètre, dépendances) et mettre en place un plan d’actions.",
    );
  }

  if (oqd >= 95) {
    strengths.push("Très bon niveau de qualité des livrables (OQD ≥ 95 %).");
  } else if (oqd >= 90) {
    strengths.push("OQD global correct, peu de livrables refusés.");
    watchPoints.push(
      "Surveiller les refus récurrents de certains clients ou projets.",
    );
    recommandations.push(
      "Renforcer la revue interne des livrables avant envoi au client.",
    );
  } else {
    watchPoints.push("OQD global en dessous de la cible (90 %).");
    recommandations.push(
      "Mettre en place une check‑list de validation avant livraison pour réduire les refus.",
    );
  }

  if (dod <= 1) {
    strengths.push("Retards moyens très faibles (DoD ≤ 1 jour).");
  } else if (dod <= 5) {
    watchPoints.push(
      "Retards moyens modérés (1 à 5 jours) à surveiller sur les jalons critiques.",
    );
    recommandations.push(
      "Sécuriser les jalons critiques avec des marges et relances anticipées.",
    );
  } else {
    watchPoints.push("Retards moyens importants (DoD > 5 jours).");
    recommandations.push(
      "Mettre en place un suivi hebdomadaire des livrables en retard et prioriser les actions.",
    );
  }

  // Si aucun message, on met une phrase générique
  if (strengths.length === 0) {
    strengths.push("Données insuffisantes pour dégager des points forts sur les livrables.");
  }
  if (watchPoints.length === 0) {
    watchPoints.push("Aucun point de vigilance majeur identifié sur la période filtrée.");
  }
  if (recommandations.length === 0) {
    recommandations.push(
      "Poursuivre le suivi des livrables actuels en conservant la même organisation.",
    );
  }

  return (
    <AppShell
      activeSection="quality"
      pageTitle="Livrables projets"
      pageSubtitle="Vue consolidée de tous les livrables sur l’ensemble des projets."
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
              Nouveau livrable
            </button>
            <button
              type="button"
              onClick={() =>
                router.push("/quality/non-conformities-projects")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Non-conformités (vue projets)
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
                window.open("/synoptique-livrables.pdf", "_blank")
              }
              className="px-3 py-1.5 text-xs rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700"
            >
              Voir le synoptique livrables
            </button>
          </div>
          <div className="flex items-center gap-2">
          <Link
            href="/Tutoriel/projelys-deliverables-tutorial.html"
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
                placeholder="Rechercher (N° projet, client, intitulé livrable...)"
                className="w-full md:max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mt-2">
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
                  Statut projet
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="Tous">Tous</option>
                  {Array.from(
                    new Set(
                      projectsForFilters
                        .map((p) => p.status ?? "")
                        .filter((v) => v.trim() !== ""),
                    ),
                  ).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 5 KPIs */}
        <section className="grid gap-4 md:grid-cols-5">
          <KpiCard
            label="Livrables"
            value={currentKpi.deliverables.total}
            suffix=""
            loading={loading}
            variant="info"
          />
          <KpiCard
            label="Livrables livrés"
            value={currentKpi.deliverables.delivered}
            suffix=""
            loading={loading}
            variant="success"
          />
          <KpiCard
            label="OTD global"
            value={currentKpi.deliverables.otd}
            suffix="%"
            loading={loading}
            variant="info"
          />
          <KpiCard
            label="OQD global"
            value={currentKpi.deliverables.oqd}
            suffix="%"
            loading={loading}
            variant="info"
          />
          <KpiCard
            label="DoD global"
            value={currentKpi.deliverables.dod}
            suffix=" j"
            loading={loading}
            variant="warning"
          />
        </section>

        {/* Bloc Alertes & recommandations (livrables uniquement) */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
            Alertes et recommandations – Livrables
            </h2>
            <span className="text-[11px] text-slate-500">
            Analyse sur la période filtrée ({currentMonthLabel})
            </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3 text-xs">
            {/* Points forts */}
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

            {/* Points de vigilance */}
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

            {/* Recommandations */}
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
        <section className="grid gap-4 lg:grid-cols-2">
          <BarChart
            title="Nb de livrables par mois"
            data={monthlyCount}
            unit=""
            selectedLabel={selectedMonth}
            onBarClick={(label) =>
              setSelectedMonth((prev) => (prev === label ? null : label))
            }
            integerYAxis
            description={`Suivi des livrables livrés par mois pour ${currentMonthLabel}.`}
            hint="Cliquer sur une barre pour filtrer tous les indicateurs et le tableau sur le mois concerné."
            onResetFilter={() => setSelectedMonth(null)}
          />
          <BarChart
            title="OTD par mois (%)"
            data={monthlyOtd}
            unit="%"
            selectedLabel={selectedMonth}
            onBarClick={(label) =>
              setSelectedMonth((prev) => (prev === label ? null : label))
            }
            description="Respect des délais de livraison par mois (tous projets, après filtres)."
            hint="Surveiller les mois en dessous de 80 % pour déclencher des plans d’action."
            onResetFilter={() => setSelectedMonth(null)}
          />
          <BarChart
            title="OQD par mois (%)"
            data={monthlyOqd}
            unit="%"
            selectedLabel={selectedMonth}
            onBarClick={(label) =>
              setSelectedMonth((prev) => (prev === label ? null : label))
            }
            description="Qualité des livrables évalués (validés vs refusés) par mois."
            hint="La valeur au-dessus de chaque barre indique le pourcentage et le nombre de livrables validés."
            onResetFilter={() => setSelectedMonth(null)}
          />
          <BarChart
            title="DoD par mois (j)"
            data={monthlyDod}
            unit=" j"
            selectedLabel={selectedMonth}
            onBarClick={(label) =>
              setSelectedMonth((prev) => (prev === label ? null : label))
            }
            description="Profondeur moyenne des retards de livraison par mois."
            hint="Au‑delà de 5 j de retard moyen, prioriser les mois concernés pour des actions correctives."
            onResetFilter={() => setSelectedMonth(null)}
          />
        </section>

        {/* Tableau Projets – synthèse Livrables */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Projets – synthèse Livrables
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
              Aucun projet avec livrables pour ces filtres.
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
                    <ThMini className="w-28">Livrables</ThMini>
                    <ThMini className="w-40">Livrables livrés </ThMini>
                    <ThMini className="w-28">OTD</ThMini>
                    <ThMini className="w-28">DoD</ThMini>
                    <ThMini className="w-28">OQD</ThMini>
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
                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
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
                        {p.delivered}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                        <KpiValueBadge type="otd" value={p.otd} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                        <KpiValueBadge type="dod" value={p.dod} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                        <KpiValueBadge type="oqd" value={p.oqd} />
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

        {/* Panneau latéral création livrable global */}
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
                    Nouveau livrable (tous projets)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Sélectionner le projet puis saisir les informations du livrable.
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
                <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
                  <h3 className="text-[11px] font-semibold text-slate-800">
                    Identification
                  </h3>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-medium text-slate-700">
                      Projet *
                    </label>
                    <select
                      className="border border-slate-300 rounded px-2 py-1 w-full text-xs bg-white"
                      value={newDeliverable.projectId ?? ""}
                      onChange={(e) =>
                        setNewDeliverable((prev) => ({
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
      </div>
    </AppShell>
  );
}

/* Composants auxiliaires */

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

      <div className="flex items-stretch gap-0.5">
        <div className="relative h-40 flex flex-col justify-between text-[10px] text-slate-400 pr-1">
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

        <div className="flex-1 flex flex-col">
          <div className="relative h-40">
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200" />

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
                    className={`flex flex-col items-center justify-end cursor-pointer transition-opacity ${
                      selectedLabel && !isSelected
                        ? "opacity-30"
                        : "opacity-100"
                    }`}
                    onClick={() => onBarClick?.(p.label)}
                  >
                    <div className="text-[11px] text-slate-900 mb-1 text-center whitespace-nowrap">
                      {displayValue}
                    </div>
                    <div
                      className={`w-6 rounded-md border shadow-sm ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-700"
                          : "bg-indigo-300 border-indigo-400 hover:bg-indigo-400"
                      }`}
                      style={{ height: `${h}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-1 flex items-center justify-evenly px-4">
            {data.map((p) => (
              <div
                key={p.label}
                className={`w-6 text-[10px] text-center ${
                  selectedLabel && selectedLabel !== p.label
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>
      </div>

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

/* Badge statut projet */

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

/* Badge couleurs pour OTD / OQD / DoD */

function KpiValueBadge({
  type,
  value,
}: {
  type: "otd" | "oqd" | "dod";
  value: number;
}) {
  let classes =
    "inline-flex items-center justify-end rounded-full px-2 py-0.5 text-[10px] border";

  if (type === "otd" || type === "oqd") {
    if (value >= 95) {
      classes += " border-emerald-200 bg-emerald-50 text-emerald-800";
    } else if (value >= 90) {
      classes += " border-amber-200 bg-amber-50 text-amber-800";
    } else {
      classes += " border-rose-200 bg-rose-50 text-rose-800";
    }
    return <span className={classes}>{value.toFixed(1)}%</span>;
  }

  if (type === "dod") {
    if (value <= 1) {
      classes += " border-emerald-200 bg-emerald-50 text-emerald-800";
    } else if (value <= 5) {
      classes += " border-amber-200 bg-amber-50 text-amber-800";
    } else {
      classes += " border-rose-200 bg-rose-50 text-rose-800";
    }
    return <span className={classes}>{value.toFixed(1)} j</span>;
  }

  return null;
}
