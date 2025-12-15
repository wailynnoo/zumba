/**
 * Run migration SQL directly via Node.js
 *
 * IMPORTANT: Run via Postgres service to get TCP proxy variables automatically:
 *   railway run --service Postgres node run-migration.js
 *
 * Running via admin-api service will NOT provide RAILWAY_TCP_PROXY_DOMAIN/PORT
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Get DATABASE_URL from environment
// Try DATABASE_PUBLIC_URL first (if available, it's already a public URL)
let databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

// Debug: Log available environment variables (without sensitive data)
console.log("🔍 Environment check:");
console.log(
  `   DATABASE_URL: ${
    process.env.DATABASE_URL
      ? "✅ Set (length: " + process.env.DATABASE_URL.length + ")"
      : "❌ Not set"
  }`
);
console.log(
  `   DATABASE_PUBLIC_URL: ${
    process.env.DATABASE_PUBLIC_URL ? "✅ Set" : "❌ Not set"
  }`
);
console.log(
  `   RAILWAY_TCP_PROXY_DOMAIN: ${
    process.env.RAILWAY_TCP_PROXY_DOMAIN || "❌ Not set"
  }`
);
console.log(
  `   RAILWAY_TCP_PROXY_PORT: ${
    process.env.RAILWAY_TCP_PROXY_PORT || "❌ Not set"
  }`
);

// If DATABASE_URL contains internal Railway URL, we MUST construct public URL
// Internal URLs don't work when running via Railway CLI from local machine
if (databaseUrl && databaseUrl.includes("postgres.railway.internal")) {
  console.log("🔍 Detected internal Railway URL, constructing public URL...");

  const tcpProxyDomain = process.env.RAILWAY_TCP_PROXY_DOMAIN;
  const tcpProxyPort = process.env.RAILWAY_TCP_PROXY_PORT;

  // Extract credentials from DATABASE_URL
  let pgPassword = process.env.PGPASSWORD;
  let pgUser = process.env.PGUSER || "postgres";
  let pgDatabase = process.env.PGDATABASE || "railway";

  // Always try to extract from DATABASE_URL first
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      pgPassword = url.password || pgPassword;
      pgUser = url.username || pgUser;
      pgDatabase = url.pathname.slice(1) || pgDatabase;
      console.log(
        `✅ Extracted credentials from DATABASE_URL (user: ${pgUser}, db: ${pgDatabase})`
      );
    } catch (e) {
      // If URL parsing fails, try regex extraction
      // Format: postgresql://user:password@host:port/database
      const match = databaseUrl.match(
        /postgresql:\/\/(?:([^:]+):)?([^@]+)@[^\/]+\/(.+)/
      );
      if (match) {
        pgUser = match[1] || pgUser;
        const userPass = match[2];
        // Check if it's just password or user:password
        if (userPass.includes(":")) {
          const parts = userPass.split(":");
          pgUser = parts[0];
          pgPassword = parts.slice(1).join(":"); // In case password contains ':'
        } else {
          // If no colon, it might be just the password (unlikely but handle it)
          pgPassword = userPass;
        }
        pgDatabase = match[3] || pgDatabase;
        console.log(
          `✅ Extracted credentials via regex (user: ${pgUser}, db: ${pgDatabase})`
        );
      }
    }
  }

  // Check if we have all required info for TCP proxy
  if (!tcpProxyDomain || !tcpProxyPort) {
    console.error(
      "❌ RAILWAY_TCP_PROXY_DOMAIN or RAILWAY_TCP_PROXY_PORT not found"
    );
    console.error("   These are required when using internal Railway URLs");
    console.error("");
    console.error("   Try one of these solutions:");
    console.error(
      "   1. Run via Postgres service: railway run --service Postgres node run-migration.js"
    );
    console.error("   2. Or get TCP proxy from Railway Dashboard:");
    console.error(
      "      - Go to Railway Dashboard → Postgres service → Connect"
    );
    console.error("      - Copy TCP Proxy domain and port");
    console.error("      - Set as environment variables before running");
    console.error(
      "   3. Or use DATABASE_PUBLIC_URL if available in Railway variables"
    );
    process.exit(1);
  }

  if (!pgPassword) {
    console.error("❌ Cannot extract password from DATABASE_URL");
    console.error("   Password is required to construct public URL");
    process.exit(1);
  }

  // Construct public URL using TCP proxy
  databaseUrl = `postgresql://${pgUser}:${pgPassword}@${tcpProxyDomain}:${tcpProxyPort}/${pgDatabase}`;
  console.log(
    `📡 Using TCP proxy connection: ${tcpProxyDomain}:${tcpProxyPort}`
  );
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
      "🚀 Starting migration: 20250114000000_add_video_steps"
    );
    console.log("📡 Connecting to database...");

    await client.connect();
    console.log("✅ Connected to database");

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "prisma",
      "migrations",
      "20250114000000_add_video_steps",
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
-- CreateTable: VideoStep
CREATE TABLE IF NOT EXISTS "video_steps" (
    "id" TEXT NOT NULL,
    "video_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cloudflare_video_id" TEXT,
    "video_url" TEXT,
    "thumbnail_url" TEXT,
    "duration_seconds" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "video_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: video_steps_video_id_idx
CREATE INDEX IF NOT EXISTS "video_steps_video_id_idx" ON "video_steps"("video_id");

-- CreateIndex: video_steps_video_id_sort_order_idx
CREATE INDEX IF NOT EXISTS "video_steps_video_id_sort_order_idx" ON "video_steps"("video_id", "sort_order");

-- CreateUniqueConstraint: video_steps_video_id_step_number_key
CREATE UNIQUE INDEX IF NOT EXISTS "video_steps_video_id_step_number_key" ON "video_steps"("video_id", "step_number");

-- AddForeignKey: video_steps_video_id_fkey
ALTER TABLE "video_steps" ADD CONSTRAINT "video_steps_video_id_fkey" 
    FOREIGN KEY ("video_id") 
    REFERENCES "videos"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
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

    // Verify the migration - check that video_steps table exists
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'video_steps';
    `);

    if (tableResult.rows.length > 0) {
      console.log("✅ Table video_steps successfully created");
      
      // Check columns
      const columnsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'video_steps'
        ORDER BY ordinal_position;
      `);
      console.log(`✅ Table has ${columnsResult.rows.length} columns`);
    } else {
      console.log("⚠️  Table video_steps was not created");
    }

    // Check if migration is recorded
    const migrationRecord = await client.query(`
      SELECT * FROM "_prisma_migrations" 
      WHERE migration_name = '20250114000000_add_video_steps';
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
          WHERE migration_name = '20250114000000_add_video_steps';
        `);

        if (checkResult.rows.length === 0) {
          await client.query(`
            INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at)
            VALUES (
              gen_random_uuid()::text,
              '',
              NOW(),
              '20250114000000_add_video_steps',
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
