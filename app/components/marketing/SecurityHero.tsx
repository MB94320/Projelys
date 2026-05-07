import { Lang } from "./marketing-content";

export default function SecurityHero({ lang }: { lang: Lang }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-6 py-18">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            {lang === "fr" ? "Sécurité & confidentialité" : "Security & privacy"}
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-5xl xl:text-6xl">
            {lang === "fr"
              ? "Un environnement sécurisé pour piloter vos projets et vos données."
              : "A secure environment to manage your projects and your data."}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
            {lang === "fr"
              ? "Projelys est pensé pour des données sensibles de pilotage, de charge, de risques,  et de qualité. Nous appliquons des règles simples : chiffrer, limiter, journaliser et ne conserver que ce qui est utile."
              : "Projelys is designed for sensitive data around governance, workload, risk and quality. We apply simple rules: encrypt, limit, monitor and only keep what is truly needed."}
          </p>

          <div className="mt-8 grid gap-3 text-sm text-slate-200">
            <div>
              •{" "}
              {lang === "fr"
                ? "Hébergement européen, accès authentifiés et gestion de rôles."
                : "European hosting, authenticated access and role-based permissions."}
            </div>
            <div>
              •{" "}
              {lang === "fr"
                ? "Sauvegardes régulières, journalisation et traçabilité des actions clés."
                : "Regular backups, logging and traceability for key actions."}
            </div>
            <div>
              •{" "}
              {lang === "fr"
                ? "Un point d’entrée unique pour centraliser vos décisions et réduire les risques d’éparpillement."
                : "A single entry point to centralize decisions and reduce scattered tools risk."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}