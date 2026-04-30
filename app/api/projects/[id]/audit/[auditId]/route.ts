import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type ParamsPromise = { params: Promise<{ id: string; auditId: string }> };

// GET /api/projects/[id]/audit/[auditId]
export async function GET(_req: Request, context: ParamsPromise) {
  const { auditId } = await context.params;
  const id = Number(auditId);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { error: "auditId invalide" },
      { status: 400 },
    );
  }

  const audit = await prisma.audit.findUnique({
    where: { id },
    include: {
      project: true,
      themes: {
        include: { questions: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!audit) {
    return NextResponse.json(
      { error: "Audit non trouvé" },
      { status: 404 },
    );
  }

  return NextResponse.json(audit);
}

// PATCH /api/projects/[id]/audit/[auditId]
export async function PATCH(req: Request, context: ParamsPromise) {
  const { auditId } = await context.params;
  const id = Number(auditId);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { error: "auditId invalide" },
      { status: 400 },
    );
  }

  const body = (await req.json()) as {
    themeId: number;
    answers: { questionId: number; answer: string; comment?: string }[];
  };

  if (!body.themeId || !Array.isArray(body.answers)) {
    return NextResponse.json(
      { error: "Payload invalide" },
      { status: 400 },
    );
  }

  // mise à jour des réponses
  for (const a of body.answers) {
    await prisma.auditQuestion.update({
      where: { id: a.questionId },
      data: {
        answer: a.answer as any,
        comment: a.comment ?? null,
      },
    });
  }

  // récupérer audit + thème pour savoir si le thème est applicable
  const audit = await prisma.audit.findUnique({
    where: { id },
    include: {
      project: true,
      themes: true,
    },
  });

  if (!audit) {
    return NextResponse.json(
      { error: "Audit non trouvé" },
      { status: 404 },
    );
  }

  const themeWithQuestions = await prisma.auditTheme.findUnique({
    where: { id: body.themeId },
    include: { questions: true },
  });

  if (!themeWithQuestions) {
    return NextResponse.json(
      { error: "Thème non trouvé" },
      { status: 404 },
    );
  }

    // détecter NA pour sous-traitance / X-shore
  const outsourcingRaw = (audit.outsourcing ?? "").toLowerCase();
  const xshoreRaw = (audit.xshore ?? "").toLowerCase();

  const hasOutsourcing = outsourcingRaw === "oui" || outsourcingRaw === "yes";
  const hasXshore = xshoreRaw === "oui" || xshoreRaw === "yes";

  const isOutsourcingTheme =
    themeWithQuestions.type === "GESTION_SOUS_TRAITANCE";
  const isXshoreTheme =
    themeWithQuestions.type === "GESTION_XSHORE";

  const isDisabledTheme =
    (!hasOutsourcing && isOutsourcingTheme) ||
    (!hasXshore && isXshoreTheme);


  // si thème non applicable => taux = null, on ne calcule pas
  if (isDisabledTheme) {
    await prisma.auditTheme.update({
      where: { id: body.themeId },
      data: { conformityRate: null },
    });
  } else {
    const questions = themeWithQuestions.questions;

    // on exclut les NA du calcul
    const answered = questions.filter(
      (q) => q.answer === "OUI" || q.answer === "NON",
    );

    if (answered.length === 0) {
      // aucune réponse OUI/NON -> thème NA
      await prisma.auditTheme.update({
        where: { id: body.themeId },
        data: { conformityRate: null },
      });
    } else {
      const totalWeight = answered.reduce(
        (sum, q) => sum + q.weight,
        0,
      );
      const yesWeight = answered
        .filter((q) => q.answer === "OUI")
        .reduce((sum, q) => sum + q.weight, 0);

      const rate =
        totalWeight > 0 ? yesWeight / totalWeight : null;

      await prisma.auditTheme.update({
        where: { id: body.themeId },
        data: { conformityRate: rate },
      });
    }
  }

  // recalcul du taux global de l’audit (moyenne des thèmes renseignés)
  const auditWithThemes = await prisma.audit.findUnique({
    where: { id },
    include: { themes: true, project: true },
  });

  if (!auditWithThemes) {
    return NextResponse.json(
      { error: "Audit non trouvé" },
      { status: 404 },
    );
  }

  const themes = auditWithThemes.themes;
  const ratedThemes = themes.filter(
    (t) => t.conformityRate != null,
  );

  const globalRate =
    ratedThemes.length > 0
      ? ratedThemes.reduce(
          (sum, t) => sum + (t.conformityRate ?? 0),
          0,
        ) / ratedThemes.length
      : 0;

  const updatedAudit = await prisma.audit.update({
    where: { id },
    data: {
      previousGlobalRate: auditWithThemes.globalConformityRate,
      globalConformityRate: globalRate,
      lastEvaluationDate: new Date(),
    },
    include: {
      project: true,
      themes: { include: { questions: true } },
    },
  });

  return NextResponse.json(updatedAudit);
}

// DELETE /api/projects/[id]/audit/[auditId]
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string; auditId: string }> },
) {
  const { auditId } = await context.params;
  const id = Number(auditId);

  if (!id || Number.isNaN(id)) {
    return NextResponse.json(
      { error: "auditId invalide" },
      { status: 400 },
    );
  }

  // on supprime d'abord les questions, puis les thèmes, puis l'audit
  await prisma.auditQuestion.deleteMany({
    where: { theme: { auditId: id } },
  });

  await prisma.auditTheme.deleteMany({
    where: { auditId: id },
  });

  await prisma.audit.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
