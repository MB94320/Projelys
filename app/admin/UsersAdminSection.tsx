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
  subscriptionPeriodStart: string | null;
  subscriptionPeriodEnd: string | null;
};

type Props = {
  initialUsers: UserRow[];
  lang?: Lang;
};

const copy = {
  fr: {
    createTitle: "Créer un nouvel utilisateur",
    existingTitle: "Utilisateurs existants",
    analyticsTitle: "Vue analytique",
    analyticsSubtitle:
      "Répartition des comptes, des offres et des contrats actifs.",
    email: "Email",
    name: "Nom",
    password: "Mot de passe",
    role: "Rôle",
    offer: "Offre",
    active: "Actif",
    inactive: "Inactif",
    status: "Statut",
    actions: "Actions",
    startDate: "Début",
    endDate: "Fin",
    createdAt: "Créé le",
    modify: "Modifier",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    createUser: "Créer l'utilisateur",
    creating: "Création...",
    updating: "Mise à jour...",
    noUsers: "Aucun utilisateur pour le moment.",
    emailRequired: "Email et mot de passe sont requis.",
    createSuccess: "Utilisateur créé avec succès.",
    updateSuccess: "Utilisateur mis à jour avec succès.",
    statusSuccess: "Statut utilisateur mis à jour.",
    deleteSuccess: "Utilisateur supprimé avec succès.",
    createError: "Erreur lors de la création de l'utilisateur.",
    updateError: "Erreur lors de la mise à jour de l'utilisateur.",
    statusError: "Erreur lors de la mise à jour du statut.",
    deleteError: "Erreur lors de la suppression de l'utilisateur.",
    refreshError: "Impossible de recharger les utilisateurs.",
    displayedNamePlaceholder: "Nom affiché",
    emailPlaceholder: "utilisateur@example.com",
    passwordPlaceholder: "Minimum 8 caractères",
    confirmDelete: "Supprimer définitivement l'utilisateur",
    totalUsers: "Utilisateurs",
    activeUsers: "Actifs",
    subscribedUsers: "Avec abonnement",
    limitedUsers: "Limited",
    adminUsers: "Admins",
    monthlyContracts: "Mensuels",
    yearlyContracts: "Annuels",
    essentialContracts: "Essential",
    fullContracts: "Full",
    enterpriseContracts: "Entreprise",
    noSubscription: "Sans abonnement",
    activeContracts: "Contrats actifs",
    scheduledCancel: "Résiliation / arrêt",
    pendingContracts: "En attente",
    expiredContracts: "Expirés",
    offerLabels: {
      LIMITED: "Limited",
      ESSENTIAL: "Essential",
      FULL_MONTHLY: "Full mensuel",
      FULL_YEARLY: "Full annuel",
      ENTERPRISE: "Entreprise",
      NONE: "Aucune",
    },
    statusLabels: {
      ACTIVE: "Actif",
      TRIALING: "Essai",
      PENDING: "En attente",
      CANCELED: "Résilié",
      EXPIRED: "Expiré",
      NONE: "—",
    },
  },
  en: {
    createTitle: "Create a new user",
    existingTitle: "Existing users",
    analyticsTitle: "Analytics view",
    analyticsSubtitle:
      "Overview of accounts, offers and active contracts.",
    email: "Email",
    name: "Name",
    password: "Password",
    role: "Role",
    offer: "Offer",
    active: "Active",
    inactive: "Inactive",
    status: "Status",
    actions: "Actions",
    startDate: "Start",
    endDate: "End",
    createdAt: "Created",
    modify: "Edit",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    createUser: "Create user",
    creating: "Creating...",
    updating: "Updating...",
    noUsers: "No users yet.",
    emailRequired: "Email and password are required.",
    createSuccess: "User created successfully.",
    updateSuccess: "User updated successfully.",
    statusSuccess: "User status updated.",
    deleteSuccess: "User deleted successfully.",
    createError: "Error while creating user.",
    updateError: "Error while updating user.",
    statusError: "Error while updating status.",
    deleteError: "Error while deleting user.",
    refreshError: "Unable to reload users.",
    displayedNamePlaceholder: "Display name",
    emailPlaceholder: "user@example.com",
    passwordPlaceholder: "Minimum 8 characters",
    confirmDelete: "Permanently delete user",
    totalUsers: "Users",
    activeUsers: "Active",
    subscribedUsers: "Subscribed",
    limitedUsers: "Limited",
    adminUsers: "Admins",
    monthlyContracts: "Monthly",
    yearlyContracts: "Yearly",
    essentialContracts: "Essential",
    fullContracts: "Full",
    enterpriseContracts: "Enterprise",
    noSubscription: "No subscription",
    activeContracts: "Active contracts",
    scheduledCancel: "Stopped / canceled",
    pendingContracts: "Pending",
    expiredContracts: "Expired",
    offerLabels: {
      LIMITED: "Limited",
      ESSENTIAL: "Essential",
      FULL_MONTHLY: "Full monthly",
      FULL_YEARLY: "Full yearly",
      ENTERPRISE: "Enterprise",
      NONE: "None",
    },
    statusLabels: {
      ACTIVE: "Active",
      TRIALING: "Trialing",
      PENDING: "Pending",
      CANCELED: "Canceled",
      EXPIRED: "Expired",
      NONE: "—",
    },
  },
};

