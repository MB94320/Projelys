import { Lang } from "./marketing-content";

export default function SecurityDetails({ lang }: { lang: Lang }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-18">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            {lang === "fr"
              ? "Accès, authentification et rôles"
              : "Access, authentication and roles"}
          </h3>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <li>
              •{" "}
              {lang === "fr"
                ? "Accès réservés aux comptes authentifiés avec gestion de rôles pour distinguer administration, pilotage et contribution."
                : "Access restricted to authenticated accounts with role-based permissions separating admin, leadership and contributors."}
            </li>
            <li>
              •{" "}
              {lang === "fr"
                ? "Possibilité de limiter les accès à certains espaces (projets, portefeuilles, vues de performance) en fonction des besoins."
                : "Ability to limit access to specific spaces (projects, portfolios, performance views) based on needs."}
            </li>
            <li>
              •{" "}
              {lang === "fr"
                ? "Session limitée dans le temps avec possibilité de se déconnecter facilement sur les postes partagés."
                : "Sessions limited in time with an easy way to sign out on shared devices."}
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            {lang === "fr"
              ? "Sauvegardes, logs et continuité"
              : "Backups, logs and continuity"}
          </h3>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            <li>
              •{" "}
              {lang === "fr"
                ? "Sauvegardes régulières de la base de données pour limiter l’impact d’une erreur ou d’un incident."
                : "Regular database backups to reduce the impact of incidents or mistakes."}
            </li>
            <li>
              •{" "}
              {lang === "fr"
                ? "Journalisation des actions importantes (création, modification, suppression) pour garder une trace de l’historique."
                : "Logging of important actions (create, update, delete) to keep a clear history."}
            </li>
            <li>
              •{" "}
              {lang === "fr"
                ? "Approche progressive : commencer simple, puis renforcer le niveau de sécurité au fil des besoins et des retours."
                : "Progressive approach: start simple and strengthen security as needs and usage grow."}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}