// member-api/src/controllers/video.controller.ts
// Video controller for Member API - Streaming and read operations

import { Response } from "express";
import { videoService } from "../services/video.service";
import { subscriptionService } from "../services/subscription.service";
import { r2StorageService } from "../services/r2-storage.service";
import { AuthRequest } from "../middleware/auth.middleware";

export class VideoController {
  /**
   * Stream video file
   * GET /api/videos/:id/stream
   * Supports Range requests for video seeking
   */
  async streamVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Get video
      const video = await videoService.getVideoById(id);

      if (!video) {
        res.status(404).json({
          success: false,
          message: "Video not found",
        });
        return;
      }

      // Check if premium video
      if (video.videoType === "premium") {
        // Check subscription
        const hasSubscription = await subscriptionService.hasActiveSubscription(userId);
        if (!hasSubscription) {
          res.status(403).json({
            success: false,
            message: "Subscription required to watch premium videos",
          });
          return;
        }
      }

      // Check if video file exists
      if (!video.cloudflareVideoId) {
        res.status(404).json({
          success: false,
          message: "Video file not found",
        });
        return;
      }

      // Get Range header for partial content support
      const range = req.headers.range;

      // Stream video from R2
      const streamData = await r2StorageService.streamFile(video.cloudflareVideoId, range);

      // Set response headers
      res.setHeader("Content-Type", streamData.contentType);
      res.setHeader("Accept-Ranges", streamData.acceptRanges);
      res.setHeader("Content-Length", streamData.contentLength);

      if (range) {
        // Partial content (206)
        res.status(206);
        res.setHeader("Content-Range", streamData.contentRange);
      } else {
        // Full content (200)
        res.status(200);
      }

      // Increment view count (only on first request, not on range requests)
      if (!range || range.startsWith("bytes=0-")) {
        videoService.incrementViewCount(id).catch((error) => {
          console.error("Failed to increment view count:", error);
        });
      }

      // Pipe stream to response
      streamData.stream.pipe(res);

