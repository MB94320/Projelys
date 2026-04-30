import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import AppShell from "../../../components/AppShell";
import ProjectGanttClient from "./ProjectGanttClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProjectGanttPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = Number(id);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: {
        orderBy: { startDate: "asc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const hasTasks = project.tasks && project.tasks.length > 0;

  return (
    <AppShell
      activeSection="projects"
      pageTitle={
        project.titleProject ??
        project.projectNumber ??
        "Gantt du projet"
      }
      pageSubtitle={`${project.projectNumber ?? ""}${
        project.clientName ? ` · ${project.clientName}` : ""
      }${project.projectManagerName ? ` · ${project.projectManagerName}` : ""}`}
    >
      <div className="mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${id}`}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50"
          >
            ← Retour fiche projet
          </Link>
        </div>
        <div className="text-slate-500">
          Vue Gantt du projet
        </div>
      </div>

      {!hasTasks ? (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h1 className="text-sm font-semibold mb-2">
            Gantt – aucune tâche définie
          </h1>
          <p className="text-xs text-slate-600 mb-3">
            Aucune tâche n’est encore renseignée pour ce projet. Ajoute
            des tâches depuis la fiche projet pour visualiser le planning.
          </p>
          <Link
            href={`/projects/${id}`}
            className="text-xs text-indigo-600 underline"
          >
            Aller à la fiche projet
          </Link>
        </div>
      ) : (
        <ProjectGanttClient project={project} />
      )}
    </AppShell>
  );
}
