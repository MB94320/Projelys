import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const dynamic = "force-dynamic";

// COULEURS COHÉRENTES - 4 phases
const PHASE_COLORS = {
  identification: rgb(0.09, 0.24, 0.50),    // D1
  analyse: rgb(0.14, 0.38, 0.66),           // D2, D4
  actions: rgb(0.20, 0.52, 0.82),           // D3, D5, D7
  cloture: rgb(0.32, 0.66, 0.94),           // D6, D8
};

const STEP_COLORS = [
  PHASE_COLORS.identification,  // D1
  PHASE_COLORS.analyse,         // D2
  PHASE_COLORS.actions,         // D3
  PHASE_COLORS.analyse,         // D4
  PHASE_COLORS.actions,         // D5
  PHASE_COLORS.cloture,         // D6
  PHASE_COLORS.actions,         // D7
  PHASE_COLORS.cloture,         // D8
];

const COLORS = {
  darkBlue: rgb(0.09, 0.24, 0.50),
  charcoal: rgb(0.2, 0.2, 0.22),
  gray50: rgb(0.976, 0.976, 0.980),
  gray100: rgb(0.949, 0.949, 0.953),
  gray300: rgb(0.878, 0.878, 0.882),
  gray500: rgb(0.5, 0.5, 0.5),
  black: rgb(0.1, 0.1, 0.1),
  white: rgb(1, 1, 1),
};

