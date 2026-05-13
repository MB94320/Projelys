import { redirect } from "next/navigation";
import { requireAdmin } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import AppShell from "@/app/components/AppShell";
import SecurityForm from "./SecurityForm";
import UsersAdminSection from "./UsersAdminSection";
import Link from "next/link";

export const dynamic = "force-dynamic";

type UserRole = "ADMIN" | "FULL" | "LIMITED";
type SubscriptionPlanView = "LIMITED" | "ESSENTIAL" | "FULL_MONTHLY" | "FULL_YEARLY" | "ENTERPRISE" | "NONE";

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

type AdminPageProps = {
  searchParams?: Promise<{
    lang?: string;
  }>;
};

function normalizeRole(role: unknown): UserRole {
  const r = String(role);
  if (r === "ADMIN") return "ADMIN";
  if (r === "LIMITED") return "LIMITED";
  return "FULL";
}

function normalizeSubscriptionPlan(plan: unknown, billingCycle: unknown): SubscriptionPlanView {
  const p = String(plan || "");
  const c = String(billingCycle || "");

  if (p === "ESSENTIAL") return "ESSENTIAL";
  if (p === "ENTERPRISE") return "ENTERPRISE";
  if (p === "FULL" && c === "YEARLY") return "FULL_YEARLY";
  if (p === "FULL") return "FULL_MONTHLY";
  if (p === "LIMITED") return "LIMITED";
  return "NONE";
}

const pageCopy = {
  fr: {
    pageTitle: "Administration",
    pageSubtitle:
      "Gestion de votre compte administrateur, des utilisateurs et des abonnements.",
    securityAccess: "Accéder aux réglages de sécurité de votre propre compte.",
    securityButton: "Sécurité du compte (utilisateur)",
    adminProfile: "Profil administrateur",
    adminProfileText:
      "Informations de base associées à votre compte administrateur.",
    displayName: "Nom affiché",
    notProvided: "Non renseigné",
    email: "Email",
    role: "Rôle",
    securityAdmin: "Sécurité (administrateur)",
    securityAdminText: "Modifier le mot de passe de votre compte administrateur.",
    usersAndSubs: "Utilisateurs & abonnements",
    usersAndSubsText:
      "Gérer les comptes utilisateurs, les accès et votre abonnement.",
    subscription: "Abonnement",
    manageUsers: "Gérer les utilisateurs (voir la liste)",
  },
  en: {
    pageTitle: "Administration",
    pageSubtitle:
      "Manage your administrator account, users and subscriptions.",
    securityAccess: "Access your own account security settings.",
    securityButton: "Account security (user)",
    adminProfile: "Administrator profile",
    adminProfileText: "Basic information linked to your administrator account.",
    displayName: "Display name",
    notProvided: "Not provided",
    email: "Email",
    role: "Role",
    securityAdmin: "Security (administrator)",
    securityAdminText: "Change your administrator account password.",
    usersAndSubs: "Users & subscriptions",
    usersAndSubsText: "Manage user accounts, access and your subscription.",
    subscription: "Subscription",
    manageUsers: "Manage users (view list)",
  },
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const lang = params?.lang === "en" ? "en" : "fr";
  const t = pageCopy[lang];

  const user = await requireAdmin();

  if (!user) {
    redirect(`/login?next=/admin&lang=${lang}`);
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
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          plan: true,
          billingCycle: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      },
    },
  });

  const users: UserRow[] = dbUsers.map((u): UserRow => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: normalizeRole(u.role),
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    subscriptionPlan: normalizeSubscriptionPlan(
      u.subscriptions[0]?.plan,
      u.subscriptions[0]?.billingCycle
    ),
    subscriptionStatus: u.subscriptions[0]?.status
      ? String(u.subscriptions[0]?.status)
      : null,
    subscriptionPeriodStart: u.subscriptions[0]?.currentPeriodStart
      ? u.subscriptions[0].currentPeriodStart.toISOString()
      : null,
    subscriptionPeriodEnd: u.subscriptions[0]?.currentPeriodEnd
      ? u.subscriptions[0].currentPeriodEnd.toISOString()
      : null,
  }));

  return (
    <AppShell
      lang={lang}
      activeSection="dashboard"
      pageTitle={t.pageTitle}
      pageSubtitle={t.pageSubtitle}
    >
      <div className="max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm dark:bg-slate-800 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-200">
              {t.securityAccess}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/settings/security?lang=${lang}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
            >
              {t.securityButton}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t.adminProfile}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
              {t.adminProfileText}
            </p>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-muted)] px-3 py-2 dark:bg-slate-700">
                <dt className="text-slate-500 dark:text-slate-200">
                  {t.displayName}
                </dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {user.name || t.notProvided}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-muted)] px-3 py-2 dark:bg-slate-700">
                <dt className="text-slate-500 dark:text-slate-200">{t.email}</dt>
                <dd className="font-medium text-slate-900 dark:text-white">
                  {user.email}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-muted)] px-3 py-2 dark:bg-slate-700">
                <dt className="text-slate-500 dark:text-slate-200">{t.role}</dt>
                <dd className="font-medium text-emerald-600 dark:text-emerald-300">
                  {user.role}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t.securityAdmin}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
              {t.securityAdminText}
            </p>
            <div className="mt-4">
              <SecurityForm />
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm dark:bg-slate-800">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t.usersAndSubs}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-200">
                {t.usersAndSubsText}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/subscription?lang=${lang}`}
                className="inline-flex items-center justify-center rounded-xl border border-sky-500/40 bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 dark:border-sky-400/40 dark:bg-sky-500 dark:hover:bg-sky-400"
              >
                {t.subscription}
              </Link>
              <a
                href="#users-admin-section"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
              >
                {t.manageUsers}
              </a>
            </div>
          </div>

          <div
            id="users-admin-section"
            className="mt-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <UsersAdminSection initialUsers={users} lang={lang} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}