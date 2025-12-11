// admin-api/scripts/postinstall.js
// Postinstall script that safely generates Prisma client
// Works in both local development and Railway deployment

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function findPrismaSchema() {
  // Try multiple possible locations
  const possiblePaths = [
    // Local development: prisma folder is in parent directory
    path.join(__dirname, "..", "..", "prisma", "schema.prisma"),
    // Railway: prisma folder might be at root
    path.join(process.cwd(), "..", "prisma", "schema.prisma"),
    // Alternative: prisma folder at current level
    path.join(process.cwd(), "prisma", "schema.prisma"),
    // Another alternative: check from admin-api parent
    path.join(__dirname, "..", "..", "..", "prisma", "schema.prisma"),
  ];

  for (const schemaPath of possiblePaths) {
    if (fs.existsSync(schemaPath)) {
      return schemaPath;
    }
  }

  return null;
}

function generatePrismaClient() {
  try {
    const schemaPath = findPrismaSchema();

    if (!schemaPath) {
      console.warn(
        "⚠️  Prisma schema not found. Skipping Prisma client generation."
      );
      console.warn(
        "   This is normal if Prisma is generated in the build step."
      );
      return;
    }

    console.log(`📦 Generating Prisma client from: ${schemaPath}`);

    // Get the directory containing the schema
    const schemaDir = path.dirname(schemaPath);

    // Run prisma generate from the schema directory
    execSync(`npx prisma generate --schema="${schemaPath}"`, {
      stdio: "inherit",
      cwd: schemaDir,
    });

    console.log("✅ Prisma client generated successfully");
  } catch (error) {
    console.warn("⚠️  Failed to generate Prisma client in postinstall:");
    console.warn(`   ${error.message}`);
    console.warn(
      "   Prisma client will be generated during build step instead."
    );
  }
}

// Only run if not in production build context
// Railway will handle Prisma generation in the build step
if (
  process.env.NODE_ENV !== "production" ||
  process.env.RAILWAY_ENVIRONMENT === undefined
) {
  generatePrismaClient();
} else {
  console.log(
    "📦 Skipping Prisma generation in postinstall (will run in build step)"
  );
}
