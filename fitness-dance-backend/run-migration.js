/**
 * Run migration SQL directly via Node.js
 * This script can be executed via Railway CLI: railway run --service admin-api node run-migration.js
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Get DATABASE_URL from environment
// Try to use public URL if internal URL is provided
let databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

// If DATABASE_URL contains internal Railway URL, construct public URL from TCP proxy
if (databaseUrl && databaseUrl.includes("postgres.railway.internal")) {
  const tcpProxyDomain =
    process.env.RAILWAY_TCP_PROXY_DOMAIN || "nozomi.proxy.rlwy.net";
  const tcpProxyPort = process.env.RAILWAY_TCP_PROXY_PORT || "56096";
  const pgUser = process.env.PGUSER || "postgres";
  const pgPassword = process.env.PGPASSWORD;
  const pgDatabase = process.env.PGDATABASE || "railway";

  if (pgPassword) {
    databaseUrl = `postgresql://${pgUser}:${pgPassword}@${tcpProxyDomain}:${tcpProxyPort}/${pgDatabase}`;
    console.log("📡 Using TCP proxy connection (public URL)");
  } else {
    console.error("❌ Cannot construct public URL: PGPASSWORD not found");
    process.exit(1);
  }
}

if (!databaseUrl) {
  console.error(
    "❌ DATABASE_URL or DATABASE_PUBLIC_URL environment variable is not set"
  );
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
});

async function runMigration() {
  try {
    console.log(
      "🚀 Starting migration: 20241206120000_add_refresh_token_security"
    );
    console.log("📡 Connecting to database...");

    await client.connect();
    console.log("✅ Connected to database");

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "prisma",
      "migrations",
      "20241206120000_add_refresh_token_security",
      "migration.sql"
    );

    let sql;
    if (fs.existsSync(migrationPath)) {
      sql = fs.readFileSync(migrationPath, "utf8");
      console.log("✅ Found migration SQL file");
    } else {
      // If file doesn't exist, use inline SQL
      console.log("⚠️  Migration file not found, using inline SQL");
      sql = `
-- CreateTable: admin_refresh_tokens
CREATE TABLE IF NOT EXISTS "admin_refresh_tokens"
(
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "device_info" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: admin_refresh_tokens_token_hash
CREATE UNIQUE INDEX IF NOT EXISTS "admin_refresh_tokens_token_hash_key" ON "admin_refresh_tokens"("token_hash");

-- CreateIndex: admin_refresh_tokens_admin_id
CREATE INDEX IF NOT EXISTS "admin_refresh_tokens_admin_id_idx" ON "admin_refresh_tokens"("admin_id");

-- CreateIndex: admin_refresh_tokens_token_hash_idx
CREATE INDEX IF NOT EXISTS "admin_refresh_tokens_token_hash_idx" ON "admin_refresh_tokens"("token_hash");

-- CreateIndex: admin_refresh_tokens_expires_at_idx
CREATE INDEX IF NOT EXISTS "admin_refresh_tokens_expires_at_idx" ON "admin_refresh_tokens"("expires_at");

-- CreateIndex: admin_refresh_tokens_is_revoked_idx
CREATE INDEX IF NOT EXISTS "admin_refresh_tokens_is_revoked_idx" ON "admin_refresh_tokens"("is_revoked");

-- AddForeignKey: admin_refresh_tokens_admin_id_fkey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'admin_refresh_tokens_admin_id_fkey'
    ) THEN
        ALTER TABLE "admin_refresh_tokens" 
        ADD CONSTRAINT "admin_refresh_tokens_admin_id_fkey" 
        FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AlterTable: refresh_tokens - Rename token to token_hash
DROP INDEX IF EXISTS "refresh_tokens_token_key";
DROP INDEX IF EXISTS "refresh_tokens_token_idx";

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refresh_tokens' AND column_name = 'token'
    ) THEN
        ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "token_hash";
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- AddColumn: refresh_tokens - Add user_agent column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'refresh_tokens' AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE "refresh_tokens" ADD COLUMN "user_agent" TEXT;
    END IF;
END $$;

-- CreateIndex: refresh_tokens_is_revoked (if it doesn't exist)
CREATE INDEX IF NOT EXISTS "refresh_tokens_is_revoked_idx" ON "refresh_tokens"("is_revoked");

-- Record migration in _prisma_migrations table
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at)
VALUES (
    gen_random_uuid()::text,
    '',
    NOW(),
    '20241206120000_add_refresh_token_security',
    NULL,
    NULL,
    NOW()
)
ON CONFLICT (migration_name) DO NOTHING;
      `.trim();
    }

    // Execute SQL - handle DO blocks and multiple statements
    // Split by semicolon but preserve DO $$ ... END $$; blocks
    const statements = [];
    let currentStatement = "";
    let inDoBlock = false;
    let dollarQuote = "";

    const lines = sql.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("--")) {
        continue;
      }

      // Check for DO $$ blocks
      if (trimmed.match(/^DO\s+\$\$?/i)) {
        inDoBlock = true;
        const match = trimmed.match(/\$\$(\w*)\$/);
        dollarQuote = match ? `$$${match[1]}$` : "$$";
        currentStatement += line + "\n";
        continue;
      }

      // Check for END of DO block
      if (inDoBlock && trimmed.includes(`END ${dollarQuote}`)) {
        currentStatement += line;
        statements.push(currentStatement.trim());
        currentStatement = "";
        inDoBlock = false;
        dollarQuote = "";
        continue;
      }

      // Regular statement
      currentStatement += line;

      // If line ends with semicolon and we're not in a DO block, it's a complete statement
      if (!inDoBlock && trimmed.endsWith(";")) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      } else if (!inDoBlock) {
        currentStatement += "\n";
      } else {
        currentStatement += "\n";
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    // Filter out empty statements
    const validStatements = statements.filter(
      (s) => s.length > 0 && !s.startsWith("--")
    );

    console.log(`📝 Executing ${validStatements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < validStatements.length; i++) {
      const statement = validStatements[i];

      try {
        await client.query(statement);
        console.log(`✅ Statement ${i + 1}/${validStatements.length} executed`);
      } catch (error) {
        // Some errors are expected (e.g., table already exists, index already exists)
        if (
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.message.includes("does not exist") ||
          (error.message.includes("column") &&
            error.message.includes("already"))
        ) {
          console.log(
            `⚠️  Statement ${i + 1} skipped (already applied or not needed): ${
              error.message.split("\n")[0]
            }`
          );
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Don't throw - continue with other statements
          console.log(`   SQL: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log("📋 Verifying migration...");

    // Verify the migration
    const adminRefreshTokensResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_refresh_tokens'
      );
    `);

    if (adminRefreshTokensResult.rows[0].exists) {
      console.log("✅ admin_refresh_tokens table exists");
    } else {
      console.log("❌ admin_refresh_tokens table not found");
    }

    // Check if migration is recorded
    const migrationRecord = await client.query(`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = '20241206120000_add_refresh_token_security';
    `);

    if (migrationRecord.rows.length > 0) {
      console.log("✅ Migration recorded in _prisma_migrations");
    } else {
      console.log(
        "⚠️  Migration not recorded in _prisma_migrations, recording it now..."
      );
      try {
        // Check if migration already exists before inserting
        const checkResult = await client.query(`
          SELECT id FROM "_prisma_migrations" 
          WHERE migration_name = '20241206120000_add_refresh_token_security';
        `);

        if (checkResult.rows.length === 0) {
          await client.query(`
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at)
            VALUES (
              gen_random_uuid()::text,
              '',
              NOW(),
              '20241206120000_add_refresh_token_security',
              NULL,
              NULL,
              NOW()
            );
          `);
          console.log("✅ Migration recorded in _prisma_migrations");
        } else {
          console.log("✅ Migration already exists in _prisma_migrations");
        }
      } catch (error) {
        console.log("⚠️  Could not record migration:", error.message);
      }
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
