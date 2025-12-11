// admin-api/scripts/generate-prisma.js
// Script to generate Prisma client
// Used in build step for Railway deployment

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
  const schemaPath = findPrismaSchema();

  if (!schemaPath) {
    console.error("❌ Prisma schema not found!");
    console.error("   Searched in:");
    console.error("   - ../prisma/schema.prisma");
    console.error("   - ../../prisma/schema.prisma");
    console.error("   - ./prisma/schema.prisma");
    process.exit(1);
  }

  console.log(`📦 Generating Prisma client from: ${schemaPath}`);

  // Get the directory containing the schema
  const schemaDir = path.dirname(schemaPath);

  try {
    // Run prisma generate from the schema directory
    execSync(`npx prisma generate --schema="${schemaPath}"`, {
      stdio: "inherit",
      cwd: schemaDir,
    });

    console.log("✅ Prisma client generated successfully");
  } catch (error) {
    console.error("❌ Failed to generate Prisma client:");
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

generatePrismaClient();