const STEPS_INFO = [
  { code: "D1", desc: "Équipe multidisciplinaire" },
  { code: "D2", desc: "Quoi ? Où ? Quand ? Comment ?" },
  { code: "D3", desc: "Sécuriser client en 3j" },
  { code: "D4", desc: "5P / Ishikawa" },
  { code: "D5", desc: "Actions définitives" },
  { code: "D6", desc: "Vérifier non-récurrence" },
  { code: "D7", desc: "Généraliser à l'organisation" },
  { code: "D8", desc: "Leçons apprises" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR");
}

function wrapTextByWidth(
  text: string,
  maxWidth: number,
  font: any,
  size: number,
): string[] {
  const words = (text || "").split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawPageFooter(
  page: any,
  pageNum: number,
  totalPages: number,
  ncRef: string,
  projNum: string,
  margin: number,
  contentWidth: number,
  font: any,
) {
  const footerY = 15;
  page.drawLine({
    start: { x: margin, y: footerY + 8 },
    end: { x: margin + contentWidth, y: footerY + 8 },
    thickness: 0.5,
    color: COLORS.gray300,
  });

  page.drawText("Fiche 8D - Projelys", {
    x: margin,
    y: footerY,
    size: 7,
    font,
    color: COLORS.gray500,
  });

  page.drawText(`NC: ${ncRef} | Projet: ${projNum}`, {
    x: margin + 110,
    y: footerY,
    size: 7,
    font,
    color: COLORS.gray500,
  });

  page.drawText(`Page ${pageNum}/${totalPages}`, {
    x: margin + contentWidth - 45,
    y: footerY,
    size: 7,
    font,
    color: COLORS.gray500,
  });
}

function draw8DIllustration(
  page: any,
  centerX: number,
  centerY: number,
  circleRadius: number,
  font: any,
  fontBold: any,
) {
  const spacing = 60;
  const circleY = centerY;
  const boxY = centerY - 75; // Boxes en dessous des cercles
  const boxHeight = 42;
  const boxWidth = 54;

  const centers: { x: number; y: number; idx: number }[] = [];

  // Calculer la position de départ pour centrer les 8 cercles
  const totalWidth = (STEPS_INFO.length - 1) * spacing;
  const startX = centerX - totalWidth / 2;

  // === CERCLES ===
  STEPS_INFO.forEach((step, idx) => {
    const x = startX + idx * spacing;
    const y = circleY;

    centers.push({ x, y, idx });

    // Cercle coloré
    page.drawCircle({
      x,
      y,
      size: circleRadius,
      color: STEP_COLORS[idx],
    });

    // Code D1, D2, etc. - CENTRÉ dans le cercle
    const textWidth = fontBold.widthOfTextAtSize(step.code, 14);
    page.drawText(step.code, {
      x: x - textWidth / 2,
      y: y - 5,
      size: 14,
      font: fontBold,
      color: COLORS.white,
    });
  });

  // === FLÈCHES ENTRE CERCLES ===
  for (let i = 0; i < centers.length - 1; i++) {
    const from = centers[i];
    const to = centers[i + 1];

    const arrowStartX = from.x + circleRadius + 2;
    const arrowEndX = to.x - circleRadius - 2;
    const arrowY = from.y;

    // Ligne principale
    page.drawLine({
      start: { x: arrowStartX, y: arrowY },
      end: { x: arrowEndX, y: arrowY },
      thickness: 2.5,
      color: STEP_COLORS[i + 1],
    });

    // Pointe de flèche
    const arrowSize = 7;
    const angle1 = Math.PI * 0.85;
    const angle2 = Math.PI * 1.15;

    const tipX = arrowEndX;
    const tipY = arrowY;

    const leftX = tipX - arrowSize * Math.cos(angle1);
    const leftY = tipY - arrowSize * Math.sin(angle1);

    const rightX = tipX - arrowSize * Math.cos(angle2);
    const rightY = tipY - arrowSize * Math.sin(angle2);

    page.drawLine({
      start: { x: tipX, y: tipY },
      end: { x: leftX, y: leftY },
      thickness: 2.5,
      color: STEP_COLORS[i + 1],
    });

    page.drawLine({
      start: { x: tipX, y: tipY },
      end: { x: rightX, y: rightY },
      thickness: 2.5,
      color: STEP_COLORS[i + 1],
    });
  }

  // === BOXES DE DESCRIPTION + CONNECTEURS ===
  STEPS_INFO.forEach((step, idx) => {
    const x = startX + idx * spacing;

    // Connecteur (ligne verticale du cercle à la box)
    page.drawLine({
      start: { x, y: circleY - circleRadius },
      end: { x, y: boxY + boxHeight },
      thickness: 1.5,
      color: STEP_COLORS[idx],
    });

    // Box de description
    page.drawRectangle({
      x: x - boxWidth / 2,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      color: COLORS.gray50,
      borderColor: STEP_COLORS[idx],
      borderWidth: 1.5,
    });

    // Texte wrappé dans la box
    const descLines = wrapTextByWidth(step.desc, boxWidth - 4, font, 6.8);
    let descLineY = boxY + boxHeight - 8;
    descLines.slice(0, 4).forEach((line) => {
      page.drawText(line, {
        x: x - boxWidth / 2 + 2,
        y: descLineY,
        size: 6.8,
        font,
        color: COLORS.black,
      });
      descLineY -= 8.5;
    });
  });

  return boxY - 25; // Retourner la position pour PHASES
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const params = await ctx.params;
    const { searchParams } = new URL(request.url);
    const ncIdParam = searchParams.get("ncId");

    const projectId = Number(params.id);
    const ncId = ncIdParam ? Number(ncIdParam) : NaN;

    if (!projectId || Number.isNaN(projectId) || !ncId || Number.isNaN(ncId)) {
      return new NextResponse("Paramètres invalides", { status: 400 });
    }

    const nc = await prisma.nonConformity.findUnique({ where: { id: ncId } });
    if (!nc) return new NextResponse("NC non trouvée", { status: 404 });

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return new NextResponse("Projet introuvable", { status: 404 });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 40;
    const contentWidth = pageWidth - 2 * margin;

    const ncRef = (nc as any).reference || `NC-${nc.id}`;
    const projNum = (project as any).projectNumber || `P-${projectId}`;

    function drawHeader(page: any, title: string, color: any, y: number) {
      page.drawRectangle({
        x: margin,
        y: y - 22,
        width: contentWidth,
        height: 22,
        color,
      });
      page.drawText(title, {
        x: margin + 12,
        y: y - 16,
        size: 12,
        font: fontBold,
        color: COLORS.white,
      });
      return y - 30;
    }

    function drawMethodologyAndInput(
      page: any,
      color: any,
      methodologyLines: string[],
      inputValue: string,
      y: number,
    ) {
      // Méthodologie
      const methodHeight = Math.min(65, 12 + methodologyLines.length * 10);
      page.drawRectangle({
        x: margin,
        y: y - methodHeight,
        width: contentWidth,
        height: methodHeight,
        color: COLORS.gray100,
        borderColor: color,
        borderWidth: 2,
      });

      let methY = y - 12;
      methodologyLines.forEach((line) => {
        page.drawText(line, {
          x: margin + 8,
          y: methY,
          size: 8,
          font,
          color: COLORS.black,
        });
        methY -= 10;
      });

      y -= methodHeight + 10;

      // Input/Saisie
      const inputHeight = 50;
      page.drawRectangle({
        x: margin,
        y: y - inputHeight,
        width: contentWidth,
        height: inputHeight,
        color: COLORS.gray50,
        borderColor: color,
        borderWidth: 2,
      });

      const inputLines = wrapTextByWidth(
        inputValue || "Responsable / pilote NC non renseigné",
        contentWidth - 16,
        font,
        9,
      );
      let inputY = y - 12;
      inputLines.slice(0, 4).forEach((line) => {
        page.drawText(line, {
          x: margin + 8,
          y: inputY,
          size: 9,
          font,
          color: COLORS.black,
        });
        inputY -= 11;
      });

      return y - inputHeight - 8;
    }

    // PAGE 1 - TITLE + INFO BOXES + ILLUSTRATION
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // === TITRE ===
    page.drawText("FICHE 8D - TRAITEMENT DE NON-CONFORMITÉ", {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: COLORS.darkBlue,
    });

    y -= 25;

    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + contentWidth, y },
      thickness: 2,
      color: COLORS.darkBlue,
    });

    y -= 20;

    // === SECTION NC / PROJET ===
    const col1X = margin;
    const col2X = margin + contentWidth / 2 + 10;
    const colW = contentWidth / 2 - 15;

    // NC Box
    page.drawText("N° NON-CONFORMITÉ", {
      x: col1X,
      y,
      size: 9,
      font: fontBold,
      color: COLORS.black,
    });

    y -= 12;

    page.drawRectangle({
      x: col1X,
      y: y - 35,
      width: colW,
      height: 35,
      color: COLORS.gray50,
      borderColor: COLORS.darkBlue,
      borderWidth: 2,
    });

    page.drawText(ncRef, {
      x: col1X + 8,
      y: y - 12,
      size: 14,
      font: fontBold,
      color: COLORS.darkBlue,
    });

    const ncDesc = (nc as any).description?.substring(0, 45) || "—";
    const ncDescLines = wrapTextByWidth(ncDesc, colW - 16, font, 7);
    let ncDescY = y - 24;
    ncDescLines.slice(0, 2).forEach((line) => {
      page.drawText(line, {
        x: col1X + 8,
        y: ncDescY,
        size: 7,
        font,
        color: COLORS.gray500,
      });
      ncDescY -= 9;
    });

    // Projet Box
    page.drawText("PROJET", {
      x: col2X,
      y: y + 12,
      size: 9,
      font: fontBold,
      color: COLORS.black,
    });

    page.drawRectangle({
      x: col2X,
      y: y - 35,
      width: colW,
      height: 35,
      color: COLORS.gray50,
      borderColor: COLORS.darkBlue,
      borderWidth: 2,
    });

    page.drawText(projNum, {
      x: col2X + 8,
      y: y - 12,
      size: 12,
      font: fontBold,
      color: COLORS.darkBlue,
    });

    const projTitle = (project as any).titleProject?.substring(0, 40) || "—";
    const projLines = wrapTextByWidth(projTitle, colW - 16, font, 7);
    let projY = y - 24;
    projLines.slice(0, 2).forEach((line) => {
      page.drawText(line, {
        x: col2X + 8,
        y: projY,
        size: 7,
        font,
        color: COLORS.gray500,
      });
      projY -= 9;
    });

    y -= 50;

    // === SECTION TIMELINE ===
    y -= 15;

    page.drawText("TIMELINE", {
      x: col1X,
      y,
      size: 9,
      font: fontBold,
      color: COLORS.black,
    });

    y -= 12;

    const timelineBoxes = [
      { label: "Détecté", value: formatDate((nc as any).detectedOn) },
      { label: "Échéance", value: formatDate((nc as any).dueDate) },
      { label: "État", value: ((nc as any).status || "—").toUpperCase() },
    ];

    const timelineBoxW = (contentWidth - 10) / 3;
    timelineBoxes.forEach((box, idx) => {
      const boxX = margin + idx * (timelineBoxW + 5);
      page.drawRectangle({
        x: boxX,
        y: y - 30,
        width: timelineBoxW,
        height: 28,
        color: COLORS.gray50,
        borderColor: STEP_COLORS[idx],
        borderWidth: 1.5,
      });

      page.drawText(box.label, {
        x: boxX + 6,
        y: y - 10,
        size: 8,
        font: fontBold,
        color: COLORS.darkBlue,
      });

      page.drawText(box.value, {
        x: boxX + 6,
        y: y - 22,
        size: 8,
        font,
        color: COLORS.black,
      });
    });

    y -= 45;

    // === SECTION ILLUSTRATION 8D - CENTRÉE ===
    y -= 15;

    page.drawText("PLAN DE TRAITEMENT 8D", {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: COLORS.darkBlue,
    });

    y -= 18;

    // Illustration - CENTRÉE sur la page
    const illustrationY = draw8DIllustration(
      page,
      margin + contentWidth / 2, // Centre horizontalement
      y - 40,
      18,
      font,
      fontBold,
    );

    y = illustrationY;

    // === PHASES LEGEND - Avec espacement ===
    y -= 20; // ESPACE vertical avant PHASES

    page.drawText("PHASES:", {
      x: margin,
      y,
      size: 9,
      font: fontBold,
      color: COLORS.black,
    });

    y -= 14;

    const phases = [
      { color: PHASE_COLORS.identification, label: "IDENTIFICATION (D1)" },
      { color: PHASE_COLORS.analyse, label: "ANALYSE (D2, D4)" },
      { color: PHASE_COLORS.actions, label: "ACTIONS (D3, D5, D7)" },
      { color: PHASE_COLORS.cloture, label: "CLÔTURE (D6, D8)" },
    ];

    phases.forEach((phase, idx) => {
      const xPos = margin + (idx % 2) * (contentWidth / 2 + 5);
      const yPos = y - Math.floor(idx / 2) * 16;

      page.drawRectangle({
        x: xPos,
        y: yPos - 10,
        width: 12,
        height: 12,
        color: phase.color,
      });

      page.drawText(phase.label, {
        x: xPos + 18,
        y: yPos - 6,
        size: 8,
        font,
        color: COLORS.black,
      });
    });

    drawPageFooter(page, 1, 4, ncRef, projNum, margin, contentWidth, font);

    // PAGE 2 - D1, D2, D3
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    y = drawHeader(page, "D1 - CONSTITUTION DE L'ÉQUIPE", STEP_COLORS[0], y);

    const d1Items = [
      "• Pilote 8D / Responsable de l'équipe",
      "• Constitution : dans les 2 jours après détection",
      "• Membres : Expert technique, Manager, Client si pertinent",
      "• Rôles définis : Analyse, brainstorming, validation",
      "• Résultat : Équipe formelle tracée",
    ];

    y = drawMethodologyAndInput(
      page,
      STEP_COLORS[0],
      d1Items,
      (nc as any).detectedBy || "",
      y,
    );

    y -= 15;

    y = drawHeader(page, "D2 - DESCRIPTION DÉTAILLÉE DU PROBLÈME", STEP_COLORS[1], y);

    const d2Items = [
      "• QUOI : Nature exacte du problème détecté",
      "• OÙ : Localisation, phase projet, module impacté",
      "• QUAND : Date/période de détection",
      "• COMBIEN : Amplitude, quantité d'objets impactés",
      "• EXIGENCES : Standards, contrats, réglementations violées",
    ];

    y = drawMethodologyAndInput(
      page,
      STEP_COLORS[1],
      d2Items,
      (nc as any).description || "",
      y,
    );

    y -= 15;

    y = drawHeader(page, "D3 - ACTIONS IMMÉDIATES (CURATIVES)", STEP_COLORS[2], y);

    const d3Items = [
      "• Objectif : Sécuriser client/exploitation (3 jours)",
      "• Mise en quarantaine / isolement",
      "• Contournement temporaire approuvé",
      "• Rollback ou restauration de version",
      "• Notification client + plan de continuation",
    ];

    y = drawMethodologyAndInput(
      page,
      STEP_COLORS[2],
      d3Items,
      (nc as any).immediateAction || "",
      y,
    );

    drawPageFooter(page, 2, 4, ncRef, projNum, margin, contentWidth, font);

    // PAGE 3 - D4, D5, D6
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    y = drawHeader(page, "D4 - CAUSES RACINES (5 POURQUOI / ISHIKAWA)", STEP_COLORS[3], y);

    const d4Items = [
      "• Méthode : Poser « Pourquoi ? » 5 fois successives",
      "• Main d'oeuvre : Compétences, formation",
      "• Méthodes : Processus, procédures, documentation",
      "• Moyens : Outils, équipements, infrastructure",
      "• Matériaux : Qualité fournisseur, spécifications",
    ];

    y = drawMethodologyAndInput(
      page,
      STEP_COLORS[3],
      d4Items,
      (nc as any).rootCause || "",
      y,
    );

    y -= 15;

    y = drawHeader(page, "D5 - ACTIONS CORRECTIVES", STEP_COLORS[4], y);

    const d5Items = [
      "• QUI FAIT QUOI : Assigner responsable + rôle",
      "• DÉLAI : Fixer échéance réaliste et validée",
      "• LIVRABLES : Résultat attendu (document, code, formation)",
      "• CRITÈRES DE RÉUSSITE : Comment valider le succès",
    ];

    y = drawMethodologyAndInput(
      page,
      STEP_COLORS[4],
      d5Items,
      (nc as any).correctiveAction || "",
      y,
    );

    y -= 15;

    y = drawHeader(page, "D6 - MISE EN OEUVRE & VALIDATION", STEP_COLORS[5], y);

    const d6Items = [
      "• Périmètre : Projets/équipes concernés",
      "• Réalisation : Ce qui a été fait, par qui, quand",
      "• Validation non-récurrence :",
      "• Indicateurs mesurés (défauts, délais, satisfaction)",
    ];

    y = drawMethodologyAndInput(
      page,
      STEP_COLORS[5],
      d6Items,
      (nc as any).validationResults || "",
      y,
    );

    drawPageFooter(page, 3, 4, ncRef, projNum, margin, contentWidth, font);

    // PAGE 4 - D7, D8, BILAN
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    y = drawHeader(page, "D7 - ACTIONS PRÉVENTIVES", STEP_COLORS[6], y);

    const d7Items = [
      "• Périmètre : Autres projets/processus impactés",
      "• Mise à jour référentiels, modèles, templates",
      "• Formations/sensibilisations équipes",
      "• Automatisation, poka-yoke (détection erreur)",
      "• Ajout contrôles qualité / checkpoints",
    ];

    y = drawMethodologyAndInput(
      page,
      STEP_COLORS[6],
      d7Items,
      (nc as any).preventiveAction || "",
      y,
    );

    y -= 15;

    y = drawHeader(page, "D8 - CLÔTURE & CAPITALISATION", STEP_COLORS[7], y);

    const d8Items = [
      "• Validation : Accord Qualité + Management",
      "• Leçons apprises pour équipe/organisation",
      "• Améliorations processus identifiées",
      "• Points vigilance à maintenir",
      "• Documentation base de connaissances / REX",
    ];

    y = drawMethodologyAndInput(
      page,
      STEP_COLORS[7],
      d8Items,
      (nc as any).lessonsLearned || "",
      y,
    );

    y -= 15;

    y = drawHeader(page, "BILAN D'EXPERT QUALITÉ", COLORS.darkBlue, y);

    const bilanData = generateBilanExpert(nc, project);
    const bilanBoxHeight = 90;

    page.drawRectangle({
      x: margin,
      y: y - bilanBoxHeight,
      width: contentWidth,
      height: bilanBoxHeight,
      color: COLORS.gray50,
      borderColor: COLORS.darkBlue,
      borderWidth: 2,
    });

    let bilanY = y - 14;
    bilanData.forEach((item) => {
      page.drawText(item, {
        x: margin + 10,
        y: bilanY,
        size: 8,
        font,
        color: COLORS.black,
      });
      bilanY -= 12;
    });

    drawPageFooter(page, 4, 4, ncRef, projNum, margin, contentWidth, font);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes) as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Fiche8D_${ncRef}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur export NC PDF:", error);
    return new NextResponse("Erreur generation PDF", { status: 500 });
  }
}

