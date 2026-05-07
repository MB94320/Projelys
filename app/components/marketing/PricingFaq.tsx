import { Lang } from "./marketing-content";

export default function PricingFaq({ lang }: { lang: Lang }) {
  const items =
    lang === "fr"
      ? [
          {
            q: "Puis-je commencer avec une version plus simple ?",
            a: "Oui. L’offre Essential permet de démarrer avec un périmètre plus ciblé autour des projets, de la charge et des actions.",
          },
          {
            q: "Quelle différence entre le Pro mensuel et annuel ?",
            a: "La couverture fonctionnelle est la même. La différence vient du mode d’engagement et du rythme de facturation.",
          },
          {
            q: "Avez-vous une offre pour les entreprises ?",
            a: "Oui. Une formule sur devis est prévue pour les ETI, TPE, PME et ESN à partir de 3 collaborateurs.",
          },
          {
            q: "Les tutoriels sont-ils inclus ?",
            a: "Oui. Des tutoriels par page sont prévus pour aider les utilisateurs à comprendre les sections de l’outil et leur usage au quotidien.",
          },
          {
            q: "Comment souscrire aujourd’hui ?",
            a: "Vous pouvez déjà souscrire aux offres Pro ou demander une démonstration pour cadrer le besoin avant déploiement.",
          },
        ]
      : [
          {
            q: "Can I start with a simpler version?",
            a: "Yes. The Essential offer is designed for a more focused scope around projects, workload and action plans.",
          },
          {
            q: "What is the difference between Pro monthly and yearly?",
            a: "The functional scope is the same. The difference lies in the commitment model and billing rhythm.",
          },
          {
            q: "Do you offer a plan for companies?",
            a: "Yes. A custom quote offer is planned for SMBs, mid-sized companies and service firms from 3 collaborators.",
          },
          {
            q: "Are tutorials included?",
            a: "Yes. Page-level tutorials are planned to help users understand each section and use the platform effectively.",
          },
          {
            q: "How can I subscribe today?",
            a: "You can already subscribe to Pro plans or request a demo to better frame your needs before rollout.",
          },
        ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-4 pb-16">
      <div className="max-w-3xl">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">
          {lang === "fr" ? "Questions fréquentes" : "Frequently asked questions"}
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-white md:text-4xl">
          {lang === "fr"
            ? "Les réponses essentielles avant de démarrer."
            : "Key answers before you get started."}
        </h2>
      </div>

      <div className="mt-10 grid gap-4">
        {items.map((item) => (
          <div
            key={item.q}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
              {item.q}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}