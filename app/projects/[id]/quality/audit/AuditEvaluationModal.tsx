"use client";

import { useEffect, useState } from "react";
import { AuditAnswer, AuditThemeType } from "@prisma/client";

export type AuditQuestion = {
  id: number;
  code: number;
  text: string;
  weight: number;
  answer: AuditAnswer;
  comment: string | null;
};

export type AuditTheme = {
  id: number;
  type: AuditThemeType;
  area: "AVV" | "DELIVERY";
  conformityRate: number | null;
  color: string;
  questions: AuditQuestion[];
};

export type Project = {
  id: number;
  projectNumber: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  titleProject: string | null;
  status: string | null;
  outsourcing?: string | null;
  xshore?: string | null;
};

export type Audit = {
  id: number;
  projectId: number;
  ref: string;
  evaluationDate: string;
  globalConformityRate: number;
  previousGlobalRate: number | null;
  lastEvaluationDate: string | null;
  qualityFollowUp: string | null;
  outsourcing: string | null;
  xshore: string | null;
  ncFromAuditCount: number;
  avgActionClosureDelay: number | null;
  project: Project;
  themes: AuditTheme[];
};

type Props = {
  audit: Audit;
  onClose: () => void;
  onUpdated: (audit: Audit) => void;
  initialThemeType?: string;
};

/* descriptions par thème */
const PROCESS_DESCRIPTIONS: Record<
  AuditThemeType,
  { title: string; body: string }
> = {
  REVUE_OPPORTUNITE: {
    title: "Revue d’opportunité",
    body:
      "Analyse de l’opportunité du projet avant engagement, validation de la cohérence avec la stratégie et les capacités de l’entreprise.",
  },
  PILOTAGE_REPONSE: {
    title: "Pilotage de la réponse",
    body:
      "Organisation et pilotage de la phase de réponse (offre) : responsabilités, planning, risques avant-vente et validation interne.",
  },
  REVUE_CONTRAT: {
    title: "Revue de contrat",
    body:
      "Validation des exigences contractuelles, des engagements et des risques associés avant signature du contrat.",
  },
  REVUE_PROPOSITION: {
    title: "Revue de proposition",
    body:
      "Contrôle du contenu de la proposition (technique, planning, coûts) et alignement avec les besoins client.",
  },
  GESTION_EXIGENCES: {
    title: "Gestion des exigences",
    body:
      "Spécifier, tracer et maîtriser les exigences du client et des parties prenantes, gérer les évolutions et avenants.",
  },
  GESTION_RISQUES_OPPORTUNITES: {
    title: "Risques & opportunités",
    body:
      "Identifier, analyser, valoriser et traiter les risques et opportunités tout au long du projet.",
  },
  PLANIFICATION: {
    title: "Planification",
    body:
      "Structurer le projet (WBS) et construire un planning réaliste, suivi et mis à jour en fonction de l’avancement.",
  },
  PERFORMANCE: {
    title: "Performance",
    body:
      "Suivi des indicateurs clés (qualité, coûts, délais, satisfaction) et mise en place d’actions correctives.",
  },
  REUNIONS_COMMUNICATION: {
    title: "Réunions & communication",
    body:
      "Plan de communication, réunions internes et client, comptes rendus et décisions tracées.",
  },
  VERIFICATION_VALIDATION: {
    title: "Vérification & validation",
    body:
      "Contrôle de la conformité des livrables et formalisation de l’acceptation par le client.",
  },
  CAPITALISATION: {
    title: "Capitalisation",
    body:
      "Retours d’expérience, partage des bonnes pratiques et actions d’amélioration.",
  },
  GESTION_CONFIGURATION: {
    title: "Gestion de configuration",
    body:
      "Identification, maîtrise des versions et des évolutions des éléments de configuration livrés au client.",
  },
  GESTION_DOCUMENTAIRE: {
    title: "Gestion documentaire",
    body:
      "Organisation, mise à disposition et archivage de la documentation du projet.",
  },
  SECURITE_PERSONNES: {
    title: "Sécurité des personnes",
    body:
      "Prise en compte des règles de sécurité, formation et prévention pour les équipes.",
  },
  SECURITE_DONNEES: {
    title: "Sécurité des données",
    body:
      "Protection des données, gestion des accès, sauvegardes et confidentialité.",
  },
  GESTION_RESSOURCES: {
    title: "Gestion des ressources",
    body:
      "Affectation, charge et compétences des ressources nécessaires au projet.",
  },
  GESTION_SOUS_TRAITANCE: {
    title: "Sous-traitance",
    body:
      "Choix, pilotage et contrôle des sous-traitants (qualité, coûts, délais).",
  },
  GESTION_XSHORE: {
    title: "X-shore / transnational",
    body:
      "Organisation et communication avec les équipes réparties géographiquement (nearshore, offshore…).",
  },
  GESTION_NON_CONFORMITES: {
    title: "Gestion des non-conformités",
    body:
      "Détection, traitement et suivi des non-conformités issues du projet.",
  },
  GESTION_INSATISFACTIONS: {
    title: "Gestion des insatisfactions",
    body:
      "Collecte, traitement et suivi des insatisfactions et réclamations client.",
  },
  PMP: {
    title: "PMP / PAQ",
    body:
      "Plan de management de projet / plan d’assurance qualité définissant l’organisation et les règles du projet.",
  },
};

