export type Lang = "fr" | "en";

export const content = {
  fr: {
    nav: {
      features: "Fonctionnalités",
      pricing: "Tarifs",
      security: "Sécurité",
      contact: "Contact",
      login: "Connexion",
      demo: "Demander une démo",
    },
    hero: {
      badge: "Une plateforme de pilotage claire, structurée et rentable",
      title: "Pilotez projets, charge, qualité, risques et performance dans un seul outil.",
      subtitle:
        "Projelys centralise ce que les équipes dispersent souvent entre Excel, Trello, Monday, MS Project, mails et documents.",
      ctaPrimary: "Demander une démo",
      ctaSecondary: "Voir les tarifs",
      slogan: "Moins d’outils dispersés. Plus de maîtrise, plus vite.",
      availability: "Disponible sur ordinateur, tablette et smartphone.",
    },
    footer: {
      rights: "Tous droits réservés © projelys.com",
      legal: "Juridique",
      terms: "Conditions de service",
      privacy: "Confidentialité",
      social: "Réseaux",
    },
  },
  en: {
    nav: {
      features: "Features",
      pricing: "Pricing",
      security: "Security",
      contact: "Contact",
      login: "Login",
      demo: "Request a demo",
    },
    hero: {
      badge: "A clear, structured and profitable operating platform",
      title: "Manage projects, workload, quality, risks and performance in one place.",
      subtitle:
        "Projelys centralizes what many teams usually spread across Excel, Trello, Monday, MS Project, emails and documents.",
      ctaPrimary: "Request a demo",
      ctaSecondary: "View pricing",
      slogan: "Fewer scattered tools. More control, faster.",
      availability: "Available on desktop, tablet and mobile.",
    },
    footer: {
      rights: "All rights reserved © projelys.com",
      legal: "Legal",
      terms: "Terms of service",
      privacy: "Privacy",
      social: "Social",
    },
  },
} as const;