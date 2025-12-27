// admin-api/src/services/collection.service.ts
// Collection service for Admin API - Full CRUD operations

import prisma from "../config/database";
import { z } from "zod";

/**
 * Convert full URL to relative path for database storage
 * If already relative, return as is
 */
function normalizeThumbnailUrl(urlOrPath: string | null | undefined): string | null {
  if (!urlOrPath) return null;
  
  // If it's an R2 key (starts with collections/, thumbnails/, etc.), return as is
  if (urlOrPath.startsWith("collections/") || 
      urlOrPath.startsWith("thumbnails/") || 
      urlOrPath.startsWith("videos/") || 
      urlOrPath.startsWith("audio/")) {
    return urlOrPath;
  }
  
  // If it's a full URL (starts with http), extract the path
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    try {
      const urlObj = new URL(urlOrPath);
      const urlPath = urlObj.pathname;
      // Remove leading slash: /uploads/collections/file.jpg -> uploads/collections/file.jpg
      return urlPath.startsWith("/") ? urlPath.substring(1) : urlPath;
    } catch {
      // If URL parsing fails, try to extract path manually
      const match = urlOrPath.match(/\/(uploads\/.*)$/);
      return match ? match[1] : urlOrPath;
    }
  }
  
  // Already a clean relative path
  return urlOrPath;
}

// Validation schemas
export const createCollectionSchema = z.object({
  categoryId: z.string().uuid("Category ID is required"),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens").optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional().or(z.literal("")),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateCollectionSchema = createCollectionSchema.partial().extend({
  categoryId: z.string().uuid().optional(),
});

// Helper function to generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export class CollectionService {
  /**
   * Create a new collection
   */
  async createCollection(data: z.infer<typeof createCollectionSchema>) {
    // Validate category exists
    const category = await prisma.videoCategory.findFirst({
      where: {
        id: data.categoryId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists (including soft-deleted)
    const activeExisting = await prisma.videoCollection.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
    });

    if (activeExisting) {
      throw new Error("Collection with this slug already exists");
    }

    // Check for soft-deleted collection with the same slug
    const softDeleted = await prisma.videoCollection.findFirst({
      where: {
        slug,
        deletedAt: { not: null },
      },
    });

    if (softDeleted) {
      // Restore the soft-deleted collection with new data
      const restored = await prisma.videoCollection.update({
        where: { id: softDeleted.id },
        data: {
          categoryId: data.categoryId,
          name: data.name,
          slug,
          description: data.description,
          thumbnailUrl: normalizeThumbnailUrl(data.thumbnailUrl) || null,
          isFeatured: data.isFeatured,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
          deletedAt: null, // Restore by clearing deletedAt
        },
      });
      return restored;
    }

    // No existing collection found, create new one
    const collection = await prisma.videoCollection.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description,
        thumbnailUrl: normalizeThumbnailUrl(data.thumbnailUrl) || null,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    return collection;
  }

  /**
   * Get all collections (with pagination and filters)
   */
  async getCollections(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params.isFeatured !== undefined) {
      where.isFeatured = params.isFeatured;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { slug: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [collections, total] = await Promise.all([
      prisma.videoCollection.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              videos: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.videoCollection.count({ where }),
    ]);

    return {
      data: collections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get collection by ID
   */
  async getCollectionById(id: string) {
    const collection = await prisma.videoCollection.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    if (!collection) {
      throw new Error("Collection not found");
    }

    return collection;
  }

  /**
   * Get collection by slug
   */
  async getCollectionBySlug(slug: string) {
    const collection = await prisma.videoCollection.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    if (!collection) {
      throw new Error("Collection not found");
    }

    return collection;
  }

  /**
   * Update collection
   */
  async updateCollection(id: string, data: z.infer<typeof updateCollectionSchema>) {
    // Check if collection exists
    const existing = await prisma.videoCollection.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new Error("Collection not found");
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await prisma.videoCategory.findFirst({
        where: {
          id: data.categoryId,
          deletedAt: null,
        },
      });

      if (!category) {
        throw new Error("Category not found");
      }
    }

    // Generate slug if name is provided but slug is not
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = generateSlug(data.name);
    }

    // Check if slug conflicts with another collection
    if (slug) {
      const conflict = await prisma.videoCollection.findFirst({
        where: {
          id: { not: id },
          slug,
          deletedAt: null,
        },
      });

      if (conflict) {
        throw new Error("Collection with this slug already exists");
      }
    }

    const collection = await prisma.videoCollection.update({
      where: { id },
      data: {
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.name && { name: data.name }),
        ...(slug && { slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.thumbnailUrl !== undefined && { thumbnailUrl: normalizeThumbnailUrl(data.thumbnailUrl) || null }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return collection;
  }

  /**
   * Delete collection (soft delete)
   */
  async deleteCollection(id: string) {
    // Check if collection exists
    const collection = await prisma.videoCollection.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            videos: true,
          },
        },
      },
    });

    if (!collection) {
      throw new Error("Collection not found");
    }

    // Check if collection has associated videos
    if (collection._count.videos > 0) {
      throw new Error("Cannot delete collection with associated videos");
    }

    // Soft delete
    await prisma.videoCollection.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: "Collection deleted successfully" };
  }

  /**
   * Toggle collection active status
   */
  async toggleCollectionStatus(id: string) {
    const collection = await prisma.videoCollection.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!collection) {
      throw new Error("Collection not found");
    }

    const updated = await prisma.videoCollection.update({
      where: { id },
      data: {
        isActive: !collection.isActive,
      },
    });

    return updated;
  }

  /**
   * Toggle collection featured status
   */
  async toggleFeaturedStatus(id: string) {
    const collection = await prisma.videoCollection.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!collection) {
      throw new Error("Collection not found");
    }

    const updated = await prisma.videoCollection.update({
      where: { id },
      data: {
        isFeatured: !collection.isFeatured,
      },
    });

    return updated;
  }
}

export const collectionService = new CollectionService();

