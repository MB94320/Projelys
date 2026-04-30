// app/_data/projectTasks.ts

export type TaskStatus = "Planifiée" | "En cours" | "Terminée";

export type ProjectTask = {
  id: string;
  projectId: string;
  name: string;
  start: string;
  end: string;
  progressPercent: number;
  status: TaskStatus;
  dependsOn?: string;
  owner?: string;         // ← nouveau : responsable / ressource principale
};

export const projectTasks: ProjectTask[] = [
  {
    id: "t-001-01",
    projectId: "p-2025-001",
    name: "Cadrage & périmètre",
    start: "2025-01-06",
    end: "2025-01-17",
    progressPercent: 100,
    status: "Terminée",
    owner: "Dupont",      
  },
  {
    id: "t-001-02",
    projectId: "p-2025-001",
    name: "Conception détaillée",
    start: "2025-01-20",
    end: "2025-02-07",
    progressPercent: 60,
    status: "En cours",
    dependsOn: "t-001-01",
    owner: "Martin",
  },
  {
    id: "t-001-03",
    projectId: "p-2025-001",
    name: "Développement",
    start: "2025-02-10",
    end: "2025-03-14",
    progressPercent: 30,
    status: "En cours",
    dependsOn: "t-001-02",
    owner: "Equipe dev",
  },
  {
    id: "t-001-04",
    projectId: "p-2025-001",
    name: "Recette & validation",
    start: "2025-03-17",
    end: "2025-04-04",
    progressPercent: 0,
    status: "Planifiée",
    dependsOn: "t-001-03",
    owner: "QA",
  },
  {
    id: "t-001-05",
    projectId: "p-2025-001",
    name: "Mise en production",
    start: "2025-04-07",
    end: "2025-04-18",
    progressPercent: 0,
    status: "Planifiée",
    dependsOn: "t-001-04",
    owner: "Ops",
  },

  {
    id: "t-002-01",
    projectId: "p-2025-002",
    name: "Avant-projet",
    start: "2025-03-24",
    end: "2025-04-14",
    progressPercent: 80,
    status: "En cours",
    owner: "Dupont",
  },
  {
    id: "t-002-02",
    projectId: "p-2025-002",
    name: "Spécifications",
    start: "2025-04-20",
    end: "2025-06-07",
    progressPercent: 0,
    status: "Planifiée",
    dependsOn: "t-002-01",
    owner: "Martin",
  },
];
