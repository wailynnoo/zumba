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

      const result = await videoService.getVideos({
        page,
        limit,
        categoryId,
        subcategoryId,
        collectionId,
        videoType,
        search,
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

      // Generate signed URL (expires in 1 hour)
      const signedUrl = await r2StorageService.getSignedUrl(
        video.cloudflareVideoId,
        3600 // 1 hour
      );

      // Increment view count (track that user watched video)
      videoService.incrementViewCount(id).catch((error) => {
        console.error("Failed to increment view count:", error);
      });

      res.status(200).json({
        success: true,
        data: {
          watchUrl: signedUrl,
          expiresIn: 3600, // seconds
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
}

export const videoController = new VideoController();

