import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import AppShell from "@/app/components/AppShell";
import SecurityForm from "./SecurityForm";
import UsersAdminSection from "./UsersAdminSection";
import Link from "next/link";

export const dynamic = "force-dynamic";

type UserRole = "ADMIN" | "FULL" | "LIMITED";

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

function normalizeRole(role: unknown): UserRole {
  const r = String(role);
  if (r === "ADMIN") return "ADMIN";
  if (r === "LIMITED") return "LIMITED";
  return "FULL";
}

export default async function AdminPage() {
  const user = await requireAdmin();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const dbUsers = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const users: UserRow[] = dbUsers.map((u): UserRow => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: normalizeRole(u.role),
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <AppShell
      activeSection="dashboard"
      pageTitle="Administration"
      pageSubtitle="Gestion de votre compte administrateur, des utilisateurs et des abonnements."
    >
      <div className="max-w-6xl space-y-6">
        {/* Bandeau d'action rapide */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm dark:bg-slate-800 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-200">
              Accéder aux réglages de sécurité de votre propre compte.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings/security"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
            >
              Sécurité du compte (utilisateur)
            </Link>
          </div>
        </div>

        {/* Profil admin + Sécurité admin côte à côte */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Profil admin */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Profil administrateur
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
              Informations de base associées à votre compte administrateur.
            </p>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-muted)] px-3 py-2 dark:bg-slate-700">
                <dt className="text-slate-500 dark:text-slate-200">
                  Nom affiché
                </dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {user.name || "Non renseigné"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-muted)] px-3 py-2 dark:bg-slate-700">
                <dt className="text-slate-500 dark:text-slate-200">Email</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {user.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-muted)] px-3 py-2 dark:bg-slate-700">
                <dt className="text-slate-500 dark:text-slate-200">Rôle</dt>
                <dd className="font-medium text-emerald-600 dark:text-emerald-300">
                  {user.role}
                </dd>
              </div>
            </dl>
          </section>

          {/* Sécurité admin */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Sécurité (administrateur)
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
              Modifier le mot de passe de votre compte administrateur.
            </p>
            <div className="mt-4">
              <SecurityForm />
            </div>
          </section>
        </div>

        {/* Utilisateurs + abonnement dans un bloc séparé */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Utilisateurs & abonnements
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
                Gérer les comptes utilisateurs, les accès et votre abonnement.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/subscription"
                className="inline-flex items-center justify-center rounded-xl border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 dark:border-sky-400/40 dark:bg-sky-500 dark:hover:bg-sky-400"
              >
                Abonnement
              </Link>
              {/* Bouton pour faire défiler vers la liste des utilisateurs */}
              <a
                href="#users-admin-section"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
              >
                Gérer les utilisateurs (voir la liste)
              </a>
            </div>
          </div>

          <div
            id="users-admin-section"
            className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <UsersAdminSection initialUsers={users} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}