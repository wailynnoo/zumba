// prisma/verify-seed.ts
// Verify seed data was created successfully

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log("🔍 Verifying seed data...\n");

  const danceStyles = await prisma.danceStyle.count();
  const intensityLevels = await prisma.intensityLevel.count();
  const categories = await prisma.videoCategory.count();
  const plans = await prisma.subscriptionPlan.count();
  const roles = await prisma.adminRole.count();
  const admins = await prisma.admin.count();

  console.log("📊 Seed Data Summary:");
  console.log(`   ✅ Dance Styles: ${danceStyles}`);
  console.log(`   ✅ Intensity Levels: ${intensityLevels}`);
  console.log(`   ✅ Video Categories: ${categories}`);
  console.log(`   ✅ Subscription Plans: ${plans}`);
  console.log(`   ✅ Admin Roles: ${roles}`);
  console.log(`   ✅ Admins: ${admins}\n`);

  if (admins > 0) {
    const superAdmin = await prisma.admin.findFirst({
      where: { email: "admin@zfitdance.com" },
      include: { adminRole: true },
    });
    if (superAdmin) {
      console.log("👤 Super Admin:");
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Role: ${superAdmin.adminRole.name}`);
      console.log(`   Active: ${superAdmin.isActive ? "Yes" : "No"}\n`);
    }
  }

  console.log("✅ Verification complete!");
}

verify()
  .catch((e) => {
    console.error("❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

