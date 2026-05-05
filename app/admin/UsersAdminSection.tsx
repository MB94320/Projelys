"use client";

import { useState } from "react";

type UserRole = "ADMIN" | "FULL" | "LIMITED";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

type Props = {
  initialUsers: UserRow[];
};

export default function UsersAdminSection({ initialUsers }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      throw new Error(data?.error || "Impossible de recharger les utilisateurs.");
    }
    setUsers(data.users);
  };

  const handleCreateUser = async () => {
    resetMessages();

    if (!formEmail || !formPassword) {
      setError("Email et mot de passe sont requis.");
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
        throw new Error(data?.error || "Erreur lors de la création de l'utilisateur.");
      }

      setMessage("Utilisateur créé avec succès.");
      setFormEmail("");
      setFormName("");
      setFormPassword("");
      setFormRole("FULL");
      setFormActive(true);
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création de l'utilisateur.");
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
        throw new Error(data?.error || "Erreur lors de la mise à jour du statut.");
      }

      setMessage("Statut utilisateur mis à jour.");
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la mise à jour du statut.");
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
        throw new Error(data?.error || "Erreur lors du changement de rôle.");
      }

      setMessage("Rôle utilisateur mis à jour.");
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || "Erreur lors du changement de rôle.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserRow) => {
    resetMessages();

    const confirmed = window.confirm(
      `Supprimer définitivement l'utilisateur ${user.email} ?`
    );

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
        throw new Error(data?.error || "Erreur lors de la suppression.");
      }

      setMessage("Utilisateur supprimé avec succès.");
      await refreshUsers();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la suppression de l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4 text-xs">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
        <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Créer un nouvel utilisateur
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
              Email
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
              Nom
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
              placeholder="Nom affiché"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
              Mot de passe
            </label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-slate-900 outline-none dark:bg-slate-800 dark:text-white"
              placeholder="Minimum 8 caractères"
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700 dark:text-white">
                Rôle
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
              Actif
            </label>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={creating}
            onClick={handleCreateUser}
            className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-[11px] font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Création..." : "Créer l'utilisateur"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 dark:bg-slate-700">
        <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          Utilisateurs existants
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-white">
                <th className="px-2 py-1 text-left">Email</th>
                <th className="px-2 py-1 text-left">Nom</th>
                <th className="px-2 py-1 text-left">Rôle</th>
                <th className="px-2 py-1 text-left">Statut</th>
                <th className="px-2 py-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="bg-[var(--surface)] text-[11px] text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                >
                  <td className="rounded-l-xl px-3 py-3">
                    <div className="max-w-[220px] truncate text-slate-900 dark:text-white">
                      {u.email}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-900 dark:text-white">
                    {u.name || "—"}
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
                      {u.isActive ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="rounded-r-xl px-3 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[10px] font-medium text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-[11px] text-slate-500 dark:text-white"
                  >
                    Aucun utilisateur pour le moment.
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
            Mise à jour...
          </div>
        )}
      </div>
    </div>
  );
}