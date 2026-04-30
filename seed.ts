import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.project.createMany({
    data: [
      {
        projectNumber: "P-2025-001",
        clientName: "Client A",
        projectManagerName: "Chef de projet A",
        titleProject: "Projet ERP Groupe A",
        status: "En cours",
        startDate: new Date("2025-01-15"),
        endDate: new Date("2025-09-30"),
        estimatedDate: new Date("2025-09-30"),
        progressPercent: 45,
        riskCriticality: "Significatif",
        plannedLoadDays: 120,
        consumedLoadDays: 40,
        comments: "Projet stratégique ERP groupe A.",
      },
      {
        projectNumber: "P-2025-002",
        clientName: "Client B",
        projectManagerName: "Chef de projet B",
        titleProject: "Refonte portail client B",
        status: "Planifié",
        startDate: new Date("2025-03-01"),
        endDate: new Date("2025-12-15"),
        estimatedDate: new Date("2025-12-15"),
        progressPercent: 10,
        riskCriticality: "Négligeable",
        plannedLoadDays: 80,
        consumedLoadDays: 5,
        comments: "Portail client web + mobile.",
      },
      {
        projectNumber: "P-2024-010",
        clientName: "Client C",
        projectManagerName: "Chef de projet C",
        titleProject: "TMA Applicative Client C",
        status: "Terminé",
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-11-30"),
        estimatedDate: new Date("2024-11-30"),
        progressPercent: 100,
        riskCriticality: "Négligeable",
        plannedLoadDays: 60,
        consumedLoadDays: 60,
        comments: "Contrat TMA clôturé avec succès.",
      },
    ],
  });

  console.log("Seed OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