/* RACI par thème – libellés adaptés */
type RaciEntry = {
  practice: string;
  client: string;
  commerce: string;
  expert: string;
  chefProjet: string;
  technique: string;
};

const RACI_BY_THEME: Partial<Record<AuditThemeType, RaciEntry[]>> = {
  GESTION_EXIGENCES: [
    {
      practice: "Établir le référentiel des exigences",
      client: "",
      commerce: "",
      expert: "R",
      chefProjet: "A/R",
      technique: "",
    },
    {
      practice: "Enregistrer les preuves du respect des exigences",
      client: "",
      commerce: "",
      expert: "",
      chefProjet: "A/R",
      technique: "R",
    },
    {
      practice: "Gérer les évolutions des exigences",
      client: "A/R",
      commerce: "R",
      expert: "",
      chefProjet: "R",
      technique: "C",
    },
  ],
  GESTION_RISQUES_OPPORTUNITES: [
    {
      practice:
        "Identifier, analyser et valoriser les risques et opportunités",
      client: "C",
      commerce: "R",
      expert: "R",
      chefProjet: "A/R",
      technique: "",
    },
    {
      practice: "Planifier les actions de réduction des risques",
      client: "",
      commerce: "C",
      expert: "R",
      chefProjet: "A/R",
      technique: "C",
    },
    {
      practice: "Piloter les actions de réduction des risques",
      client: "C",
      commerce: "C",
      expert: "R",
      chefProjet: "A/R",
      technique: "C",
    },
  ],
  PLANIFICATION: [
    {
      practice:
        "Structurer et planifier le projet, optimiser la planification",
      client: "",
      commerce: "C",
      expert: "R",
      chefProjet: "A/R",
      technique: "C",
    },
  ],
};

function getRaciBg(value: string): string {
  if (!value) return "bg-slate-100";
  const upper = value.toUpperCase();
  if (upper.includes("A")) return "bg-rose-100";
  if (upper.includes("R")) return "bg-emerald-100";
  if (upper.includes("C")) return "bg-indigo-100";
  if (upper.includes("I")) return "bg-sky-100";
  return "bg-slate-100";
}

/** Statut d’un thème (bandeau Taux de conformité) */
function getConformityStatus(rate: number | null) {
  const target = 0.8;
  if (rate == null) {
    return {
      label: "Non applicable",
      bg: "bg-slate-200",
      text: "text-slate-700",
      displayRate: NaN,
      targetPct: target * 100,
    };
  }
  const displayRate = rate * 100;
  const label = rate >= target ? "Complet" : "Incomplet";
  const bg = rate >= target ? "bg-emerald-600" : "bg-black";
  return {
    label,
    bg,
    text: "text-white",
    displayRate,
    targetPct: target * 100,
  };
}

