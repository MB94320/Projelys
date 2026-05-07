"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "@/app/components/AppShell";
import { useRouter } from "next/navigation";

type ProjectRow = {
  projectId: number;
  projectLabel: string;
  projectTitle: string | null;
  clientName: string | null;
  projectManagerName: string | null;
  status: string | null;
  totalDeliverables: number;
  otd: number;
  oqd: number;
  dod: number;      // DoD moyen projet
  dodTotal: number; // somme des retards projet
  ncOpen: number;
  ncTotal: number;
  ncCritical: number;
  avgCloseDelayNc: number;
  auditScore: number | null;
};

type OverviewExtended = {
  global: {
    totalDeliverables: number;
    globalOtd: number;
    globalOqd: number;
    dodGlobal: number; // somme de tous les DoD
    totalNc: number;
    openNc: number;
    closedNc: number;
    avgCloseDelayNc: number;
    globalAuditScore: number | null;
  };
  projects: ProjectRow[];
};

type FilterState = {
  search: string;
  projectNumber: string;
  client: string;
  pm: string;
  status: string;
};

export default function QualityGlobalPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterState>({
    search: "",
    projectNumber: "Tous",
    client: "Tous",
    pm: "Tous",
    status: "Tous",
  });

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/quality/overview-extended");
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(
          d?.error ?? "Erreur lors du chargement de la synthèse qualité.",
        );
      }
      const json = (await res.json()) as OverviewExtended;
      setData(json);
    } catch (e: any) {
      setError(
        e?.message ?? "Erreur inconnue lors du chargement de la synthèse qualité.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const projects = data?.projects ?? [];

  // listes pour filtres
  const uniqueProjectNumbers = useMemo(
    () =>
      Array.from(new Set(projects.map((p) => p.projectLabel))).sort(),
    [projects],
  );

  const uniqueClients = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((p) => p.clientName ?? "")
            .filter((v) => v.trim() !== ""),
        ),
      ),
    [projects],
  );

  const uniquePms = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((p) => p.projectManagerName ?? "")
            .filter((v) => v.trim() !== ""),
        ),
      ),
    [projects],
  );

  const uniqueStatus = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((p) => p.status ?? "")
            .filter((v) => v.trim() !== ""),
        ),
      ),
    [projects],
  );

  // application des filtres
  const filteredProjects = useMemo(
    () =>
      projects.filter((p) => {
        if (filter.client !== "Tous" && p.clientName !== filter.client) {
          return false;
        }
        if (filter.pm !== "Tous" && p.projectManagerName !== filter.pm) {
          return false;
        }
        if (filter.status !== "Tous" && p.status !== filter.status) {
          return false;
        }
        if (
          filter.projectNumber !== "Tous" &&
          p.projectLabel !== filter.projectNumber
        ) {
          return false;
        }

        if (filter.search.trim()) {
          const q = filter.search.toLowerCase();
          const haystack = [
            p.projectTitle ?? "",
            p.projectLabel ?? "",
            p.clientName ?? "",
            p.projectManagerName ?? "",
            p.status ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      }),
    [projects, filter],
  );

  // KPIs dynamiques recalculés sur les projets filtrés
  const dynamicKpis = useMemo(() => {
    if (filteredProjects.length === 0) {
      return {
        totalDeliverables: 0,
        otd: 0,
        oqd: 0,
        dodGlobal: 0,
        ncOpen: 0,
        ncClosed: 0,
        avgCloseDelayNc: 0,
        auditScore: 0,
      };
    }

    const totalDeliverables = filteredProjects.reduce(
      (sum, p) => sum + p.totalDeliverables,
      0,
    );

    // OTD / OQD moyens pondérés par nb de livrables
    let otdNum = 0;
    let oqdNum = 0;
    let livrablesCountForRates = 0;
    let dodGlobal = 0;

    for (const p of filteredProjects) {
      if (p.totalDeliverables > 0) {
        otdNum += p.otd * p.totalDeliverables;
        oqdNum += p.oqd * p.totalDeliverables;
        livrablesCountForRates += p.totalDeliverables;
      }
      dodGlobal += p.dodTotal;
    }

    const otd =
      livrablesCountForRates > 0
        ? otdNum / livrablesCountForRates
        : 0;
    const oqd =
      livrablesCountForRates > 0
        ? oqdNum / livrablesCountForRates
        : 0;

    const ncOpen = filteredProjects.reduce(
      (sum, p) => sum + p.ncOpen,
      0,
    );
    const ncTotal = filteredProjects.reduce(
      (sum, p) => sum + p.ncTotal,
      0,
    );
    const ncClosed = ncTotal - ncOpen;

    // délai moyen de clôture NC
    let totDelay = 0;
    let projectWithDelay = 0;
    for (const p of filteredProjects) {
      if (p.avgCloseDelayNc > 0) {
        totDelay += p.avgCloseDelayNc;
        projectWithDelay += 1;
      }
    }
    const avgCloseDelayNc =
      projectWithDelay > 0 ? totDelay / projectWithDelay : 0;

    // score audit moyen
    const auditScores = filteredProjects
      .map((p) => p.auditScore)
      .filter((s): s is number => s !== null);
    const auditScore =
      auditScores.length > 0
        ? auditScores.reduce((s, v) => s + v, 0) /
          auditScores.length
        : 0;

    return {
      totalDeliverables,
      otd,
      oqd,
      dodGlobal,
      ncOpen,
      ncClosed,
      avgCloseDelayNc,
      auditScore,
    };
  }, [filteredProjects]);

  // Alertes & recommandations (3 colonnes)
  const alertsLivrables = useMemo(() => {
    const veryGood: string[] = [];
    const watch: string[] = [];
    const actions: string[] = [];

    for (const p of filteredProjects) {
      if (p.totalDeliverables === 0) continue;

      if (p.otd >= 95 && p.oqd >= 95 && p.dod <= 1) {
        veryGood.push(
          `${p.projectLabel} : performance livrables très robuste (OTD ${p.otd.toFixed(
            1,
          )} %, OQD ${p.oqd.toFixed(1)} %, DoD ${p.dod.toFixed(1)} j).`,
        );
      }

      if (
        (p.otd < 90 && p.otd >= 80) ||
        (p.oqd < 90 && p.oqd >= 80)
      ) {
        watch.push(
          `${p.projectLabel} : légère dégradation (OTD ${p.otd.toFixed(
            1,
          )} %, OQD ${p.oqd.toFixed(
            1,
          )} %) – suivre les dérives planning / qualité.`,
        );
      }

      if (p.otd < 80 || p.oqd < 80 || p.dod > 5) {
        actions.push(
          `${p.projectLabel} : plan d’actions à lancer (revue de planning, sécurisation des jalons critiques, analyse des causes de non‑qualité).`,
        );
      }
    }

    return { veryGood, watch, actions };
  }, [filteredProjects]);

  const alertsNc = useMemo(() => {
    const veryGood: string[] = [];
    const watch: string[] = [];
    const actions: string[] = [];

    for (const p of filteredProjects) {
      if (p.ncTotal === 0) {
        veryGood.push(
          `${p.projectLabel} : aucune NC enregistrée – surveiller néanmoins les signaux faibles.`,
        );
        continue;
      }

      if (p.ncOpen === 0 && p.avgCloseDelayNc <= 15) {
        veryGood.push(
          `${p.projectLabel} : traitement NC maîtrisé (toutes clôturées, délai moyen ${p.avgCloseDelayNc.toFixed(
            1,
          )} j).`,
        );
      }

      if (p.ncOpen > 0 && p.ncOpen <= 3 && p.ncCritical === 0) {
        watch.push(
          `${p.projectLabel} : ${p.ncOpen} NC ouverte(s) non critique(s) – s’assurer de la tenue des plans d’actions.`,
        );
      }

      if (p.ncOpen > 3 || p.ncCritical > 0) {
        actions.push(
          `${p.projectLabel} : ${p.ncOpen} NC ouvertes dont ${p.ncCritical} critique(s) – prioriser la sécurisation du périmètre impacté et organiser un QRQC / 8D.`,
        );
      }
    }

    return { veryGood, watch, actions };
  }, [filteredProjects]);

  const alertsAudits = useMemo(() => {
    const veryGood: string[] = [];
    const watch: string[] = [];
    const actions: string[] = [];

    for (const p of filteredProjects) {
      if (p.auditScore === null) continue;

      if (p.auditScore >= 90) {
        veryGood.push(
          `${p.projectLabel} : score audit ${p.auditScore.toFixed(
            1,
          )} % – système projet très bien maîtrisé.`,
        );
      } else if (p.auditScore >= 70) {
        watch.push(
          `${p.projectLabel} : score audit ${p.auditScore.toFixed(
            1,
          )} % – quelques écarts à résorber (actions organisation / documentation).`,
        );
      } else {
        actions.push(
          `${p.projectLabel} : score audit ${p.auditScore.toFixed(
            1,
          )} % – lancer un plan de remise à niveau processus et refaire un audit de suivi.`,
        );
      }
    }

    return { veryGood, watch, actions };
  }, [filteredProjects]);

  const pageTitle = "Qualité ISO 9001";

  return (
    <AppShell
      activeSection="quality"
      pageTitle={pageTitle}
      pageSubtitle="Vue consolidée des indicateurs qualité (livrables, non‑conformités, audits) sur l’ensemble des projets."
    >
      <div className="space-y-6">
        {/* Bandeau haut + boutons nav */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!data) return;
                const headers = [
                  "projectId",
                  "projectNumber",
                  "projectTitle",
                  "clientName",
                  "projectManagerName",
                  "status",
                  "totalDeliverables",
                  "otd",
                  "oqd",
                  "dod",
                  "dodTotal",
                  "ncOpen",
                  "ncTotal",
                  "ncCritical",
                  "avgCloseDelayNc",
                  "auditScore",
                ];
                const rows = data.projects.map((p) =>
                  [
                    p.projectId,
                    p.projectLabel,
                    p.projectTitle ?? "",
                    p.clientName ?? "",
                    p.projectManagerName ?? "",
                    p.status ?? "",
                    p.totalDeliverables,
                    p.otd.toFixed(1),
                    p.oqd.toFixed(1),
                    p.dod.toFixed(1),
                    p.dodTotal.toFixed(1),
                    p.ncOpen,
                    p.ncTotal,
                    p.ncCritical,
                    p.avgCloseDelayNc.toFixed(1),
                    p.auditScore != null ? p.auditScore.toFixed(1) : "",
                  ].map((v) => String(v).replace(/\r?\n/g, " ")),
                );
                const csv =
                  [headers.join(";")]
                    .concat(rows.map((r) => r.join(";")))
                    .join("\n");
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "Qualite_globale_projets.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Export Excel
            </button>

            {/* mêmes couleurs que colonne Actions */}
            <button
              type="button"
              onClick={() => router.push("/quality/deliverables-projects")}
              className="px-3 py-1.5 text-xs rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700"
            >
              Livrables (vue projets)
            </button>

            <button
              type="button"
              onClick={() => router.push("/quality/non-conformities-projects")}
              className="px-3 py-1.5 text-xs rounded-md border border-amber-200 bg-amber-50 text-amber-700"
            >
              Non‑conformités (vue projets)
            </button>

            <button
              type="button"
              onClick={() => router.push("/quality/audits-projects")}
              className="px-3 py-1.5 text-xs rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              Audits (vue projets)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/Tutoriel/projelys-quality-hub-tutorial.html"
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

        {error && (
          <div className="rounded bg-rose-50 text-rose-700 px-4 py-2 text-xs border border-rose-200">
            {error}
          </div>
        )}

        {/* Filtres */}
        <section className="bg-white rounded-lg shadow-sm p-3 border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              type="text"
              value={filter.search}
              onChange={(e) =>
                setFilter((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Rechercher (intitulé, client, responsable...)"
              className="w-full md:max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mt-3">
            <div>
              <label className="block text-slate-500 mb-1">Client</label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={filter.client}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, client: e.target.value }))
                }
              >
                <option value="Tous">Tous</option>
                {uniqueClients.map((c) => (
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
                value={filter.projectNumber}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    projectNumber: e.target.value,
                  }))
                }
              >
                <option value="Tous">Tous</option>
                {uniqueProjectNumbers.map((num) => (
                  <option key={num} value={num}>
                    {num}
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
                value={filter.pm}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, pm: e.target.value }))
                }
              >
                <option value="Tous">Tous</option>
                {uniquePms.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Statut</label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={filter.status}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="Tous">Tous</option>
                {uniqueStatus.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* KPIs livrables (dynamiques) */}
        <section className="grid gap-4 md:grid-cols-4">
          <KpiCardColored
            label="Livrables"
            value={dynamicKpis.totalDeliverables}
            loading={loading}
            variant="info"
          />
          <KpiCardColored
            label="OTD global"
            value={dynamicKpis.otd}
            suffix="%"
            loading={loading}
            variant="primary"
          />
          <KpiCardColored
            label="OQD global"
            value={dynamicKpis.oqd}
            suffix="%"
            loading={loading}
            variant="success"
          />
          <KpiCardColored
            label="DoD global"
            value={dynamicKpis.dodGlobal}
            suffix=" j"
            loading={loading}
            variant="warning"
          />
        </section>

        {/* KPIs NC + Audit (dynamiques) */}
        <section className="grid gap-4 md:grid-cols-4">
          <KpiCardColored
            label="NC ouvertes"
            value={dynamicKpis.ncOpen}
            loading={loading}
            variant="danger"
          />
          <KpiCardColored
            label="NC fermées"
            value={dynamicKpis.ncClosed}
            loading={loading}
            variant="info"
          />
          <KpiCardColored
            label="Délai moyen clôture NC"
            value={dynamicKpis.avgCloseDelayNc}
            suffix=" j"
            loading={loading}
            variant="warning"
          />
          <KpiCardColored
            label="Score audits global"
            value={dynamicKpis.auditScore}
            suffix="%"
            loading={loading}
            variant="primary"
          />
        </section>

        {/* Alertes & recommandations – 3 colonnes */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 space-y-3">
          <h3 className="text-xs font-semibold text-slate-900">
            Alertes & recommandations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
            {/* Livrables */}
            <div className="border border-slate-100 rounded-md p-2">
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-3 py-0.5 text-[10px] font-semibold text-indigo-700">
                  📦 Livrables
                </span>
              </div>
              <MiniSection
                title="Points forts"
                items={alertsLivrables.veryGood}
              />
              <MiniSection
                title="Points de vigilance"
                items={alertsLivrables.watch}
              />
              <MiniSection
                title="Recommandations"
                items={alertsLivrables.actions}
              />
            </div>

            {/* NC */}
            <div className="border border-slate-100 rounded-md p-2">
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-[10px] font-semibold text-amber-700">
                  ⚠️ Non‑conformités
                </span>
              </div>
              <MiniSection title="Points forts" items={alertsNc.veryGood} />
              <MiniSection
                title="Points de vigilance"
                items={alertsNc.watch}
              />
              <MiniSection
                title="Recommandations"
                items={alertsNc.actions}
              />
            </div>

            {/* Audits */}
            <div className="border border-slate-100 rounded-md p-2">
              <div className="flex justify-center mb-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-0.5 text-[10px] font-semibold text-emerald-700">
                  📋 Audits
                </span>
              </div>
              <MiniSection
                title="Points forts"
                items={alertsAudits.veryGood}
              />
              <MiniSection
                title="Points de vigilance"
                items={alertsAudits.watch}
              />
              <MiniSection
                title="Recommandations"
                items={alertsAudits.actions}
              />
            </div>
          </div>
        </section>


        {/* Tableau projets */}
        <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-900">
              Projets – synthèse qualité
            </h2>
            <span className="text-[11px] text-slate-500">
              {filteredProjects.length} projet(s) affiché(s) /{" "}
              {projects.length} au total
            </span>
          </div>
          {loading ? (
            <p className="text-xs text-slate-500">
              Chargement des projets...
            </p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-xs text-slate-500">
              Aucun projet ne correspond aux filtres.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[360px]">
              <table className="min-w-full text-xs table-fixed">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <ThMini className="w-32">N° projet</ThMini>
                    <ThMini className="w-40">Intitulé projet</ThMini>
                    <ThMini className="w-36">Chef de projet</ThMini>
                    <ThMini className="w-28">Statut</ThMini>
                    <ThMini className="w-28">Livrables</ThMini>
                    <ThMini className="w-28">OTD</ThMini>
                    <ThMini className="w-28">DoD</ThMini>
                    <ThMini className="w-28">OQD</ThMini>
                    <ThMini className="w-32">NC projet</ThMini>
                    <ThMini className="w-32">NC ouvertes</ThMini>
                    <ThMini className="w-32">Score audit</ThMini>
                    <ThMini className="w-44 text-center">Actions</ThMini>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((p) => (
                    <tr key={p.projectId} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-[11px] text-indigo-700 whitespace-nowrap">
                        <Link
                          href={`/projects/${p.projectId}`}
                          className="hover:underline"
                        >
                          {p.projectLabel}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-800 whitespace-nowrap">
                        {p.projectTitle ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-700 whitespace-nowrap">
                        {p.projectManagerName ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-[11px] whitespace-nowrap">
                        {statusBadge(p.status)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right text-slate-700 whitespace-nowrap">
                        {p.totalDeliverables}
                      </td>                     
                      <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                        {kpiBadge(p.otd, "%")}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                        {kpiBadge(p.dod, " j", true)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                        {kpiBadge(p.oqd, "%")}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                        {ncBadge(p.ncTotal, p.ncCritical)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                        {ncOpenBadge(p.ncOpen)}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-right whitespace-nowrap">
                        {auditScoreBadge(p.auditScore)}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <div className="inline-flex gap-2">
                          <Link
                            href={`/projects/${p.projectId}/quality/deliverables`}
                            className="px-2 py-0.5 rounded border border-indigo-300 bg-indigo-50 text-[10px] text-indigo-700 hover:bg-indigo-100 whitespace-nowrap"
                          >
                            Livrables
                          </Link>
                          <Link
                            href={`/projects/${p.projectId}/quality/non-conformities`}
                            className="px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-[10px] text-amber-700 hover:bg-orange-100 whitespace-nowrap"
                          >
                            NC
                          </Link>
                          <Link
                            href={`/projects/${p.projectId}/quality/audit`}
                            className="px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700 hover:bg-emerald-100 whitespace-nowrap"
                          >
                            Audit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

/* ===== Sous‑composants & helpers ===== */

type KpiCardColoredProps = {
  label: string;
  value: number;
  suffix?: string;
  loading: boolean;
  variant?: "primary" | "success" | "warning" | "danger" | "info";
};

function KpiCardColored({
  label,
  value,
  suffix,
  loading,
  variant = "info",
}: KpiCardColoredProps) {
  const display = Number.isFinite(value) ? value.toFixed(1) : value;

  let bg = "bg-slate-50 border-slate-200";
  let text = "text-slate-900";

  if (variant === "primary") {
    bg = "bg-indigo-50 border-indigo-200";
    text = "text-indigo-900";
  } else if (variant === "success") {
    bg = "bg-emerald-50 border-emerald-200";
    text = "text-emerald-900";
  } else if (variant === "warning") {
    bg = "bg-amber-50 border-amber-200";
    text = "text-amber-900";
  } else if (variant === "danger") {
    bg = "bg-rose-50 border-rose-200";
    text = "text-rose-900";
  }

  return (
    <div className={`rounded-lg border px-4 py-3 shadow-sm ${bg}`}>
      <div className="text-[11px] font-medium uppercase text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${text}`}>
        {loading ? "…" : display}
        {suffix && !loading ? suffix : null}
      </div>
    </div>
  );
}

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

type MiniSectionProps = {
  title: "Points forts" | "Points de vigilance" | "Recommandations" | string;
  items: string[];
};

function MiniSection({ title, items }: MiniSectionProps) {
  const hasItems = items.length > 0;

  let colorTitle = "text-slate-600";
  let icon = "•";

  if (title === "Points forts") {
    colorTitle = hasItems ? "text-emerald-700" : "text-slate-500";
    icon = hasItems ? "✅" : "➖";
  } else if (title === "Points de vigilance") {
    colorTitle = hasItems ? "text-amber-700" : "text-slate-500";
    icon = hasItems ? "⚠️" : "➖";
  } else if (title === "Recommandations") {
    colorTitle = hasItems ? "text-indigo-700" : "text-slate-500";
    icon = hasItems ? "📝" : "➖";
  }

  return (
    <div className="mt-1">
      <div className={`text-[10px] font-semibold flex items-center gap-1 ${colorTitle}`}>
        <span className="text-[11px]">{icon}</span>
        <span>{title}</span>
      </div>
      {hasItems ? (
        <ul className="list-disc ml-4 space-y-0.5 text-[10px] text-slate-700">
          {items.slice(0, 4).map((it, idx) => (
            <li key={idx}>{it}</li>
          ))}
        </ul>
      ) : (
        <div className="text-[10px] text-slate-400 ml-4">
          Rien de particulier.
        </div>
      )}
    </div>
  );
}


function statusBadge(status: string | null) {
  const s = (status ?? "").toLowerCase();
  let cls =
    "inline-flex px-2 py-0.5 rounded text-[11px] border ";

  if (s.includes("cours")) {
    cls += "bg-amber-100 text-amber-700 border-amber-200";
  } else if (s.includes("termin") || s.includes("clos")) {
    cls += "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (s.includes("alerte") || s.includes("critique")) {
    cls += "bg-rose-100 text-rose-700 border-rose-200";
  } else {
    cls += "bg-sky-100 text-sky-700 border-sky-200";
  }

  return <span className={cls}>{status || "-"}</span>;
}

function kpiBadge(value: number, suffix: string, isDelay = false) {
  let cls =
    "inline-flex px-2 py-0.5 rounded text-[11px] border ";
  if (!isDelay) {
    if (value >= 85) {
      cls += "bg-emerald-100 text-emerald-700 border-emerald-200";
    } else if (value >= 70) {
      cls += "bg-amber-100 text-amber-700 border-amber-200";
    } else {
      cls += "bg-rose-100 text-rose-700 border-rose-200";
    }
  } else {
    if (value <= 2) {
      cls += "bg-emerald-100 text-emerald-700 border-emerald-200";
    } else if (value <= 5) {
      cls += "bg-amber-100 text-amber-700 border-amber-200";
    } else {
      cls += "bg-rose-100 text-rose-700 border-rose-200";
    }
  }
  return (
    <span className={cls}>
      {value.toFixed(1)} {suffix}
    </span>
  );
}

function ncOpenBadge(open: number) {
  let cls =
    "inline-flex px-2 py-0.5 rounded text-[11px] border ";
  if (open === 0) {
    cls += "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (open <= 3) {
    cls += "bg-amber-100 text-amber-700 border-amber-200";
  } else {
    cls += "bg-rose-100 text-rose-700 border-rose-200";
  }
  return <span className={cls}>{open}</span>;
}

function ncBadge(total: number, critical: number) {
  let cls =
    "inline-flex px-2 py-0.5 rounded text-[11px] border ";
  if (total === 0) {
    cls += "bg-slate-100 text-slate-600 border-slate-200";
  } else if (critical === 0) {
    cls += "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (critical <= 2) {
    cls += "bg-amber-100 text-amber-700 border-amber-200";
  } else {
    cls += "bg-rose-100 text-rose-700 border-rose-200";
  }
  return (
    <span className={cls}>
      {total} (crit: {critical})
    </span>
  );
}

function auditScoreBadge(score: number | null) {
  if (score === null) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-[11px] border bg-slate-100 text-slate-600 border-slate-200">
        NA
      </span>
    );
  }
  let cls =
    "inline-flex px-2 py-0.5 rounded text-[11px] border ";
  if (score >= 85) {
    cls += "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (score >= 70) {
    cls += "bg-amber-100 text-amber-700 border-amber-200";
  } else {
    cls += "bg-rose-100 text-rose-700 border-rose-200";
  }
  return (
    <span className={cls}>
      {score.toFixed(1)} %
    </span>
  );
}
