"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import AppShell from "@/app/components/AppShell";

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Merci de remplir tous les champs.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg("Le nouveau mot de passe doit être différent de l’actuel.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/change-password", {
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
        setErrorMsg(data?.error ?? "Une erreur est survenue.");
        return;
      }

      setSuccessMsg(
        "Mot de passe mis à jour. Vous devrez vous reconnecter sur vos autres sessions.",
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setErrorMsg("Erreur réseau. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell
      activeSection="dashboard"
      pageTitle="Sécurité du compte"
      pageSubtitle="Gérer votre mot de passe et la sécurité de votre compte."
    >
      <section className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Changer de mot de passe
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Saisissez votre mot de passe actuel et choisissez un nouveau mot de passe
                d&apos;au moins 8 caractères.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Retour connexion
              </Link>
              <Link
                href="/auth/reset-password"
                className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
              >
                Réinitialisation par email
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5 text-xs">
              <label
                htmlFor="currentPassword"
                className="block font-medium text-slate-700 dark:text-slate-200"
              >
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-20 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={
                    showCurrent
                      ? "Masquer le mot de passe actuel"
                      : "Afficher le mot de passe actuel"
                  }
                >
                  {showCurrent ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label
                htmlFor="newPassword"
                className="block font-medium text-slate-700 dark:text-slate-200"
              >
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-20 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={
                    showNew
                      ? "Masquer le nouveau mot de passe"
                      : "Afficher le nouveau mot de passe"
                  }
                >
                  {showNew ? "Masquer" : "Afficher"}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Minimum 8 caractères, idéalement avec majuscule, minuscule, chiffre et caractère spécial.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label
                htmlFor="confirmPassword"
                className="block font-medium text-slate-700 dark:text-slate-200"
              >
                Confirmation du nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-20 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Confirmer le nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label={
                    showConfirm
                      ? "Masquer la confirmation du mot de passe"
                      : "Afficher la confirmation du mot de passe"
                  }
                >
                  {showConfirm ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            {errorMsg ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {errorMsg}
              </div>
            ) : null}

            {successMsg ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                {successMsg}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {isSubmitting ? "Enregistrement..." : "Mettre à jour le mot de passe"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Réinitialiser le formulaire
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Bonnes pratiques
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li>Utiliser un mot de passe unique pour Projelys.</li>
            <li>Éviter de réutiliser un ancien mot de passe.</li>
            <li>Préférer une phrase de passe longue et mémorisable.</li>
            <li>Se déconnecter des appareils partagés après usage.</li>
          </ul>
        </div>
      </section>
    </AppShell>
  );
}