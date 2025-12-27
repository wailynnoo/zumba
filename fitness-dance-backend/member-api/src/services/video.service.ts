// member-api/src/services/video.service.ts
// Video service for Member API - Read-only operations

import prisma from "../config/database";
import { r2StorageService } from "./r2-storage.service";

/**
 * Convert R2 key to signed URL (same as collection service)
 */
async function getFullImageUrl(relativePath: string | null | undefined): Promise<string | null> {
  if (!relativePath) return null;
  
  // If already a full URL (signed URL or external URL), return as is
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  
  // If it's an R2 key (starts with collections/, categories/, thumbnails/, etc.), generate signed URL
  // EXACTLY like collection service does
  if (relativePath.startsWith("collections/") || 
      relativePath.startsWith("categories/") || 
      relativePath.startsWith("thumbnails/") || 
      relativePath.startsWith("videos/") || 
      relativePath.startsWith("audio/")) {
    
    try {
      // Generate signed URL (expires in 1 hour) - same as collections
      if (r2StorageService.isConfigured()) {
        return await r2StorageService.getSignedUrl(relativePath, 3600);
      } else {
        console.warn("[Video Service] R2 not configured, cannot generate signed URL");
        return relativePath;
      }
    } catch (error) {
      console.error("[Video Service] Error generating signed URL:", error);
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

export class VideoService {
  /**
   * Get video by ID (for members)
   * Only returns published videos
   */
  async getVideoById(id: string) {
    const video = await prisma.video.findFirst({
      where: {
        id,
        isPublished: true,
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
        subcategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        collection: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!video) return null;

    // Convert thumbnail URL to signed URL
    const thumbnailUrl = await getFullImageUrl(video.thumbnailUrl);

    return {
      ...video,
      thumbnailUrl,
    };
  }

  /**
   * Increment view count for a video
   */
  async incrementViewCount(videoId: string): Promise<void> {
    await prisma.video.update({
      where: { id: videoId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get videos (for members) - with pagination and filters
   */
  async getVideos(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    subcategoryId?: string;
    collectionId?: string;
    videoType?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
      deletedAt: null,
    };

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }
    if (params.subcategoryId) {
      where.subcategoryId = params.subcategoryId;
    }
    if (params.collectionId) {
      where.collectionId = params.collectionId;
    }
    if (params.videoType) {
      where.videoType = params.videoType;
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    // Debug logging
    console.log('[VideoService] getVideos params:', JSON.stringify(params, null, 2));
    console.log('[VideoService] getVideos where clause:', JSON.stringify(where, null, 2));

    // Check total videos without filters (for debugging)
    const totalAllVideos = await prisma.video.count({
      where: {
        isPublished: true,
        deletedAt: null,
      },
    });
    console.log('[VideoService] Total published videos (no filters):', totalAllVideos);

    // If collectionId is provided, check if videos exist with that collectionId (including unpublished)
    if (params.collectionId) {
      const videosWithCollectionId = await prisma.video.count({
        where: {
          collectionId: params.collectionId,
        },
      });
      const publishedVideosWithCollectionId = await prisma.video.count({
        where: {
          collectionId: params.collectionId,
          isPublished: true,
          deletedAt: null,
        },
      });
      console.log('[VideoService] Videos with collectionId (all):', videosWithCollectionId);
      console.log('[VideoService] Videos with collectionId (published):', publishedVideosWithCollectionId);
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          durationSeconds: true,
          viewCount: true,
          videoType: true,
          audioUrl: true,
          hasAudioMode: true,
          createdAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          subcategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          collection: {
            select: {
              id: true,
              name: true,
              slug: true,
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
      prisma.video.count({ where }),
    ]);

    // Convert thumbnail URLs to signed URLs (same pattern as collection service)
    console.log('[VideoService] Starting thumbnail URL conversion for', videos.length, 'videos');
    const videosWithThumbnails = await Promise.all(
      videos.map(async (video: any) => {
        const originalThumbnail = video.thumbnailUrl;
        console.log(`[VideoService] Converting thumbnail for video "${video.title}": ${originalThumbnail}`);
        const convertedThumbnail = await getFullImageUrl(video.thumbnailUrl);
        console.log(`[VideoService] Conversion result - Original: ${originalThumbnail}, Converted: ${convertedThumbnail}`);
        return {
          ...video,
          thumbnailUrl: convertedThumbnail,
        };
      })
    );
    console.log('[VideoService] Thumbnail conversion complete. Sample:', videosWithThumbnails[0]?.thumbnailUrl);

    return {
      data: videosWithThumbnails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get video steps for videos in a collection
   * Returns step-by-step tutorial videos
   */
  async getVideoSteps(params: {
    page?: number;
    limit?: number;
    collectionId?: string;
    videoId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // If collectionId is provided, get steps for all videos in that collection
    if (params.collectionId) {
      // First get all video IDs in the collection
      const videosInCollection = await prisma.video.findMany({
        where: {
          collectionId: params.collectionId,
          isPublished: true,
          deletedAt: null,
        },
        select: { id: true },
      });
      
      where.videoId = {
        in: videosInCollection.map(v => v.id),
      };
    }

    // If specific videoId is provided
    if (params.videoId) {
      where.videoId = params.videoId;
    }

    const [steps, total] = await Promise.all([
      prisma.videoStep.findMany({
        where,
        include: {
          video: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              durationSeconds: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              collection: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: [
          { sortOrder: "asc" },
          { stepNumber: "asc" },
        ],
        skip,
        take: limit,
      }),
      prisma.videoStep.count({ where }),
    ]);

    // Convert thumbnail URLs to signed URLs
    // Use parent video's thumbnail if tutorial doesn't have its own
    const stepsWithThumbnails = await Promise.all(
      steps.map(async (step: any) => {
        // Prefer step's own thumbnail, fallback to parent video's thumbnail
        const rawThumbnail = step.thumbnailUrl || step.video?.thumbnailUrl;
        const thumbnailUrl = await getFullImageUrl(rawThumbnail);
        
        // Use parent video's title/description if step doesn't have its own
        const title = step.title || step.video?.title || 'Tutorial';
        const description = step.description || step.video?.description;
        
        return {
          ...step,
          title,
          description,
          thumbnailUrl,
          // Also include parent video thumbnail separately
          parentVideoThumbnail: step.video?.thumbnailUrl ? await getFullImageUrl(step.video.thumbnailUrl) : null,
        };
      })
    );

    return {
      data: stepsWithThumbnails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get video step by ID
   */
  async getVideoStepById(id: string) {
    const step = await prisma.videoStep.findFirst({
      where: {
        id,
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            videoType: true,
            isPublished: true,
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!step) return null;

    // Check if parent video is published
    if (!step.video.isPublished) return null;

    const thumbnailUrl = await getFullImageUrl(step.thumbnailUrl);

    return {
      ...step,
      thumbnailUrl,
    };
  }
}

export const videoService = new VideoService();