function formatDate(value: string | null, lang: Lang) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function toInputDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function fromInputDate(value: string) {
  if (!value) return null;
  return new Date(`${value}T00:00:00.000Z`).toISOString();
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

  const [formEmail, setFormEmail] = useState("");
  const [formName, setFormName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("FULL");
  const [formOffer, setFormOffer] = useState<SubscriptionPlanView>("FULL_MONTHLY");
  const [formActive, setFormActive] = useState(true);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");

  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("FULL");
  const [editOffer, setEditOffer] = useState<SubscriptionPlanView>("FULL_MONTHLY");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const resetMessages = () => {
    setError(null);
    setMessage(null);
  };

  const refreshUsers = async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const raw = await res.text();

    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(t.refreshError);
    }

    if (!res.ok) {
      throw new Error(data?.error || t.refreshError);
    }

    setUsers(data.users);
  };

  const analytics = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.isActive).length;
    const subscribedUsers = users.filter((u) => u.subscriptionPlan !== "NONE").length;
    const limitedUsers = users.filter((u) => u.role === "LIMITED").length;
    const adminUsers = users.filter((u) => u.role === "ADMIN").length;
    const monthlyContracts = users.filter((u) => u.subscriptionPlan === "FULL_MONTHLY").length;
    const yearlyContracts = users.filter((u) => u.subscriptionPlan === "FULL_YEARLY").length;
    const essentialContracts = users.filter((u) => u.subscriptionPlan === "ESSENTIAL").length;
    const fullContracts = users.filter(
      (u) => u.subscriptionPlan === "FULL_MONTHLY" || u.subscriptionPlan === "FULL_YEARLY"
    ).length;
    const enterpriseContracts = users.filter((u) => u.subscriptionPlan === "ENTERPRISE").length;
    const noSubscription = users.filter((u) => u.subscriptionPlan === "NONE").length;
    const activeContracts = users.filter((u) => u.subscriptionStatus === "ACTIVE").length;
    const scheduledCancel = users.filter((u) => u.subscriptionStatus === "CANCELED").length;
    const pendingContracts = users.filter((u) => u.subscriptionStatus === "PENDING").length;
    const expiredContracts = users.filter((u) => u.subscriptionStatus === "EXPIRED").length;

    return {
      totalUsers,
      activeUsers,
      subscribedUsers,
      limitedUsers,
      adminUsers,
      monthlyContracts,
      yearlyContracts,
      essentialContracts,
      fullContracts,
      enterpriseContracts,
      noSubscription,
      activeContracts,
      scheduledCancel,
      pendingContracts,
      expiredContracts,
    };
  }, [users]);

  const startEdit = (user: UserRow) => {
    setEditingUserId(user.id);
    setEditRole(user.role);
    setEditOffer(user.subscriptionPlan);
    setEditIsActive(user.isActive);
    setEditStartDate(toInputDate(user.subscriptionPeriodStart));
    setEditEndDate(toInputDate(user.subscriptionPeriodEnd));
    resetMessages();
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditRole("FULL");
    setEditOffer("FULL_MONTHLY");
    setEditIsActive(true);
    setEditStartDate("");
    setEditEndDate("");
  };

  const handleCreateUser = async () => {
    resetMessages();

    if (!formEmail || !formPassword) {
      setError(t.emailRequired);
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
          subscriptionPlan: formOffer,
          subscriptionPeriodStart: fromInputDate(formStartDate),
          subscriptionPeriodEnd: fromInputDate(formEndDate),
        }),
      });

      const raw = await res.text();

      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(t.createError);
      }

      if (!res.ok) {
        throw new Error(data?.error || t.createError);
      }

      setMessage(t.createSuccess);
      setFormEmail("");
      setFormName("");
      setFormPassword("");
      setFormRole("FULL");
      setFormOffer("FULL_MONTHLY");
      setFormActive(true);
      setFormStartDate("");
      setFormEndDate("");
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

      const raw = await res.text();

      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(t.statusError);
      }

      if (!res.ok) {
        throw new Error(data?.error || t.statusError);
      }

      setMessage(t.statusSuccess);
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || t.statusError);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: number) => {
    resetMessages();
    try {
      setLoading(true);

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          role: editRole,
          isActive: editIsActive,
          subscriptionPlan: editOffer,
          subscriptionPeriodStart: fromInputDate(editStartDate),
          subscriptionPeriodEnd: fromInputDate(editEndDate),
        }),
      });

      const raw = await res.text();

      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(t.updateError);
      }

      if (!res.ok) {
        throw new Error(data?.error || t.updateError);
      }

      setMessage(t.updateSuccess);
      cancelEdit();
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || t.updateError);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserRow) => {
    resetMessages();

    const confirmed = window.confirm(`${t.confirmDelete} ${user.email} ?`);
    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const raw = await res.text();

      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(t.deleteError);
      }

      if (!res.ok) {
        throw new Error(data?.error || t.deleteError);
      }

      setMessage(t.deleteSuccess);
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || t.deleteError);
    } finally {
      setLoading(false);
    }
  };

  const offerLabel = (value: SubscriptionPlanView) => t.offerLabels[value];
  const statusLabel = (value: string | null) =>
    t.statusLabels[(value as keyof typeof t.statusLabels) || "NONE"] || value || "—";

  return (
    <div className="mt-4 space-y-4 text-xs">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
        <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          {t.createTitle}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
              {t.email}
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
              placeholder={t.emailPlaceholder}
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
              placeholder={t.displayedNamePlaceholder}
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

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
              {t.offer}
            </label>
            <select
              value={formOffer}
              onChange={(e) => setFormOffer(e.target.value as SubscriptionPlanView)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
            >
              <option value="NONE">{offerLabel("NONE")}</option>
              <option value="LIMITED">{offerLabel("LIMITED")}</option>
              <option value="ESSENTIAL">{offerLabel("ESSENTIAL")}</option>
              <option value="FULL_MONTHLY">{offerLabel("FULL_MONTHLY")}</option>
              <option value="FULL_YEARLY">{offerLabel("FULL_YEARLY")}</option>
              <option value="ENTERPRISE">{offerLabel("ENTERPRISE")}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
                {t.startDate}
              </label>
              <input
                type="date"
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
                {t.endDate}
              </label>
              <input
                type="date"
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-white">
            <input
              type="checkbox"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
            />
            {formActive ? t.active : t.inactive}
          </label>

          <button
            type="button"
            disabled={creating}
            onClick={handleCreateUser}
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-[11px] font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? t.creating : t.createUser}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
        <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          {t.analyticsTitle}
        </div>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-300">
          {t.analyticsSubtitle}
        </p>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl bg-[var(--surface)] p-3 dark:bg-slate-800">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t.totalUsers}
            </div>
            <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
              {analytics.totalUsers}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--surface)] p-3 dark:bg-slate-800">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t.activeUsers}
            </div>
            <div className="mt-2 text-lg font-semibold text-emerald-600 dark:text-emerald-300">
              {analytics.activeUsers}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--surface)] p-3 dark:bg-slate-800">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t.subscribedUsers}
            </div>
            <div className="mt-2 text-lg font-semibold text-sky-600 dark:text-sky-300">
              {analytics.subscribedUsers}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--surface)] p-3 dark:bg-slate-800">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t.limitedUsers}
            </div>
            <div className="mt-2 text-lg font-semibold text-amber-600 dark:text-amber-300">
              {analytics.limitedUsers}
            </div>
          </div>
          <div className="rounded-xl bg-[var(--surface)] p-3 dark:bg-slate-800">
            <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t.adminUsers}
            </div>
            <div className="mt-2 text-lg font-semibold text-violet-600 dark:text-violet-300">
              {analytics.adminUsers}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
        <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          {t.existingTitle}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-white">
                <th className="px-2 py-1 text-left">{t.name}</th>
                <th className="px-2 py-1 text-left">{t.email}</th>
                <th className="px-2 py-1 text-left">{t.role}</th>
                <th className="px-2 py-1 text-left">{t.offer}</th>
                <th className="px-2 py-1 text-left">{t.status}</th>
                <th className="px-2 py-1 text-left">{t.startDate}</th>
                <th className="px-2 py-1 text-left">{t.endDate}</th>
                <th className="px-2 py-1 text-left">{t.createdAt}</th>
                <th className="px-2 py-1 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditing = editingUserId === u.id;

                return (
                  <tr
                    key={u.id}
                    className="bg-[var(--surface)] text-[11px] text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                  >
                    <td className="rounded-l-xl px-3 py-3 text-slate-900 dark:text-white">
                      {u.name || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="max-w-[220px] truncate text-slate-900 dark:text-white">
                        {u.email}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[10px] text-slate-900 outline-none dark:bg-slate-700 dark:text-white"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="FULL">FULL</option>
                          <option value="LIMITED">LIMITED</option>
                        </select>
                      ) : (
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
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <select
                          value={editOffer}
                          onChange={(e) => setEditOffer(e.target.value as SubscriptionPlanView)}
                          className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[10px] text-slate-900 outline-none dark:bg-slate-700 dark:text-white"
                        >
                          <option value="NONE">{offerLabel("NONE")}</option>
                          <option value="LIMITED">{offerLabel("LIMITED")}</option>
                          <option value="ESSENTIAL">{offerLabel("ESSENTIAL")}</option>
                          <option value="FULL_MONTHLY">{offerLabel("FULL_MONTHLY")}</option>
                          <option value="FULL_YEARLY">{offerLabel("FULL_YEARLY")}</option>
                          <option value="ENTERPRISE">{offerLabel("ENTERPRISE")}</option>
                        </select>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                          {offerLabel(u.subscriptionPlan)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
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
                          {u.isActive ? t.active : t.inactive}
                        </button>

                        <span className="text-[10px] text-slate-500 dark:text-slate-300">
                          {statusLabel(u.subscriptionStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[10px] text-slate-900 outline-none dark:bg-slate-700 dark:text-white"
                        />
                      ) : (
                        formatDate(u.subscriptionPeriodStart, lang)
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editEndDate}
                          onChange={(e) => setEditEndDate(e.target.value)}
                          className="rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-1 text-[10px] text-slate-900 outline-none dark:bg-slate-700 dark:text-white"
                        />
                      ) : (
                        formatDate(u.subscriptionPeriodEnd, lang)
                      )}
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-300">
                      {formatDate(u.createdAt, lang)}
                    </td>
                    <td className="rounded-r-xl px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateUser(u.id)}
                              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200"
                            >
                              {t.save}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {t.cancel}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(u)}
                              className="inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-[10px] font-medium text-sky-700 hover:bg-sky-100 dark:border-sky-900/40 dark:bg-sky-950/20 dark:text-sky-200"
                            >
                              {t.modify}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-medium text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200"
                            >
                              {t.delete}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

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
            {t.updating}
          </div>
        )}
      </div>
    </div>
  );
}