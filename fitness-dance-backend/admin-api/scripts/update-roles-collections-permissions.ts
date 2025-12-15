// Script to update existing admin roles with collections permissions
// Run this after deploying collections feature: 
//   railway run --service Postgres node -r ts-node/register admin-api/scripts/update-roles-collections-permissions.ts

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Get DATABASE_URL from environment (Railway will provide this)
let databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

// If DATABASE_URL contains internal Railway URL, construct public URL using TCP proxy
if (databaseUrl.includes("postgres.railway.internal")) {
  console.log("🔍 Detected internal Railway URL, constructing public URL...");

  const tcpProxyDomain = process.env.RAILWAY_TCP_PROXY_DOMAIN;
  const tcpProxyPort = process.env.RAILWAY_TCP_PROXY_PORT;

  if (!tcpProxyDomain || !tcpProxyPort) {
    console.error("❌ RAILWAY_TCP_PROXY_DOMAIN or RAILWAY_TCP_PROXY_PORT not found");
    console.error("   Make sure you're running via: railway run --service Postgres");
    process.exit(1);
  }

  // Extract credentials from DATABASE_URL
  let pgPassword: string | undefined;
  let pgUser = "postgres";
  let pgDatabase = "railway";

  try {
    const url = new URL(databaseUrl);
    pgPassword = url.password;
    pgUser = url.username || pgUser;
    pgDatabase = url.pathname.slice(1) || pgDatabase;
    console.log(`✅ Extracted credentials from DATABASE_URL (user: ${pgUser}, db: ${pgDatabase})`);
  } catch (e) {
    // If URL parsing fails, try regex extraction
    const match = databaseUrl.match(/postgresql:\/\/(?:([^:]+):)?([^@]+)@[^\/]+\/(.+)/);
    if (match) {
      pgUser = match[1] || pgUser;
      const userPass = match[2];
      if (userPass.includes(":")) {
        const parts = userPass.split(":");
        pgUser = parts[0];
        pgPassword = parts.slice(1).join(":");
      } else {
        pgPassword = userPass;
      }
      pgDatabase = match[3] || pgDatabase;
      console.log(`✅ Extracted credentials via regex (user: ${pgUser}, db: ${pgDatabase})`);
    }
  }

  if (!pgPassword) {
    console.error("❌ Could not extract password from DATABASE_URL");
    process.exit(1);
  }

  // Construct public database URL using TCP proxy
  databaseUrl = `postgresql://${pgUser}:${pgPassword}@${tcpProxyDomain}:${tcpProxyPort}/${pgDatabase}`;
  console.log(`📡 Using TCP proxy connection: ${tcpProxyDomain}:${tcpProxyPort}`);
}

// Create Prisma client directly without env validation
const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function updateRolesWithCollectionsPermissions() {
  console.log("🔄 Updating admin roles with collections permissions...\n");

  try {
    // Get all admin roles
    const roles = await prisma.adminRole.findMany();

    for (const role of roles) {
      const currentPermissions = (role.permissions as any) || {};
      
      // Determine collections permissions based on role
      let collectionsPermissions: string[] = [];
      
      if (role.slug === "super_admin") {
        // Super Admin: Full access
        collectionsPermissions = ["create", "read", "update", "delete"];
      } else if (role.slug === "content_manager") {
        // Content Manager: Full access to collections (since they manage videos and categories)
        collectionsPermissions = ["create", "read", "update", "delete"];
      } else if (role.slug === "user_manager" || role.slug === "support") {
        // User Manager and Support: Read-only
        collectionsPermissions = ["read"];
      } else {
        // Default: Read-only for unknown roles
        collectionsPermissions = ["read"];
      }

      // Update permissions
      const updatedPermissions = {
        ...currentPermissions,
        collections: collectionsPermissions,
      };

      await prisma.adminRole.update({
        where: { id: role.id },
        data: {
          permissions: updatedPermissions,
        },
      });

      console.log(`✅ Updated ${role.name} (${role.slug}) with collections permissions:`, collectionsPermissions);
    }

    console.log("\n✅ All roles updated successfully!");
  } catch (error) {
    console.error("❌ Error updating roles:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateRolesWithCollectionsPermissions();

