// Script to verify collections permissions are set correctly
// Run: railway run --service Postgres node -r ts-node/register admin-api/scripts/verify-collections-permissions.ts

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Get DATABASE_URL from environment
let databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL not found in environment");
  process.exit(1);
}

// Handle Railway TCP proxy
if (databaseUrl.includes("postgres.railway.internal")) {
  const tcpProxyDomain = process.env.RAILWAY_TCP_PROXY_DOMAIN;
  const tcpProxyPort = process.env.RAILWAY_TCP_PROXY_PORT;

  if (!tcpProxyDomain || !tcpProxyPort) {
    console.error("❌ RAILWAY_TCP_PROXY_DOMAIN or RAILWAY_TCP_PROXY_PORT not found");
    process.exit(1);
  }

  let pgPassword: string | undefined;
  let pgUser = "postgres";
  let pgDatabase = "railway";

  try {
    const url = new URL(databaseUrl);
    pgPassword = url.password;
    pgUser = url.username || pgUser;
    pgDatabase = url.pathname.slice(1) || pgDatabase;
  } catch (e) {
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
    }
  }

  if (!pgPassword) {
    console.error("❌ Could not extract password from DATABASE_URL");
    process.exit(1);
  }

  databaseUrl = `postgresql://${pgUser}:${pgPassword}@${tcpProxyDomain}:${tcpProxyPort}/${pgDatabase}`;
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function verifyPermissions() {
  console.log("🔍 Verifying collections permissions...\n");

  try {
    const roles = await prisma.adminRole.findMany();

    for (const role of roles) {
      const permissions = (role.permissions as any) || {};
      const collectionsPerms = permissions.collections;

      console.log(`\n📋 ${role.name} (${role.slug}):`);
      console.log(`   Collections permissions:`, collectionsPerms || "❌ NOT SET");
      
      if (collectionsPerms && Array.isArray(collectionsPerms)) {
        const hasRead = collectionsPerms.includes("read");
        const hasCreate = collectionsPerms.includes("create");
        const hasUpdate = collectionsPerms.includes("update");
        const hasDelete = collectionsPerms.includes("delete");
        
        console.log(`   ✅ Read: ${hasRead ? "✅" : "❌"}`);
        console.log(`   ✅ Create: ${hasCreate ? "✅" : "❌"}`);
        console.log(`   ✅ Update: ${hasUpdate ? "✅" : "❌"}`);
        console.log(`   ✅ Delete: ${hasDelete ? "✅" : "❌"}`);
      } else {
        console.log(`   ⚠️  Collections permissions are missing or invalid!`);
      }
    }

    console.log("\n✅ Verification complete!");
  } catch (error) {
    console.error("❌ Error verifying permissions:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPermissions();

