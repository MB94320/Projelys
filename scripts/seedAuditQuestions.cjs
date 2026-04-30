// scripts/seedAuditQuestions.cjs
const { PrismaClient, AuditThemeType, AuditArea } = require("@prisma/client");

const prisma = new PrismaClient();

const BASE_THEMES = [
  // 1. Avant-vente
  {
    type: AuditThemeType.REVUE_OPPORTUNITE,
    area: AuditArea.AVV,
    questions: [
      {
        text: "Les enjeux et l’opportunité du projet sont-ils clairement formalisés ?",
        weight: 1,
      },
      {
        text: "Les risques majeurs associés à l’opportunité sont-ils identifiés ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.PILOTAGE_REPONSE,
    area: AuditArea.AVV,
    questions: [
      {
        text: "La réponse est-elle pilotée avec un plan d’actions et des responsables ?",
        weight: 1,
      },
      {
        text: "Les arbitrages clés sont-ils tracés et partagés ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.REVUE_CONTRAT,
    area: AuditArea.AVV,
    questions: [
      {
        text: "Les clauses contractuelles critiques sont-elles analysées ?",
        weight: 1,
      },
      {
        text: "Les écarts entre contrat et proposition sont-ils clarifiés ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.REVUE_PROPOSITION,
    area: AuditArea.AVV,
    questions: [
      {
        text: "La proposition est-elle cohérente avec les capacités de l’équipe ?",
        weight: 1,
      },
      {
        text: "Les hypothèses de chiffrage sont-elles documentées ?",
        weight: 1,
      },
    ],
  },

  // 2. Delivery – thèmes principaux
  {
    type: AuditThemeType.GESTION_EXIGENCES,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les exigences client sont-elles tracées et vérifiables ?",
        weight: 1,
      },
      {
        text: "Les évolutions d’exigences sont-elles maîtrisées ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.GESTION_RISQUES_OPPORTUNITES,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les risques projet sont-ils évalués et mis à jour régulièrement ?",
        weight: 1,
      },
      {
        text: "Des plans d’action sont-ils définis pour les risques critiques ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.PLANIFICATION,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Le planning intègre-t-il les contraintes clés ?",
        weight: 1,
      },
      {
        text: "Les dérives de planning sont-elles analysées ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.PERFORMANCE,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les indicateurs coût/délai/qualité sont-ils suivis ?",
        weight: 1,
      },
      {
        text: "Les écarts donnent-ils lieu à des actions correctives ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.REUNIONS_COMMUNICATION,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les comités projet sont-ils tenus avec la bonne fréquence ?",
        weight: 1,
      },
      {
        text: "Les décisions sont-elles tracées et diffusées ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.VERIFICATION_VALIDATION,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les activités de vérification/validation sont-elles planifiées ?",
        weight: 1,
      },
      {
        text: "Les résultats sont-ils exploités pour améliorer le projet ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.CAPITALISATION,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les retours d’expérience sont-ils collectés et réutilisés ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.GESTION_CONFIGURATION,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les versions de livrables sont-elles maîtrisées ?",
        weight: 1,
      },
      {
        text: "Les changements sont-ils tracés ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.GESTION_DOCUMENTAIRE,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les documents de référence sont-ils identifiés et accessibles ?",
        weight: 1,
      },
      {
        text: "La documentation est-elle à jour ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.SECURITE_PERSONNES,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les règles de sécurité des personnes sont-elles connues ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.SECURITE_DONNEES,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "La confidentialité et l’intégrité des données sont-elles prises en compte ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.GESTION_RESSOURCES,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les ressources sont-elles adaptées en quantité et compétences ?",
        weight: 1,
      },
      {
        text: "Les charges sont-elles suivies ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.GESTION_SOUS_TRAITANCE,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les engagements des sous-traitants sont-ils maîtrisés ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.GESTION_XSHORE,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les contraintes de fuseaux horaires / langue sont-elles maîtrisées ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.GESTION_NON_CONFORMITES,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les non-conformités sont-elles enregistrées et traitées ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.GESTION_INSATISFACTIONS,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Les insatisfactions clients sont-elles tracées ?",
        weight: 1,
      },
    ],
  },
  {
    type: AuditThemeType.PMP,
    area: AuditArea.DELIVERY,
    questions: [
      {
        text: "Le plan de management projet est-il formalisé ?",
        weight: 1,
      },
      {
        text: "Est-il utilisé comme référence par l’équipe ?",
        weight: 1,
      },
    ],
  },
];

async function main() {
  const audits = await prisma.audit.findMany({
    include: {
      themes: {
        include: { questions: true },
      },
    },
  });

  console.log(`Found ${audits.length} audits.`);

  for (const audit of audits) {
    console.log(`\nAudit ${audit.id} (${audit.ref})`);

    const existingThemesByType = new Map();

    for (const t of audit.themes) {
      existingThemesByType.set(t.type, {
        id: t.id,
        questionsCount: t.questions.length,
      });
    }

    for (const base of BASE_THEMES) {
      const existing = existingThemesByType.get(base.type);

      // 1) aucun thème => on crée thème + questions
      if (!existing) {
        console.log(
          `  -> creating theme ${base.type} with ${base.questions.length} questions`,
        );
        await prisma.auditTheme.create({
          data: {
            auditId: audit.id,
            type: base.type,
            area: base.area,
            conformityRate: null,
            color: "gray",
            questions: {
              create: base.questions.map((q, idx) => ({
                code: idx + 1,
                text: q.text,
                weight: q.weight,
                answer: "NA",
              })),
            },
          },
        });
        continue;
      }

      // 2) thème existe mais pas assez de questions -> on complète
      if (existing.questionsCount < base.questions.length) {
        console.log(
          `  -> adding questions for theme ${base.type} (had ${existing.questionsCount}, should have ${base.questions.length})`,
        );

        const existingQuestions = await prisma.auditQuestion.findMany({
          where: { themeId: existing.id },
          orderBy: { code: "asc" },
        });

        const nextCode =
          existingQuestions.length > 0
            ? existingQuestions[existingQuestions.length - 1].code + 1
            : 1;

        const toCreate = base.questions.slice(existing.questionsCount);

        await prisma.auditQuestion.createMany({
          data: toCreate.map((q, idx) => ({
            themeId: existing.id,
            code: nextCode + idx,
            text: q.text,
            weight: q.weight,
            answer: "NA",
          })),
        });
      }
    }
  }

  console.log("\nDone seeding audit themes/questions.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
