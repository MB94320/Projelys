import { prisma } from "@/app/lib/prisma";
import AppShell from "../components/AppShell";
import ProjectsClient from "./ProjectsClient";


export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      activeSection="projects"
      pageTitle="Portefeuille des projets"
      pageSubtitle="Vue d'ensemble des projets avec filtres, indicateurs et timeline."
    >
      {/* Ici on laisse toute l'intelligence UI côté client */}
      <ProjectsClient initialProjects={projects} />
    </AppShell>
  );
}
