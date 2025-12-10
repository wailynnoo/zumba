// prisma/seed.ts
// Seed script for initial data

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create Prisma Client with adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...\n");

  // 1. Seed Dance Styles
  console.log("📝 Seeding Dance Styles...");
  const danceStyles = [
    {
      name: "Zumba Fitness Dance",
      slug: "zumba-fitness-dance",
      description: "High-energy dance fitness program combining Latin and international music with dance moves",
      sortOrder: 1,
    },
    {
      name: "Bollywood Dance",
      slug: "bollywood-dance",
      description: "Energetic and expressive dance style from Indian cinema",
      sortOrder: 2,
    },
    {
      name: "K-pop Fitness Dance",
      slug: "kpop-fitness-dance",
      description: "Fun and dynamic dance routines inspired by K-pop music",
      sortOrder: 3,
    },
    {
      name: "Dance Choreography",
      slug: "dance-choreography",
      description: "Structured dance routines and choreography lessons",
      sortOrder: 4,
    },
    {
      name: "TikTok Dance Basic",
      slug: "tiktok-dance-basic",
      description: "Popular and trending dance moves from TikTok",
      sortOrder: 5,
    },
  ];

  for (const style of danceStyles) {
    await prisma.danceStyle.upsert({
      where: { slug: style.slug },
      update: {},
      create: style,
    });
  }
  console.log(`✅ Created ${danceStyles.length} dance styles\n`);

  // 2. Seed Intensity Levels
  console.log("📝 Seeding Intensity Levels...");
  const intensityLevels = [
    {
      name: "Slow & Low Intensity",
      slug: "slow-low-intensity",
      description: "Gentle movements perfect for beginners and low-impact workouts",
      sortOrder: 1,
    },
    {
      name: "Fast & High Intensity",
      slug: "fast-high-intensity",
      description: "High-energy routines for advanced dancers and intense workouts",
      sortOrder: 2,
    },
  ];

  for (const level of intensityLevels) {
    await prisma.intensityLevel.upsert({
      where: { slug: level.slug },
      update: {},
      create: level,
    });
  }
  console.log(`✅ Created ${intensityLevels.length} intensity levels\n`);

  // 3. Seed Video Categories
  console.log("📝 Seeding Video Categories...");
  const videoCategories = [
    {
      name: "Full Workout",
      slug: "full-workout",
      description: "Complete workout sessions",
      sortOrder: 1,
    },
    {
      name: "Tutorial",
      slug: "tutorial",
      description: "Step-by-step dance tutorials",
      sortOrder: 2,
    },
    {
      name: "Quick Session",
      slug: "quick-session",
      description: "Short and quick dance sessions",
      sortOrder: 3,
    },
  ];

  const createdCategories = [];
  for (const category of videoCategories) {
    const created = await prisma.videoCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    createdCategories.push(created);
  }
  console.log(`✅ Created ${videoCategories.length} video categories\n`);

  // 4. Seed Subscription Plans
  console.log("📝 Seeding Subscription Plans...");
  const subscriptionPlans = [
    {
      name: "1 Month",
      durationMonths: 1,
      priceMmk: 10000,
      discountPercent: 0,
      sortOrder: 1,
    },
    {
      name: "3 Months",
      durationMonths: 3,
      priceMmk: 27000,
      discountPercent: 10,
      sortOrder: 2,
    },
    {
      name: "6 Months",
      durationMonths: 6,
      priceMmk: 48000,
      discountPercent: 20,
      sortOrder: 3,
    },
    {
      name: "1 Year",
      durationMonths: 12,
      priceMmk: 84000,
      discountPercent: 30,
      sortOrder: 4,
    },
  ];

  for (const plan of subscriptionPlans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: plan.name },
    });
    if (!existing) {
      await prisma.subscriptionPlan.create({
        data: plan,
      });
    } else {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: plan,
      });
    }
  }
  console.log(`✅ Created ${subscriptionPlans.length} subscription plans\n`);

  // 5. Seed Admin Roles
  console.log("📝 Seeding Admin Roles...");
  const adminRoles = [
    {
      name: "Super Admin",
      slug: "super_admin",
      description: "Full system access with all permissions",
      permissions: {
        users: ["create", "read", "update", "delete"],
        admins: ["create", "read", "update", "delete"],
        videos: ["create", "read", "update", "delete"],
        subscriptions: ["create", "read", "update", "delete"],
        analytics: ["read"],
        settings: ["read", "update"],
        knowledge: ["create", "read", "update", "delete"],
        feedback: ["read", "update", "delete"],
      },
    },
    {
      name: "Content Manager",
      slug: "content_manager",
      description: "Manage videos and knowledge articles",
      permissions: {
        videos: ["create", "read", "update", "delete"],
        knowledge: ["create", "read", "update", "delete"],
        analytics: ["read"],
      },
    },
    {
      name: "User Manager",
      slug: "user_manager",
      description: "Manage users and subscriptions",
      permissions: {
        users: ["read", "update"],
        subscriptions: ["read", "update"],
        analytics: ["read"],
      },
    },
    {
      name: "Support",
      slug: "support",
      description: "View and respond to user feedback",
      permissions: {
        feedback: ["read", "update"],
        users: ["read"],
      },
    },
  ];

  const createdRoles = [];
  for (const role of adminRoles) {
    const created = await prisma.adminRole.upsert({
      where: { slug: role.slug },
      update: {},
      create: role,
    });
    createdRoles.push(created);
  }
  console.log(`✅ Created ${adminRoles.length} admin roles\n`);

  // 6. Create First Super Admin
  console.log("📝 Creating Super Admin account...");
  const superAdminRole = createdRoles.find((r) => r.slug === "super_admin");
  if (!superAdminRole) {
    throw new Error("Super Admin role not found!");
  }

  // Default password: "Admin@123" (change this in production!)
  const defaultPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin@123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const superAdmin = await prisma.admin.upsert({
    where: { email: "admin@zfitdance.com" },
    update: {},
    create: {
      email: "admin@zfitdance.com",
      passwordHash,
      displayName: "Super Admin",
      adminRoleId: superAdminRole.id,
      isActive: true,
      // createdById is null for the first admin
    },
  });
  console.log(`✅ Created Super Admin: ${superAdmin.email}`);
  console.log(`   Password: ${defaultPassword} (change this in production!)\n`);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

