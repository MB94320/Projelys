import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");
  const projectId = idParam ? Number(idParam) : NaN;

  if (!projectId || Number.isNaN(projectId)) {
    return new NextResponse("Paramètre id manquant ou invalide", {
      status: 400,
    });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: true },
  });

  if (!project) {
    return new NextResponse("Projet introuvable", { status: 404 });
  }

  // ----- Création du PDF avec pdf-lib -----
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 800;
  const left = 50;

  const drawText = (text: string, size = 12, color = rgb(0, 0, 0)) => {
    page.drawText(text, {
      x: left,
      y,
      size,
      font,
      color,
    });
    y -= size + 4;
  };

  // Titre
  drawText("Fiche projet", 20);
  y -= 10;

  // Infos principales
  drawText(`N° projet : ${project.projectNumber ?? "-"}`);
  drawText(`Intitulé : ${project.titleProject ?? "-"}`);
  drawText(`Client : ${project.clientName ?? "-"}`);
  drawText(`Chef de projet : ${project.projectManagerName ?? "-"}`);
  drawText(`Statut : ${project.status ?? "-"}`);
  drawText(`Criticité : ${project.riskCriticality ?? "-"}`);
  drawText(
    `Avancement : ${project.progressPercent ?? 0} %`,
  );
  drawText(
    `Date de début : ${
      project.startDate
        ? new Date(project.startDate).toLocaleDateString("fr-FR")
        : "-"
    }`,
  );
  drawText(
    `Date d'échéance : ${
      project.estimatedDate
        ? new Date(project.estimatedDate).toLocaleDateString("fr-FR")
        : "-"
    }`,
  );

  y -= 10;
  drawText("Tâches (résumé)", 14);

  const tasks = project.tasks as any[];
  if (tasks.length === 0) {
    drawText("Aucune tâche renseignée.");
  } else {
    tasks.slice(0, 25).forEach((t, idx) => {
      const line = `${idx + 1}. ${t.title ?? "Sans titre"} – ${
        t.assigneeName ?? "Non affectée"
      } – ${t.progressPercent ?? 0} %`;
      // retour à la page suivante si on est trop bas
      if (y < 60) {
        y = 800;
        pdfDoc.addPage(page);
      }
      drawText(line, 10);
    });
  }

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(Buffer.from(pdfBytes) as any, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="projet-${project.projectNumber ?? projectId}.pdf"`,
    },
  });
}
