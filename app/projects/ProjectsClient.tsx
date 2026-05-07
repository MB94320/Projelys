"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project } from "@prisma/client";
import * as XLSX from "xlsx";

type SortField =
  | "none"
  | "projectNumber"
  | "client"
  | "label"
  | "manager"
  | "progress"
  | "risk"
  | "status"
  | "estimateDate";

type SortDirection = "asc" | "desc";

const HOURS_PER_DAY = 7;
const TIMELINE_WINDOW_MONTHS = 12;

const riskOrder = ["Négligeable", "Significatif", "Critique", "Inacceptable"];
const statusOrder = ["Planifié", "En cours", "Terminé", "Annulé"];

interface ProjectsClientProps {
  initialProjects: Project[];
}

type NotificationItem = {
  id: string;
  message: string;
  type: "new" | "deadline";
};

type ThMiniProps = {
  children: React.ReactNode;
  className?: string;
};

function ThMini({ children, className = "" }: ThMiniProps) {
  return (
    <th
      className={
        "px-3 py-2 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wide bg-slate-100 " +
        className
      }
    >
      {children}
    </th>
  );
}

export default function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // filtres détaillés
  const [projectNumberFilter, setProjectNumberFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // timelineOffset n’est plus utilisé pour filtrer, mais on le garde si besoin plus tard
  const [timelineOffset] = useState(0);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // 1. Filtrage + tri
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...initialProjects];

    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter((p: Project & Record<string, any>) => {
        const number = (p as any).projectNumber?.toLowerCase?.() ?? "";
        const client = (p as any).clientName?.toLowerCase?.() ?? "";
        const title = (p as any).titleProject?.toLowerCase?.() ?? "";
        const manager =
          (p as any).projectManagerName?.toLowerCase?.() ?? "";
        return (
          number.includes(term) ||
          client.includes(term) ||
          title.includes(term) ||
          manager.includes(term)
        );
      });
    }

    // filtre n° projet
    if (projectNumberFilter.trim()) {
      result = result.filter((p: any) =>
        (p.projectNumber ?? "")
          .toLowerCase()
          .includes(projectNumberFilter.toLowerCase()),
      );
    }

    // filtre client
    if (clientFilter !== "all") {
      result = result.filter((p: any) => p.clientName === clientFilter);
    }

    // filtre chef de projet
    if (managerFilter !== "all") {
      result = result.filter(
        (p: any) => p.projectManagerName === managerFilter,
      );
    }

    // filtre criticité
    if (riskFilter !== "all") {
      if (riskFilter === "none") {
        result = result.filter((p: any) => !p.riskCriticality);
      } else {
        result = result.filter(
          (p: any) => p.riskCriticality === riskFilter,
        );
      }
    }

    // filtre statut
    if (statusFilter !== "all") {
      if (statusFilter === "none") {
        result = result.filter((p: any) => !p.status);
      } else {
        result = result.filter((p: any) => p.status === statusFilter);
      }
    }

    if (sortField === "none") return result;

    const sorted = result.sort((a: any, b: any) => {
      let cmp = 0;

      if (sortField === "projectNumber") {
        cmp = (a.projectNumber ?? "").localeCompare(b.projectNumber ?? "");
      } else if (sortField === "client") {
        cmp = (a.clientName ?? "").localeCompare(b.clientName ?? "");
        if (cmp === 0) {
          cmp = (a.projectManagerName ?? "").localeCompare(
            b.projectManagerName ?? "",
          );
        }
      } else if (sortField === "manager") {
        cmp = (a.projectManagerName ?? "").localeCompare(
          b.projectManagerName ?? "",
        );
      } else if (sortField === "progress") {
        cmp = (a.progressPercent ?? 0) - (b.progressPercent ?? 0);
      } else if (sortField === "risk") {
        const ia = riskOrder.indexOf(a.riskCriticality ?? "");
        const ib = riskOrder.indexOf(b.riskCriticality ?? "");
        cmp = ia - ib;
      } else if (sortField === "status") {
        const ia = statusOrder.indexOf(a.status ?? "");
        const ib = statusOrder.indexOf(b.status ?? "");
        cmp = ia - ib;
      } else if (sortField === "estimateDate") {
        cmp =
          new Date(a.estimatedDate ?? 0).getTime() -
          new Date(b.estimatedDate ?? 0).getTime();
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [
    initialProjects,
    search,
    sortField,
    sortDirection,
    projectNumberFilter,
    clientFilter,
    managerFilter,
    riskFilter,
    statusFilter,
  ]);

  // 2. KPI + timeline + notifications
  const {
    totalProjects,
    activeProjects,
    totalPlannedHours,
    totalConsumedHours,
    totalRemainingHours,
    avgProgress,
    highRisk,
    statusCounts,
    riskCounts,
    kpiProgressColor,
    kpiRiskColor,
    kpiLoadColor,
    timelineItems,
    notificationItems,
  } = useMemo(() => {
    const list = filteredAndSortedProjects;
    const totalProjects = list.length;

    const totalPlannedHours = list.reduce((sum, p: any) => {
      return sum + (p.plannedLoadDays ?? 0);
    }, 0);

    const totalConsumedHours = list.reduce((sum, p: any) => {
      return sum + (p.consumedLoadDays ?? 0);
    }, 0);

    const totalRemainingHours = totalPlannedHours - totalConsumedHours;

    const avgProgress =
      totalProjects === 0
        ? 0
        : Math.round(
            list.reduce(
              (sum, p: any) => sum + (p.progressPercent ?? 0),
              0,
            ) / totalProjects,
          );

    const activeProjects = list.filter(
      (p: any) => p.status === "Planifié" || p.status === "En cours",
    ).length;

    const highRisk = list.filter(
      (p: any) =>
        p.riskCriticality === "Critique" ||
        p.riskCriticality === "Inacceptable",
    ).length;

    const statusCounts: Record<string, number> = {
      Planifié: 0,
      "En cours": 0,
      Terminé: 0,
      Annulé: 0,
    };
    const riskCounts: Record<string, number> = {
      Négligeable: 0,
      Significatif: 0,
      Critique: 0,
      Inacceptable: 0,
    };

    list.forEach((p: any) => {
      if (p.status && statusCounts[p.status] !== undefined) {
        statusCounts[p.status] += 1;
      }
      if (
        p.riskCriticality &&
        riskCounts[p.riskCriticality] !== undefined
      ) {
        riskCounts[p.riskCriticality] += 1;
      }
    });

    const kpiProgressColor =
      avgProgress > 90
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : avgProgress > 60
        ? "bg-sky-100 text-sky-700 border-sky-200"
        : avgProgress > 30
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-rose-100 text-rose-700 border-rose-200";

    const kpiRiskColor =
      highRisk === 0
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : highRisk <= 2
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : "bg-rose-100 text-rose-700 border-rose-200";

    const kpiLoadColor =
      totalRemainingHours <= 0
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : "bg-sky-100 text-sky-700 border-sky-200";

    // Timeline : tous les projets avec échéance, triés, sans fenêtre
    type TimelineItem = {
      id: number;
      projectNumber: string | null;
      title: string | null;
      deadline: Date;
      progress: number;
      risk: string | null;
      status: string | null;
    };

    const projectsWithDeadline = list.filter(
      (p: any) => p.estimatedDate || p.endDate,
    );

    let allItems: TimelineItem[] = [];
    if (projectsWithDeadline.length > 0) {
      allItems = projectsWithDeadline.map((p: any) => ({
        id: p.id,
        projectNumber: p.projectNumber ?? null,
        title: p.titleProject ?? null,
        deadline: new Date(
          p.estimatedDate ?? p.endDate ?? new Date(),
        ),
        progress: p.progressPercent ?? 0,
        risk: p.riskCriticality ?? null,
        status: p.status ?? null,
      }));
      allItems.sort(
        (a, b) => a.deadline.getTime() - b.deadline.getTime(),
      );
    }

    // Positionnement linéaire : premier à gauche, dernier à droite
    let timelineItems: (TimelineItem & { leftPx: number })[] = [];
    if (allItems.length > 0) {
      const baseSpacing = 220; // espacement horizontal entre cartes
      const startOffset = 40; // marge à gauche
      timelineItems = allItems.map((item, index) => ({
        ...item,
        leftPx: startOffset + index * baseSpacing,
      }));
    }

    // Notifications (inchangées)
    const notifications: NotificationItem[] = [];
    const now = new Date();

    allItems.forEach((item) => {
      // on peut réutiliser la logique existante si besoin (ici simplifié)
      if (item.deadline.getTime() >= now.getTime()) {
        const diffDays =
          (item.deadline.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays <= 7) {
          notifications.push({
            id: `deadline-${item.id}`,
            type: "deadline",
            message: `Projet ${
              item.projectNumber ?? "inconnu"
            } : échéance dans ${Math.round(diffDays)} jours`,
          });
        }
      }
    });

    notifications.sort((a, b) => (a.id > b.id ? -1 : 1));
    const limitedNotifications = notifications.slice(0, 10);

    return {
      totalProjects,
      activeProjects,
      totalPlannedHours,
      totalConsumedHours,
      totalRemainingHours,
      avgProgress,
      highRisk,
      statusCounts,
      riskCounts,
      kpiProgressColor,
      kpiRiskColor,
      kpiLoadColor,
      timelineItems,
      notificationItems: limitedNotifications,
    };
  }, [filteredAndSortedProjects, timelineOffset]);

  const upcomingAlertsCount = notificationsRead
    ? 0
    : notificationItems.length;

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 text-[10px] text-slate-500">
        {sortDirection === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const handleNewProject = () => {
    router.push("/projects/new");
  };

  const handleExportPortfolioToExcel = () => {
    const rows = filteredAndSortedProjects.map((p: any) => ({
      "N° projet": p.projectNumber ?? "",
      Intitulé: p.titleProject ?? "",
      Client: p.clientName ?? "",
      "Chef de projet": p.projectManagerName ?? "",
      Statut: p.status ?? "",
      "Date début": p.startDate
        ? new Date(p.startDate).toLocaleDateString("fr-FR")
        : "",
      "Date échéance": p.estimatedDate
        ? new Date(p.estimatedDate).toLocaleDateString("fr-FR")
        : "",
      "Charge prévue (h)": p.plannedLoadDays ?? 0,
      "Charge consommée (h)": p.consumedLoadDays ?? 0,
      "Avancement (%)": p.progressPercent ?? 0,
      "Criticité risque": p.riskCriticality ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Portefeuille");
    XLSX.writeFile(workbook, "Portefeuille_detaille.xlsx");
  };

  const handleToggleNotifications = () => {
    setShowNotifications((v) => !v);
    if (!notificationsRead && notificationItems.length > 0) {
      setNotificationsRead(true);
    }
  };

  const clients = useMemo(
    () =>
      Array.from(
        new Set(
          initialProjects
            .map((p: any) => p.clientName)
            .filter((c): c is string => !!c),
        ),
      ),
    [initialProjects],
  );
  const managers = useMemo(
    () =>
      Array.from(
        new Set(
          initialProjects
            .map((p: any) => p.projectManagerName)
            .filter((m): m is string => !!m),
        ),
      ),
    [initialProjects],
  );
  const projectNumbers = useMemo(
    () =>
      Array.from(
        new Set(
          initialProjects
            .map((p: any) => p.projectNumber)
            .filter((n): n is string => !!n),
        ),
      ).sort((a, b) =>
        a.localeCompare(b, "fr-FR", { numeric: true }),
      ),
    [initialProjects],
  );

  const statusColors: Record<string, string> = {
    Planifié: "bg-indigo-400",
    "En cours": "bg-amber-400",
    Terminé: "bg-emerald-400",
    Annulé: "bg-slate-400",
  };

  const riskColors: Record<string, string> = {
    Négligeable: "bg-indigo-400",
    Significatif: "bg-amber-400",
    Critique: "bg-rose-400",
    Inacceptable: "bg-red-500",
  };

  const riskIcon = (risk: string | null) => {
    if (!risk) return "●";
    if (risk === "Négligeable") return "●";
    if (risk === "Significatif") return "▲";
    if (risk === "Critique") return "✱";
    if (risk === "Inacceptable") return "⚠";
    return "●";
  };

  const statusPillColor = (status: string | null) => {
    if (status === "Annulé") return "bg-slate-100 text-slate-700";
    if (status === "Terminé")
      return "bg-emerald-100 text-emerald-700";
    if (status === "Planifié")
      return "bg-indigo-100 text-indigo-700";
    if (status === "En cours")
      return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-600";
  };

  const handleEditProject = (id: number) => {
    router.push(`/projects/${id}`);
  };

  const handleEditTasks = (id: number) => {
    router.push(`/projects/${id}/gantt`);
  };

  const totalStatus = Object.values(statusCounts).reduce(
    (s, v) => s + v,
    0,
  );
  const totalRisk = Object.values(riskCounts).reduce(
    (s, v) => s + v,
    0,
  );

  const getDelayLabel = (p: any) => {
    const estimated = p.estimatedDate ? new Date(p.estimatedDate) : null;
    const end = p.endDate ? new Date(p.endDate) : null;
    const now = new Date();

    if (!estimated) return null;
    if (p.status !== "Terminé" && estimated < now) {
      return "En retard";
    }
    if (p.status === "Terminé" && end && end > estimated) {
      return "Terminé en retard";
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Bandeau haut : export + nouveau + alertes */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportPortfolioToExcel}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            Export Excel
          </button>

          <button
            onClick={handleNewProject}
            className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white"
          >
            Nouveau projet
          </button>

          {/* Cloche + panneau d'alertes */}
          <div className="relative">
            <button
              type="button"
              onClick={handleToggleNotifications}
              className="relative inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100"
            >
              <span className="text-lg">🔔</span>
              {upcomingAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-[10px] text-white flex items-center justify-center">
                  {upcomingAlertsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 max-h-80 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Alertes projets
                  </span>
                  <button
                    className="text-[11px] text-slate-400 hover:text-slate-600"
                    onClick={() => setShowNotifications(false)}
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
                      <li
                        key={n.id}
                        className="flex items-start gap-1"
                      >
                        <span className="mt-[3px]">•</span>
                        <span
                          className={
                            n.type === "new"
                              ? "text-indigo-700"
                              : "text-rose-700"
                          }
                        >
                          {n.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="px-3 py-1 border-t border-slate-100 text-[10px] text-slate-400">
                  Max. 10 alertes / 7 jours, le reste est purgé
                  automatiquement.
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Link
              href="/Tutoriel/projelys-portfolio-tutorial.html"
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

      {/* Cadre recherche + filtres */}
      <div className="bg-white rounded-lg shadow-sm p-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher (n° projet, client, intitulé, chef de projet...)"
              className="w-full md:max-w-md border border-slate-300 rounded-md px-3 py-1.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs mt-2">
            <div>
              <label className="block text-slate-500 mb-1">
                N° projet
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={projectNumberFilter || "all"}
                onChange={(e) =>
                  setProjectNumberFilter(
                    e.target.value === "all" ? "" : e.target.value,
                  )
                }
              >
                <option value="all">Tous</option>
                {projectNumbers.map((num) => (
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
                value={managerFilter}
                onChange={(e) => setManagerFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                {managers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">
                Client
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                {clients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">
                Criticité
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="all">Toutes</option>
                <option value="none">Non renseignée</option>
                <option value="Négligeable">Négligeable</option>
                <option value="Significatif">Significatif</option>
                <option value="Critique">Critique</option>
                <option value="Inacceptable">Inacceptable</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 mb-1">
                Statut
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-2 py-1"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="none">Non renseigné</option>
                <option value="Planifié">Planifié</option>
                <option value="En cours">En cours</option>
                <option value="Terminé">Terminé</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPI principaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg shadow-sm p-4 border bg-indigo-50 text-indigo-700">
          <div className="text-xs text-slate-500">
            Projets actifs filtrés
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {activeProjects}/{totalProjects}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Planifiés &amp; en cours dans le filtre.
          </div>
        </div>

        <div
          className={`rounded-lg shadow-sm p-4 border ${kpiLoadColor}`}
        >
          <div className="text-xs">
            Charge prévue / consommée (h)
          </div>
          <div className="mt-2 text-xl font-semibold">
            {totalPlannedHours} h / {totalConsumedHours} h
          </div>
          <div className="mt-1 text-[11px]">
            Reste {totalRemainingHours} h à réaliser.
          </div>
        </div>

        <div
          className={`rounded-lg shadow-sm p-4 border ${kpiProgressColor}`}
        >
          <div className="text-xs">Avancement moyen</div>
          <div className="mt-2 text-2xl font-semibold">
            {avgProgress}%
          </div>
          <div className="mt-1 text-[11px]">
            Vert &gt; 90, bleu &gt; 60, orange &gt; 30, rouge sinon.
          </div>
        </div>

        <div
          className={`rounded-lg shadow-sm p-4 border ${kpiRiskColor}`}
        >
          <div className="text-xs">Projets à risque élevé</div>
          <div className="mt-2 text-2xl font-semibold">{highRisk}</div>
          <div className="mt-1 text-[11px]">
            Criticité &quot;Critique&quot; ou &quot;Inacceptable&quot;.
          </div>
        </div>
      </div>

      {/* 2 KPI graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Répartition par statut */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Répartition par statut
            </h2>
            <span className="text-[11px] text-slate-500">
              {totalStatus} projets
            </span>
          </div>
          <div className="mt-2 h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {statusOrder.map((st) => {
              const count = statusCounts[st] ?? 0;
              if (!totalStatus || count === 0) return null;
              const width = (count / totalStatus) * 100;
              return (
                <div
                  key={st}
                  className={statusColors[st]}
                  style={{ width: `${width}%` }}
                  title={`${st}: ${count}`}
                />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            {statusOrder.map((st) => (
              <div key={st} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${statusColors[st]}`}
                />
                <span className="truncate">{st}</span>
                <span className="ml-auto font-medium">
                  {statusCounts[st] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par criticité */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Répartition par criticité
            </h2>
            <span className="text-[11px] text-slate-500">
              {totalRisk} projets
            </span>
          </div>
          <div className="mt-2 h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {riskOrder.map((rk) => {
              const count = riskCounts[rk] ?? 0;
              if (!totalRisk || count === 0) return null;
              const width = (count / totalRisk) * 100;
              return (
                <div
                  key={rk}
                  className={riskColors[rk]}
                  style={{ width: `${width}%` }}
                  title={`${rk}: ${count}`}
                />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            {riskOrder.map((rk) => (
              <div key={rk} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${riskColors[rk]}`}
                />
                <span className="truncate">{rk}</span>
                <span className="ml-auto font-medium">
                  {riskCounts[rk] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline synthétique */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Timeline des projets
          </h2>
          <span className="text-[11px] text-slate-500">
            {timelineItems.length === 0
              ? "Aucune échéance renseignée"
              : `${timelineItems.length} projet(s) avec échéance`}
          </span>
        </div>

        <div className="flex items-center justify-between mb-2 text-[11px] text-slate-600">
          <span>Trié par date d&apos;échéance (du plus ancien au plus récent)</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">
              Utiliser les flèches ou le scroll horizontal
            </span>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("projects-timeline-scroll");
                if (el) {
                  el.scrollBy({ left: -300, behavior: "smooth" });
                }
              }}
              className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("projects-timeline-scroll");
                if (el) {
                  el.scrollBy({ left: 300, behavior: "smooth" });
                }
              }}
              className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs"
            >
              ›
            </button>
          </div>
        </div>

        {timelineItems.length === 0 ? (
          <p className="text-[11px] text-slate-500 mt-2">
            Renseigne des dates d&apos;échéance (ou de fin) dans les projets
            pour alimenter la timeline.
          </p>
        ) : (
          <>
            <div
              id="projects-timeline-scroll"
              className="relative w-full overflow-x-auto overflow-y-hidden"
            >
              <div
                className="relative h-44 min-w-max pr-8"
              >
                {/* Barre horizontale */}
                <div className="absolute left-0 right-8 top-6 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-full shadow-inner" />

                {/* Projets positionnés */}
                {timelineItems.map((item, index) => (
                  <Link
                    key={item.id}
                    href={`/projects/${item.id}`}
                    className="absolute -translate-x-1/2 flex flex-col items-center text-center w-[170px]"
                        style={{
                          left: `${item.leftPx + 40}px`,
                          top: "0.5rem",
                        }}
                  >

                    {/* petit triangle relié à la barre */}
                    <div className="h-6 flex items-end">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-b-slate-400 border-l-transparent border-r-transparent shadow-sm" />
                    </div>

                    {/* carte projet */}
                    <div className="mt-1 px-2 py-2 rounded-md border border-slate-200 bg-white shadow-sm hover:border-indigo-200 hover:bg-indigo-50">
                      <div className="text-[10px] text-slate-500">
                        {item.deadline.toLocaleDateString("fr-FR")}
                      </div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        {item.projectNumber ?? `Projet ${index + 1}`}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {item.title ?? "Sans intitulé"}
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-[11px]">
                        <span
                          className={`inline-flex items-center justify-center h-4 w-4 rounded-full text-[10px] ${
                            item.risk === "Critique"
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : item.risk === "Inacceptable"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : item.risk === "Significatif"
                              ? "bg-amber-100 text-amber-700 border border-amber-200"
                              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {riskIcon(item.risk)}
                        </span>
                        <span className="text-slate-600">
                          ({item.progress}%)
                        </span>
                      </div>
                      {item.status && (
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPillColor(
                              item.status,
                            )}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Légende */}
            <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-600">
              <div className="flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px]">
                  ●
                </span>
                <span>Risque négligeable</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px]">
                  ▲
                </span>
                <span>Risque significatif</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px]">
                  ✱
                </span>
                <span>Risque critique</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-700 border border-red-200 text-[10px]">
                  ⚠
                </span>
                <span>Risque inacceptable</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex h-3 w-3 rounded-full bg-indigo-400" />
                <span>Planifié</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex h-3 w-3 rounded-full bg-amber-400" />
                <span>En cours</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400" />
                <span>Terminé</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-flex h-3 w-3 rounded-full bg-slate-400" />
                <span>Annulé</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tableau projets avec ThMini */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-slate-900">
            Portefeuille détaillé
          </h2>
          <span className="text-[11px] text-slate-500">
            {filteredAndSortedProjects.length} projets affichés sur{" "}
            {initialProjects.length}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[260px]">
          <table className="in-w-full text-xs table-fixed">
            <thead className="bg-slate-100 text-slate-600 sticky top-0 z-10">
              <tr>
                <ThMini className="w-32">N° projet</ThMini>
                <ThMini className="w-40">Intitulé projet</ThMini>
                <ThMini className="w-40">Client</ThMini>
                <ThMini className="w-36">Chef de projet</ThMini>
                <ThMini className="w-28">Statut</ThMini>                
                <ThMini className="w-28">Avancement</ThMini>                  
                <ThMini className="w-28">Criticité</ThMini>
                <ThMini className="w-28">Échéance</ThMini>                 
                <ThMini className="w-28">Retard</ThMini>
                <ThMini className="w-28">Actions</ThMini>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedProjects.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    Aucun projet ne correspond à votre recherche.
                  </td>
                </tr>
              )}

              {filteredAndSortedProjects.map((p: any) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50"
                  onClick={() => router.push(`/projects/${p.id}`)}
                >
                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-indigo-700">
                    <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/projects/${p.id}`,
                              )
                            }
                            className="hover:underline"
                          >
                            {p.projectNumber ?? `P-${p.id}`}
                          </button>
                  </td>
                  
                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                    {p.titleProject ?? "-"}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                    {p.clientName ?? "-"}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                    {p.projectManagerName ?? "-"}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusPillColor(p.status ?? null),
                      ].join(" ")}
                    >
                      {p.status ?? "-"}
                    </span>
                  </td>                  

                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{
                            width: `${p.progressPercent ?? 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">
                        {p.progressPercent ?? 0}%
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        p.riskCriticality === "Négligeable"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : p.riskCriticality === "Significatif"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : p.riskCriticality === "Critique"
                          ? "bg-rose-50 text-rose-700 border border-rose-100"
                          : p.riskCriticality === "Inacceptable"
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-slate-50 text-slate-600 border border-slate-100",
                      ].join(" ")}
                    >
                      {p.riskCriticality ?? "-"}
                    </span>
                  </td>                  

                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                    {p.estimatedDate
                      ? new Date(p.estimatedDate).toLocaleDateString(
                          "fr-FR",
                        )
                      : "-"}
                  </td>

                  <td className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700">
                    {(() => {
                      const delay = getDelayLabel(p);
                      if (!delay) return "-";
                      const isLate =
                        delay === "En retard" ||
                        delay === "Terminé en retard";
                      const cls = isLate
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200";
                      return (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}
                        >
                          {delay}
                        </span>
                      );
                    })()}
                  </td>

                  <td
                    className="px-3 py-2 whitespace-nowrap text-[11px] text-slate-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex gap-2">
                      <button
                        className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] text-slate-700"
                        onClick={() => handleEditProject(p.id)}
                      >
                        MaJ projet
                      </button>
                      <button
                        className="px-2 py-0.5 rounded border border-indigo-300 bg-indigo-50 text-[10px] text-indigo-700"
                        onClick={() => handleEditTasks(p.id)}
                      >
                        Tâches
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>    
  );
}
