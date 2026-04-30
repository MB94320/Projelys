// app/projects/[id]/quality/non-conformities/8d/page.tsx
import AppShell from "@/app/components/AppShell";

type Props = { params: { id: string } };

export default function Nc8DPage({ params }: Props) {
  const projectId = Number(params.id);

  return (
    <AppShell
      activeSection="projects"
      pageTitle={`Fiche 8D – projet ${projectId}`}
      pageSubtitle="Détail de la non-conformité et plan 8D"
    >
      <div className="p-6 text-sm">
        Fiche 8D à concevoir ici (édition détaillée de la NC sélectionnée).
      </div>
    </AppShell>
  );
}
