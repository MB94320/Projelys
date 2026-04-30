"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";

type SectionKey =
  | "dashboard"
  | "projects"
  | "presales"
  | "loadplan"
  | "performance"
  | "skills"
  | "risk"
  | "finance"
  | "actions"
  | "quality";

type AppShellProps = {
  activeSection: SectionKey;
  children: ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
};

type Theme = "light" | "dark";

type SessionUser = {
  id: number;
  email: string;
  name: string | null;
  role: "ADMIN" | "USER";
};

const navItems: {
  key: SectionKey;
  label: string;
  shortLabel: string;
  href: string;
  icon: ReactNode;
}[] = [
  {
    key: "dashboard",
    label: "Tableau de bord",
    shortLabel: "Dashboard",
    href: "/",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="5" rx="2" />
        <rect x="13" y="10" width="8" height="11" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
      </svg>
    ),
  },
  {
    key: "projects",
    label: "Projets",
    shortLabel: "Projets",
    href: "/projects",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M3 7h18" />
        <path d="M6 4h4l1 2h7a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H7a4 4 0 0 1-4-4V6a2 2 0 0 1 2-2h1z" />
      </svg>
    ),
  },
  {
    key: "presales",
    label: "Avant-vente",
    shortLabel: "AVV",
    href: "/presales",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M4 19h16" />
        <path d="M6 16V8" />
        <path d="M12 16V5" />
        <path d="M18 16v-4" />
      </svg>
    ),
  },
  {
    key: "loadplan",
    label: "Plan de charge",
    shortLabel: "Charge",
    href: "/loadplan",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    key: "performance",
    label: "Performance",
    shortLabel: "Perf",
    href: "/performance",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M4 19h16" />
        <path d="M7 15l3-3 3 2 4-5" />
        <path d="M17 9h2v2" />
      </svg>
    ),
  },
  {
    key: "skills",
    label: "Compétences & ressources",
    shortLabel: "Skills",
    href: "/skills",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="8" r="3" />
        <path d="M3 20a5 5 0 0 1 10 0" />
        <path d="M11 20a5 5 0 0 1 10 0" />
      </svg>
    ),
  },
  {
    key: "risk",
    label: "Risques & opportunités",
    shortLabel: "Risques",
    href: "/risks-opportunities",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M12 3 2 21h20L12 3z" />
        <path d="M12 9v5" />
        <path d="M12 18h.01" />
      </svg>
    ),
  },
  {
    key: "finance",
    label: "Finances",
    shortLabel: "Finance",
    href: "/finance",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9 10c0-1.1 1.2-2 3-2s3 .9 3 2-1.2 2-3 2-3 .9-3 2 1.2 2 3 2 3-.9 3-2" />
      </svg>
    ),
  },
  {
    key: "actions",
    label: "Plan d'actions",
    shortLabel: "Actions",
    href: "/actions",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    key: "quality",
    label: "Qualité ISO 9001",
    shortLabel: "Qualité",
    href: "/quality",
    icon: (
      <svg
        className="h-[18px] w-[18px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M12 3l2.8 5.6L21 9.5l-4.5 4.3 1 6.2L12 17l-5.5 3 1-6.2L3 9.5l6.2-.9L12 3z" />
      </svg>
    ),
  },
];

const languageOptions = [
  { code: "fr" as const, label: "FR" },
  { code: "en" as const, label: "EN" },
];

