import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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

  const html = generateProjectHTML(project);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

// Adapté à ta fiche projet actuelle
function generateProjectHTML(project: any): string {
  const today = new Date();
  const tasks = (project.tasks as any[]) ?? [];

  // --- DATES & CHARGES À PARTIR DES TÂCHES ---
  const allTaskDates: Date[] = tasks
    .flatMap((t: any) => [
      t.startDate ? new Date(t.startDate) : null,
      t.endDate ? new Date(t.endDate) : null,
    ])
    .filter((d: any): d is Date => d !== null);

  const startDateFromTasks: Date | null =
    allTaskDates.length > 0
      ? new Date(Math.min(...allTaskDates.map((d) => d.getTime())))
      : null;

  const endDateFromTasks: Date | null =
    allTaskDates.length > 0
      ? new Date(Math.max(...allTaskDates.map((d) => d.getTime())))
      : null;

  const start: Date | null =
    startDateFromTasks ??
    (project.startDate ? new Date(project.startDate) : null);

  const end: Date | null =
    endDateFromTasks ??
    (project.estimatedDate ? new Date(project.estimatedDate) : null);

  const plannedHours: number =
    tasks.reduce(
      (s: number, t: any) => s + (t.plannedWorkHours ?? 0),
      0,
    ) || 0;

  const consumedHours: number =
    tasks.reduce(
      (s: number, t: any) => s + (t.consumedWorkHours ?? 0),
      0,
    ) || 0;

  const remainingHours = plannedHours - consumedHours;

  const totalDurationDays: number | null =
    start && end
      ? Math.max(
          1,
          Math.round(
            (end.getTime() - start.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : null;

  const elapsedDays: number | null =
    start && totalDurationDays
      ? Math.min(
          totalDurationDays,
          Math.max(
            0,
            Math.round(
              (today.getTime() - start.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          ),
        )
      : null;

  const elapsedRatio: number | null =
    totalDurationDays && elapsedDays
      ? Math.round((elapsedDays / totalDurationDays) * 100)
      : null;

  // --- AVANCEMENT PONDÉRÉ ---
  const totalPlannedForProgress = tasks.reduce(
    (s: number, t: any) => s + (t.plannedWorkHours ?? 0),
    0,
  );

  const weightedProgress: number =
    totalPlannedForProgress > 0
      ? Math.round(
          tasks.reduce(
            (s: number, t: any) =>
              s +
              (t.progressPercent ?? 0) *
                (t.plannedWorkHours ?? 0),
            0,
          ) / totalPlannedForProgress,
        )
      : project.progressPercent ?? 0;

  const progress = weightedProgress;
  const progressVsTimeDelta: number | null =
    elapsedRatio !== null ? progress - elapsedRatio : null;

  // --- COURBE EN S (KPI) ---
  const loadProgress: number =
    plannedHours > 0
      ? Math.round((consumedHours / plannedHours) * 100)
      : 0;

  const sCurveDelta: number = progress - loadProgress;

  let sCurveKpiLabel =
    "Valeur créée cohérente avec la charge consommée.";
  if (plannedHours > 0) {
    if (sCurveDelta >= 5) {
      sCurveKpiLabel =
        "Valeur créée supérieure à la charge consommée (tendance favorable).";
    } else if (sCurveDelta <= -5) {
      sCurveKpiLabel =
        "Charge consommée supérieure à la valeur créée (risque de dérive coûts / délais).";
    }
  }

  let sCurveMessage =
    "Données insuffisantes pour analyser la courbe en S.";
  if (plannedHours > 0) {
    if (sCurveDelta >= 5) {
      sCurveMessage =
        "Le projet crée plus de valeur que la charge consommée : tendance favorable (valeur acquise au-dessus des coûts réels).";
    } else if (sCurveDelta <= -5) {
      sCurveMessage =
        "Le projet consomme plus de charge que la valeur créée : risque de dérive coûts / délais, surveiller les écarts.";
    } else {
      sCurveMessage =
        "Valeur créée cohérente avec la charge consommée : situation globalement maîtrisée.";
    }
  }

  // --- RISQUE ÉLEVÉ ---
  const hasHighRisk =
    project.riskCriticality === "Critique" ||
    project.riskCriticality === "Inacceptable";

  // --- RECOMMANDATIONS ---
  const recommendations: string[] = [];
  const hasDelay =
    progressVsTimeDelta !== null && progressVsTimeDelta <= -5;

  if (hasDelay) {
    recommendations.push(
      "Projet en retard par rapport au temps écoulé : analyser la charge, ajuster les priorités ou revoir la date d’échéance.",
    );
  }
  if (hasHighRisk) {
    recommendations.push(
      "Risque élevé : prévoir un point spécifique en comité, formaliser un plan de mitigation et des actions dans le plan d’actions.",
    );
  }
  if (remainingHours < 0) {
    recommendations.push(
      "Surconsommation de charge : vérifier le périmètre, renégocier éventuellement le budget ou réallouer des ressources.",
    );
  }
  if (recommendations.length === 0) {
    if (project.comments && project.comments.trim().length > 0) {
      recommendations.push(project.comments.trim());
    } else {
      recommendations.push(
        "Aucune alerte majeure détectée sur ce projet. Continuer le pilotage régulier et la mise à jour des données.",
      );
    }
  }

  const revenue = 0;
  const costs = 0;
  const margin = revenue - costs;
  const marginRate =
    revenue > 0 ? Math.round((margin / revenue) * 100) : null;

  const statusLabel = project.status ?? "Non renseigné";
  const riskLabel = project.riskCriticality ?? "Non renseigné";

  // Limiter le nombre de tâches pour tenir sur 2 pages
  const tasksForPdf = tasks.slice(0, 20);

  const comments = (project.comments || "") as string;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Fiche Projet ${project.projectNumber ?? ""}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f3f4f6;
      padding: 20px;
    }
    .pdf-container {
      width: 210mm;
      height: 297mm;
      background: #ffffff;
      padding: 15mm;
      margin: 0 auto 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.08);
      page-break-after: always;
      position: relative;
    }
    h1 {
      font-size: 22px;
      color: #111827;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .badge-row {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-bottom: 16px;
      font-size: 11px;
      color: #6b7280;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
    }
    .badge-status { background: #e0f2fe; color: #0369a1; }
    .badge-risk { background: #dcfce7; color: #166534; }

    h2 {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      margin-top: 16px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 10px;
      font-size: 11px;
    }
    .info-item {
      background: #f9fafb;
      border-radius: 6px;
      padding: 8px;
      border: 1px solid #e5e7eb;
    }
    .info-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 3px;
    }
    .info-value {
      font-size: 12px;
      color: #111827;
      font-weight: 500;
    }

    .kpi-row {
      display: grid;
      grid-template-columns: 1.1fr 1fr 1fr;
      gap: 10px;
      margin-top: 6px;
      margin-bottom: 8px;
    }
    .card {
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      padding: 10px;
      font-size: 11px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 6px;
    }

    .circular-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .circular {
      width: 70px;
      height: 70px;
      border-radius: 999px;
      background: conic-gradient(
        #22c55e 0deg ${progress * 3.6}deg,
        #e5e7eb ${progress * 3.6}deg 360deg
      );
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .circular::after {
      content: "${progress}%";
      position: absolute;
      width: 54px;
      height: 54px;
      border-radius: 999px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      color: #16a34a;
    }
    .circular-caption {
      font-size: 10px;
      color: #6b7280;
    }

    .planning-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      font-size: 10px;
      color: #4b5563;
    }
    .planning-label { font-size: 10px; color: #6b7280; }
    .planning-value { font-size: 11px; font-weight: 500; color: #111827; }

    .kpi-charge {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kpi-charge-line {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      font-size: 10px;
    }
    .kpi-charge-value {
      font-size: 12px;
      font-weight: 600;
      color: #111827;
    }

    .comments-box {
      background: #fefce8;
      border-radius: 6px;
      border: 1px solid #facc15;
      padding: 8px;
      font-size: 10px;
      color: #4b5563;
      line-height: 1.5;
      margin-top: 4px;
    }

    .section-grid-3 {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1.2fr;
      gap: 10px;
      margin-top: 6px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-top: 6px;
    }
    thead { background: #f3f4f6; }
    th, td {
      padding: 6px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    th { font-weight: 600; color: #374151; }
    td { color: #111827; }

    .status-badge-table {
      display: inline-flex;
      padding: 2px 6px;
      border-radius: 999px;
      font-size: 9px;
      background: #e0f2fe;
      color: #0369a1;
    }

    .small {
      font-size: 9px;
      color: #6b7280;
    }

    @media print {
      body { padding: 0; background: #ffffff; }
      .pdf-container { margin: 0; box-shadow: none; }
    }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>

<!-- PAGE 1 -->
<div class="pdf-container">
  <h1>${project.titleProject ?? "Fiche projet"}</h1>
  <div class="subtitle">
    ${(project.projectNumber ?? "")}${
      project.clientName ? " · " + project.clientName : ""
    }${
      project.projectManagerName ? " · " + project.projectManagerName : ""
    }
  </div>

  <div class="badge-row">
    <span>Fiche projet</span>
    <span class="badge badge-status">${statusLabel}</span>
    <span class="badge badge-risk">Criticité : ${riskLabel}</span>
  </div>

  <h2>Synthèse du projet</h2>
  <div class="kpi-row">
    <div class="card">
      <div class="card-title">Avancement</div>
      <div class="circular-wrap">
        <div class="circular"></div>
        <div class="circular-caption">Avancement global du projet</div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Cadre planning</div>
      <div class="planning-row">
        <div>
          <div class="planning-label">Date de début</div>
          <div class="planning-value">
            ${
              start
                ? start.toLocaleDateString("fr-FR")
                : "-"
            }
          </div>
        </div>
        <div>
          <div class="planning-label">Date d’échéance</div>
          <div class="planning-value">
            ${
              end
                ? end.toLocaleDateString("fr-FR")
                : "-"
            }
          </div>
        </div>
      </div>
      <div class="small" style="margin-top:6px;">
        ${
          totalDurationDays !== null
            ? "Durée totale estimée : " + totalDurationDays + " jours"
            : "Durée totale non renseignée."
        }
      </div>
      <div class="small">
        ${
          elapsedDays !== null && elapsedRatio !== null
            ? "Jours écoulés : " + elapsedDays + " (" + elapsedRatio + " %)"
            : "Jours écoulés non calculables."
        }
      </div>
    </div>

    <div class="card">
      <div class="card-title">Charges & S‑curve</div>
      <div class="kpi-charge">
        <div class="kpi-charge-line">
          <span>Charge prévue</span>
          <span class="kpi-charge-value">${plannedHours} h</span>
        </div>
        <div class="kpi-charge-line">
          <span>Charge consommée</span>
          <span class="kpi-charge-value">${consumedHours} h</span>
        </div>
        <div class="kpi-charge-line">
          <span>Courbe en S (Δ)</span>
          <span class="kpi-charge-value">
            ${sCurveDelta > 0 ? "+" : ""}${sCurveDelta} pts
          </span>
        </div>
        <div class="small" style="margin-top:4px;">
          ${sCurveKpiLabel}
        </div>
      </div>
    </div>
  </div>

  <h2>Synthèse & recommandations</h2>
  <div class="comments-box">
    <ul style="padding-left: 16px; margin: 0; list-style: disc;">
      ${recommendations.map((rec) => `<li>${rec}</li>`).join("")}
    </ul>
  </div>

  <h2>Analyse automatique (courbe en S)</h2>
  <div class="comments-box">
    ${sCurveMessage}
  </div>
</div>

<!-- PAGE 2 -->
<div class="pdf-container">
  <h2>Données financières & risques</h2>
  <div class="section-grid-3">
    <div class="card">
      <div class="card-title">Finances (AVV)</div>
      <div class="small" style="margin-bottom:4px;">
        Données à enrichir lorsque l’AVV sera branché.
      </div>
      <table>
        <tr>
          <td class="small">Revenu</td>
          <td style="text-align:right;">${revenue.toLocaleString("fr-FR")} €</td>
        </tr>
        <tr>
          <td class="small">Coûts</td>
          <td style="text-align:right;">${costs.toLocaleString("fr-FR")} €</td>
        </tr>
        <tr>
          <td class="small">Marge</td>
          <td style="text-align:right;">${margin.toLocaleString("fr-FR")} €</td>
        </tr>
        <tr>
          <td class="small">Taux de marge</td>
          <td style="text-align:right;">
            ${marginRate !== null ? marginRate + " %" : "N/A"}
          </td>
        </tr>
      </table>
    </div>

    <div class="card">
      <div class="card-title">Statut & risque</div>
      <table>
        <tr>
          <td class="small">Statut</td>
          <td style="text-align:right;">${statusLabel}</td>
        </tr>
        <tr>
          <td class="small">Criticité</td>
          <td style="text-align:right;">${riskLabel}</td>
        </tr>
        ${
          progressVsTimeDelta !== null
            ? `
        <tr>
          <td class="small">Avancement vs temps</td>
          <td style="text-align:right;">
            ${progressVsTimeDelta > 0 ? "+" : ""}${progressVsTimeDelta} pts
          </td>
        </tr>
        `
            : ""
        }
      </table>
    </div>

    <div class="card">
      <div class="card-title">Commentaires</div>
      <div class="comments-box">
        ${
          comments.trim()
            ? comments.split("\\n").join("<br />")
            : "Aucun commentaire saisi."
        }
      </div>
    </div>
  </div>

  <h2 style="margin-top:14px;">Tâches principales (${tasksForPdf.length}${
    tasks.length > tasksForPdf.length ? " / " + tasks.length : ""
  })</h2>
  <table>
    <thead>
      <tr>
        <th>Tâche</th>
        <th>Responsable</th>
        <th>Prévu (h)</th>
        <th>Consommé (h)</th>
        <th>Avancement</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      ${
        tasksForPdf
          .map(
            (t: any) => `
        <tr>
          <td>${t.title ?? "Sans titre"}</td>
          <td>${t.assigneeName ?? "Non affectée"}</td>
          <td style="text-align:center;">${t.plannedWorkHours ?? "-"} h</td>
          <td style="text-align:center;">${t.consumedWorkHours ?? "-"} h</td>
          <td style="text-align:center;">${t.progressPercent ?? 0}%</td>
          <td><span class="status-badge-table">${t.status ?? "-"}</span></td>
        </tr>
      `,
          )
          .join("")
      }
    </tbody>
  </table>
</div>

</body>
</html>
  `;
}
