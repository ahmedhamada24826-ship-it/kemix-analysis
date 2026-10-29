import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Skipping production administrator setup outside Vercel Production.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Serialize first-admin creation if production builds overlap.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(720260102)`;

    const existingAdmin = await tx.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (existingAdmin) {
      console.log("Production administrator is already configured.");
      return;
    }

    const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const name = process.env.INITIAL_ADMIN_NAME?.trim();
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (!email && !name && !password) {
      console.warn("No first administrator was created. Set INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME, and INITIAL_ADMIN_PASSWORD in Vercel Production, then redeploy to enable the admin workspace.");
      return;
    }
    if (!email || !name || !password || name.length < 2 || password.length < 12 || password.length > 256) {
      throw new Error("Set INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_NAME, and a 12-256 character INITIAL_ADMIN_PASSWORD in Vercel Production before deploying.");
    }

    const existingUser = await tx.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("INITIAL_ADMIN_EMAIL already belongs to an account. Choose an unused company email for the first administrator.");
    }

    await tx.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 12),
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        clientType: "ORGANIZATION",
      },
    });
    console.log("Created the initial production administrator.");
  });
}

main()
  .catch((error) => {
    console.error("Production administrator setup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
