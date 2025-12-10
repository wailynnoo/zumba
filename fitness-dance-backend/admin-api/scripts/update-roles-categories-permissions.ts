// Script to update existing admin roles with categories permissions
// Run this after deploying RBAC changes: npx ts-node admin-api/scripts/update-roles-categories-permissions.ts

import prisma from "../src/config/database";
import dotenv from "dotenv";

dotenv.config();

async function updateRolesWithCategoriesPermissions() {
  console.log("🔄 Updating admin roles with categories permissions...\n");

  try {
    // Get all admin roles
    const roles = await prisma.adminRole.findMany();

    for (const role of roles) {
      const currentPermissions = (role.permissions as any) || {};
      
      // Determine categories permissions based on role
      let categoriesPermissions: string[] = [];
      
      if (role.slug === "super_admin") {
        // Super Admin: Full access
        categoriesPermissions = ["create", "read", "update", "delete"];
      } else if (role.slug === "content_manager") {
        // Content Manager: Full access to categories
        categoriesPermissions = ["create", "read", "update", "delete"];
      } else if (role.slug === "user_manager" || role.slug === "support") {
        // User Manager and Support: Read-only
        categoriesPermissions = ["read"];
      } else {
        // Default: Read-only for unknown roles
        categoriesPermissions = ["read"];
      }

      // Update permissions
      const updatedPermissions = {
        ...currentPermissions,
        categories: categoriesPermissions,
      };

      await prisma.adminRole.update({
        where: { id: role.id },
        data: {
          permissions: updatedPermissions,
        },
      });

      console.log(`✅ Updated ${role.name} (${role.slug}) with categories permissions:`, categoriesPermissions);
    }

    console.log("\n✅ All roles updated successfully!");
  } catch (error) {
    console.error("❌ Error updating roles:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateRolesWithCategoriesPermissions();

