// lib/services/videoStepService.ts
// Video Step service for API calls

import api from "../api";

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

export interface VideoStep {
  id: string;
  videoId: string;
  stepNumber: number;
  title: string;
  description: string | null;
  cloudflareVideoId: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVideoStepData {
  stepNumber: number;
  title: string;
  description?: string;
  cloudflareVideoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  sortOrder?: number;
}

export interface UpdateVideoStepData {
  stepNumber?: number;
  title?: string;
  description?: string | null;
  cloudflareVideoId?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  sortOrder?: number;
}

const videoStepService = {
  /**
   * Get all steps for a video
   */
  async getVideoSteps(videoId: string): Promise<VideoStep[]> {
    const response = await api.get<{ success: boolean; data: VideoStep[] }>(`/api/videos/${videoId}/steps`);
    return response.data.data;
  },

  /**
   * Get video step by ID
   */
  async getVideoStepById(id: string): Promise<VideoStep> {
    const response = await api.get<{ success: boolean; data: VideoStep }>(`/api/video-steps/${id}`);
    return response.data.data;
  },

  /**
   * Create a new video step
   */
  async createVideoStep(videoId: string, data: CreateVideoStepData): Promise<VideoStep> {
    const response = await api.post<{ success: boolean; data: VideoStep }>(`/api/videos/${videoId}/steps`, data);
    return response.data.data;
  },

  /**
   * Update video step
   */
  async updateVideoStep(id: string, data: UpdateVideoStepData): Promise<VideoStep> {
    const response = await api.put<{ success: boolean; data: VideoStep }>(`/api/video-steps/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete video step
   */
  async deleteVideoStep(id: string): Promise<void> {
    await api.delete(`/api/video-steps/${id}`);
  },

  /**
   * Reorder video steps
   */
  async reorderVideoSteps(videoId: string, stepIds: string[]): Promise<void> {
    await api.patch(`/api/videos/${videoId}/steps/reorder`, { stepIds });
  },

  /**
   * Upload video file for a step
   */
  async uploadStepVideo(stepId: string, file: File, onProgress?: (progress: number) => void): Promise<VideoStep> {
    const formData = new FormData();
    formData.append("video", file);

    const response = await api.post<{ success: boolean; data: VideoStep }>(
      `/api/video-steps/${stepId}/video`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );
    return response.data.data;
  },

  /**
   * Get signed URL for a step's video file
   */
  async getStepVideoUrl(stepId: string): Promise<string> {
    const cacheKey = `step-video-${stepId}`;
    const cached = getCachedUrl(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await api.get<{ success: boolean; data: { videoUrl: string; expiresIn: number } }>(
      `/api/video-steps/${stepId}/video-url`
    );
    const url = response.data.data.videoUrl;
    setCachedUrl(cacheKey, url);
    return url;
  },
};

export default videoStepService;

