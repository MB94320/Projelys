// app/projects/[id]/quality/non-conformities/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import { ExportNc8dPdfButton } from "../ExportNc8dPdfButton";

type Project = {
  id: number;
  titleProject: string | null;
  projectNumber: string | null;
};

type Deliverable = {
  id: number;
  projectId: number;
  reference: string | null;
  title: string;
};

type NonConformity = {
  id: number;
  projectId: number;
  deliverableId: number | null;
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
  rootCause: string | null;
  immediateAction: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  comments: string | null;
  fncUrl: string | null;
  eightDProgress: number | null;
  eightDComment: string | null;
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

const NC_SEVERITY = ["Mineure", "Majeure", "Critique"];
const NC_STATUS = ["Ouvert", "En cours", "Clôturé", "Annulé"];

const EIGHTD_HELP = {
  D1: {
    title: "D1 – Identification",
    text: "Identifier les personnes impliquées dans le traitement de la NC (chef de projet, Team Manager, expert, client le cas échéant) et leurs rôles. Groupe formé dans les 3 jours max.",
  },
  D2: {
    title: "D2 – Décrire précisément le problème",
    text: "Décrire quoi, où, quand, combien : symptômes, contexte, exigences impactées et conséquences potentielles (sécurité, coût, délai, satisfaction client).",
  },
  D3: {
    title: "D3 – Actions immédiates",
    text: "Lister les actions curatives prises dans les 5 jours max pour sécuriser le client ou l’exploitation (mise en quarantaine, contournement, dérogation, rollback, etc.).",
  },
  D4: {
    title: "D4 – Causes racines",
    text: "Utiliser les 5 pourquoi / Ishikawa pour identifier pourquoi le problème est apparu et pourquoi il n’a pas été détecté plus tôt. Appuyer-vous sur la liste de causes proposées.",
  },
  D5: {
    title: "D5 – Actions correctives",
    text: "Définir les actions visant à éliminer les causes racines (qui fait quoi, pour quand, avec quels livrables et quels critères de réussite).",
  },
  D6: {
    title: "D6 – Mise en œuvre & efficacité",
    text: "Décrire ce qui a été réalisé, sur quel périmètre, et comment la non-récurrence est vérifiée (échantillon de livrables, indicateur, tests…).",
  },
  D7: {
    title: "D7 – Actions préventives",
    text: "Identifier les autres périmètres impactables et les actions préventives (mise à jour référentiels, modèles, formations, automatisation/poka-yoké…).",
  },
  D8: {
    title: "D8 – Clôture & capitalisation",
    text: "Valider la clôture, résumer les enseignements clés, ce qui est capitalisé (REX, base de connaissances) et comment c’est communiqué (client, équipe, management).",
  },
} as const;

const CAUSE_CATEGORIES: Record<string, string[]> = {
  Technique: [
    "Technologies non maîtrisées",
    "Dépendance technologique (mono source, brevets…)",
    "Logistique / environnement de travail particulier",
    "Fabrication (maîtrise, validation, changement de process…)",
    "Obsolescence (composants, process, moyens)",
    "Critères de performance mal définis",
    "Mauvaise connaissance des outils (production, reporting, client…)",
  ],
  "Gestion du projet": [
    "Responsabilités client/fournisseur mal définies",
    "Architecture projet complexe ou floue",
    "Pilotage / mode de management inadapté",
    "Non utilisation du retour d’expérience",
    "Reportings projet insuffisants ou inadaptés",
  ],
  "Organisation du projet": [
    "Processus imposé complexe ou mal maîtrisé",
    "Processus de décision mal défini",
    "Relations avec sous-traitants mal cadrées",
    "Rôles et responsabilités mal définis",
  ],
  Livrables: [
    "Critères d’acceptation non formalisés ou non validés",
    "Mauvaise connaissance des standards internes / client",
    "Gestion des évolutions et anomalies insuffisante",
  ],
  Ressources: [
    "Indisponibilité des ressources / données d’entrée",
    "Compétences insuffisantes ou mal identifiées",
    "Facteurs humains (stress, fatigue, manque d’esprit d’équipe…)",
    "Sous-traitance / offshore inadaptés",
  ],
  Achat: [
    "Paramètres critiques qualité/coût/délai mal gérés",
    "Mauvaise identification des lots/tâches critiques",
    "Pas de retour d’expérience fournisseurs",
  ],
  Financier: [
    "Mauvaise estimation de la charge",
    "Mauvaise prise en compte des coûts annexes",
    "Plan de trésorerie inadapté ou pénalités financières",
  ],
  Contractuel: [
    "Expression de besoin / cahier des charges incomplet",
    "Évolution d’exigences non maîtrisée",
    "Limites de prestations / responsabilités floues",
  ],
  Légal: [
    "Clauses contractuelles non acceptables",
    "Non maîtrise de la réglementation / plans de prévention",
    "Mauvaise contractualisation avec fournisseurs",
  ],
  Autres: [
    "Événement externe (météo, politique, social…)",
    "Danger sécurité / réglementation spécifique",
    "Manque de communication / synchronisation entre projets",
    "Habilitations / formations obsolètes ou inexistantes",
  ],
};

type NewNc = {
  reference: string;
  projectId: number | null;
  origin: string;
  type: string;
  deliverableId: number | null;
  severity: string;
  status: string;
  detectedOn: string;
  dueDate: string;
  detectedBy: string;
  description: string;
  rootCause: string;
  immediateAction: string;
  correctiveAction: string;
  preventiveAction: string;
  comments: string;
  fncUrl: string;
  eightDProgress: number;
  eightDComment: string;
};

type BarPoint = { label: string; value: number };

export default function ProjectNonConformitiesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routeProjectId = Number(params.id);

  const [projects, setProjects] = useState<Project[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [ncs, setNcs] = useState<NonConformity[]>([]);
  const [kpi, setKpi] = useState<QualityKpi | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingKpi, setLoadingKpi] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterOwner, setFilterOwner] = useState<string>("Tous");
  const [filterStatus, setFilterStatus] = useState<string>("Tous");
  const [filterSeverity, setFilterSeverity] = useState<string>("Toutes");
  const [filterOrigin, setFilterOrigin] = useState<string>("Toutes");

  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingNc, setEditingNc] = useState<NonConformity | null>(null);
  const [loadingDelete, setLoadingDelete] = useState<number | null>(null);

  const [search, setSearch] = useState<string>("");

  const [newNc, setNewNc] = useState<NewNc>({
    reference: "",
    projectId: routeProjectId || null,
    origin: "",
    type: "",
    deliverableId: null,
    severity: "",
    status: "Ouvert",
    detectedOn: "",
    dueDate: "",
    detectedBy: "",
    description: "",
    rootCause: "",
    immediateAction: "",
    correctiveAction: "",
    preventiveAction: "",
    comments: "",
    fncUrl: "",
    eightDProgress: 0,
    eightDComment: "",
  });

  const [severityChartFilter, setSeverityChartFilter] = useState<string | null>(
    null,
  );
  const [monthChartFilter, setMonthChartFilter] = useState<string | null>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [hasSeenNotifications, setHasSeenNotifications] = useState(false);

  // ----------- PDF 8D  -----------
  async function exportNc8dPdf(projectId: number, ncId: number) {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/quality/export-nc-pdf?ncId=${ncId}`,
      );
      if (!res.ok) {
        alert("Erreur lors de l'export PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Fiche8D_NC_${ncId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors de l'export PDF");
    }
  }


  // ----------- chargement données -----------

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [projRes, delivRes, ncRes] = await Promise.all([
        fetch("/api/projects"),
        fetch(`/api/projects/${routeProjectId}/quality?type=deliverables`),
        fetch(
          `/api/projects/${routeProjectId}/quality?type=non-conformities`,
        ),
      ]);

      if (!projRes.ok) {
        throw new Error("Erreur de chargement des projets");
      }
      if (!delivRes.ok) {
        throw new Error("Erreur de chargement des livrables");
      }
      if (!ncRes.ok) {
        const d = await ncRes.json().catch(() => null);
        throw new Error(
          d?.error ?? "Erreur de chargement des non-conformités",
        );
      }

      const projData = (await projRes.json()) as Project[];
      const delivData = (await delivRes.json()) as Deliverable[];
      const ncData = (await ncRes.json()) as NonConformity[];

      setProjects(projData);
      setDeliverables(delivData);
      setNcs(ncData);

      const nextRef = computeNextReference(ncData, "NC");
      setNewNc((prev) => ({
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

  async function loadKpi() {
    try {
      setLoadingKpi(true);
      const res = await fetch(
        `/api/projects/${routeProjectId}/quality?type=kpi`,
      );
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.error ?? "Erreur lors du calcul des KPI qualité",
        );
      }
      const data = (await res.json()) as QualityKpi;
      setKpi(data);
    } catch (e: any) {
      setError(
        (prev) =>
          prev ??
          e.message ??
          "Erreur lors du calcul des KPI qualité",
      );
    } finally {
      setLoadingKpi(false);
    }
  }

  useEffect(() => {
    if (!routeProjectId) return;
    loadData();
    loadKpi();
  }, [routeProjectId]);

  function computeNextReference(existing: NonConformity[], prefixBare: "Liv" | "NC"): string {
    const year = new Date().getFullYear();
    const prefix = `${prefixBare}_${year}_`;
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

  // ----------- création / mise à jour NC -----------

    async function handleSaveNc(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      if (!newNc.description.trim()) {
        throw new Error("Merci de renseigner la description de la NC.");
      }

      const projectIdToUse = newNc.projectId ?? routeProjectId;
      if (!projectIdToUse) {
        throw new Error("Merci de sélectionner un projet.");
      }

      const payload = {
        reference:
          newNc.reference && newNc.reference !== ""
            ? newNc.reference
            : undefined,
        type: newNc.type || null,
        origin: newNc.origin || null,
        deliverableId:
          newNc.origin === "Livrable" && newNc.deliverableId
            ? newNc.deliverableId
            : null,
        severity: newNc.severity || null,
        status: newNc.status,
        detectedOn: newNc.detectedOn || null,
        detectedBy: newNc.detectedBy.trim() || null,
        dueDate: newNc.dueDate || null,
        description: newNc.description.trim(),
        rootCause: newNc.rootCause.trim() || null,
        immediateAction: newNc.immediateAction.trim() || null,
        correctiveAction: newNc.correctiveAction.trim() || null,
        preventiveAction: newNc.preventiveAction.trim() || null,
        comments: newNc.comments.trim() || null,
        fncUrl: newNc.fncUrl.trim() || null,
        eightDProgress: newNc.eightDProgress ?? 0,
        eightDComment: newNc.eightDComment.trim() || null,
      };

      const res = await fetch(
        `/api/projects/${projectIdToUse}/quality?type=non-conformities`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.error ?? "Erreur lors de la création de la NC",
        );
      }

      setCreating(false);      
      await Promise.all([loadData(), loadKpi()]);

      // on laisse loadData recalculer la nouvelle référence
      setNewNc((prev) => ({
        ...prev,
        origin: "",
        type: "",
        deliverableId: null,
        severity: "",
        status: "Ouvert",
        detectedOn: "",
        dueDate: "",
        detectedBy: "",
        description: "",
        rootCause: "",
        immediateAction: "",
        correctiveAction: "",
        preventiveAction: "",
        comments: "",
        fncUrl: "",
        eightDProgress: 0,
        eightDComment: "",
      }));
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }


  async function handleDeleteNc(id: number) {
    const ok = window.confirm(
      "Supprimer définitivement cette non-conformité ?",
    );
    if (!ok) return;

    try {
      setLoadingDelete(id);
      const res = await fetch(
        `/api/projects/${routeProjectId}/quality?type=non-conformities&id=${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error ?? "Erreur lors de la suppression.");
      }
      await Promise.all([loadData(), loadKpi()]);
    } catch (e: any) {
      alert(e.message ?? "Erreur lors de la suppression.");
    } finally {
      setLoadingDelete(null);
    }
  }
  
  // ----------- helpers -----------

  function formatDate(value: string | null) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  }

  function statusBadge(status: string) {
    let color = "bg-gray-100 text-gray-800 border border-gray-200";
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

  function severityBadge(severity: string | null) {
    if (!severity) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 border border-slate-200">
          —
        </span>
      );
    }
    let color = "bg-gray-100 text-gray-800 border border-gray-200";
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

  const filteredDeliverablesForProject = useMemo(() => {
    return deliverables.filter((d) => d.projectId === routeProjectId);
  }, [deliverables, routeProjectId]);

  // ----------- export CSV local -----------

  function handleExportNcToCsv() {
    if (ncs.length === 0) {
      alert("Aucune NC à exporter.");
      return;
    }

    const headers = [
      "id",
      "reference",
      "projectId",
      "type",
      "origin",
      "description",
      "severity",
      "detectedOn",
      "detectedBy",
      "dueDate",
      "status",
      "closedDate",
      "rootCause",
      "immediateAction",
      "correctiveAction",
      "preventiveAction",
      "comments",
      "fncUrl",
      "eightDProgress",
      "eightDComment",
    ];

    const rows = filteredNcs.map((nc) =>
      [
        nc.id,
        nc.reference ?? "",
        nc.projectId,
        nc.type ?? "",
        nc.origin ?? "",
        (nc.description ?? "").replace(/\r?\n/g, " "),
        nc.severity ?? "",
        nc.detectedOn ?? "",
        nc.detectedBy ?? "",
        nc.dueDate ?? "",
        nc.status ?? "",
        nc.closedDate ?? "",
        nc.rootCause ?? "",
        (nc.immediateAction ?? "").replace(/\r?\n/g, " "),
        (nc.correctiveAction ?? "").replace(/\r?\n/g, " "),
        (nc.preventiveAction ?? "").replace(/\r?\n/g, " "),
        (nc.comments ?? "").replace(/\r?\n/g, " "),
        nc.fncUrl ?? "",
        nc.eightDProgress ?? "",
        (nc.eightDComment ?? "").replace(/\r?\n/g, " "),
      ].map((val) => {
        const v = String(val ?? "");
        if (v.includes(";") || v.includes('"') || v.includes("\n")) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      }),
    );

    const csvContent =
      [headers.join(";")]
        .concat(rows.map((r) => r.join(";")))
        .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NC_projet_${routeProjectId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

    function openEditNc(nc: NonConformity) {
    setNewNc({
      reference: nc.reference ?? "",
      projectId: nc.projectId,
      origin: nc.origin ?? "",
      type: nc.type ?? "",
      deliverableId: nc.deliverableId,
      severity: nc.severity ?? "",
      status: nc.status,
      detectedOn: nc.detectedOn ?? "",
      dueDate: nc.dueDate ?? "",
      detectedBy: nc.detectedBy ?? "",
      description: nc.description,
      rootCause: nc.rootCause ?? "",
      immediateAction: nc.immediateAction ?? "",
      correctiveAction: nc.correctiveAction ?? "",
      preventiveAction: nc.preventiveAction ?? "",
      comments: nc.comments ?? "",
      fncUrl: nc.fncUrl ?? "",
      eightDProgress: nc.eightDProgress ?? 0,
      eightDComment: nc.eightDComment ?? "",
    });
    setEditingNc(nc);
    setCreating(true); // ouvre le panneau latéral
  }

  // ----------- filtres / KPI / graph -----------

  const filteredNcs = useMemo(() => {
    return ncs.filter((nc) => {
      if (filterOwner !== "Tous" && (nc.detectedBy ?? "") !== filterOwner) {
        return false;
      }
      if (filterStatus !== "Tous" && nc.status !== filterStatus) {
        return false;
      }
      if (filterSeverity !== "Toutes" && nc.severity !== filterSeverity) {
        return false;
      }
      if (filterOrigin !== "Toutes" && nc.origin !== filterOrigin) {
        return false;
      }

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
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    ncs,
    filterOwner,
    filterStatus,
    filterSeverity,
    filterOrigin,
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

  const notificationItems = useMemo(() => {
    const items: { id: number; message: string }[] = [];
    const today = new Date();

    for (const nc of ncs) {
      if (nc.status === "Clôturé") continue;
      if (!nc.dueDate) continue;
      const due = new Date(nc.dueDate);
      if (Number.isNaN(due.getTime())) continue;

      if (due < today) {
        items.push({
          id: nc.id,
          message: `NC ${nc.reference ?? nc.id} en retard (échéance ${due.toLocaleDateString(
            "fr-FR",
          )}).`,
        });
      }
    }
    return items.slice(0, 10);
  }, [ncs]);

  const currentProject = projects.find((p) => p.id === routeProjectId);
  const projectLabel =
    currentProject?.projectNumber ??
    (currentProject ? `projet ${currentProject.id}` : `projet ${routeProjectId}`);

  // ----------- rendu -----------

  return (
    <AppShell
      activeSection="quality"
      pageTitle={`Non-conformités – ${projectLabel}`}
      pageSubtitle="Suivi des non-conformités, insatisfactions et 8D pour ce projet."
    >
      <div className="space-y-6">
        <Link
          href={"/quality/non-conformities-projects"}
          className="text-xs text-indigo-600 hover:underline"
        >
          ← Retour vue non-conformités projets
        </Link>

        {error && (
          <div className="rounded bg-red-100 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Bandeau haut : export + nouvelle NC + alertes */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportNcToCsv}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Export Excel
            </button>
            <button
              onClick={() => {
                setCreating(true);
              }}
              className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Nouvelle non-conformité
            </button>
            {/* Nouveau bouton : revenir vers les livrables du projet */}
            <button
              type="button"
              onClick={() => router.push(`/projects/${routeProjectId}/quality/deliverables`)}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Voir les livrables
            </button>

            <button
              type="button"
              onClick={() => router.push(`/projects/${routeProjectId}/quality/audit`)}
              className="px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              Voir les audits
            </button>

            {/* Nouveau bouton : ouvrir le synoptique des NC (PDF en /public) */}
            <button
              type="button"
              onClick={() => window.open("/synoptique-non-conformites.pdf", "_blank")}
              className="px-3 py-1.5 text-xs rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700"
            >
              Voir le synoptique non-conformités
            </button>

            {/* Cloche de notifications NC */}
            <div className="relative">
              <button
                  type="button"
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100"
                >
                  <span className="text-lg">🔔</span>
                  {notificationItems.length > 0 && !hasSeenNotifications && (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center">
                      {notificationItems.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 max-h-80 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">
                        Alertes NC
                      </span>
                      <button
                        className="text-[11px] text-slate-400 hover:text-slate-600"
                        onClick={() => {
                          setShowNotifications(false);
                          setHasSeenNotifications(true);
                        }}
                      >
                        Fermer
                      </button>
                    </div>
                    {notificationItems.length === 0 ? (
                      <div className="px-3 py-3 text-[11px] text-slate-500">
                        Aucune alerte pour le moment.
                      </div>
                    ) : (
                      <ul className="px-3 py-2 space-y-1 text-[11px]">
                        {notificationItems.map((n) => (
                          <li key={n.id} className="flex items-start gap-1">
                            <span className="mt-[3px]">•</span>
                            <span className="text-rose-700">{n.message}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
            </div>
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
                placeholder="Rechercher (réf, description, responsable...)"
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
                      ncs
                        .map((nc) => nc.detectedBy ?? "")
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
                  {NC_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
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
                  <option value="Toutes">Toutes sévérités</option>
                  {NC_SEVERITY.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">
                  Origine
                </label>
                <select
                  className="w-full rounded-md border border-slate-300 px-2 py-1"
                  value={filterOrigin}
                  onChange={(e) => setFilterOrigin(e.target.value)}
                >
                  <option value="Toutes">Toutes origines</option>
                  {NC_ORIGINS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg shadow-sm p-4 border bg-indigo-50">
            <div className="text-xs text-slate-600">NC ouvertes</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {kpiFiltered.open}
            </div>
            <div className="mt-1 text-[11px] text-slate-600">
              Inclut toutes les NC dont le statut n’est pas « Clôturé ».
            </div>
          </div>

          <div className="rounded-lg shadow-sm p-4 border bg-slate-50">
            <div className="text-xs text-slate-600">NC totales</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {kpiFiltered.total}
            </div>
            <div className="mt-1 text-[11px] text-slate-600">
              Ensemble des NC créées pour ce projet.
            </div>
          </div>

          <div className="rounded-lg shadow-sm p-4 border bg-amber-50">
            <div className="text-xs text-slate-600">% NC critiques</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {kpiFiltered.criticalRate.toFixed(1)} %
            </div>
            <div className="mt-1 text-[11px] text-slate-600">
              NC « Majeure » ou « Critique » / NC totales.
            </div>
          </div>

          <div className="rounded-lg shadow-sm p-4 border bg-rose-50">
            <div className="text-xs text-slate-600">
              Délai moyen de clôture
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {kpiFiltered.avgCloseDelay.toFixed(1)} j
            </div>
            <div className="mt-1 text-[11px] text-slate-600">
              Nombre moyen de jours entre détection et clôture.
            </div>
          </div>
        </div>

        {/* histogrammes */}
        <div className="mb-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <NcHistogram
            title="Répartition des NC par sévérité"
            data={barsSeverity}
            description="L’indicateur montre la répartition des non-conformités par niveau de sévérité (mineure, majeure, critique)."
            activeLabel={severityChartFilter}
            onBarClick={(label) => setSeverityChartFilter(label)}
            onReset={() => setSeverityChartFilter(null)}
          />

          <NcHistogram
            title="NC détectées par mois"
            data={barsByMonth}
            description="Suivi des NC enregistrées au fil des mois pour ce projet."
            activeLabel={monthChartFilter}
            onBarClick={(label) => setMonthChartFilter(label)}
            onReset={() => setMonthChartFilter(null)}
          />
        </div>

        {/* Tableau NC */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Liste des non-conformités
            </h2>
            <span className="text-[11px] text-slate-500">
              {filteredNcs.length} NC filtrée(s) / {ncs.length} au total
            </span>
          </div>

          <div className="overflow-x-auto max-h-[260px]">
            <table className="min-w-full text-xs table-fixed">
              <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium bg-slate-100">
                    Réf
                  </th>
                  <th className="px-3 py-2 text-left font-medium bg-slate-100">
                    Projet
                  </th>
                  <th className="px-3 py-2 text-left font-medium bg-slate-100">
                    Type / origine
                  </th>
                  <th className="px-3 py-2 text-left font-medium bg-slate-100">
                    Sévérité
                  </th>
                  <th className="px-3 py-2 text-left font-medium bg-slate-100">
                    Responsable
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
                <th className="px-3 py-2 text-left font-medium bg-slate-100 w-[340px]">
                    Description
                  </th>
                  <th className="px-3 py-2 text-left font-medium bg-slate-100">
                    Avancement 8D
                  </th>
                  <th className="px-3 py-2 text-center font-medium bg-slate-100">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredNcs.length === 0 && (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-3 py-4 text-center text-slate-500"
                    >
                      Aucune non-conformité pour l’instant avec ces filtres.
                    </td>
                  </tr>
                )}

                {filteredNcs.map((nc) => (
                  <tr key={nc.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                        <Link
                          href={`/projects/${nc.projectId}/quality/non-conformities/${nc.id}`}
                          className="text-indigo-600 hover:underline font-medium text-[11px]"
                        >
                          {nc.reference ?? `NC-${nc.id}`}
                        </Link>                    
                      </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={`/projects/${nc.projectId}`}
                        className="text-[11px] text-indigo-600 hover:underline"
                      >
                        {projectLabel}
                      </Link>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-slate-800">
                          {nc.type ?? "—"}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {nc.origin ?? "Origine non renseignée"}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      {severityBadge(nc.severity)}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      {nc.detectedBy ?? "—"}
                    </td>

                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {formatDate(nc.detectedOn)}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {formatDate(nc.dueDate)}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {formatDate(nc.closedDate)}
                    </td>

                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {statusBadge(nc.status)}
                    </td>

                    {/* Description sur plusieurs lignes */}
                    <td className="px-3 py-2 text-[11px] align-top w-[340px]">
                      <div className="text-slate-600 whitespace-normal break-words">
                        {nc.description || "—"}
                      </div>
                    </td>

                    {/* Avancement de la NC */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 rounded h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 bg-indigo-500"
                            style={{
                              width: `${nc.eightDProgress ?? 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-700">
                          {nc.eightDProgress ?? 0}%
                        </span>
                      </div>
                    </td>

                    {/* Actions : Mettre à jour + Fiche 8D */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        
                        {/* Mis à jour de la Fiche 8D */}
                        <Link
                            href={`/projects/${nc.projectId}/quality/non-conformities/${nc.id}`}
                            className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] text-slate-700"
                          >
                            MaJ NC
                          </Link>
                        
                        {/* Export PDF de la Fiche 8D */}
                        <button
                          type="button"
                          onClick={() =>
                            exportNc8dPdf(nc.projectId, nc.id)
                          }
                          className="px-2 py-0.5 rounded border border-indigo-300 bg-indigo-50 text-[10px] text-indigo-700"
                        >
                          Fiche 8D (pdf)
                          
                        </button>

                        {/* Bouton suppression */}
                        <button
                          type="button"
                          onClick={() => handleDeleteNc(nc.id)}
                          title="Supprimer la non-conformité"
                          className={`h-7 w-7 flex items-center justify-center rounded-full border ${
                            loadingDelete === nc.id
                              ? "bg-rose-100 border-rose-200 text-rose-400 cursor-wait"
                              : "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                          }`}
                          disabled={loadingDelete === nc.id}
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

        {/* panneau latéral nouvelle / édition NC */}
        {creating && (
          <div className="fixed inset-0 z-40 flex">
            <div
              className="flex-1 bg-black/40"
              onClick={() => {
                if (!saving) {
                  setCreating(false);
                }
              }}
            />
            <aside className="w-full max-w-3xl bg-white shadow-xl border-l border-slate-200">
              <div className="flex flex-col h-full">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-semibold text-slate-900">
                       Nouvelle non-conformité
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Enregistrez une NC liée au projet {projectLabel} et éventuellement à un livrable.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      if (!saving) {
                        setCreating(false);
                        setEditingNc(null);
                      }
                    }}
                    disabled={saving}
                  >
                    Fermer
                  </button>
                </div>

                <form
                  onSubmit={handleSaveNc}
                  className="p-4 space-y-4 text-xs overflow-auto max-h-[calc(100vh-60px)]"
                >
                  {/* D1 contexte */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      D1 – Identification de la non-conformité
                    </h3>

                    <div className="grid grid-cols-3 gap-3">
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

                      <div className="space-y-1 col-span-3 sm:col-span-1">
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
                              projectId: routeProjectId,
                              deliverableId:
                                e.target.value === "Livrable"
                                  ? prev.deliverableId
                                  : null,
                            }))
                          }
                        >
                          <option value="">Sélectionner une origine</option>
                          {NC_ORIGINS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Projet
                        </label>
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full text-xs bg-slate-100 text-slate-700"
                          value={projectLabel}
                          disabled
                        />
                      </div>

                      {newNc.origin === "Livrable" && (
                        <div className="space-y-1">
                          <label className="block text-[11px] font-medium text-slate-700">
                            Livrable lié
                          </label>
                          <select
                            className="border rounded px-2 py-1 w-full text-xs bg-white"
                            value={newNc.deliverableId ?? ""}
                            onChange={(e) =>
                              setNewNc((prev) => ({
                                ...prev,
                                deliverableId: e.target.value
                                  ? Number(e.target.value)
                                  : null,
                              }))
                            }
                          >
                            <option value="">Sélectionner un livrable</option>
                            {filteredDeliverablesForProject.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.reference ?? `LIV-${d.id}`} – {d.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
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
                          <option value="">Sélectionner un type</option>
                          {NC_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-slate-700">
                          Lien FNC / ticket
                        </label>
                        <input
                          className="border rounded px-2 py-1 w-full text-xs bg-white"
                          value={newNc.fncUrl}
                          onChange={(e) =>
                            setNewNc((prev) => ({
                              ...prev,
                              fncUrl: e.target.value,
                            }))
                          }
                          placeholder="Lien vers FNC client, ticket interne…"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
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
                    </div>

                    <div className="grid grid-cols-2 gap-3">
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

                  {/* D2 description */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      D2 – Description de la non-conformité
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

                  {/* D3 – Actions immédiates */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      D3 – Actions immédiates (curatives)
                    </h3>
                    <textarea
                      className="border rounded px-2 py-1 w-full text-xs h-18"
                      value={newNc.immediateAction}
                      onChange={(e) =>
                        setNewNc((prev) => ({
                          ...prev,
                          immediateAction: e.target.value,
                        }))
                      }
                      placeholder="Lister les actions mises en place rapidement pour sécuriser le client / l’exploitation."
                    />
                  </div>
  
                  {/* D5 / D7 */}
                  <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-slate-50">
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      D5 & D7 – Actions correctives / préventives
                    </h3>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        D5 – Actions correctives
                      </label>
                      <textarea
                        className="border rounded px-2 py-1 w-full text-xs h-16"
                        value={newNc.correctiveAction}
                        onChange={(e) =>
                          setNewNc((prev) => ({
                            ...prev,
                            correctiveAction: e.target.value,
                          }))
                        }
                        placeholder="Décrire les actions correctives pour supprimer les causes racines (qui, quoi, quand, livrables…)."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        D7 – Actions préventives
                      </label>
                      <textarea
                        className="border rounded px-2 py-1 w-full text-xs h-16"
                        value={newNc.preventiveAction}
                        onChange={(e) =>
                          setNewNc((prev) => ({
                            ...prev,
                            preventiveAction: e.target.value,
                          }))
                        }
                        placeholder="Lister les actions préventives pour éviter la réapparition (mise à jour doc, formation, automatisation…)."
                      />
                    </div>
                  </div>

                  {/* boutons */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        if (!saving) {
                          setCreating(false);
                          setEditingNc(null);
                        }
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
                      {saving
                        ? "Enregistrement..."
                        : editingNc
                        ? "Mettre à jour la NC"
                        : "Enregistrer la NC"}
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
                Cliquer sur une barre filtre tous les indicateurs et la
                liste des NC sur la valeur sélectionnée.
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
