// admin-api/src/services/category.service.ts
// Category service for Admin API - Full CRUD operations

import prisma from "../config/database";
import { z } from "zod";

/**
 * Convert full URL to relative path for database storage
 * If already relative, return as is
 */
function normalizeImageUrl(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  
  // If it's a full URL (starts with http), extract the path
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    try {
      const urlObj = new URL(urlOrPath);
      const urlPath = urlObj.pathname;
      // Remove leading slash: /uploads/categories/file.jpg -> uploads/categories/file.jpg
      return urlPath.startsWith("/") ? urlPath.substring(1) : urlPath;
    } catch {
      // If URL parsing fails, try to extract path manually
      const match = urlOrPath.match(/\/(uploads\/.*)$/);
      return match ? match[1] : urlOrPath;
    }
  }
  
  // If it contains a domain but no protocol, extract just the path part
  if (urlOrPath.includes(".up.railway.app") || urlOrPath.includes(".railway.app") || urlOrPath.includes("://")) {
    // Try to find the uploads part
    const parts = urlOrPath.split("/");
    const uploadsIndex = parts.findIndex(p => p === "uploads");
    if (uploadsIndex >= 0) {
      // Return everything from "uploads" onwards
      return parts.slice(uploadsIndex).join("/");
    }
    
    // If no "uploads" found, try to extract from URL pattern
    const match = urlOrPath.match(/(uploads\/.*)$/);
    if (match) {
      return match[1];
    }
  }
  
  // Already a clean relative path
  return urlOrPath;
}

// Validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  description: z.string().optional(),
  iconUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

// Helper function to generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export class CategoryService {
  /**
   * Create a new category
   */
  async createCategory(data: z.infer<typeof createCategorySchema>) {
    // Check if name already exists first (name is the primary identifier)
    const existingByName = await prisma.videoCategory.findFirst({
      where: {
        name: data.name,
        deletedAt: null,
      },
    });

    if (existingByName) {
      throw new Error("Category with this name already exists");
    }

    // Generate slug if not provided, and make it unique if needed
    let slug = data.slug || generateSlug(data.name);
    
    // If slug was auto-generated, ensure it's unique
    if (!data.slug) {
      let uniqueSlug = slug;
      let counter = 1;
      while (await prisma.videoCategory.findFirst({
        where: {
          slug: uniqueSlug,
          deletedAt: null,
        },
      })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    } else {
      // If slug was provided, check if it conflicts
      const existingBySlug = await prisma.videoCategory.findFirst({
        where: {
          slug: slug,
          deletedAt: null,
        },
      });

      if (existingBySlug) {
        throw new Error("Category with this slug already exists");
      }
    }

    // Check for soft-deleted categories with the same name (prioritize name over slug)
    const softDeleted = await prisma.videoCategory.findFirst({
      where: {
        name: data.name,
        deletedAt: { not: null },
      },
    });

    if (softDeleted) {
      // Restore the soft-deleted category with new data
      // Use the unique slug we generated above
      const restored = await prisma.videoCategory.update({
        where: { id: softDeleted.id },
        data: {
          name: data.name,
          slug: slug,
          description: data.description,
          iconUrl: normalizeImageUrl(data.iconUrl) || null,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          deletedAt: null, // Restore by clearing deletedAt
        },
      });
      return restored;
    }

    // No existing category found, create new one
    const category = await prisma.videoCategory.create({
      data: {
        name: data.name,
        slug: slug,
        description: data.description,
        iconUrl: normalizeImageUrl(data.iconUrl) || null,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    return category;
  }

  /**
   * Get all categories (with pagination and filters)
   */
  async getCategories(params: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.videoCategory.findMany({
        where,
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.videoCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string) {
    const category = await prisma.videoCategory.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            videos: {
              where: {
                deletedAt: null,
              },
            },
            subcategories: {
              where: {
                deletedAt: null,
              },
            },
            collections: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string) {
    const category = await prisma.videoCategory.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            videos: {
              where: {
                deletedAt: null,
              },
            },
            subcategories: {
              where: {
                deletedAt: null,
              },
            },
            collections: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: z.infer<typeof updateCategorySchema>) {
    // Check if category exists
    const existing = await prisma.videoCategory.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new Error("Category not found");
    }

    // Check if name conflicts with another category (name is primary identifier)
    if (data.name) {
      const nameConflict = await prisma.videoCategory.findFirst({
        where: {
          id: { not: id },
          name: data.name,
          deletedAt: null,
        },
      });

      if (nameConflict) {
        throw new Error("Category with this name already exists");
      }
    }

    // Generate slug if name is provided but slug is not
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = generateSlug(data.name);
      
      // Make slug unique if it was auto-generated
      let uniqueSlug = slug;
      let counter = 1;
      while (await prisma.videoCategory.findFirst({
        where: {
          id: { not: id },
          slug: uniqueSlug,
          deletedAt: null,
        },
      })) {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    } else if (data.slug) {
      // If slug was provided, check if it conflicts
      const slugConflict = await prisma.videoCategory.findFirst({
        where: {
          id: { not: id },
          slug: data.slug,
          deletedAt: null,
        },
      });

      if (slugConflict) {
        throw new Error("Category with this slug already exists");
      }
    }

    const category = await prisma.videoCategory.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(slug && { slug: slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.iconUrl !== undefined && { iconUrl: normalizeImageUrl(data.iconUrl) || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return category;
  }

  /**
   * Delete category (soft delete)
   * Uses transaction and checks all relationships (direct and indirect)
   */
  async deleteCategory(id: string) {
    // Use transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // Check if category exists
      const category = await tx.videoCategory.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new Error("Category not found");
      }

      // Check all relationships (direct and indirect) using transaction client
      const { checkCategoryRelationships } = await import("../utils/relationship-checker");
      const relationshipCheck = await checkCategoryRelationships(id, tx);

      if (relationshipCheck.hasBlockingRelationships) {
        throw new Error(relationshipCheck.errorMessage || "Cannot delete category with associated data");
      }

      // Soft delete - all checks passed
      await tx.videoCategory.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      return { message: "Category deleted successfully" };
    });
  }

  /**
   * Toggle category active status
   */
  async toggleCategoryStatus(id: string) {
    const category = await prisma.videoCategory.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    const updated = await prisma.videoCategory.update({
      where: { id },
      data: {
        isActive: !category.isActive,
      },
    });

    return updated;
  }
}

export const categoryService = new CategoryService();

