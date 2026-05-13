"use client";

import { useMemo, useState } from "react";

type UserRole = "ADMIN" | "FULL" | "LIMITED";
type Lang = "fr" | "en";

type SubscriptionPlanView =
  | "LIMITED"
  | "ESSENTIAL"
  | "FULL_MONTHLY"
  | "FULL_YEARLY"
  | "ENTERPRISE"
  | "NONE";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  subscriptionPlan: SubscriptionPlanView;
  subscriptionStatus: string | null;
  billingCycle: string | null;
  subscriptionPeriodStart: string | null;
  subscriptionPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
};

type Props = {
  initialUsers: UserRow[];
  lang?: Lang;
};

const copy = {
  fr: {
    createUser: "Créer un nouvel utilisateur",
    existingUsers: "Utilisateurs existants",
    analytics: "Vue abonnements & KPI",
    email: "Email",
    name: "Nom",
    password: "Mot de passe",
    role: "Rôle",
    active: "Actif",
    create: "Créer l'utilisateur",
    creating: "Création...",
    namePlaceholder: "Nom affiché",
    passwordPlaceholder: "Minimum 8 caractères",
    noUsers: "Aucun utilisateur pour le moment.",
    updateLoading: "Mise à jour...",
    delete: "Supprimer",
    statusUpdated: "Statut utilisateur mis à jour.",
    roleUpdated: "Rôle utilisateur mis à jour.",
    userCreated: "Utilisateur créé avec succès.",
    userDeleted: "Utilisateur supprimé avec succès.",
    requiredFields: "Email et mot de passe sont requis.",
    refreshError: "Impossible de recharger les utilisateurs.",
    createError: "Erreur lors de la création de l'utilisateur.",
    roleError: "Erreur lors du changement de rôle.",
    statusError: "Erreur lors de la mise à jour du statut.",
    deleteError: "Erreur lors de la suppression de l'utilisateur.",
    deleteConfirm: "Supprimer définitivement l'utilisateur",
    yesActive: "Actif",
    noActive: "Inactif",
    usersTab: "Utilisateurs",
    analyticsTab: "Analytique",
    colName: "Nom",
    colEmail: "Email",
    colRole: "Rôle",
    colOffer: "Offre",
    colCycle: "Cycle",
    colContractStart: "Début",
    colContractEnd: "Fin",
    colStatus: "Statut",
    colActions: "Actions",
    notProvided: "—",
    offerNone: "Aucune",
    offerLimited: "Limited",
    offerEssential: "Essential",
    offerFullMonthly: "Full mensuel",
    offerFullYearly: "Full annuel",
    offerEnterprise: "Entreprise",
    cycleMonthly: "Mensuel",
    cycleYearly: "Annuel",
    cycleTrial: "Essai",
    cycleNone: "—",
    statusActive: "Active",
    statusPending: "En attente",
    statusCanceled: "Résiliée",
    statusExpired: "Expirée",
    statusTrialing: "Essai",
    statusUnknown: "Inconnu",
    kpiTotalUsers: "Utilisateurs",
    kpiActiveSubs: "Abonnements actifs",
    kpiPaidPlans: "Comptes payants",
    kpiUpgradedUsers: "Passages Limited -> abonnement",
    chartPlans: "Répartition des offres",
    chartCycles: "Répartition des cycles",
    chartStatus: "Statuts d’abonnement",
    chartRoles: "Répartition des rôles",
    newUserDefaultOfferHint:
      "La création admin crée le compte. L’offre réelle est ensuite pilotée par Stripe / abonnement.",
  },
  en: {
    createUser: "Create new user",
    existingUsers: "Existing users",
    analytics: "Subscription & KPI view",
    email: "Email",
    name: "Name",
    password: "Password",
    role: "Role",
    active: "Active",
    create: "Create user",
    creating: "Creating...",
    namePlaceholder: "Display name",
    passwordPlaceholder: "Minimum 8 characters",
    noUsers: "No users yet.",
    updateLoading: "Updating...",
    delete: "Delete",
    statusUpdated: "User status updated.",
    roleUpdated: "User role updated.",
    userCreated: "User created successfully.",
    userDeleted: "User deleted successfully.",
    requiredFields: "Email and password are required.",
    refreshError: "Unable to reload users.",
    createError: "Error while creating user.",
    roleError: "Error while changing role.",
    statusError: "Error while updating status.",
    deleteError: "Error while deleting user.",
    deleteConfirm: "Permanently delete user",
    yesActive: "Active",
    noActive: "Inactive",
    usersTab: "Users",
    analyticsTab: "Analytics",
    colName: "Name",
    colEmail: "Email",
    colRole: "Role",
    colOffer: "Plan",
    colCycle: "Cycle",
    colContractStart: "Start",
    colContractEnd: "End",
    colStatus: "Status",
    colActions: "Actions",
    notProvided: "—",
    offerNone: "None",
    offerLimited: "Limited",
    offerEssential: "Essential",
    offerFullMonthly: "Full monthly",
    offerFullYearly: "Full yearly",
    offerEnterprise: "Enterprise",
    cycleMonthly: "Monthly",
    cycleYearly: "Yearly",
    cycleTrial: "Trial",
    cycleNone: "—",
    statusActive: "Active",
    statusPending: "Pending",
    statusCanceled: "Canceled",
    statusExpired: "Expired",
    statusTrialing: "Trial",
    statusUnknown: "Unknown",
    kpiTotalUsers: "Users",
    kpiActiveSubs: "Active subscriptions",
    kpiPaidPlans: "Paying accounts",
    kpiUpgradedUsers: "Limited -> subscription upgrades",
    chartPlans: "Plans distribution",
    chartCycles: "Cycles distribution",
    chartStatus: "Subscription statuses",
    chartRoles: "Roles distribution",
    newUserDefaultOfferHint:
      "Admin creation creates the account. The real plan is then driven by Stripe / subscription.",
  },
};

