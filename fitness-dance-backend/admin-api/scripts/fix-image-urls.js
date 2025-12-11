// scripts/fix-image-urls.js
// Script to fix image URLs in database that contain domains
// Run this once to clean up existing data

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Extract clean relative path from URL or path
 */
function extractRelativePath(urlOrPath) {
  if (!urlOrPath) return null;

  // If it's a full URL
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    try {
      const url = new URL(urlOrPath);
      const path = url.pathname.startsWith("/")
        ? url.pathname.substring(1)
        : url.pathname;
      return path;
    } catch {
      // Try manual extraction
      const match = urlOrPath.match(/\/(uploads\/.*)$/);
      return match ? match[1] : null;
    }
  }

  // If it contains a domain but no protocol
  if (
    urlOrPath.includes(".up.railway.app") ||
    urlOrPath.includes(".railway.app")
  ) {
    const parts = urlOrPath.split("/");
    const uploadsIndex = parts.findIndex((p) => p === "uploads");
    if (uploadsIndex >= 0) {
      return parts.slice(uploadsIndex).join("/");
    }
  }

  // Already clean relative path
  return urlOrPath;
}

async function fixImageUrls() {
  try {
    console.log("🔍 Finding categories with image URLs...");

    const categories = await prisma.videoCategory.findMany({
      where: {
        iconUrl: { not: null },
      },
      select: {
        id: true,
        name: true,
        iconUrl: true,
      },
    });

    console.log(`📊 Found ${categories.length} categories with images`);

    let fixed = 0;
    let skipped = 0;

    for (const category of categories) {
      const originalUrl = category.iconUrl;
      const cleanPath = extractRelativePath(originalUrl);

      // Only update if the path changed
      if (cleanPath && cleanPath !== originalUrl) {
        await prisma.videoCategory.update({
          where: { id: category.id },
          data: { iconUrl: cleanPath },
        });

        console.log(`✅ Fixed: ${category.name}`);
        console.log(`   Before: ${originalUrl}`);
        console.log(`   After:  ${cleanPath}`);
        fixed++;
      } else {
        skipped++;
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`   Fixed: ${fixed} categories`);
    console.log(`   Skipped: ${skipped} categories (already correct)`);
  } catch (error) {
    console.error("❌ Error fixing image URLs:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixImageUrls();
