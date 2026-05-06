"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!token) {
      setErrorMsg("Lien de réinitialisation invalide ou incomplet.");
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMsg("Merci de remplir tous les champs.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error ?? "Impossible de réinitialiser le mot de passe.");
        return;
      }

      setSuccessMsg("Mot de passe réinitialisé avec succès. Redirection vers la connexion...");
      setPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (error) {
      console.error(error);
      setErrorMsg("Erreur réseau. Merci de réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            Projelys
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Réinitialiser le mot de passe
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Nouveau mot de passe
              </label>
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="px-3 text-xs text-slate-500 dark:text-slate-300"
                >
                  {showPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Confirmer le mot de passe
              </label>
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="px-3 text-xs text-slate-500 dark:text-slate-300"
                >
                  {showConfirmPassword ? "Masquer" : "Afficher"}
                </button>
              </div>
            </div>

            {errorMsg ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {errorMsg}
              </div>
            ) : null}

            {successMsg ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                {successMsg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Enregistrement..." : "Définir le nouveau mot de passe"}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-xs text-indigo-600 hover:underline dark:text-indigo-300"
              >
                Retour à la connexion
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}