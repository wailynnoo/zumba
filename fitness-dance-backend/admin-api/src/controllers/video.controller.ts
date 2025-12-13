// admin-api/src/controllers/video.controller.ts
// Video controller for Admin API

import { Request, Response } from "express";
import { videoService, createVideoSchema, updateVideoSchema } from "../services/video.service";
import { r2StorageService } from "../services/r2-storage.service";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";

export class VideoController {
  /**
   * Get all videos
   * GET /api/videos
   */
  async getVideos(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = req.validatedQuery || req.query;
      const page = validatedQuery.page as number | undefined;
      const limit = validatedQuery.limit as number | undefined;
      const categoryId = validatedQuery.categoryId as string | undefined;
      const subcategoryId = validatedQuery.subcategoryId as string | undefined;
      const collectionId = validatedQuery.collectionId as string | undefined;
      const danceStyleId = validatedQuery.danceStyleId as string | undefined;
      const intensityLevelId = validatedQuery.intensityLevelId as string | undefined;
      const isPublished = validatedQuery.isPublished as boolean | undefined;
      const videoType = validatedQuery.videoType as string | undefined;
      const search = validatedQuery.search as string | undefined;

      const result = await videoService.getVideos({
        page,
        limit,
        categoryId,
        subcategoryId,
        collectionId,
        danceStyleId,
        intensityLevelId,
        isPublished,
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
   * Get video by ID
   * GET /api/videos/:id
   */
  async getVideoById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const video = await videoService.getVideoById(id);

      res.status(200).json({
        success: true,
        data: video,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Video not found",
      });
    }
  }

  /**
   * Create video
   * POST /api/videos
   */
  async createVideo(req: Request, res: Response): Promise<void> {
    try {
      const validated = createVideoSchema.parse(req.body);
      const video = await videoService.createVideo(validated);

      res.status(201).json({
        success: true,
        message: "Video created successfully",
        data: video,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create video",
      });
    }
  }

  /**
   * Update video
   * PUT /api/videos/:id
   */
  async updateVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateVideoSchema.parse(req.body);
      const video = await videoService.updateVideo(id, validated);

      res.status(200).json({
        success: true,
        message: "Video updated successfully",
        data: video,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update video",
      });
    }
  }

  /**
   * Delete video
   * DELETE /api/videos/:id
   */
  async deleteVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await videoService.deleteVideo(id);

      res.status(200).json({
        success: true,
        message: "Video deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete video",
      });
    }
  }

  /**
   * Toggle published status
   * PATCH /api/videos/:id/publish
   */
  async togglePublishedStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const video = await videoService.togglePublishedStatus(id);

      res.status(200).json({
        success: true,
        message: `Video ${video.isPublished ? "published" : "unpublished"} successfully`,
        data: video,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to toggle published status",
      });
    }
  }

  /**
   * Upload video file
   * POST /api/videos/:id/video
   */
  async uploadVideo(req: Request, res: Response): Promise<void> {
    try {
      console.log("[Video Upload] Starting video upload process...");
      const { id } = req.params;
      console.log("[Video Upload] Video ID:", id);

      if (!req.file) {
        console.error("[Video Upload] No file provided in request");
        res.status(400).json({
          success: false,
          message: "No video file provided",
        });
        return;
      }

      console.log("[Video Upload] File received:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer?.length,
      });

      if (!r2StorageService.isConfigured()) {
        console.error("[Video Upload] R2 storage is not configured");
        res.status(500).json({
          success: false,
          message: "R2 storage is not configured",
        });
        return;
      }

      console.log("[Video Upload] R2 storage is configured, proceeding...");

      // Get video record
      const video = await videoService.getVideoById(id);
      console.log("[Video Upload] Video record found:", video.id);

      // Delete old video file if exists
      if (video.cloudflareVideoId) {
        try {
          console.log("[Video Upload] Deleting old video file:", video.cloudflareVideoId);
          await r2StorageService.deleteFile(video.cloudflareVideoId);
        } catch (error) {
          console.error("[Video Upload] Error deleting old video file:", error);
        }
      }

      // Generate unique file name
      const fileName = r2StorageService.generateFileName(req.file.originalname, "video");
      console.log("[Video Upload] Generated file name:", fileName);

      // Upload to R2
      console.log("[Video Upload] Uploading to R2...");
      const videoUrl = await r2StorageService.uploadVideo(
        req.file.buffer,
        fileName,
        req.file.mimetype
      );
      console.log("[Video Upload] Upload successful! Video URL:", videoUrl);

      // Update video record
      console.log("[Video Upload] Updating video record in database...");
      const updatedVideo = await videoService.updateVideo(id, {
        cloudflareVideoId: videoUrl,
      });
      console.log("[Video Upload] Video record updated successfully");

      res.status(200).json({
        success: true,
        message: "Video uploaded successfully",
        data: {
          videoUrl,
          video: updatedVideo,
        },
      });
    } catch (error: any) {
      console.error("[Video Upload] Error:", error);
      console.error("[Video Upload] Error stack:", error.stack);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to upload video",
      });
    }
  }

  /**
   * Upload thumbnail
   * POST /api/videos/:id/thumbnail
   */
  async uploadThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No thumbnail file provided",
        });
        return;
      }

      if (!r2StorageService.isConfigured()) {
        res.status(500).json({
          success: false,
          message: "R2 storage is not configured",
        });
        return;
      }

      // Get video record
      const video = await videoService.getVideoById(id);

      // Delete old thumbnail if exists
      if (video.thumbnailUrl) {
        try {
          await r2StorageService.deleteFile(video.thumbnailUrl);
        } catch (error) {
          console.error("Error deleting old thumbnail:", error);
        }
      }

      // Generate unique file name
      const fileName = r2StorageService.generateFileName(req.file.originalname, "thumbnail");

      // Upload to R2
      const thumbnailUrl = await r2StorageService.uploadThumbnail(
        req.file.buffer,
        fileName,
        req.file.mimetype
      );

      // Update video record
      const updatedVideo = await videoService.updateVideo(id, {
        thumbnailUrl,
      });

      res.status(200).json({
        success: true,
        message: "Thumbnail uploaded successfully",
        data: {
          thumbnailUrl,
          video: updatedVideo,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to upload thumbnail",
      });
    }
  }

  /**
   * Upload audio file
   * POST /api/videos/:id/audio
   */
  async uploadAudio(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No audio file provided",
        });
        return;
      }

      if (!r2StorageService.isConfigured()) {
        res.status(500).json({
          success: false,
          message: "R2 storage is not configured",
        });
        return;
      }

      // Get video record
      const video = await videoService.getVideoById(id);

      // Delete old audio file if exists
      if (video.audioUrl) {
        try {
          await r2StorageService.deleteFile(video.audioUrl);
        } catch (error) {
          console.error("Error deleting old audio file:", error);
        }
      }

      // Generate unique file name
      const fileName = r2StorageService.generateFileName(req.file.originalname, "audio");

      // Upload to R2
      const audioUrl = await r2StorageService.uploadAudio(
        req.file.buffer,
        fileName,
        req.file.mimetype
      );

      // Update video record
      const updatedVideo = await videoService.updateVideo(id, {
        audioUrl,
      });

      res.status(200).json({
        success: true,
        message: "Audio uploaded successfully",
        data: {
          audioUrl,
          video: updatedVideo,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to upload audio",
      });
    }
  }

  /**
   * Delete video file
   * DELETE /api/videos/:id/video
   */
  async deleteVideoFile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const video = await videoService.getVideoById(id);

      if (!video.cloudflareVideoId) {
        res.status(400).json({
          success: false,
          message: "Video has no video file to delete",
        });
        return;
      }

      // Delete from R2
      await r2StorageService.deleteFile(video.cloudflareVideoId);

      // Update video record
      await videoService.updateVideo(id, {
        cloudflareVideoId: undefined,
      });

      res.status(200).json({
        success: true,
        message: "Video file deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete video file",
      });
    }
  }

  /**
   * Delete thumbnail
   * DELETE /api/videos/:id/thumbnail
   */
  async deleteThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const video = await videoService.getVideoById(id);

      if (!video.thumbnailUrl) {
        res.status(400).json({
          success: false,
          message: "Video has no thumbnail to delete",
        });
        return;
      }

      // Delete from R2
      await r2StorageService.deleteFile(video.thumbnailUrl);

      // Update video record
      await videoService.updateVideo(id, {
        thumbnailUrl: undefined,
      });

      res.status(200).json({
        success: true,
        message: "Thumbnail deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete thumbnail",
      });
    }
  }

  /**
   * Delete audio file
   * DELETE /api/videos/:id/audio
   */
  async deleteAudio(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const video = await videoService.getVideoById(id);

      if (!video.audioUrl) {
        res.status(400).json({
          success: false,
          message: "Video has no audio file to delete",
        });
        return;
      }

      // Delete from R2
      await r2StorageService.deleteFile(video.audioUrl);

      // Update video record
      await videoService.updateVideo(id, {
        audioUrl: undefined,
      });

      res.status(200).json({
        success: true,
        message: "Audio file deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete audio file",
      });
    }
  }

  /**
   * Stream video file (with range request support)
   * GET /api/videos/:id/stream
   * Admin users don't need subscription check
   */
  async streamVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get video from database
      const video = await videoService.getVideoById(id);

      if (!video.cloudflareVideoId) {
        res.status(404).json({
          success: false,
          message: "Video file not found",
        });
        return;
      }

      // Extract key from URL
      const key = r2StorageService.extractKey(video.cloudflareVideoId);
      const s3Client = r2StorageService.getS3Client();
      const bucketName = r2StorageService.getBucketName();

      // Parse Range header for video seeking
      const range = req.headers.range;
      let start = 0;
      let end: number | undefined;

      // Get file metadata first using HeadObject (more efficient)
      const headCommand = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const headResponse = await s3Client.send(headCommand);
      const contentLength = headResponse.ContentLength || 0;
      const contentType = headResponse.ContentType || "video/mp4";

      // Parse range if provided
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : contentLength - 1;
      } else {
        end = contentLength - 1;
      }

      // Ensure valid range
      if (start >= contentLength || end >= contentLength) {
        res.status(416).json({
          success: false,
          message: "Range Not Satisfiable",
        });
        return;
      }

      // Create command with range
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
        Range: `bytes=${start}-${end}`,
      });

      // Stream the video
      const response = await s3Client.send(command);

      // Set headers for video streaming
      const chunkSize = end - start + 1;
      res.status(range ? 206 : 200); // 206 Partial Content for range requests
      res.setHeader("Content-Range", `bytes ${start}-${end}/${contentLength}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", chunkSize);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

      // Stream the body to response
      if (response.Body) {
        // AWS SDK v3 returns Body as ReadableStream (web standard)
        // Convert to buffer chunks and send
        const stream = response.Body as any;
        
        // Handle ReadableStream (web standard)
        if (stream && typeof stream.getReader === 'function') {
          const reader = stream.getReader();
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  res.end();
                  break;
                }
                res.write(Buffer.from(value));
              }
            } catch (error) {
              console.error("[Video Controller] Stream error:", error);
              if (!res.headersSent) {
                res.status(500).json({
                  success: false,
                  message: "Failed to stream video",
                });
              }
            }
          };
          pump();
        } else if (stream && typeof stream.pipe === 'function') {
          // If it's a Node.js stream, pipe directly
          stream.pipe(res);
        } else {
          // Fallback: convert to buffer
          const chunks: Uint8Array[] = [];
          for await (const chunk of stream as any) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          res.send(buffer);
        }
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to stream video",
        });
      }
    } catch (error: any) {
      console.error("[Video Controller] Error streaming video:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: error.message || "Failed to stream video",
        });
      }
    }
  }

  /**
   * Get video watch URL (signed URL for direct R2 access)
   * GET /api/videos/:id/watch-url
   * Admin users don't need subscription check
   * Returns signed URL that expires in 1 hour
   */
  async getVideoWatchUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get video from database
      const video = await videoService.getVideoById(id);

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

  /**
   * Get video thumbnail signed URL
   * GET /api/videos/:id/thumbnail-url
   * Returns a signed URL for the video thumbnail (expires in 1 hour)
   */
  async getThumbnailUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get video from database
      const video = await videoService.getVideoById(id);

      if (!video.thumbnailUrl) {
        res.status(404).json({
          success: false,
          message: "Video has no thumbnail",
        });
        return;
      }

      // Generate signed URL (expires in 1 hour)
      const signedUrl = await r2StorageService.getSignedUrl(
        video.thumbnailUrl,
        3600 // 1 hour
      );

      res.status(200).json({
        success: true,
        data: {
          thumbnailUrl: signedUrl,
          expiresIn: 3600,
        },
      });
    } catch (error: any) {
      console.error("[Video Controller] Error generating thumbnail signed URL:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate thumbnail URL",
      });
    }
  }
}

export const videoController = new VideoController();

