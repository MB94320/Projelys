// app/projects/[id]/page.tsx
import AppShell from "../../components/AppShell";
import { prisma } from "@/app/lib/prisma";
import ProjectPageClient from "./ProjectPageClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);

  if (!projectId || Number.isNaN(projectId)) {
    return (
      <AppShell
        activeSection="projects"
        pageTitle="Projet introuvable"
        pageSubtitle="Identifiant invalide."
      >
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          L’identifiant de projet est invalide.
        </div>
      </AppShell>
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: true,
      risks: true,
    },
  });

  if (!project) {
    return (
      <AppShell
        activeSection="projects"
        pageTitle="Projet introuvable"
        pageSubtitle="Le projet demandé n'existe pas ou a été supprimé."
      >
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          Aucun projet trouvé pour l'identifiant {id}.
        </div>
        <div className="mt-3">
          <a
            href="/projects"
            className="text-xs text-indigo-600 underline"
          >
            Retour au portefeuille
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeSection="projects"
      pageTitle={
        project.titleProject ?? project.projectNumber ?? "Fiche projet"
      }
      pageSubtitle={`${project.projectNumber ?? ""}${
        project.clientName ? ` · ${project.clientName}` : ""
      }${
        project.projectManagerName
          ? ` · ${project.projectManagerName}`
          : ""
      }`}
    >
      <ProjectPageClient project={project} />
    </AppShell>
  );
}