function formatDate(value: string | null, lang: Lang) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function planLabel(plan: SubscriptionPlanView, t: (typeof copy)["fr"]) {
  switch (plan) {
    case "LIMITED":
      return t.offerLimited;
    case "ESSENTIAL":
      return t.offerEssential;
    case "FULL_MONTHLY":
      return t.offerFullMonthly;
    case "FULL_YEARLY":
      return t.offerFullYearly;
    case "ENTERPRISE":
      return t.offerEnterprise;
    default:
      return t.offerNone;
  }
}

function cycleLabel(cycle: string | null, t: (typeof copy)["fr"]) {
  if (cycle === "MONTHLY") return t.cycleMonthly;
  if (cycle === "YEARLY") return t.cycleYearly;
  if (cycle === "TRIAL") return t.cycleTrial;
  return t.cycleNone;
}

function statusLabel(status: string | null, t: (typeof copy)["fr"]) {
  if (status === "ACTIVE") return t.statusActive;
  if (status === "PENDING") return t.statusPending;
  if (status === "CANCELED") return t.statusCanceled;
  if (status === "EXPIRED") return t.statusExpired;
  if (status === "TRIALING") return t.statusTrialing;
  return t.statusUnknown;
}

function barColor(index: number) {
  const palette = [
    "bg-sky-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
  ];
  return palette[index % palette.length];
}