function getThemeBg(rate: number | null, disabled: boolean): string {
  if (disabled) return "bg-slate-200 text-slate-700";
  if (rate == null) return "bg-slate-200 text-slate-700";
  const pct = rate * 100;
  if (pct < 65) return "bg-rose-50";
  if (pct < 80) return "bg-amber-50";
  return "bg-emerald-50";
}

export function AuditEvaluationModal({
  audit: initialAudit,
  onClose,
  onUpdated,
  initialThemeType,
}: Props) {
  const [audit, setAudit] = useState<Audit>(initialAudit);
  const [activeThemeId, setActiveThemeId] = useState<number | null>(
    initialAudit.themes[0]?.id ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const themes = audit?.themes ?? [];

  // si aucun thème actif encore défini, on prend le premier une seule fois
  useEffect(() => {
    if (themes.length && activeThemeId == null) {
      setActiveThemeId(themes[0].id);
    }
  }, [themes, activeThemeId]);

  const currentTheme =
    activeThemeId != null
      ? themes.find((t) => t.id === activeThemeId) ?? null
      : null;


  // sélection initiale d’un thème si demandé (clic sur le graphe)
  useEffect(() => {
    if (!initialThemeType || !audit.themes?.length) return;
    const theme = audit.themes.find((t) => t.type === initialThemeType);
    if (theme) {
      setActiveThemeId(theme.id);
    }
  }, [initialThemeType, audit.themes]);

  // infos sous-traitance / x-shore
  const outsourcing = audit.outsourcing ?? audit.project.outsourcing ?? "";
  const xshore = audit.xshore ?? audit.project.xshore ?? "";

  const hasOutsourcing =
    outsourcing.toLowerCase() === "oui" || outsourcing.toLowerCase() === "yes";

  const hasXshore =
    xshore.toLowerCase() === "oui" || xshore.toLowerCase() === "yes";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/projects/${initialAudit.projectId}/audit/${initialAudit.id}`,
        );
        if (!res.ok) {
          console.error("Erreur chargement audit:", await res.text());
          return;
        }
        const data = (await res.json()) as Audit;
        setAudit(data);
      } catch (err) {
        console.error("Erreur de chargement de l’audit", err);
      }
    }
    load();
  }, [initialAudit.projectId, initialAudit.id]);

  async function handleCalculateThemeRate() {
    if (!currentTheme) return;

    const isOutsourcingTheme =
      currentTheme.type === "GESTION_SOUS_TRAITANCE";
    const isXshoreTheme = currentTheme.type === "GESTION_XSHORE";
    const isDisabledTheme =
      (!hasOutsourcing && isOutsourcingTheme) ||
      (!hasXshore && isXshoreTheme);

    if (isDisabledTheme) {
      alert(
        "Ce thème n’est pas applicable pour cet audit (pas de sous-traitance / X-shore).",
      );
      return;
    }

    setCalculating(true);
    try {
      const answersPayload = (currentTheme.questions ?? []).map((q) => ({
        questionId: q.id,
        answer: q.answer,
        comment: q.comment ?? "",
      }));

      const res = await fetch(
        `/api/projects/${audit.projectId}/audit/${audit.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            themeId: currentTheme.id,
            answers: answersPayload,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        console.error("Erreur calcul taux thème:", text);
        alert(
          "Erreur lors du calcul du taux de conformité pour ce thème.",
        );
        return;
      }

      const updated = (await res.json()) as Audit;

      // Conserver l’ordre courant et le thème actif par id
      setAudit((prev) => {
        const updatedById = new Map<number, AuditTheme>();
        updated.themes.forEach((t) => updatedById.set(t.id, t));

        const mergedThemes = prev.themes.map((oldTheme) => {
          const srv = updatedById.get(oldTheme.id);
          if (!srv) return oldTheme;

          if (oldTheme.id === activeThemeId) {
            return {
              ...oldTheme,
              conformityRate: srv.conformityRate,
              color: srv.color,
            };
          }
          return {
            ...oldTheme,
            ...srv,
          };
        });

        return {
          ...prev,
          globalConformityRate: updated.globalConformityRate,
          previousGlobalRate: updated.previousGlobalRate,
          lastEvaluationDate: updated.lastEvaluationDate,
          qualityFollowUp: updated.qualityFollowUp,
          ncFromAuditCount: updated.ncFromAuditCount,
          avgActionClosureDelay: updated.avgActionClosureDelay,
          themes: mergedThemes,
        };
      });

      onUpdated(updated);
    } catch (e: any) {
      console.error(e);
      alert(
        e?.message ??
          "Erreur inconnue lors du calcul du taux de conformité.",
      );
    } finally {
      setCalculating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      onUpdated(audit);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!currentTheme) {
    return (
      <div className="fixed inset-0 z-40 flex">
        <div
          className="flex-1 bg-black/40"
          onClick={() => !saving && !calculating && onClose()}
        />
        <aside className="w-full max-w-5xl bg-white shadow-xl border-l border-slate-200 flex flex-col">
          <header className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-slate-900">
                Évaluation de l’audit {audit.ref}
              </h2>
            </div>
            <button
              type="button"
              className="text-[11px] text-slate-500 hover:text-slate-700"
              onClick={() => !saving && !calculating && onClose()}
            >
              Fermer
            </button>
          </header>
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
            Chargement des thèmes d’audit...
          </div>
        </aside>
      </div>
    );
  }

  const isOutsourcingTheme =
    currentTheme.type === "GESTION_SOUS_TRAITANCE";
  const isXshoreTheme = currentTheme.type === "GESTION_XSHORE";
  const isDisabledTheme =
    (!hasOutsourcing && isOutsourcingTheme) ||
    (!hasXshore && isXshoreTheme);

  // Forcer le taux à null pour les thèmes non applicables
  const effectiveConformityRate = isDisabledTheme
    ? null
    : currentTheme.conformityRate;

  const processInfo = PROCESS_DESCRIPTIONS[currentTheme.type];
  const raci = (RACI_BY_THEME[currentTheme.type] as RaciEntry[]) ?? [];
  const evalInfo = getConformityStatus(effectiveConformityRate);
  const themeLabel = processInfo ? processInfo.title : currentTheme.type;

  function updateQuestionAnswer(
    questionId: number,
    answer: AuditAnswer,
  ) {
    if (isDisabledTheme || !currentTheme) return;

    setAudit((prev) => {
      const newThemes = prev.themes.map((t) =>
        t.id === currentTheme.id
          ? {
              ...t,
              questions: (t.questions ?? []).map((q) =>
                q.id === questionId ? { ...q, answer } : q,
              ),
            }
          : t,
      );
      return {
        ...prev,
        themes: newThemes,
      };
    });
  }

  function handleSelectTheme(id: number) {
    setActiveThemeId(id);
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="flex-1 bg-black/40"
        onClick={() => !saving && !calculating && onClose()}
      />
      <aside className="w-full max-w-5xl bg-white shadow-xl border-l border-slate-200 flex flex-col">
        <header className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-slate-900">
              Évaluation de l’audit {audit.ref}
            </h2>
            <p className="text-[11px] text-slate-500">
              Projet{" "}
              {audit.project?.projectNumber ??
                audit.project?.titleProject ??
                `P-${audit.projectId}`}
            </p>
            <p className="text-[11px] text-slate-500">
              Date d’évaluation :{" "}
              {new Date(audit.evaluationDate).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <button
            type="button"
            className="text-[11px] text-slate-500 hover:text-slate-700"
            onClick={() => !saving && !calculating && onClose()}
          >
            Fermer
          </button>
        </header>

        <div className="flex-1 overflow-hidden flex">
          {/* Liste thèmes */}
          <div className="w-72 border-r border-slate-200 overflow-y-auto bg-slate-50">
            <div className="p-3 border-b border-slate-100">
              <p className="text-[11px] font-semibold text-slate-700">
                Process évalués
              </p>
              <p className="text-[10px] text-slate-500">
                Sélectionne un process pour voir sa description, son
                RACI et son évaluation.
              </p>
            </div>
            <ul className="text-[11px]">
              {themes.map((t) => {
                const info = PROCESS_DESCRIPTIONS[t.type];
                const labelLeft = [t.area ?? "", info ? info.title : t.type]
                  .filter(Boolean)
                  .join(" – ");

                const themeDisabled =
                  (!hasOutsourcing &&
                    t.type === "GESTION_SOUS_TRAITANCE") ||
                  (!hasXshore && t.type === "GESTION_XSHORE");

                const bgLevel = getThemeBg(
                  t.conformityRate,
                  themeDisabled,
                );

                const isActive = t.id === currentTheme.id;

                const display =
                  t.conformityRate != null && !themeDisabled
                    ? `${(t.conformityRate * 100).toFixed(0)} %`
                    : "NA";

                return (
                  <li key={t.id} className="px-2 py-1">
                    <button
                      type="button"
                      onClick={() => handleSelectTheme(t.id)}
                      className={`w-full text-left px-2 py-1.5 flex items-center justify-between rounded-md border ${
                        isActive
                          ? "border-indigo-500 ring-2 ring-indigo-500 ring-offset-0"
                          : "border-transparent hover:border-slate-300"
                      } ${bgLevel}`}
                    >
                      <span className="truncate max-w-[190px]">
                        {labelLeft}
                      </span>
                      <span className="ml-2 text-[10px]">
                        {display}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contenu à droite */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
            <section className="border border-slate-200 rounded-lg p-3 bg-indigo-50">
              <h3 className="text-[13px] font-semibold text-slate-800 mb-1">
                {processInfo.title}
              </h3>
            </section>

            {/* Description */}
            <section className="border border-slate-200 rounded-lg p-3 bg-emerald-50">
              <h3 className="text-[11px] font-semibold text-slate-800 mb-1">
                Description du process
              </h3>
              {processInfo ? (
                <>
                  <p className="text-[11px] text-slate-600 leading-snug mt-1">
                    {processInfo.body}
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Description à compléter pour ce process.
                </p>
              )}
            </section>

            {/* RACI */}
            <section className="border border-slate-200 rounded-lg p-3 bg-white">
              <h3 className="text-[11px] font-semibold text-slate-800 mb-2">
                RACI du process
              </h3>
              {raci.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">
                  RACI à compléter pour ce process.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border px-1 py-0.5 text-left">
                          Pratique
                        </th>
                        <th className="border px-1 py-0.5">Client</th>
                        <th className="border px-1 py-0.5">Commerce</th>
                        <th className="border px-1 py-0.5">Expert</th>
                        <th className="border px-1 py-0.5">
                          Chef de projet
                        </th>
                        <th className="border px-1 py-0.5">Technique</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raci.map((row, i) => (
                        <tr key={i}>
                          <td className="border px-1 py-0.5 bg-slate-50">
                            {row.practice}
                          </td>
                          <td
                            className={
                              "border px-1 py-0.5 text-center " +
                              getRaciBg(row.client)
                            }
                          >
                            {row.client}
                          </td>
                          <td
                            className={
                              "border px-1 py-0.5 text-center " +
                              getRaciBg(row.commerce)
                            }
                          >
                            {row.commerce}
                          </td>
                          <td
                            className={
                              "border px-1 py-0.5 text-center " +
                              getRaciBg(row.expert)
                            }
                          >
                            {row.expert}
                          </td>
                          <td
                            className={
                              "border px-1 py-0.5 text-center " +
                              getRaciBg(row.chefProjet)
                            }
                          >
                            {row.chefProjet}
                          </td>
                          <td
                            className={
                              "border px-1 py-0.5 text-center " +
                              getRaciBg(row.technique)
                            }
                          >
                            {row.technique}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-1">
                A = Accountable, R = Responsible, C = Consulted, I =
                Informé.
              </p>
            </section>

            {/* Évaluation + questions */}
            <section className="border border-slate-200 rounded-lg p-3 bg-sky-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold text-slate-800">
                  Évaluation du thème {themeLabel}
                </h3>
                <button
                  type="button"
                  onClick={handleCalculateThemeRate}
                  disabled={calculating || isDisabledTheme}
                  className="text-[11px] px-2 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isDisabledTheme
                    ? "Thème non applicable (NA)"
                    : calculating
                    ? "Calcul en cours..."
                    : "Calculer le taux de conformité"}
                </button>
              </div>

              {isDisabledTheme && (
                <p className="mb-2 text-[11px] text-slate-600">
                  Ce thème n’est pas applicable à ce projet (pas de
                  sous-traitance / X‑shore). Les questions restent en NA.
                </p>
              )}

              <div className="flex flex-wrap items-stretch text-[11px] mb-3">
                <div className="flex flex-col mr-2">
                  <div className="flex">
                    <div className="px-2 py-1 bg-sky-700 text-white text-center text-[11px] w-32">
                      Taux de conformité
                    </div>
                    <div
                      className={`px-2 py-1 ${evalInfo.bg} ${evalInfo.text} text-center text-[11px] w-28`}
                    >
                      {evalInfo.label}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="px-2 py-1 bg-sky-700 text-white text-center text-[11px] w-32">
                      Objectif
                    </div>
                    <div className="px-2 py-1 bg-lime-400 text-white text-center text-[11px] w-28">
                      {evalInfo.targetPct.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="ml-4 mt-1 text-[11px] text-slate-700">
                  Taux actuel pour ce thème :{" "}
                  <span className="font-semibold">
                    {Number.isNaN(evalInfo.displayRate)
                      ? "NA"
                      : `${evalInfo.displayRate.toFixed(0)} %`}
                  </span>
                  . Seuil de complétude à 80 %.
                </div>
              </div>

              {(currentTheme.questions ?? []).length > 0 && !isDisabledTheme ? (
                <>
                  <p className="text-[11px] font-semibold text-slate-800 mb-1">
                    Questions d’évaluation
                  </p>
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border px-2 py-1 text-left">
                          Question
                        </th>
                        <th className="border px-2 py-1 w-16 text-center">
                          Oui
                        </th>
                        <th className="border px-2 py-1 w-16 text-center">
                          Non
                        </th>
                        <th className="border px-2 py-1 w-16 text-center">
                          N/A
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTheme.questions.map((q) => (
                        <tr key={q.id}>
                          <td className="border px-2 py-1">
                            {q.text}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={q.answer === "OUI"}
                              onChange={() =>
                                updateQuestionAnswer(q.id, "OUI")
                              }
                            />
                          </td>
                          <td className="border px-2 py-1 text-center">
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={q.answer === "NON"}
                              onChange={() =>
                                updateQuestionAnswer(q.id, "NON")
                              }
                            />
                          </td>
                          <td className="border px-2 py-1 text-center">
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={q.answer === "NA"}
                              onChange={() =>
                                updateQuestionAnswer(q.id, "NA")
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : !isDisabledTheme ? (
                <p className="text-[11px] text-slate-500 italic">
                  Aucune question définie pour ce thème.
                </p>
              ) : null}
            </section>
          </div>
        </div>

        <footer className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
          <button
            type="button"
            className="border border-slate-300 rounded px-3 py-1.5 text-[11px] bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => !saving && !calculating && onClose()}
            disabled={saving || calculating}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded px-3 py-1.5 text-[11px] bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
            onClick={handleSave}
            disabled={saving || calculating}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </footer>
      </aside>
    </div>
  );
}