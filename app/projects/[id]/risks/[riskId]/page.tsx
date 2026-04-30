import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import AppShell from "@/app/components/AppShell";
import type { Project, Risk } from "@prisma/client";
import RiskDetailClient from "./RiskDetailClient";

type PageProps = {
  params: Promise<{ id: string; riskId: string }>;
};

export const dynamic = "force-dynamic";

export default async function RiskDetailPage({ params }: PageProps) {
  const { id, riskId } = await params;
  const projectId = Number(id);
  const rId = Number(riskId);

  if (!projectId || Number.isNaN(projectId) || !rId || Number.isNaN(rId)) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    notFound();
  }

  const risk = await prisma.risk.findUnique({
    where: { id: rId },
  });

  if (!risk || risk.projectId !== projectId) {
    notFound();
  }

  const p: any = project;
  const r: any = risk;

  return (
    <AppShell
      activeSection="risk"
      pageTitle={`Fiche risque / opportunité – ${p.projectNumber ?? ""}`}
      pageSubtitle={p.titleProject ?? ""}
    >
      <RiskDetailClient
        projectId={project.id}
        projectNumber={p.projectNumber ?? ""}
        projectTitle={p.titleProject ?? ""}
        projectStatus={p.status ?? ""}
        risk={risk}
      />
    </AppShell>
  );
}
