// admin-api/src/services/video.service.ts
// Video service for Admin API - Full CRUD operations

import prisma from "../config/database";
import { z } from "zod";
import { r2StorageService } from "./r2-storage.service";

// Validation schemas
export const createVideoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  collectionId: z.string().uuid().optional(),
  videoType: z.enum(["premium", "free"]).default("premium"), // 'premium' = requires subscription, 'free' = no subscription needed
  hasAudioMode: z.boolean().default(true),
  durationSeconds: z.number().int().positive().optional(),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const updateVideoSchema = createVideoSchema.partial().extend({
  cloudflareVideoId: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional(),
});

export class VideoService {
  /**
   * Get all videos (with pagination and filters)
   */
  async getVideos(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    subcategoryId?: string;
    collectionId?: string;
    isPublished?: boolean;
    videoType?: string;
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
    if (params.subcategoryId) {
      where.subcategoryId = params.subcategoryId;
    }
    if (params.collectionId) {
      where.collectionId = params.collectionId;
    }
    if (params.isPublished !== undefined) {
      where.isPublished = params.isPublished;
    }
    if (params.videoType) {
      where.videoType = params.videoType;
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { category: { name: { contains: params.search, mode: "insensitive" } } },
        { subcategory: { name: { contains: params.search, mode: "insensitive" } } },
        { collection: { name: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
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
        orderBy: [
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.video.count({ where }),
    ]);

    return {
      data: videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get videos by IDs (for batch operations)
   */
  async getVideosByIds(ids: string[]) {
    const videos = await prisma.video.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      select: {
        id: true,
        thumbnailUrl: true,
      },
    });
    return videos;
  }

  /**
   * Get video by ID
   */
  async getVideoById(id: string) {
    const video = await prisma.video.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        category: true,
        subcategory: true,
        collection: true,
      },
    });

    if (!video) {
      throw new Error("Video not found");
    }

    return video;
  }

  /**
   * Create a new video
   */
  async createVideo(data: z.infer<typeof createVideoSchema>) {
    // Validate relationships exist
    await this.validateRelationships(data);

    const video = await prisma.video.create({
      data: {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        collectionId: data.collectionId,
        videoType: data.videoType,
        hasAudioMode: data.hasAudioMode,
        durationSeconds: data.durationSeconds,
        isPublished: data.isPublished,
        sortOrder: data.sortOrder,
        publishedAt: data.isPublished ? new Date() : null,
      },
      include: {
        category: true,
        subcategory: true,
        collection: true,
      },
    });

    return video;
  }

  /**
   * Update video
   */
  async updateVideo(id: string, data: z.infer<typeof updateVideoSchema>) {
    // Check if video exists
    const existing = await prisma.video.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new Error("Video not found");
    }

    // Validate relationships if provided
    if (data.categoryId || data.subcategoryId || data.collectionId || 
        data.collectionId) {
      await this.validateRelationships(data as any);
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.subcategoryId !== undefined) updateData.subcategoryId = data.subcategoryId;
    if (data.collectionId !== undefined) updateData.collectionId = data.collectionId;
    if (data.videoType !== undefined) updateData.videoType = data.videoType;
    if (data.hasAudioMode !== undefined) updateData.hasAudioMode = data.hasAudioMode;
    if (data.durationSeconds !== undefined) updateData.durationSeconds = data.durationSeconds;
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished;
      updateData.publishedAt = data.isPublished ? new Date() : null;
    }
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    
    // Handle file URLs (from uploads)
    if (data.cloudflareVideoId !== undefined) updateData.cloudflareVideoId = data.cloudflareVideoId;
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.audioUrl !== undefined) updateData.audioUrl = data.audioUrl;
    
    // Handle undefined values for optional fields (set to null)
    if (data.subcategoryId === null) updateData.subcategoryId = null;
    if (data.collectionId === null) updateData.collectionId = null;
    if (data.cloudflareVideoId === null) updateData.cloudflareVideoId = null;
    if (data.thumbnailUrl === null) updateData.thumbnailUrl = null;
    if (data.audioUrl === null) updateData.audioUrl = null;

    const video = await prisma.video.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subcategory: true,
        collection: true,
      },
    });

    return video;
  }

  /**
   * Delete video (soft delete)
   */
  async deleteVideo(id: string) {
    const video = await prisma.video.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!video) {
      throw new Error("Video not found");
    }

    // Soft delete
    await prisma.video.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Delete files from R2 if they exist
    if (video.cloudflareVideoId) {
      // Note: cloudflareVideoId might be a URL or ID, handle accordingly
      try {
        await r2StorageService.deleteFile(video.cloudflareVideoId);
      } catch (error) {
        console.error("Error deleting video file from R2:", error);
      }
    }
    if (video.thumbnailUrl) {
      try {
        await r2StorageService.deleteFile(video.thumbnailUrl);
      } catch (error) {
        console.error("Error deleting thumbnail from R2:", error);
      }
    }
    if (video.audioUrl) {
      try {
        await r2StorageService.deleteFile(video.audioUrl);
      } catch (error) {
        console.error("Error deleting audio file from R2:", error);
      }
    }

    return { success: true };
  }

  /**
   * Toggle video published status
   */
  async togglePublishedStatus(id: string) {
    const video = await prisma.video.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!video) {
      throw new Error("Video not found");
    }

    const isPublished = !video.isPublished;

    const updated = await prisma.video.update({
      where: { id },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      include: {
        category: true,
        subcategory: true,
        collection: true,
      },
    });

    return updated;
  }

  /**
   * Validate relationships exist
   */
  private async validateRelationships(data: {
    categoryId?: string;
    subcategoryId?: string;
    collectionId?: string;
  }) {
    if (data.categoryId) {
      const category = await prisma.videoCategory.findFirst({
        where: { id: data.categoryId, deletedAt: null },
      });
      if (!category) {
        throw new Error("Category not found");
      }
    }

    if (data.subcategoryId) {
      const subcategory = await prisma.videoSubcategory.findFirst({
        where: { id: data.subcategoryId, deletedAt: null },
      });
      if (!subcategory) {
        throw new Error("Subcategory not found");
      }
    }

    if (data.collectionId) {
      const collection = await prisma.videoCollection.findFirst({
        where: { id: data.collectionId, deletedAt: null },
      });
      if (!collection) {
        throw new Error("Collection not found");
      }
    }
  }
}

export const videoService = new VideoService();

