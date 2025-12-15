// lib/services/videoService.ts
// Video service for API calls

import api from "../api";
import { getAccessToken } from "../auth";

// URL Cache for signed URLs (expires in 1 hour, cache for 55 minutes to leave buffer)
interface CachedUrl {
  url: string;
  expiresAt: number;
}

const urlCache = new Map<string, CachedUrl>();

/**
 * Get cached URL if valid, otherwise return null
 */
function getCachedUrl(cacheKey: string): string | null {
  const cached = urlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }
  // Remove expired entry
  if (cached) {
    urlCache.delete(cacheKey);
  }
  return null;
}

/**
 * Cache a URL for 55 minutes (leave 5 min buffer before expiry)
 */
function setCachedUrl(cacheKey: string, url: string): void {
  urlCache.set(cacheKey, {
    url,
    expiresAt: Date.now() + 55 * 60 * 1000, // 55 minutes
  });
}

/**
 * Clear cached URL for a specific key
 */
function clearCachedUrl(cacheKey: string): void {
  urlCache.delete(cacheKey);
}

/**
 * Clear cached URL for a video's watch URL (exported for use in components)
 */
export function clearVideoWatchUrlCache(videoId: string): void {
  clearCachedUrl(`watch-${videoId}`);
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  subcategoryId: string | null;
  collectionId: string | null;
  cloudflareVideoId: string | null;
  videoType: "premium" | "free"; // 'premium' = requires subscription, 'free' = no subscription needed
  audioUrl: string | null;
  hasAudioMode: boolean;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number;
  isPublished: boolean;
  publishedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  collection?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CreateVideoData {
  title: string;
  description?: string;
  categoryId: string;
  subcategoryId?: string;
  collectionId?: string;
  videoType?: "premium" | "free"; // 'premium' = requires subscription, 'free' = no subscription needed
  hasAudioMode?: boolean;
  durationSeconds?: number;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface UpdateVideoData {
  title?: string;
  description?: string;
  categoryId?: string;
  subcategoryId?: string;
  collectionId?: string;
  videoType?: "premium" | "free"; // 'premium' = requires subscription, 'free' = no subscription needed
  hasAudioMode?: boolean;
  durationSeconds?: number;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface VideoListParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  subcategoryId?: string;
  collectionId?: string;
  danceStyleId?: string;
  intensityLevelId?: string;
  isPublished?: boolean;
  videoType?: "premium" | "free";
  search?: string;
}

export interface VideoListResponse {
  success: boolean;
  data: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const videoService = {
  /**
   * Get all videos with pagination and filters
   */
  async getVideos(params?: VideoListParams): Promise<VideoListResponse> {
    const response = await api.get<VideoListResponse>("/api/videos", { params });
    return response.data;
  },

  /**
   * Get video by ID
   */
  async getVideoById(id: string): Promise<Video> {
    const response = await api.get<{ success: boolean; data: Video }>(`/api/videos/${id}`);
    return response.data.data;
  },

  /**
   * Create a new video
   */
  async createVideo(data: CreateVideoData): Promise<Video> {
    const response = await api.post<{ success: boolean; data: Video }>("/api/videos", data);
    return response.data.data;
  },

  /**
   * Update video
   */
  async updateVideo(id: string, data: UpdateVideoData): Promise<Video> {
    const response = await api.put<{ success: boolean; data: Video }>(`/api/videos/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete video
   */
  async deleteVideo(id: string): Promise<void> {
    await api.delete(`/api/videos/${id}`);
  },

  /**
   * Toggle published status
   */
  async togglePublishedStatus(id: string): Promise<Video> {
    const response = await api.patch<{ success: boolean; data: Video }>(`/api/videos/${id}/publish`);
    return response.data.data;
  },

  /**
   * Upload video file
   * @param onProgress - Optional callback for upload progress (0-100)
   */
  async uploadVideo(
    id: string,
    videoFile: File,
    onProgress?: (progress: number) => void
  ): Promise<{ videoUrl: string; video: Video }> {
    console.log("[Video Service] Starting video upload:", {
      videoId: id,
      fileName: videoFile.name,
      fileSize: videoFile.size,
      fileType: videoFile.type,
    });

    const formData = new FormData();
    formData.append("video", videoFile);

    try {
      // Don't set Content-Type manually - let axios set it with boundary
      const response = await api.post<{
        success: boolean;
        data: { videoUrl: string; video: Video };
      }>(
        `/api/videos/${id}/video`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          },
        }
      );

      console.log("[Video Service] Video upload successful:", response.data);
      if (onProgress) onProgress(100);
      
      // Clear cache for this video's watch URL since it's been updated
      clearCachedUrl(`watch-${id}`);
      
      return response.data.data;
    } catch (error: any) {
      console.error("[Video Service] Video upload error:", error);
      console.error("[Video Service] Error response:", error.response?.data);
      throw error;
    }
  },

  /**
   * Upload thumbnail
   * @param onProgress - Optional callback for upload progress (0-100)
   */
  async uploadThumbnail(
    id: string,
    thumbnailFile: File,
    onProgress?: (progress: number) => void
  ): Promise<{ thumbnailUrl: string; video: Video }> {
    console.log("[Video Service] Starting thumbnail upload:", {
      videoId: id,
      fileName: thumbnailFile.name,
      fileSize: thumbnailFile.size,
      fileType: thumbnailFile.type,
    });

    const formData = new FormData();
    formData.append("thumbnail", thumbnailFile);

    try {
      // Don't set Content-Type manually - let axios set it with boundary
      const response = await api.post<{
        success: boolean;
        data: { thumbnailUrl: string; video: Video };
      }>(
        `/api/videos/${id}/thumbnail`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          },
        }
      );

      console.log("[Video Service] Thumbnail upload successful:", response.data);
      if (onProgress) onProgress(100);
      
      // Clear cache for this video's thumbnail URL since it's been updated
      clearCachedUrl(`thumbnail-${id}`);
      
      return response.data.data;
    } catch (error: any) {
      console.error("[Video Service] Thumbnail upload error:", error);
      console.error("[Video Service] Error response:", error.response?.data);
      throw error;
    }
  },

  /**
   * Upload audio file
   * @param onProgress - Optional callback for upload progress (0-100)
   */
  async uploadAudio(
    id: string,
    audioFile: File,
    onProgress?: (progress: number) => void
  ): Promise<{ audioUrl: string; video: Video }> {
    console.log("[Video Service] Starting audio upload:", {
      videoId: id,
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
    });

    const formData = new FormData();
    formData.append("audio", audioFile);

    try {
      // Don't set Content-Type manually - let axios set it with boundary
      const response = await api.post<{
        success: boolean;
        data: { audioUrl: string; video: Video };
      }>(
        `/api/videos/${id}/audio`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          },
        }
      );

      console.log("[Video Service] Audio upload successful:", response.data);
      if (onProgress) onProgress(100);
      return response.data.data;
    } catch (error: any) {
      console.error("[Video Service] Audio upload error:", error);
      console.error("[Video Service] Error response:", error.response?.data);
      throw error;
    }
  },

  /**
   * Delete video file
   */
  async deleteVideoFile(id: string): Promise<void> {
    await api.delete(`/api/videos/${id}/video`);
  },

  /**
   * Delete thumbnail
   */
  async deleteThumbnail(id: string): Promise<void> {
    await api.delete(`/api/videos/${id}/thumbnail`);
  },

  /**
   * Delete audio file
   */
  async deleteAudio(id: string): Promise<void> {
    await api.delete(`/api/videos/${id}/audio`);
  },

  /**
   * Get video watch URL (signed URL for direct R2 access)
   * Fetches signed URL from API - much faster than streaming through API
   * @returns Promise<string> - Signed URL that expires in 1 hour
   */
  async getVideoWatchUrl(videoId: string): Promise<string> {
    const cacheKey = `watch-${videoId}`;
    const cached = getCachedUrl(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<{
        success: boolean;
        data: { watchUrl: string; expiresIn: number };
      }>(`/api/videos/${videoId}/watch-url`);
      
      const url = response.data.data.watchUrl;
      setCachedUrl(cacheKey, url);
      return url;
    } catch (error: any) {
      console.error("[Video Service] Error fetching watch URL:", error);
      throw error;
    }
  },

  /**
   * Get video streaming URL (for admin panel) - DEPRECATED
   * Use getVideoWatchUrl() instead for better performance
   * @deprecated Use getVideoWatchUrl() instead
   */
  getVideoStreamUrl(videoId: string): string {
    // Get base URL from environment or use default
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
    
    // Get access token from auth
    const token = getAccessToken();
    
    if (!token) {
      console.warn("[Video Service] No access token available for video streaming");
      return `${baseURL}/api/videos/${videoId}/stream`;
    }
    
    // Append token as query parameter for video streaming
    // HTML video elements can't send Authorization headers
    return `${baseURL}/api/videos/${videoId}/stream?token=${encodeURIComponent(token)}`;
  },

  /**
   * Get video audio signed URL
   * Fetches signed URL from API for audio file
   * @returns Promise<string> - Signed URL that expires in 1 hour
   */
  async getAudioUrl(videoId: string): Promise<string> {
    const cacheKey = `audio-${videoId}`;
    const cached = getCachedUrl(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<{
        success: boolean;
        data: { audioUrl: string; expiresIn: number };
      }>(`/api/videos/${videoId}/audio-url`);
      
      const url = response.data.data.audioUrl;
      setCachedUrl(cacheKey, url);
      return url;
    } catch (error: any) {
      console.error("[Video Service] Error fetching audio signed URL:", error);
      throw error;
    }
  },

  /**
   * Get batch thumbnail signed URLs
   * @param videoIds - Array of video IDs
   * @returns Map of video ID to thumbnail signed URL
   */
  async getBatchThumbnailUrls(videoIds: string[]): Promise<Record<string, string>> {
    if (videoIds.length === 0) return {};
    
    try {
      // Check cache for each video ID
      const cachedUrls: Record<string, string> = {};
      const uncachedIds: string[] = [];
      
      videoIds.forEach((id) => {
        const cacheKey = `thumbnail-${id}`;
        const cached = getCachedUrl(cacheKey);
        if (cached) {
          cachedUrls[id] = cached;
        } else {
          uncachedIds.push(id);
        }
      });
      
      // Fetch uncached URLs in batch
      if (uncachedIds.length > 0) {
        const response = await api.post<{
          success: boolean;
          data: Record<string, string>;
        }>("/api/videos/thumbnail-urls", { videoIds: uncachedIds });
        
        // Cache the new URLs
        Object.entries(response.data.data).forEach(([id, url]) => {
          setCachedUrl(`thumbnail-${id}`, url);
          cachedUrls[id] = url;
        });
      }
      
      return cachedUrls;
    } catch (error: any) {
      console.error("[Video Service] Error fetching batch thumbnail URLs:", error);
      return {};
    }
  },

  /**
   * Get video thumbnail signed URL
   * Fetches signed URL from API for thumbnail image
   * @returns Promise<string> - Signed URL that expires in 1 hour
   */
  async getThumbnailUrl(videoId: string): Promise<string> {
    const cacheKey = `thumbnail-${videoId}`;
    const cached = getCachedUrl(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await api.get<{
        success: boolean;
        data: { thumbnailUrl: string; expiresIn: number };
      }>(`/api/videos/${videoId}/thumbnail-url`);
      
      const url = response.data.data.thumbnailUrl;
      setCachedUrl(cacheKey, url);
      return url;
    } catch (error: any) {
      console.error("[Video Service] Error fetching thumbnail signed URL:", error);
      throw error;
    }
  },
};

export default videoService;

