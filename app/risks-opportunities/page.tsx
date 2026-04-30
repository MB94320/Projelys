import AppShell from "../components/AppShell";
import { prisma } from "@/app/lib/prisma";
import GlobalRisksClient from "./GlobalRisksClient";

export const dynamic = "force-dynamic";

export default async function GlobalRisksPage() {
  const risks = await prisma.risk.findMany({
    include: {
      project: {
        select: {
          id: true,
          projectNumber: true,
          titleProject: true,
          clientName: true,
          projectManagerName: true,
        },
      },
    },
  });

  return (
    <AppShell
        activeSection="risk" // <-- clé existante dans SectionKey
        pageTitle="Risques & opportunités"
        pageSubtitle="Vue consolidée de l’ensemble des risques et opportunités,
          tous projets confondus."
        >
        <GlobalRisksClient risks={risks} />
    </AppShell>
  );
}
