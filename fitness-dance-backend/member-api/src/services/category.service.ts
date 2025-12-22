// member-api/src/services/category.service.ts
// Category service for Member API - Read-only operations

import prisma from "../config/database";
import { r2StorageService } from "./r2-storage.service";

/**
 * Convert R2 key to signed URL (like admin API)
 */
async function getFullImageUrl(relativePath: string | null | undefined): Promise<string | null> {
  if (!relativePath) return null;
  
  // If already a full URL (signed URL or external URL), return as is
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  
  // If it's an R2 key (starts with categories/, collections/, etc.), generate signed URL
  if (relativePath.startsWith("categories/") || 
      relativePath.startsWith("collections/") || 
      relativePath.startsWith("thumbnails/") || 
      relativePath.startsWith("videos/") || 
      relativePath.startsWith("audio/")) {
    
    try {
      // Generate signed URL (expires in 1 hour)
      if (r2StorageService.isConfigured()) {
        return await r2StorageService.getSignedUrl(relativePath, 3600);
      } else {
        console.warn("[Category Service] R2 not configured, cannot generate signed URL");
        return relativePath;
      }
    } catch (error) {
      console.error("[Category Service] Error generating signed URL:", error);
      return relativePath;
    }
  }
  
  // Legacy: Handle old local file paths (uploads/categories/...)
  const port = process.env.PORT || 3001;
  let baseUrl = process.env.BASE_URL || process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${port}`;
  
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    const protocol = process.env.NODE_ENV === "production" ? "https://" : "http://";
    baseUrl = `${protocol}${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/$/, "");
  
  const finalPath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
  return `${baseUrl}/${finalPath}`;
}

export class CategoryService {
  /**
   * Get all active categories
   */
  async getCategories(params?: {
    includeCounts?: boolean;
  }) {
    const categories = await prisma.videoCategory.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
      include: params?.includeCounts
        ? {
            _count: {
              select: {
                videos: {
                  where: {
                    isPublished: true,
                    deletedAt: null,
                  },
                },
                subcategories: {
                  where: {
                    isActive: true,
                    deletedAt: null,
                  },
                },
                collections: {
                  where: {
                    isActive: true,
                    deletedAt: null,
                  },
                },
              },
            },
          }
        : undefined,
    });

    // Convert iconUrl from R2 key to signed URL
    const categoriesWithUrls = await Promise.all(
      categories.map(async (category: any) => ({
        ...category,
        iconUrl: await getFullImageUrl(category.iconUrl),
      }))
    );
    
    return categoriesWithUrls;
  }

  /**
   * Get category by ID (only active)
   */
  async getCategoryById(id: string) {
    const category = await prisma.videoCategory.findFirst({
      where: {
        id,
        isActive: true,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            videos: {
              where: {
                isPublished: true,
                deletedAt: null,
              },
            },
            subcategories: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
            collections: {
              where: {
                isActive: true,
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

    // Convert iconUrl from R2 key to signed URL
    const iconUrl = await getFullImageUrl(category.iconUrl);
    return {
      ...category,
      iconUrl,
    };
  }

  /**
   * Get category by slug (only active)
   */
  async getCategoryBySlug(slug: string) {
    const category = await prisma.videoCategory.findFirst({
      where: {
        slug,
        isActive: true,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            videos: {
              where: {
                isPublished: true,
                deletedAt: null,
              },
            },
            subcategories: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
            collections: {
              where: {
                isActive: true,
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

    // Convert iconUrl from R2 key to signed URL
    const iconUrl = await getFullImageUrl(category.iconUrl);
    return {
      ...category,
      iconUrl,
    };
  }
}

export const categoryService = new CategoryService();

