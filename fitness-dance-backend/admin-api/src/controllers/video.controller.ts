// admin-api/src/controllers/video.controller.ts
// Video controller for Admin API

import { Request, Response } from "express";
import { videoService, createVideoSchema, updateVideoSchema } from "../services/video.service";
import { r2StorageService } from "../services/r2-storage.service";
import { videoValidationService } from "../services/video-validation.service";
import { videoConversionService } from "../services/video-conversion.service";
import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import getVideoDuration from "get-video-duration";

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
      const isPublished = validatedQuery.isPublished as boolean | undefined;
      const videoType = validatedQuery.videoType as string | undefined;
      const search = validatedQuery.search as string | undefined;

      const result = await videoService.getVideos({
        page,
        limit,
        categoryId,
        subcategoryId,
        collectionId,
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

      // Check if file needs conversion (e.g., .mov files)
      let videoBuffer = req.file.buffer;
      let videoFilename = req.file.originalname;
      let videoMimetype = req.file.mimetype;
      let wasConverted = false;

      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const needsConversion = [".mov", ".avi", ".mkv", ".wmv"].includes(fileExt);

      if (needsConversion) {
        // First check if ffmpeg is available
        const ffmpegAvailable = await videoConversionService.checkFfmpegAvailable();
        if (!ffmpegAvailable) {
          console.error("[Video Upload] ffmpeg is not installed on the server");
          res.status(400).json({
            success: false,
            message: `Cannot upload ${fileExt} files: ffmpeg is not installed on the server`,
            recommendation: "Please convert the video manually to MP4 (H.264) before uploading, or ask the administrator to install ffmpeg on the server.",
            conversionCommand: "ffmpeg -i input.mov -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart output.mp4",
          });
          return;
        }

        console.log(`[Video Upload] Converting ${fileExt} file to MP4 for mobile compatibility...`);
        const conversionResult = await videoConversionService.convertToMP4(
          req.file.buffer,
          req.file.originalname
        );

        if (!conversionResult.success || !conversionResult.convertedBuffer) {
          console.error("[Video Upload] Conversion failed:", conversionResult.error);
          res.status(400).json({
            success: false,
            message: `Failed to convert ${fileExt} file: ${conversionResult.error || "Unknown error"}`,
            recommendation: "Please convert the video manually to MP4 (H.264) before uploading.",
            conversionCommand: "ffmpeg -i input.mov -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart output.mp4",
          });
          return;
        }

        videoBuffer = conversionResult.convertedBuffer;
        videoFilename = videoFilename.replace(fileExt, ".mp4");
        videoMimetype = "video/mp4";
        wasConverted = true;
        console.log(`[Video Upload] Conversion successful! Converted ${fileExt} to MP4 in ${conversionResult.duration?.toFixed(2)}s`);
        console.log(`[Video Upload] Converted buffer size: ${videoBuffer.length} bytes`);
        console.log(`[Video Upload] New filename: ${videoFilename}, mimetype: ${videoMimetype}`);
        
        // Verify converted buffer is valid
        if (!videoBuffer || videoBuffer.length === 0) {
          console.error("[Video Upload] Converted buffer is empty!");
          res.status(400).json({
            success: false,
            message: "Video conversion produced an empty file",
            recommendation: "Please convert the video manually to MP4 (H.264) before uploading.",
          });
          return;
        }
      }

      // Full video validation (codec check)
      console.log("[Video Upload] Validating video codec...");
      console.log(`[Video Upload] Buffer size before validation: ${videoBuffer.length} bytes`);
      const validation = await videoValidationService.validateVideo(
        videoBuffer,
        videoFilename
      );

      if (!validation.valid) {
        console.error("[Video Upload] Video validation failed:", validation.errors);
        res.status(400).json({
          success: false,
          message: "Video format/codec not supported",
          errors: validation.errors,
          warnings: validation.warnings,
          videoInfo: validation.videoInfo,
          recommendation: "Please convert your video to MP4 with H.264 codec using: ffmpeg -i input -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k output.mp4",
        });
        return;
      }

      // Log warnings but allow upload
      if (validation.warnings.length > 0) {
        console.warn("[Video Upload] Validation warnings:", validation.warnings);
      }

      if (validation.videoInfo) {
        console.log("[Video Upload] Video info:", validation.videoInfo);
      }

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

      // Generate unique file name (use converted filename if conversion happened)
      const fileName = r2StorageService.generateFileName(videoFilename, "video");
      console.log("[Video Upload] Generated file name:", fileName);

      // Detect video duration before uploading
      let durationSeconds: number | undefined;
      const tempFilePath = path.join(os.tmpdir(), `video-${Date.now()}-${Math.random().toString(36).substring(7)}.${path.extname(videoFilename).slice(1)}`);
      
      try {
        console.log("[Video Upload] Writing video to temp file for duration detection:", tempFilePath);
        fs.writeFileSync(tempFilePath, videoBuffer);
        
        console.log("[Video Upload] Detecting video duration...");
        const duration = await getVideoDuration(tempFilePath);
        durationSeconds = Math.round(duration);
        console.log("[Video Upload] Video duration detected:", durationSeconds, "seconds");
      } catch (durationError: any) {
        console.warn("[Video Upload] Failed to detect video duration:", durationError.message);
        // Continue without duration - it's optional
      } finally {
        // Clean up temp file
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log("[Video Upload] Temp file cleaned up");
          }
        } catch (cleanupError) {
          console.error("[Video Upload] Error cleaning up temp file:", cleanupError);
        }
      }

      // Upload to R2
      console.log("[Video Upload] Uploading to R2...");
      console.log("[Video Upload] Upload details:", {
        bufferSize: videoBuffer.length,
        fileName,
        videoMimetype,
        wasConverted,
      });
      
      if (!videoBuffer || videoBuffer.length === 0) {
        console.error("[Video Upload] ERROR: Buffer is empty before R2 upload!");
        res.status(500).json({
          success: false,
          message: "Video buffer is empty - cannot upload to storage",
        });
        return;
      }
      
      const videoUrl = await r2StorageService.uploadVideo(
        videoBuffer,
        fileName,
        videoMimetype
      );
      console.log("[Video Upload] Upload successful! Video URL:", videoUrl);

      // Update video record with video URL and duration
      console.log("[Video Upload] Updating video record in database...");
      const updateData: any = {
        cloudflareVideoId: videoUrl,
      };
      if (durationSeconds !== undefined) {
        updateData.durationSeconds = durationSeconds;
      }
      const updatedVideo = await videoService.updateVideo(id, updateData);
      console.log("[Video Upload] Video record updated successfully");

      res.status(200).json({
        success: true,
        message: wasConverted 
          ? "Video uploaded successfully (converted to MP4 for mobile compatibility)" 
          : "Video uploaded successfully",
        data: {
          videoUrl,
          video: updatedVideo,
          videoInfo: validation.videoInfo,
        },
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        converted: wasConverted,
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

      // Check if file exists in R2 before generating signed URL
      const fileExists = await r2StorageService.fileExists(video.cloudflareVideoId);
      if (!fileExists) {
        res.status(404).json({
          success: false,
          message: "Video file not found in storage",
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

      // Check if file exists in R2 before generating signed URL
      const fileExists = await r2StorageService.fileExists(video.thumbnailUrl);
      if (!fileExists) {
        res.status(404).json({
          success: false,
          message: "Thumbnail file not found in storage",
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

  /**
   * Get batch thumbnail signed URLs
   * POST /api/videos/thumbnail-urls
   * Returns signed URLs for multiple video thumbnails (expires in 1 hour)
   */
  async getBatchThumbnailUrls(req: Request, res: Response): Promise<void> {
    try {
      const { videoIds } = req.body;

      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "videoIds must be a non-empty array",
        });
        return;
      }

      // Limit batch size to prevent abuse
      if (videoIds.length > 100) {
        res.status(400).json({
          success: false,
          message: "Maximum 100 video IDs allowed per request",
        });
        return;
      }

      // Get all videos at once
      const videos = await videoService.getVideosByIds(videoIds);

      // Generate signed URLs for videos that have thumbnails
      const thumbnailUrls: Record<string, string> = {};
      const promises = videos
        .filter((video: any) => video.thumbnailUrl)
        .map(async (video: any) => {
          try {
            // Check if file exists in R2
            const fileExists = await r2StorageService.fileExists(video.thumbnailUrl!);
            if (fileExists) {
              const signedUrl = await r2StorageService.getSignedUrl(video.thumbnailUrl!, 3600);
              thumbnailUrls[video.id] = signedUrl;
            }
          } catch (error) {
            console.error(`[Video Controller] Error generating thumbnail URL for video ${video.id}:`, error);
            // Skip this video, don't add to result
          }
        });

      await Promise.all(promises);

      res.status(200).json({
        success: true,
        data: thumbnailUrls,
      });
    } catch (error: any) {
      console.error("[Video Controller] Error generating batch thumbnail URLs:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate batch thumbnail URLs",
      });
    }
  }

  /**
   * Get video audio signed URL
   * GET /api/videos/:id/audio-url
   * Returns a signed URL for the video audio file (expires in 1 hour)
   */
  async getAudioUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get video from database
      const video = await videoService.getVideoById(id);

      if (!video.audioUrl) {
        res.status(404).json({
          success: false,
          message: "Video has no audio file",
        });
        return;
      }

      // Check if file exists in R2 before generating signed URL
      const fileExists = await r2StorageService.fileExists(video.audioUrl);
      if (!fileExists) {
        res.status(404).json({
          success: false,
          message: "Audio file not found in storage",
        });
        return;
      }

      // Generate signed URL (expires in 1 hour)
      const signedUrl = await r2StorageService.getSignedUrl(
        video.audioUrl,
        3600 // 1 hour
      );

      res.status(200).json({
        success: true,
        data: {
          audioUrl: signedUrl,
          expiresIn: 3600,
        },
      });
    } catch (error: any) {
      console.error("[Video Controller] Error generating audio signed URL:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate audio URL",
      });
    }
  }
}

export const videoController = new VideoController();

