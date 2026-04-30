import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import AppShell from "@/app/components/AppShell";
import ProjectRisksClient from "./ProjectRisksClient";
import type { Project, Risk } from "@prisma/client";

type PageProps = {
  params: Promise<{ id: string }>;
};

type ProjectWithRisks = Project & { risks: Risk[] };

export const dynamic = "force-dynamic";

export default async function ProjectRisksPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);

  if (!projectId || Number.isNaN(projectId)) {
    notFound();
  }

  const projectRaw = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      risks: true,
    },
  });

  if (!projectRaw) {
    notFound();
  }

  const project = projectRaw as ProjectWithRisks;
  const p: any = project;

  return (
    <AppShell
      activeSection="risk"
      pageTitle={`Risques & opportunités – ${p.projectNumber ?? ""} ${
        p.titleProject ?? ""
      }`}
      pageSubtitle={p.clientName ?? undefined}
    >
      <ProjectRisksClient
        projectId={project.id}
        projectNumber={p.projectNumber ?? ""}
        projectTitle={p.titleProject ?? ""}
        projectStatus={p.status ?? ""}
        projectRiskCriticality={p.riskCriticality ?? null}
        initialRisks={project.risks}
      />
    </AppShell>
  );
}
