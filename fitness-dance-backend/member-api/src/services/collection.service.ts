// member-api/src/services/collection.service.ts
// Collection service for Member API - Read-only operations

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
  
  // If it's an R2 key (starts with collections/, categories/, thumbnails/, etc.), generate signed URL
  if (relativePath.startsWith("collections/") || 
      relativePath.startsWith("categories/") || 
      relativePath.startsWith("thumbnails/") || 
      relativePath.startsWith("videos/") || 
      relativePath.startsWith("audio/")) {
    
    try {
      // Generate signed URL (expires in 1 hour)
      if (r2StorageService.isConfigured()) {
        return await r2StorageService.getSignedUrl(relativePath, 3600);
      } else {
        console.warn("[Collection Service] R2 not configured, cannot generate signed URL");
        return relativePath;
      }
    } catch (error) {
      console.error("[Collection Service] Error generating signed URL:", error);
      return relativePath;
    }
  }
  
  // Legacy: Handle old local file paths (uploads/collections/...)
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

export class CollectionService {
  /**
   * Get all active collections (for slider/featured)
   */
  async getCollections(params?: {
    featured?: boolean;
    categoryId?: string;
    includeCounts?: boolean;
  }) {
    const where: any = {
      isActive: true,
      deletedAt: null,
    };

    if (params?.featured) {
      where.isFeatured = true;
    }

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    const collections = await prisma.videoCollection.findMany({
      where,
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
              },
            },
          }
        : undefined,
    });

    // Convert thumbnailUrl from R2 key to signed URL
    const collectionsWithUrls = await Promise.all(
      collections.map(async (collection: any) => ({
        ...collection,
        thumbnailUrl: await getFullImageUrl(collection.thumbnailUrl),
      }))
    );
    
    return collectionsWithUrls;
  }

  /**
   * Get collection by ID (only active)
   */
  async getCollectionById(id: string) {
    const collection = await prisma.videoCollection.findFirst({
      where: {
        id,
        isActive: true,
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
            videos: {
              where: {
                isPublished: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      throw new Error("Collection not found");
    }

    // Convert thumbnailUrl from R2 key to signed URL
    const thumbnailUrl = await getFullImageUrl(collection.thumbnailUrl);
    return {
      ...collection,
      thumbnailUrl,
    };
  }

  /**
   * Get collection by slug (only active)
   */
  async getCollectionBySlug(slug: string) {
    const collection = await prisma.videoCollection.findFirst({
      where: {
        slug,
        isActive: true,
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
            videos: {
              where: {
                isPublished: true,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      throw new Error("Collection not found");
    }

    // Convert thumbnailUrl from R2 key to signed URL
    const thumbnailUrl = await getFullImageUrl(collection.thumbnailUrl);
    return {
      ...collection,
      thumbnailUrl,
    };
  }
}

export const collectionService = new CollectionService();