function generateBilanExpert(nc: any, project: any): string[] {
  const ncRef = nc.reference || `NC-${nc.id}`;
  const projNum = (project as any).projectNumber || `P-${project.id}`;
  const severity = nc.severity || "Non définie";
  const detectedDate = formatDate(nc.detectedOn);
  const dueDate = formatDate(nc.dueDate);

  const items: string[] = [];

  items.push(`• NC ${ncRef} | Projet ${projNum} | Sévérité: ${severity}`);
  items.push(`• Détectée: ${detectedDate} | Échéance: ${dueDate}`);

  if (nc.status === "Clôturé") {
    const closedDate = formatDate(nc.closedDate);
    items.push(`• STATUT: CLÔTURÉE (${closedDate})`);
    items.push("• Toutes étapes 8D complétées avec succès");
    items.push("• Analyse exhaustive (D1-D4) et actions correctives (D5)");
    items.push("• Efficacité validée (D6) et prévention systématisée (D7-D8)");
    items.push("• Enseignements capitalisés - Dossier fermé");
  } else if (nc.status === "En cours") {
    items.push("• STATUT: EN COURS DE TRAITEMENT");
    items.push("• Analyse 8D engagée - Actions curatives déployées");
    items.push("• Causes sous investigation (D2-D4)");
    items.push("• Plan de correction en définition (D5)");
    items.push("• Suivi régulier recommandé");
  } else {
    items.push("• STATUT: OUVERTE");
    items.push("• Constitution équipe 8D prioritaire (D1)");
    items.push("• Analyse détaillée requise (D2, D4)");
    items.push("• Plan d'actions à développer (D5)");
    items.push("• Suivi hebdomadaire conseillé");
  }

  return items;
}
