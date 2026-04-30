"use client";

import { FormEvent, useState } from "react";

export default function SecurityForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Impossible de changer le mot de passe.");
      }

      setMessage("Mot de passe mis à jour avec succès.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la mise à jour du mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3 text-xs">
      <div>
        <label className="mb-1 block font-medium text-slate-700 dark:text-slate-200">
          Mot de passe actuel
        </label>
        <input
          type={showPasswords ? "text" : "password"}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 outline-none"
          placeholder="Mot de passe actuel"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-700 dark:text-slate-200">
          Nouveau mot de passe
        </label>
        <input
          type={showPasswords ? "text" : "password"}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 outline-none"
          placeholder="Au moins 8 caractères"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-slate-700 dark:text-slate-200">
          Confirmation du nouveau mot de passe
        </label>
        <input
          type={showPasswords ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 outline-none"
          placeholder="Répéter le nouveau mot de passe"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowPasswords((v) => !v)}
          className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          {showPasswords ? "Masquer les mots de passe" : "Afficher les mots de passe"}
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
          {message}
        </div>
      )}
    </form>
  );
}