export default function UsersAdminSection({
  initialUsers,
  lang = "fr",
}: Props) {
  const t = copy[lang];
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "analytics">("users");

  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("FULL");
  const [formActive, setFormActive] = useState(true);

  const resetMessages = () => {
    setError(null);
    setMessage(null);
  };

  const refreshUsers = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || t.refreshError);
    }
    setUsers(data.users);
  };

  const handleCreateUser = async () => {
    resetMessages();

    if (!formEmail || !formPassword) {
      setError(t.requiredFields);
      return;
    }

    try {
      setCreating(true);

      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          name: formName,
          password: formPassword,
          role: formRole,
          isActive: formActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.createError);
      }

      setMessage(t.userCreated);
      setFormEmail("");
      setFormName("");
      setFormPassword("");
      setFormRole("FULL");
      setFormActive(true);
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || t.createError);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: UserRow) => {
    resetMessages();
    try {
      setLoading(true);

      const res = await fetch("/api/admin/toggle-user-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.statusError);
      }

      setMessage(t.statusUpdated);
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || t.statusError);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (user: UserRow, role: UserRole) => {
    resetMessages();
    try {
      setLoading(true);

      const res = await fetch("/api/admin/change-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.roleError);
      }

      setMessage(t.roleUpdated);
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || t.roleError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserRow) => {
    resetMessages();

    const confirmed = window.confirm(`${t.deleteConfirm} ${user.email} ?`);
    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || t.deleteError);
      }

      setMessage(t.userDeleted);
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || t.deleteError);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const totalUsers = users.length;
    const activeSubscriptions = users.filter(
      (u) => u.subscriptionStatus === "ACTIVE" || u.subscriptionStatus === "TRIALING"
    ).length;
    const payingUsers = users.filter((u) =>
      ["ESSENTIAL", "FULL_MONTHLY", "FULL_YEARLY", "ENTERPRISE"].includes(u.subscriptionPlan)
    ).length;
    const upgradedFromLimited = users.filter(
      (u) =>
        u.role !== "LIMITED" &&
        ["ESSENTIAL", "FULL_MONTHLY", "FULL_YEARLY", "ENTERPRISE"].includes(u.subscriptionPlan)
    ).length;

    const countMap = (items: string[]) =>
      items.reduce<Record<string, number>>((acc, item) => {
        acc[item] = (acc[item] || 0) + 1;
        return acc;
      }, {});

    const planCounts = countMap(users.map((u) => planLabel(u.subscriptionPlan, t)));
    const cycleCounts = countMap(users.map((u) => cycleLabel(u.billingCycle, t)));
    const statusCounts = countMap(users.map((u) => statusLabel(u.subscriptionStatus, t)));
    const roleCounts = countMap(users.map((u) => u.role));

    return {
      totalUsers,
      activeSubscriptions,
      payingUsers,
      upgradedFromLimited,
      planCounts,
      cycleCounts,
      statusCounts,
      roleCounts,
    };
  }, [users, t]);

  const renderBars = (title: string, values: Record<string, number>) => {
    const entries = Object.entries(values).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(([, value]) => value), 1);

    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 dark:bg-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
        <div className="mt-4 space-y-3">
          {entries.map(([label, value], index) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-slate-700 dark:text-slate-200">{label}</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {value}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-2.5 rounded-full ${barColor(index)}`}
                  style={{ width: `${(value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-4 text-xs">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
            activeTab === "users"
              ? "bg-sky-600 text-white"
              : "border border-[var(--border)] bg-[var(--surface)] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          {t.usersTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`rounded-xl px-4 py-2 text-xs font-medium transition ${
            activeTab === "analytics"
              ? "bg-violet-600 text-white"
              : "border border-[var(--border)] bg-[var(--surface)] text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          }`}
        >
          {t.analyticsTab}
        </button>
      </div>

      {activeTab === "users" && (
        <>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              {t.createUser}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
                  placeholder="utilisateur@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
                  {t.name}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
                  placeholder={t.namePlaceholder}
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
                  {t.password}
                </label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
                  placeholder={t.passwordPlaceholder}
                />
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
                    {t.role}
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="FULL">FULL</option>
                    <option value="LIMITED">LIMITED</option>
                  </select>
                </div>

                <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-white">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                  />
                  {t.active}
                </label>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-300">
              {t.newUserDefaultOfferHint}
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={creating}
                onClick={handleCreateUser}
                className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-[11px] font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? t.creating : t.create}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              {t.existingUsers}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1250px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-white">
                    <th className="px-2 py-1 text-left">{t.colName}</th>
                    <th className="px-2 py-1 text-left">{t.colEmail}</th>
                    <th className="px-2 py-1 text-left">{t.colRole}</th>
                    <th className="px-2 py-1 text-left">{t.colOffer}</th>
                    <th className="px-2 py-1 text-left">{t.colCycle}</th>
                    <th className="px-2 py-1 text-left">{t.colContractStart}</th>
                    <th className="px-2 py-1 text-left">{t.colContractEnd}</th>
                    <th className="px-2 py-1 text-left">{t.colStatus}</th>
                    <th className="px-2 py-1 text-right">{t.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="bg-[var(--surface)] text-[11px] text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    >
                      <td className="rounded-l-xl px-3 py-3">
                        <div className="max-w-[160px] truncate font-medium text-slate-900 dark:text-white">
                          {u.name || t.notProvided}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="max-w-[220px] truncate text-slate-900 dark:text-white">
                          {u.email}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleChangeRole(u, e.target.value as UserRole)
                            }
                            className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[10px] text-slate-900 outline-none dark:bg-slate-700 dark:text-white"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="FULL">FULL</option>
                            <option value="LIMITED">LIMITED</option>
                          </select>

                          <span
                            className={[
                              "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold",
                              u.role === "ADMIN"
                                ? "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-200"
                                : u.role === "FULL"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200",
                            ].join(" ")}
                          >
                            {u.role}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                          {planLabel(u.subscriptionPlan, t)}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                        {cycleLabel(u.billingCycle, t)}
                      </td>

                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                        {formatDate(u.subscriptionPeriodStart, lang)}
                      </td>

                      <td className="px-3 py-3 text-slate-700 dark:text-slate-200">
                        {formatDate(u.subscriptionPeriodEnd, lang)}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={[
                              "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium",
                              u.isActive
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200"
                                : "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-600 dark:text-white",
                            ].join(" ")}
                          >
                            {u.isActive ? t.yesActive : t.noActive}
                          </button>

                          <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-medium text-sky-700 dark:bg-sky-950/30 dark:text-sky-200">
                            {statusLabel(u.subscriptionStatus, t)}
                          </span>
                        </div>
                      </td>

                      <td className="rounded-r-xl px-3 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-medium text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200"
                          >
                            {t.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-6 text-center text-[11px] text-slate-500 dark:text-white"
                      >
                        {t.noUsers}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {(error || message) && (
              <div className="mt-4 space-y-2">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
                    {message}
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="mt-2 text-right text-[10px] text-slate-500 dark:text-white">
                {t.updateLoading}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 dark:bg-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-300">
                {t.kpiTotalUsers}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {analytics.totalUsers}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 dark:bg-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-300">
                {t.kpiActiveSubs}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {analytics.activeSubscriptions}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 dark:bg-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-300">
                {t.kpiPaidPlans}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {analytics.payingUsers}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 dark:bg-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-300">
                {t.kpiUpgradedUsers}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {analytics.upgradedFromLimited}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {renderBars(t.chartPlans, analytics.planCounts)}
            {renderBars(t.chartCycles, analytics.cycleCounts)}
            {renderBars(t.chartStatus, analytics.statusCounts)}
            {renderBars(t.chartRoles, analytics.roleCounts)}
          </div>
        </div>
      )}
    </div>
  );
}