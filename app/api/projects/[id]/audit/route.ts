// app/api/projects/[id]/audit/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import type { AuditThemeType, AuditArea } from "@prisma/client";

type QuestionDef = {
  text: string;
  weight: number;
};

type ThemeDef = {
  type: AuditThemeType;
  area: AuditArea;
  questions: QuestionDef[];
};

const BASE_THEMES: ThemeDef[] = [
  {
    type: "REVUE_OPPORTUNITE",
    area: "AVV",
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
    type: "PILOTAGE_REPONSE",
    area: "AVV",
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
    type: "REVUE_CONTRAT",
    area: "AVV",
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
    type: "REVUE_PROPOSITION",
    area: "AVV",
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
  {
    type: "GESTION_EXIGENCES",
    area: "DELIVERY",
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
    type: "GESTION_RISQUES_OPPORTUNITES",
    area: "DELIVERY",
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
    type: "PLANIFICATION",
    area: "DELIVERY",
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
    type: "PERFORMANCE",
    area: "DELIVERY",
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
    type: "REUNIONS_COMMUNICATION",
    area: "DELIVERY",
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
    type: "VERIFICATION_VALIDATION",
    area: "DELIVERY",
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
    type: "CAPITALISATION",
    area: "DELIVERY",
    questions: [
      {
        text: "Les retours d’expérience sont-ils collectés et réutilisés ?",
        weight: 1,
      },
    ],
  },
  {
    type: "GESTION_CONFIGURATION",
    area: "DELIVERY",
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
    type: "GESTION_DOCUMENTAIRE",
    area: "DELIVERY",
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
    type: "SECURITE_PERSONNES",
    area: "DELIVERY",
    questions: [
      {
        text: "Les règles de sécurité des personnes sont-elles connues ?",
        weight: 1,
      },
    ],
  },
  {
    type: "SECURITE_DONNEES",
    area: "DELIVERY",
    questions: [
      {
        text: "La confidentialité et l’intégrité des données sont-elles prises en compte ?",
        weight: 1,
      },
    ],
  },
  {
    type: "GESTION_RESSOURCES",
    area: "DELIVERY",
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
    type: "GESTION_SOUS_TRAITANCE",
    area: "DELIVERY",
    questions: [
      {
        text: "Les engagements des sous-traitants sont-ils maîtrisés ?",
        weight: 1,
      },
    ],
  },
  {
    type: "GESTION_XSHORE",
    area: "DELIVERY",
    questions: [
      {
        text: "Les contraintes de fuseaux horaires / langue sont-elles maîtrisées ?",
        weight: 1,
      },
    ],
  },
  {
    type: "GESTION_NON_CONFORMITES",
    area: "DELIVERY",
    questions: [
      {
        text: "Les non-conformités sont-elles enregistrées et traitées ?",
        weight: 1,
      },
    ],
  },
  {
    type: "GESTION_INSATISFACTIONS",
    area: "DELIVERY",
    questions: [
      {
        text: "Les insatisfactions clients sont-elles tracées ?",
        weight: 1,
      },
    ],
  },
  {
    type: "PMP",
    area: "DELIVERY",
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

type CreateAuditBody = {
  evaluationDate: string;
  qualityFollowUp?: string | null;
  outsourcing?: string | null;
  xshore?: string | null;
};

// GET /api/projects/[id]/audit
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (!projectId || Number.isNaN(projectId)) {
    return NextResponse.json([]);
  }

  const audits = await prisma.audit.findMany({
    where: { projectId },
    include: {
      project: true,
      themes: { include: { questions: true } },
    },
    orderBy: { evaluationDate: "desc" },
  });

  return NextResponse.json(audits);
}

// POST /api/projects/[id]/audit
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const projectId = Number(id);

  if (!projectId || Number.isNaN(projectId)) {
    return NextResponse.json(
      { error: "projectId invalide" },
      { status: 400 },
    );
  }

  const body = (await req.json()) as CreateAuditBody;

  if (!body.evaluationDate) {
    return NextResponse.json(
      { error: "evaluationDate requis" },
      { status: 400 },
    );
  }

  const evalDate = new Date(body.evaluationDate);
  if (Number.isNaN(evalDate.getTime())) {
    return NextResponse.json(
      { error: "evaluationDate invalide" },
      { status: 400 },
    );
  }

  const year = evalDate.getFullYear();
  const prefix = `AUD_${year}_`;

  const existing = await prisma.audit.findMany({
    where: { ref: { startsWith: prefix } },
    select: { ref: true },
    orderBy: { ref: "asc" },
  });

  let nextIndex = 1;
  for (const a of existing) {
    const tail = a.ref.slice(prefix.length);
    const num = Number(tail);
    if (!Number.isNaN(num) && num >= nextIndex) {
      nextIndex = num + 1;
    }
  }

  const generatedRef = `${prefix}${String(nextIndex).padStart(3, "0")}`;

  const audit = await prisma.audit.create({
    data: {
      projectId,
      ref: generatedRef,
      evaluationDate: evalDate,
      lastEvaluationDate: null,
      globalConformityRate: 0,
      previousGlobalRate: null,
      qualityFollowUp: body.qualityFollowUp ?? null,
      outsourcing: body.outsourcing ?? null,
      xshore: body.xshore ?? null,
      ncFromAuditCount: 0,
      avgActionClosureDelay: null,
      themes: {
        create: BASE_THEMES.map((t) => ({
          type: t.type,
          area: t.area,
          conformityRate: null,
          color: "gray",
          questions: {
            create: t.questions.map((q, idx) => ({
              code: idx + 1,
              text: q.text,
              weight: q.weight,
            })),
          },
        })),
      },
    },
    include: {
      project: true,
      themes: { include: { questions: true } },
    },
  });

  return NextResponse.json(audit, { status: 201 });
}
