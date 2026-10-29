import { seedDatabase } from "./seed";
import { prisma } from "./prisma";

async function main() {
  try {
    await seedDatabase();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
