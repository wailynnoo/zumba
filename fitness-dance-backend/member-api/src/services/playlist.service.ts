// member-api/src/services/playlist.service.ts
// Playlist service for Member API

import prisma from "../config/database";
import { r2StorageService } from "./r2-storage.service";

/**
 * Convert R2 key to signed URL for thumbnails
 */
async function getFullImageUrl(relativePath: string | null | undefined): Promise<string | null> {
  if (!relativePath) return null;
  
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  
  if (relativePath.startsWith("collections/") || 
      relativePath.startsWith("categories/") || 
      relativePath.startsWith("thumbnails/") || 
      relativePath.startsWith("videos/") || 
      relativePath.startsWith("audio/")) {
    
    try {
      if (r2StorageService.isConfigured()) {
        return await r2StorageService.getSignedUrl(relativePath, 3600);
      } else {
        console.warn("[Playlist Service] R2 not configured, cannot generate signed URL");
        return relativePath;
      }
    } catch (error) {
      console.error("[Playlist Service] Error generating signed URL:", error);
      return relativePath;
    }
  }
  
  return relativePath;
}

export class PlaylistService {
  /**
   * Get all playlists for a user
   */
  async getPlaylists(userId: string) {
    const playlists = await prisma.playlist.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        items: {
          where: {
            video: {
              deletedAt: null,
            },
          },
          include: {
            video: {
              select: {
                thumbnailUrl: true,
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
          take: 1, // Just to get thumbnail
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Process playlists to add thumbnail and video count
    const processedPlaylists = await Promise.all(
      playlists.map(async (playlist) => {
        // Get thumbnail from first video
        let thumbnailUrl: string | null = null;
        if (playlist.items.length > 0 && playlist.items[0].video.thumbnailUrl) {
          thumbnailUrl = await getFullImageUrl(playlist.items[0].video.thumbnailUrl);
        }

        return {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
          thumbnailUrl,
          videoCount: playlist._count.items,
          createdAt: playlist.createdAt,
          updatedAt: playlist.updatedAt,
        };
      })
    );

    return processedPlaylists;
  }

  /**
   * Get playlist by ID with videos
   */
  async getPlaylistById(playlistId: string, userId: string) {
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
        deletedAt: null,
      },
      include: {
        items: {
          where: {
            video: {
              deletedAt: null,
            },
          },
          include: {
            video: {
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
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!playlist) {
      return null;
    }

    // Process videos with thumbnail URLs
    const videos = await Promise.all(
      playlist.items.map(async (item) => {
        const video = item.video;
        const thumbnailUrl = await getFullImageUrl(video.thumbnailUrl || null);

        return {
          id: video.id,
          title: video.title,
          description: video.description,
          categoryId: video.categoryId,
          subcategoryId: video.subcategoryId,
          collectionId: video.collectionId,
          cloudflareVideoId: video.cloudflareVideoId,
          videoType: video.videoType,
          thumbnailUrl,
          durationSeconds: video.durationSeconds,
          viewCount: video.viewCount,
          isPublished: video.isPublished,
          category: video.category,
          subcategory: video.subcategory,
          collection: video.collection,
          sortOrder: item.sortOrder,
        };
      })
    );

    // Get playlist thumbnail from first video
    let thumbnailUrl: string | null = null;
    if (videos.length > 0 && videos[0].thumbnailUrl) {
      thumbnailUrl = videos[0].thumbnailUrl;
    }

    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      thumbnailUrl,
      videoCount: playlist._count.items,
      videos,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(userId: string, name: string, description?: string) {
    const playlist = await prisma.playlist.create({
      data: {
        userId,
        name,
        description,
      },
    });

    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      thumbnailUrl: null,
      videoCount: 0,
      createdAt: playlist.createdAt,
      updatedAt: playlist.updatedAt,
    };
  }

  /**
   * Update playlist
   */
  async updatePlaylist(playlistId: string, userId: string, name?: string, description?: string) {
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
        deletedAt: null,
      },
    });

    if (!playlist) {
      return null;
    }

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        items: {
          where: {
            video: {
              deletedAt: null,
            },
          },
          include: {
            video: {
              select: {
                thumbnailUrl: true,
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
          take: 1,
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    // Get thumbnail
    let thumbnailUrl: string | null = null;
    if (updated.items.length > 0 && updated.items[0].video.thumbnailUrl) {
      thumbnailUrl = await getFullImageUrl(updated.items[0].video.thumbnailUrl);
    }

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      thumbnailUrl,
      videoCount: updated._count.items,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete playlist (soft delete)
   */
  async deletePlaylist(playlistId: string, userId: string) {
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
        deletedAt: null,
      },
    });

    if (!playlist) {
      return false;
    }

    await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        deletedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Add video to playlist
   */
  async addVideoToPlaylist(playlistId: string, videoId: string, userId: string) {
    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
        deletedAt: null,
      },
    });

    if (!playlist) {
      return false;
    }

    // Check if video exists and is not deleted
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        deletedAt: null,
      },
    });

    if (!video) {
      return false;
    }

    // Check if video is already in playlist
    const existingItem = await prisma.playlistItem.findUnique({
      where: {
        playlistId_videoId: {
          playlistId,
          videoId,
        },
      },
    });

    if (existingItem) {
      return true; // Already added
    }

    // Get max sort order
    const maxSortOrder = await prisma.playlistItem.findFirst({
      where: { playlistId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const newSortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

    // Add video to playlist
    await prisma.playlistItem.create({
      data: {
        playlistId,
        videoId,
        sortOrder: newSortOrder,
      },
    });

    return true;
  }

  /**
   * Remove video from playlist
   */
  async removeVideoFromPlaylist(playlistId: string, videoId: string, userId: string) {
    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
        deletedAt: null,
      },
    });

    if (!playlist) {
      return false;
    }

    // Remove video from playlist
    await prisma.playlistItem.deleteMany({
      where: {
        playlistId,
        videoId,
      },
    });

    return true;
  }

  /**
   * Reorder videos in playlist
   */
  async reorderVideos(playlistId: string, videoIds: string[], userId: string) {
    // Verify playlist belongs to user
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
        deletedAt: null,
      },
    });

    if (!playlist) {
      return false;
    }

    // Update sort orders
    await Promise.all(
      videoIds.map((videoId, index) =>
        prisma.playlistItem.updateMany({
          where: {
            playlistId,
            videoId,
          },
          data: {
            sortOrder: index,
          },
        })
      )
    );

    return true;
  }

  /**
   * Get playlist count for user
   */
  async getPlaylistCount(userId: string) {
    const count = await prisma.playlist.count({
      where: {
        userId,
        deletedAt: null,
      },
    });

    return count;
  }
}

export const playlistService = new PlaylistService();

