// app/_data/projects.ts

export type ProjectStatus = "Planifié" | "En cours" | "Terminé" | "Annulé";
export type ProjectRisk = "Négligeable" | "Significatif" | "Critique" | "Inacceptable";

export type Project = {
  id: string;
  projectNumber: string;
  clientName: string;
  projectManagerName: string;
  label: string;
  estimatedDate: string;
  startDate?: string;
  progressPercent: number;
  status: ProjectStatus;
  riskCriticality: ProjectRisk;

  // Champs pour lien avec plan de charge / performance
  plannedLoadDays?: number;      // charge prévue en jours.hommes
  consumedLoadDays?: number;     // charge consommée
  tasksCount?: number;           // nombre de tâches projet
  deliverablesCount?: number;    // nombre de livrables suivis
};

export const projects: Project[] = [
  {
    id: "p-2025-001",
    projectNumber: "P-2025-001",
    clientName: "Client A",
    projectManagerName: "Dupont",
    label: "Migration système X",
    startDate: "06/01/2025",
    estimatedDate: "31/12/2025",
    progressPercent: 45,
    status: "En cours",
    riskCriticality: "Significatif",
    plannedLoadDays: 120,
    consumedLoadDays: 40,
    tasksCount: 25,
    deliverablesCount: 8,
  },
  {
    id: "p-2025-002",
    projectNumber: "P-2025-002",
    clientName: "Client B",
    projectManagerName: "Martin",
    label: "Nouveau produit Z",
    startDate: "20/02/2025",
    estimatedDate: "30/06/2026",
    progressPercent: 10,
    status: "Planifié",
    riskCriticality: "Critique",
    plannedLoadDays: 200,
    consumedLoadDays: 10,
    tasksCount: 40,
    deliverablesCount: 12,
  },
  {
    id: "p-2024-010",
    projectNumber: "P-2024-010",
    clientName: "Client C",
    projectManagerName: "Durand",
    label: "Refonte site web",
    startDate: "15/01/2024",
    estimatedDate: "15/09/2024",
    progressPercent: 100,
    status: "Terminé",
    riskCriticality: "Négligeable",
    plannedLoadDays: 80,
    consumedLoadDays: 78,
    tasksCount: 18,
    deliverablesCount: 6,
  },
  {
    id: "p-2025-005",
    projectNumber: "P-2025-005",
    clientName: "Client D",
    projectManagerName: "Leroy",
    label: "Implémentation ERP",
    startDate: "01/03/2025",
    estimatedDate: "31/03/2026",
    progressPercent: 35,
    status: "En cours",
    riskCriticality: "Inacceptable",
    plannedLoadDays: 300,
    consumedLoadDays: 90,
    tasksCount: 55,
    deliverablesCount: 20,
  },
];
