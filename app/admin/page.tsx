import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/auth";
import AppShell from "@/app/components/AppShell"; // adapte le chemin si nécessaire
import SecurityForm from "./SecurityForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdmin();

  if (!user) {
    redirect("/login?next=/admin");
  }

  return (
    <AppShell
      activeSection="dashboard"
      pageTitle="Administration"
      pageSubtitle="Gestion de votre compte administrateur."
    >
      <div className="max-w-xl space-y-6">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Profil administrateur
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Informations de base associées à votre compte.
          </p>

          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">
                Nom affiché
              </dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">
                {user.name || "Non renseigné"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Email</dt>
              <dd className="font-medium text-slate-900 dark:text-slate-50">
                {user.email}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Rôle</dt>
              <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                {user.role}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Sécurité
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Modifier votre mot de passe administrateur.
          </p>

          {/* Client component inline via form action simple */}
          {/* On garde ça simple : on passe par un petit formulaire POST côté client */}
          {/* Voir app/admin/SecurityForm.tsx si tu préfères découper plus tard */}
          <SecurityForm />
        </section>
      </div>
    </AppShell>
  );
}