export default function AppShell({
  activeSection,
  children,
  pageTitle,
  pageSubtitle,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState<Theme>("light");
  const [currentLang, setCurrentLang] = useState<"fr" | "en">("fr");
  const [todayLabel, setTodayLabel] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formatted = formatter.format(now);
    setTodayLabel(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  useEffect(() => {
    const savedTheme =
      typeof window !== "undefined"
        ? (window.localStorage.getItem("projelys-theme") as Theme | null)
        : null;

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
      return;
    }

    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("projelys-theme", theme);
  }, [theme]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        setLoadingSession(true);
        const res = await fetch("/api/session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setSessionUser(null);
          }
          return;
        }

        const data = (await res.json()) as {
          authenticated: boolean;
          user: SessionUser | null;
        };

        if (!cancelled) {
          setSessionUser(data.authenticated ? data.user : null);
        }
      } catch {
        if (!cancelled) {
          setSessionUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingSession(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
    } finally {
      setSessionUser(null);
      router.push("/login");
      router.refresh();
    }
  };

  const currentProjectId = useMemo(() => {
    const match = pathname.match(/^\/projects\/(\d+)/);
    return match ? match[1] : null;
  }, [pathname]);

  const initials = useMemo(() => {
    if (!sessionUser) return "MB";
    if (sessionUser.name && sessionUser.name.trim() !== "") {
      const parts = sessionUser.name.trim().split(/\s+/);
      if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return (
        (parts[0][0] ?? "").toUpperCase() +
        (parts[parts.length - 1][0] ?? "").toUpperCase()
      );
    }
    const emailName = sessionUser.email.split("@")[0] ?? "";
    return emailName.substring(0, 2).toUpperCase() || "MB";
  }, [sessionUser]);

  const topbarHeight = 64;
  const sidebarWidthClass = sidebarCollapsed ? "md:w-[74px]" : "md:w-64";
  const contentPaddingClass = sidebarCollapsed ? "md:pl-[90px]" : "md:pl-64";

  const renderNav = (compact = false) => (
    <nav className={compact ? "space-y-1" : "space-y-0.5"}>
      {navItems.map((item) => {
        const isActive = item.key === activeSection;

        return (
          <Link
            key={item.key}
            href={item.href}
            title={sidebarCollapsed && !compact ? item.label : undefined}
            className={[
              "group relative flex items-center transition-all duration-150",
              compact
                ? "gap-3 rounded-xl px-3 py-3"
                : sidebarCollapsed
                ? "justify-center rounded-xl px-0 py-2.5"
                : "gap-3 rounded-xl px-3 py-2.5",
              isActive
                ? "bg-[var(--sidebar-active)] text-[var(--sidebar-active-foreground)]"
                : "text-[var(--sidebar-foreground)] hover:bg-[var(--surface-muted)]",
            ].join(" ")}
          >
            {isActive && !compact && (
              <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[var(--sidebar-active-foreground)]" />
            )}

            <span
              className={[
                "inline-flex shrink-0 items-center justify-center",
                compact ? "h-8 w-8" : sidebarCollapsed ? "h-9 w-9" : "h-8 w-8",
                isActive
                  ? "text-[var(--sidebar-active-foreground)]"
                  : "text-[var(--sidebar-muted)]",
              ].join(" ")}
            >
              {item.icon}
            </span>

            {(compact || !sidebarCollapsed) && (
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium leading-none">
                  {item.label}
                </div>
              </div>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header
        className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b px-3 md:px-5"
        style={{
          background: "var(--topbar)",
          borderColor: "var(--border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[var(--surface-muted)] text-slate-600 md:hidden dark:border-slate-700 dark:text-slate-300"
            title="Ouvrir le menu"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <div className="flex min-w-[170px] shrink-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              P
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                Projelys
              </div>
              <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                Pilotage portefeuille
              </div>
            </div>
          </div>

          <div className="hidden flex-1 justify-center xl:flex">
            <div className="flex w-full max-w-[440px] items-center rounded-full border border-slate-200 bg-[var(--surface-muted)] px-4 py-2 dark:border-slate-700">
              <svg
                className="mr-2 h-4 w-4 shrink-0 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="text"
                placeholder="Recherche globale..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-2 md:gap-3">
            <div className="hidden lg:flex items-center whitespace-nowrap text-[13px] font-bold text-slate-600 dark:text-slate-300">
              {todayLabel}
              {currentProjectId ? (
                <span className="ml-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  #{currentProjectId}
                </span>
              ) : null}
            </div>

            <div className="relative hidden sm:block">
              <select
                value={currentLang}
                onChange={(e) =>
                  setCurrentLang(e.target.value === "en" ? "en" : "fr")
                }
                className="appearance-none rounded-full border border-slate-200 bg-[var(--surface-muted)] py-2 pl-3 pr-8 text-[11px] font-medium text-slate-500 outline-none dark:border-slate-700 dark:text-slate-400"
              >
                {languageOptions.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
                ▼
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                setTheme((prev) => (prev === "light" ? "dark" : "light"))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[var(--surface-muted)] text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[var(--surface-soft)]"
              title={
                theme === "light"
                  ? "Passer en mode sombre"
                  : "Passer en mode clair"
              }
            >
              {theme === "light" ? (
                <svg
                  className="h-4 w-4 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4 text-slate-300"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[var(--surface-muted)] text-slate-500 dark:border-slate-700 dark:text-slate-300"
              title="Notifications"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M10 21h4" />
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              </svg>
            </button>

            {!loadingSession && !sessionUser && (
              <Link
                href="/login"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-slate-200 bg-[var(--surface-muted)] px-3 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[var(--surface-soft)]"
              >
                Connexion
              </Link>
            )}

            {sessionUser && (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-[var(--surface-muted)] px-3 text-[11px] font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950/20"
                  title="Se déconnecter"
                >
                  Déconnexion
                </button>

                <div className="hidden md:inline-flex max-w-[140px] items-center rounded-full border border-slate-200 bg-[var(--surface-muted)] px-3 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-200">
                  <span className="mr-2 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                    {initials}
                  </span>
                  <span className="truncate">
                    {sessionUser.name || sessionUser.email}
                  </span>
                </div>
              </>
            )}

            {!sessionUser && (
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[var(--surface-muted)] text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-200">
                MB
              </div>
            )}

            {sessionUser && (
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[var(--surface-muted)] text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-200 md:hidden">
                {initials}
              </div>
            )}
          </div>
        </div>
      </header>

      <aside
        className={`fixed left-0 z-40 hidden ${sidebarWidthClass} md:flex flex-col transition-all duration-300`}
        style={{
          top: `${topbarHeight}px`,
          bottom: 0,
          background: "var(--sidebar)",
          borderRight: `1px solid var(--border)`,
        }}
      >
        <div className="flex items-center justify-between px-3 py-3">
          {!sidebarCollapsed ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">
              Navigation
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sidebar-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--sidebar-foreground)]"
            title={sidebarCollapsed ? "Déplier le menu" : "Réduire le menu"}
          >
            {sidebarCollapsed ? (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {renderNav(false)}
        </div>

        <div
          className="border-t px-2 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <Link
            href="/admin"
            title={sidebarCollapsed ? "Administration" : undefined}
            className={[
              "flex items-center text-[var(--sidebar-muted)] transition hover:text-[var(--sidebar-foreground)]",
              sidebarCollapsed
                ? "justify-center rounded-xl py-2.5 hover:bg-[var(--surface-muted)]"
                : "gap-3 rounded-xl px-3 py-2.5 hover:bg-[var(--surface-muted)]",
            ].join(" ")}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center">
              <svg
                className="h-[18px] w-[18px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
              >
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.64.26 1.33.4 2.02.4H21a2 2 0 1 1 0 4h-.09c-.69 0-1.38.14-2.02.4Z" />
              </svg>
            </span>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium">
                  Administration
                </div>
                <div className="truncate text-[10px] text-[var(--sidebar-muted)]">
                  Comptes et accès
                </div>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[320px] border-r bg-[var(--sidebar)] md:hidden"
            style={{ borderColor: "var(--border)", paddingTop: `${topbarHeight}px` }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--sidebar-muted)]">
                Navigation
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--sidebar-muted)] hover:bg-[var(--surface-muted)]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            <div className="px-3 pb-3">{renderNav(true)}</div>

            <div
              className="border-t px-3 py-3"
              style={{ borderColor: "var(--border)" }}
            >
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-[var(--sidebar-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--sidebar-foreground)]"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center">
                  <svg
                    className="h-[18px] w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                  >
                    <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.64.26 1.33.4 2.02.4H21a2 2 0 1 1 0 4h-.09c-.69 0-1.38.14-2.02.4Z" />
                  </svg>
                </span>
                <div>
                  <div className="text-[13px] font-medium">Administration</div>
                  <div className="text-[10px] text-[var(--sidebar-muted)]">
                    Comptes et accès
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      <main
        className={`transition-all duration-300 ${contentPaddingClass}`}
        style={{
          paddingTop: `${topbarHeight + 20}px`,
        }}
      >
        <section className="min-h-[calc(100vh-64px)] bg-[var(--background)] px-4 pb-8 md:px-5">
          {pageTitle && (
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {pageTitle}
              </h1>
              {pageSubtitle ? (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {pageSubtitle}
                </p>
              ) : null}
            </div>
          )}

          {children}
        </section>
      </main>
    </div>
  );
}