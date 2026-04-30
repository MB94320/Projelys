// scripts/fixActionOrigin.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const defaultOrigin = "Risques";
  const updated = await prisma.action.updateMany({
    where: { origin: null },
    data: { origin: defaultOrigin },
  });
  console.log(`Origine renseignée sur ${updated.count} action(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
