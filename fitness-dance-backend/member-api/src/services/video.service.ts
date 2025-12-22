// member-api/src/services/video.service.ts
// Video service for Member API - Read-only operations

import prisma from "../config/database";

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

    return video;
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
}

export const videoService = new VideoService();

