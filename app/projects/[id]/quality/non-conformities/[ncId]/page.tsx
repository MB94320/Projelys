"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";

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

const NC_SEVERITY = ["Mineure", "Majeure", "Critique"];

const NC_STATUS = ["Ouvert", "En cours", "Clôturé", "Annulé"];

const EIGHTD_HELP = {
  D1: {
    title: "D1 – Constituer l’équipe",
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
    text: "Utiliser les 5 pourquoi / Ishikawa pour identifier pourquoi le problème est apparu et pourquoi il n’a pas été détecté plus tôt.",
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

export default function NcDetailPage() {
  const params = useParams<{ id: string; ncId: string }>();
  const router = useRouter();
  const projectId = Number(params.id);
  const ncId = Number(params.ncId);

  const [nc, setNc] = useState<NonConformity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [d1Team, setD1Team] = useState("");
  const [d2Problem, setD2Problem] = useState("");
  const [d3Immediate, setD3Immediate] = useState("");
  const [d4Causes, setD4Causes] = useState("");
  const [d5Corrective, setD5Corrective] = useState("");
  const [d6Effectiveness, setD6Effectiveness] = useState("");
  const [d7Preventive, setD7Preventive] = useState("");
  const [d8Closure, setD8Closure] = useState("");
  const [eightDProgress, setEightDProgress] = useState<number>(0);
  const [eightDComment, setEightDComment] = useState("");

  const [ownerForActions, setOwnerForActions] = useState("");
  const [actionsDueDate, setActionsDueDate] = useState("");

  useEffect(() => {
    if (!projectId || !ncId) return;

    async function loadNc() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/projects/${projectId}/quality?type=non-conformities`
        );
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          throw new Error(
            d?.error ?? "Erreur de chargement des non-conformités"
          );
        }
        const list = (await res.json()) as any[];

        const found = list.find((x) => x.id === ncId);
        if (!found) {
          throw new Error("Non-conformité introuvable pour ce projet");
        }

        setNc({
          id: found.id,
          projectId: found.projectId,
          deliverableId: found.deliverableId,
          reference: found.reference,
          type: found.type,
          origin: found.origin,
          description: found.description,
          severity: found.severity,
          detectedOn: found.detectedOn
            ? new Date(found.detectedOn).toISOString().slice(0, 10)
            : null,
          detectedBy: found.detectedBy,
          dueDate: found.dueDate
            ? new Date(found.dueDate).toISOString().slice(0, 10)
            : null,
          status: found.status,
          closedDate: found.closedDate
            ? new Date(found.closedDate).toISOString().slice(0, 10)
            : null,
          rootCause: found.rootCause,
          immediateAction: found.immediateAction,
          correctiveAction: found.correctiveAction,
          preventiveAction: found.preventiveAction,
          comments: found.comments,
          fncUrl: found.fncUrl,
          eightDProgress: found.eightDProgress ?? 0,
          eightDComment: found.eightDComment ?? "",
        });

        setD2Problem(found.description ?? "");
        setD3Immediate(found.immediateAction ?? "");
        setD5Corrective(found.correctiveAction ?? "");
        setD7Preventive(found.preventiveAction ?? "");
        setD4Causes(found.rootCause ?? "");
        setD1Team("");
        setD6Effectiveness("");
        setD8Closure(found.comments ?? "");
        setEightDProgress(found.eightDProgress ?? 0);
        setEightDComment(found.eightDComment ?? "");
      } catch (e: any) {
        setError(e.message ?? "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    loadNc();
  }, [projectId, ncId]);

  function formatDate(value: string | null) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("fr-FR");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nc) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        id: nc.id,
        type: nc.type,
        origin: nc.origin,
        description: d2Problem || nc.description,
        severity: nc.severity,
        detectedOn: nc.detectedOn,
        detectedBy: nc.detectedBy,
        dueDate: nc.dueDate,
        status: nc.status,
        closedDate: nc.closedDate,
        rootCause: d4Causes || nc.rootCause,
        immediateAction: d3Immediate || nc.immediateAction,
        correctiveAction: d5Corrective || nc.correctiveAction,
        preventiveAction: d7Preventive || nc.preventiveAction,
        comments: d8Closure || nc.comments,
        fncUrl: nc.fncUrl,
        eightDProgress,
        eightDComment,
      };

      const res = await fetch(
        `/api/projects/${projectId}/quality?type=non-conformities`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.error ?? "Erreur lors de la mise à jour de la NC"
        );
      }

      const updated = (await res.json()) as any;
      setNc((prev) =>
        prev
          ? {
              ...prev,
              description: updated.description,
              severity: updated.severity,
              status: updated.status,
              detectedOn: updated.detectedOn
                ? new Date(updated.detectedOn).toISOString().slice(0, 10)
                : null,
              dueDate: updated.dueDate
                ? new Date(updated.dueDate).toISOString().slice(0, 10)
                : null,
              closedDate: updated.closedDate
                ? new Date(updated.closedDate).toISOString().slice(0, 10)
                : null,
              rootCause: updated.rootCause,
              immediateAction: updated.immediateAction,
              correctiveAction: updated.correctiveAction,
              preventiveAction: updated.preventiveAction,
              comments: updated.comments,
              eightDProgress: updated.eightDProgress ?? prev.eightDProgress,
              eightDComment: updated.eightDComment ?? prev.eightDComment,
            }
          : prev
      );
      router.push(`/projects/${projectId}/quality/non-conformities`);
    } catch (e: any) {
      setError(e.message ?? "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateActionsFrom8D() {
  if (!nc) return;

  try {
    setSaving(true);
    setError(null);

    type ActionPayload = {
      title: string;
      description: string | null;
      owner: string | null;
      priority: "Basse" | "Moyenne" | "Haute";
      dueDate: string | null;
      category: "Corrective" | "Préventive";
    };

    const actionsPayload: ActionPayload[] = [];

    const owner = ownerForActions || nc.detectedBy || null;
    const dueDate = actionsDueDate || nc.dueDate || null;

    // D5 – une ligne = une action corrective
    if (d5Corrective.trim()) {
      const lines = d5Corrective
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      for (const line of lines) {
        actionsPayload.push({
          title: line,                   // intitulé exact
          description: `DAC – ${line}`,  // tag DAC dans les commentaires
          owner,
          priority: "Moyenne",
          dueDate,
          category: "Corrective",
        });
      }
    }

    // D7 – une ligne = une action préventive
    if (d7Preventive.trim()) {
      const lines = d7Preventive
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      for (const line of lines) {
        actionsPayload.push({
          title: line,                   // intitulé exact
          description: `DAP – ${line}`,  // tag DAP dans les commentaires
          owner,
          priority: "Moyenne",
          dueDate,
          category: "Préventive",
        });
      }
    }

    if (!actionsPayload.length) {
      throw new Error(
        "Merci de saisir au moins une action (D5 ou D7), une action par ligne.",
      );
    }

    const res = await fetch(
      `/api/projects/${projectId}/quality/non-conformities/${ncId}/actions-from-8d`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: actionsPayload }),
      },
    );

    if (!res.ok) {
      const d = await res.json().catch(() => null);
      throw new Error(
        d?.error ?? "Erreur lors de la création des actions D5/D7.",
      );
    }
  } catch (e: any) {
    setError(e.message ?? "Erreur inconnue");
  } finally {
    setSaving(false);
  }
}



  if (loading) {
    return (
      <AppShell activeSection="quality" pageTitle="Fiche NC – chargement">
        <div className="p-4 text-sm text-slate-600">Chargement…</div>
      </AppShell>
    );
  }

  if (!nc) {
    return (
      <AppShell activeSection="quality" pageTitle="Fiche NC – introuvable">
        <div className="p-4 text-sm text-red-600">
          Impossible de charger la non-conformité.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeSection="quality"
      pageTitle={`Fiche NC ${nc.reference ?? nc.id}`}
      pageSubtitle="Mise à jour de la non-conformité et de la fiche 8D"
    >
      <div className="p-4 space-y-4 text-xs">
        {error && (
          <div className="rounded bg-red-100 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-slate-500">
              Projet #{nc.projectId}
            </span>
            <span className="text-sm font-semibold text-slate-900">
              Non-conformité {nc.reference ?? nc.id}
            </span>
            <span className="text-[11px] text-slate-600">
              Créée le {formatDate(nc.detectedOn)} – Statut {nc.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/quality/non-conformities`}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
            >
              Retour liste NC
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)] gap-4"
        >
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-white">
              <h3 className="text-[11px] font-semibold text-slate-800">
                D1 – Identification de la non-conformité
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Référence
                  </label>
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full text-xs bg-slate-100 text-slate-600"
                    value={nc.reference ?? ""}
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Statut
                  </label>
                  <select
                    className="border rounded px-2 py-1 w-full text-xs bg-white"
                    value={nc.status}
                    onChange={(e) =>
                      setNc((prev) =>
                        prev ? { ...prev, status: e.target.value } : prev
                      )
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
                    Type
                  </label>
                  <select
                    className="border rounded px-2 py-1 w-full text-xs bg-white"
                    value={nc.type ?? ""}
                    onChange={(e) =>
                      setNc((prev) =>
                        prev ? { ...prev, type: e.target.value } : prev
                      )
                    }
                  >
                    <option value="">Non renseigné</option>
                    {NC_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Origine
                  </label>
                  <select
                    className="border rounded px-2 py-1 w-full text-xs bg-white"
                    value={nc.origin ?? ""}
                    onChange={(e) =>
                      setNc((prev) =>
                        prev ? { ...prev, origin: e.target.value } : prev
                      )
                    }
                  >
                    <option value="">Non renseignée</option>
                    {NC_ORIGINS.map((o) => (
                      <option key={o} value={o}>
                        {o}
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
                    value={nc.severity ?? ""}
                    onChange={(e) =>
                      setNc((prev) =>
                        prev ? { ...prev, severity: e.target.value } : prev
                      )
                    }
                  >
                    <option value="">Non renseignée</option>
                    {NC_SEVERITY.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Responsable / pilote NC
                  </label>
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={nc.detectedBy ?? ""}
                    onChange={(e) =>
                      setNc((prev) =>
                        prev ? { ...prev, detectedBy: e.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Date de détection
                  </label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={nc.detectedOn ?? ""}
                    onChange={(e) =>
                      setNc((prev) =>
                        prev ? { ...prev, detectedOn: e.target.value } : prev
                      )
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
                    value={nc.dueDate ?? ""}
                    onChange={(e) =>
                      setNc((prev) =>
                        prev ? { ...prev, dueDate: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-700">
                    Date de clôture
                  </label>
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-full text-xs"
                    value={nc.closedDate ?? ""}
                    onChange={(e) =>
                      setNc((prev) =>
                        prev ? { ...prev, closedDate: e.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
              <h3 className="text-[11px] font-semibold text-slate-800">
                D2 – Description de la non-conformité
              </h3>
              <textarea
                className="border rounded px-2 py-1 w-full text-xs h-32"
                value={d2Problem}
                onChange={(e) => setD2Problem(e.target.value)}
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
              <h3 className="text-[11px] font-semibold text-slate-800">
                D3 – Actions immédiates (curatives)
              </h3>
              <textarea
                className="border rounded px-2 py-1 w-full text-xs h-24"
                value={d3Immediate}
                onChange={(e) => setD3Immediate(e.target.value)}
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
              <h3 className="text-[11px] font-semibold text-slate-800">
                D4 – Causes racines
              </h3>
              <p className="text-[11px] text-slate-600">
                Coche les causes qui expliquent l&apos;apparition de la NC, puis
                complète au besoin dans le champ libre.
              </p>
              <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-md p-2 space-y-2">
                {Object.entries(CAUSE_CATEGORIES).map(
                  ([category, items]) => (
                    <div key={category}>
                      <div className="text-[11px] font-semibold text-slate-700 mb-1">
                        {category}
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {items.map((item) => {
                          const checked = d4Causes.includes(item);
                          return (
                            <label
                              key={item}
                              className="inline-flex items-start gap-1 text-[11px] text-slate-700"
                            >
                              <input
                                type="checkbox"
                                className="mt-[2px]"
                                checked={checked}
                                onChange={(e) => {
                                  setD4Causes((prev) => {
                                    const list = prev ? prev.split("\n") : [];
                                    if (e.target.checked) {
                                      if (!list.includes(item))
                                        list.push(item);
                                    } else {
                                      const idx = list.indexOf(item);
                                      if (idx !== -1) list.splice(idx, 1);
                                    }
                                    return list.join("\n");
                                  });
                                }}
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
              <textarea
                className="border rounded px-2 py-1 w-full text-xs h-24 mt-2"
                value={d4Causes}
                onChange={(e) => setD4Causes(e.target.value)}
                placeholder="Synthèse des causes racines sélectionnées / analyse 5 pourquoi…"
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
              <h3 className="text-[11px] font-semibold text-slate-800">
                D5 – Actions correctives
              </h3>
              <textarea
                className="border rounded px-2 py-1 w-full text-xs h-24"
                value={d5Corrective}
                onChange={(e) => setD5Corrective(e.target.value)}
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
              <h3 className="text-[11px] font-semibold text-slate-800">
                D6 – Mise en œuvre & efficacité
              </h3>
              <textarea
                className="border rounded px-2 py-1 w-full text-xs h-24"
                value={d6Effectiveness}
                onChange={(e) => setD6Effectiveness(e.target.value)}
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
              <h3 className="text-[11px] font-semibold text-slate-800">
                D7 – Actions préventives
              </h3>
              <textarea
                className="border rounded px-2 py-1 w-full text-xs h-24"
                value={d7Preventive}
                onChange={(e) => setD7Preventive(e.target.value)}
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
              <h3 className="text-[11px] font-semibold text-slate-800">
                D8 – Clôture & capitalisation
              </h3>
              <textarea
                className="border rounded px-2 py-1 w-full text-xs h-24"
                value={d8Closure}
                onChange={(e) => setD8Closure(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                onClick={() =>
                  router.push(
                    `/projects/${projectId}/quality/non-conformities`
                  )
                }
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
              <h3 className="text-[11px] font-semibold text-slate-800 mb-1">
                Avancement 8D
              </h3>
              <input
                type="number"
                min={0}
                max={100}
                className="border rounded px-2 py-1 w-full text-xs mb-2"
                value={eightDProgress}
                onChange={(e) =>
                  setEightDProgress(Number(e.target.value) || 0)
                }
              />
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-2 bg-indigo-500"
                  style={{ width: `${eightDProgress}%` }}
                />
              </div>
              <textarea
                className="mt-2 border rounded px-2 py-1 w-full text-xs h-16"
                placeholder="Commentaire global sur l’avancement 8D"
                value={eightDComment}
                onChange={(e) => setEightDComment(e.target.value)}
              />
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
              <h3 className="text-[11px] font-semibold text-slate-800">
                Créer des actions à partir de D5 / D7
              </h3>
              <p className="text-[11px] text-slate-600">
                Utilise les blocs « Actions correctives » (D5) et « Actions
                préventives » (D7) pour générer des actions dans le plan
                d&apos;actions Qualité du projet.
              </p>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-700">
                  Responsable par défaut
                </label>
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full text-xs"
                  value={ownerForActions}
                  onChange={(e) => setOwnerForActions(e.target.value)}
                  placeholder={nc.detectedBy ?? "Responsable NC"}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-700">
                  Échéance des actions
                </label>
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full text-xs"
                  value={actionsDueDate}
                  onChange={(e) => setActionsDueDate(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleCreateActionsFrom8D}
                disabled={saving}
                className="mt-2 px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white disabled:opacity-60"
              >
                Créer / mettre à jour les actions D5–D7
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
              <h3 className="text-[11px] font-semibold text-slate-800">
                Aide fiche 8D
              </h3>
              {Object.entries(EIGHTD_HELP).map(([key, value]) => (
                <div key={key} className="border-t border-slate-100 pt-2 mt-2">
                  <div className="text-[11px] font-semibold text-slate-800">
                    {value.title}
                  </div>
                  <div className="text-[11px] text-slate-600">{value.text}</div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