      // Handle stream errors
      streamData.stream.on("error", (error) => {
        console.error("Stream error:", error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error streaming video",
          });
        }
      });
    } catch (error: any) {
      console.error("Error streaming video:", error);

      if (!res.headersSent) {
        const statusCode = error.message === "Invalid range" ? 416 : 500;
        res.status(statusCode).json({
          success: false,
          message: error.message || "Failed to stream video",
        });
      }
    }
  }

  /**
   * Get video details (metadata only, no streaming)
   * GET /api/videos/:id
   */
  async getVideo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const video = await videoService.getVideoById(id);

      if (!video) {
        res.status(404).json({
          success: false,
          message: "Video not found",
        });
        return;
      }

      // Check if premium video
      if (video.videoType === "premium") {
        const hasSubscription = await subscriptionService.hasActiveSubscription(userId);
        if (!hasSubscription) {
          res.status(403).json({
            success: false,
            message: "Subscription required to access premium videos",
          });
          return;
        }
      }

      // Don't return cloudflareVideoId - use stream endpoint instead
      const { cloudflareVideoId, ...videoData } = video;

      res.status(200).json({
        success: true,
        data: videoData,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch video",
      });
    }
  }

  /**
   * Get list of videos
   * GET /api/videos
   */
  async getVideos(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const categoryId = req.query.categoryId as string | undefined;
      const subcategoryId = req.query.subcategoryId as string | undefined;
      const collectionId = req.query.collectionId as string | undefined;
      const videoType = req.query.videoType as string | undefined;
      const search = req.query.search as string | undefined;

      console.log('[VideoController] getVideos request query:', {
        page,
        limit,
        categoryId,
        subcategoryId,
        collectionId,
        videoType,
        search,
        rawQuery: req.query,
      });

      const result = await videoService.getVideos({
        page,
        limit,
        categoryId,
        subcategoryId,
        collectionId,
        videoType,
        search,
      });

      console.log('[VideoController] getVideos result:', {
        videosCount: result.data.length,
        total: result.pagination.total,
        page: result.pagination.page,
        totalPages: result.pagination.totalPages,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch videos",
      });
    }
  }

  /**
   * Get video watch URL (signed URL for direct R2 access)
   * GET /api/videos/:id/watch-url
   * Checks subscription for premium videos
   * Returns signed URL that expires in 1 hour
   */
  async getVideoWatchUrl(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Get video
      const video = await videoService.getVideoById(id);

      if (!video) {
        res.status(404).json({
          success: false,
          message: "Video not found",
        });
        return;
      }

      // Check if video is published
      if (!video.isPublished) {
        res.status(404).json({
          success: false,
          message: "Video not found",
        });
        return;
      }

      // Check if premium video
      if (video.videoType === "premium") {
        // Check subscription
        const hasSubscription = await subscriptionService.hasActiveSubscription(userId);
        if (!hasSubscription) {
          res.status(403).json({
            success: false,
            message: "Subscription required to watch premium videos",
          });
          return;
        }
      }

      // Check if video file exists
      if (!video.cloudflareVideoId) {
        res.status(404).json({
          success: false,
          message: "Video file not found",
        });
        return;
      }

      // Generate signed URL (expires in 15 minutes for security)
      // Short expiration prevents URL sharing/downloading
      const signedUrl = await r2StorageService.getSignedUrl(
        video.cloudflareVideoId,
        900 // 15 minutes - short enough to prevent sharing, long enough for watching
      );

      // Increment view count (track that user watched video)
      videoService.incrementViewCount(id).catch((error) => {
        console.error("Failed to increment view count:", error);
      });

      res.status(200).json({
        success: true,
        data: {
          watchUrl: signedUrl,
          expiresIn: 900, // 15 minutes
        },
      });
    } catch (error: any) {
      console.error("[Video Controller] Error generating watch URL:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate watch URL",
      });
    }
  }

  /**
   * Get video steps (step-by-step tutorials)
   * GET /api/videos/steps
   */
  async getVideoSteps(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const collectionId = req.query.collectionId as string | undefined;
      const videoId = req.query.videoId as string | undefined;

      const result = await videoService.getVideoSteps({
        page,
        limit,
        collectionId,
        videoId,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch video steps",
      });
    }
  }

  /**
   * Get video audio URL (signed URL for audio-only playback)
   * GET /api/videos/:id/audio-url
   * Returns the audio track URL for videos with hasAudioMode=true
   */
  async getVideoAudioUrl(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Get video
      const video = await videoService.getVideoById(id);

      if (!video) {
        res.status(404).json({
          success: false,
          message: "Video not found",
        });
        return;
      }

      // Check if video is published
      if (!video.isPublished) {
        res.status(404).json({
          success: false,
          message: "Video not found",
        });
        return;
      }

      // Check if audio mode is available
      if (!video.hasAudioMode || !video.audioUrl) {
        res.status(404).json({
          success: false,
          message: "Audio track not available for this video",
        });
        return;
      }

      // Check if premium video
      if (video.videoType === "premium") {
        const hasSubscription = await subscriptionService.hasActiveSubscription(userId);
        if (!hasSubscription) {
          res.status(403).json({
            success: false,
            message: "Subscription required to listen to premium audio",
          });
          return;
        }
      }

      let audioUrl: string;

      // If audioUrl is an R2 key, generate signed URL
      if (video.audioUrl.startsWith("audio/") || video.audioUrl.startsWith("videos/")) {
        audioUrl = await r2StorageService.getSignedUrl(
          video.audioUrl,
          900 // 15 minutes
        );
      } else {
        // Use audioUrl directly (external URL or already signed)
        audioUrl = video.audioUrl;
      }

      res.status(200).json({
        success: true,
        data: {
          audioUrl,
          expiresIn: 900,
        },
      });
    } catch (error: any) {
      console.error("[Video Controller] Error generating audio URL:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate audio URL",
      });
    }
  }

  /**
   * Get video step watch URL (signed URL for tutorial video)
   * GET /api/videos/steps/:id/watch-url
   */
  async getVideoStepWatchUrl(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      // Get video step
      const step = await videoService.getVideoStepById(id);

      if (!step) {
        res.status(404).json({
          success: false,
          message: "Tutorial video not found",
        });
        return;
      }

      // Check if parent video is premium
      if (step.video.videoType === "premium") {
        const hasSubscription = await subscriptionService.hasActiveSubscription(userId);
        if (!hasSubscription) {
          res.status(403).json({
            success: false,
            message: "Subscription required to watch premium tutorials",
          });
          return;
        }
      }

      // Check if tutorial has a video file
      if (!step.cloudflareVideoId && !step.videoUrl) {
        res.status(404).json({
          success: false,
          message: "Tutorial video file not found",
        });
        return;
      }

      let watchUrl: string;

      // If has cloudflareVideoId, generate signed URL from R2
      if (step.cloudflareVideoId) {
        watchUrl = await r2StorageService.getSignedUrl(
          step.cloudflareVideoId,
          900 // 15 minutes
        );
      } else {
        // Use videoUrl directly (external URL)
        watchUrl = step.videoUrl!;
      }

      res.status(200).json({
        success: true,
        data: {
          watchUrl,
          expiresIn: 900,
        },
      });
    } catch (error: any) {
      console.error("[Video Controller] Error generating tutorial watch URL:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate watch URL",
      });
    }
  }
}

export const videoController = new VideoController();

