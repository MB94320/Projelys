// app/projects/[id]/quality/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import ProjectQualityClient from "./ProjectQualityClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectQualityPage({ params }: Props) {
  // ⬇⬇⬇ IMPORTANT : on attend la Promise
  const { id } = await params;
  const projectId = Number(id);
  if (!projectId) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) notFound();

  return <ProjectQualityClient projectId={projectId} />;
}
