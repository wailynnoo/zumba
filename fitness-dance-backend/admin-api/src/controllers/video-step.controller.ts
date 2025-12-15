// admin-api/src/controllers/video-step.controller.ts
// Video Step controller for Admin API

import { Request, Response } from "express";
import { videoStepService, createVideoStepSchema, updateVideoStepSchema } from "../services/video-step.service";
import { z } from "zod";
import { r2StorageService } from "../services/r2-storage.service";

export class VideoStepController {
  /**
   * Get all steps for a video
   * GET /api/videos/:videoId/steps
   */
  async getVideoSteps(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;

      const steps = await videoStepService.getVideoSteps(videoId);

      res.status(200).json({
        success: true,
        data: steps,
      });
    } catch (error: any) {
      console.error("[Video Step Controller] Error fetching video steps:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch video steps",
      });
    }
  }

  /**
   * Get a single video step by ID
   * GET /api/video-steps/:id
   */
  async getVideoStepById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const step = await videoStepService.getVideoStepById(id);

      res.status(200).json({
        success: true,
        data: step,
      });
    } catch (error: any) {
      if (error.message === "Video step not found") {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error("[Video Step Controller] Error fetching video step:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch video step",
      });
    }
  }

  /**
   * Create a new video step
   * POST /api/videos/:videoId/steps
   */
  async createVideoStep(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      const validated = createVideoStepSchema.parse({
        ...req.body,
        videoId,
      });

      const step = await videoStepService.createVideoStep(validated);

      res.status(201).json({
        success: true,
        message: "Video step created successfully",
        data: step,
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

      console.error("[Video Step Controller] Error creating video step:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create video step",
      });
    }
  }

  /**
   * Update a video step
   * PUT /api/video-steps/:id
   */
  async updateVideoStep(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateVideoStepSchema.parse(req.body);

      const step = await videoStepService.updateVideoStep(id, validated);

      res.status(200).json({
        success: true,
        message: "Video step updated successfully",
        data: step,
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

      if (error.message === "Video step not found") {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error("[Video Step Controller] Error updating video step:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update video step",
      });
    }
  }

  /**
   * Delete a video step
   * DELETE /api/video-steps/:id
   */
  async deleteVideoStep(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await videoStepService.deleteVideoStep(id);

      res.status(200).json({
        success: true,
        message: "Video step deleted successfully",
      });
    } catch (error: any) {
      if (error.message === "Video step not found") {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      console.error("[Video Step Controller] Error deleting video step:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete video step",
      });
    }
  }

  /**
   * Reorder video steps
   * PATCH /api/videos/:videoId/steps/reorder
   */
  async reorderVideoSteps(req: Request, res: Response): Promise<void> {
    try {
      const { videoId } = req.params;
      const { stepIds } = req.body;

      if (!Array.isArray(stepIds)) {
        res.status(400).json({
          success: false,
          message: "stepIds must be an array",
        });
        return;
      }

      await videoStepService.reorderVideoSteps(videoId, stepIds);

      res.status(200).json({
        success: true,
        message: "Video steps reordered successfully",
      });
    } catch (error: any) {
      console.error("[Video Step Controller] Error reordering video steps:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to reorder video steps",
      });
    }
  }

  /**
   * Upload video file for a step
   * POST /api/video-steps/:id/video
   */
  async uploadStepVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No video file provided",
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

      // Get step record
      const step = await videoStepService.getVideoStepById(id);

      // Delete old video file if exists
      if (step.cloudflareVideoId) {
        try {
          await r2StorageService.deleteFile(step.cloudflareVideoId);
        } catch (error) {
          console.error("[Video Step Controller] Error deleting old video file:", error);
        }
      }

      // Generate unique file name
      const fileName = r2StorageService.generateFileName(req.file.originalname, "video");
      const relativePath = `video-steps/${fileName}`;

      // Upload to R2 - uploadVideo prepends "videos/" to the fileName
      // So if we pass "video-steps/video-xxx.mp4", it becomes "videos/video-steps/video-xxx.mp4"
      await r2StorageService.uploadVideo(
        req.file.buffer,
        relativePath, // This will become "videos/video-steps/video-xxx.mp4" in R2
        req.file.mimetype
      );

      // Store the actual R2 key (with "videos/" prefix) for signed URL generation
      const actualKey = `videos/${relativePath}`; // e.g., "videos/video-steps/video-xxx.mp4"

      // Update step with R2 key (not public URL, since bucket is private)
      // The key will be used to generate signed URLs when needed
      const updatedStep = await videoStepService.updateVideoStep(id, {
        cloudflareVideoId: actualKey, // R2 key (e.g., "videos/video-steps/video-xxx.mp4")
        videoUrl: actualKey, // Store key for now, can generate signed URL later if needed
      });

      res.status(200).json({
        success: true,
        message: "Step video uploaded successfully",
        data: updatedStep,
      });
    } catch (error: any) {
      console.error("[Video Step Controller] Error uploading step video:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to upload step video",
      });
    }
  }

  /**
   * Get signed URL for a video step's video file
   * GET /api/video-steps/:id/video-url
   * Returns a signed URL for the step's video (expires in 1 hour)
   */
  async getStepVideoUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get step from database
      const step = await videoStepService.getVideoStepById(id);

      if (!step.cloudflareVideoId && !step.videoUrl) {
        res.status(404).json({
          success: false,
          message: "Step video file not found",
        });
        return;
      }

      // Use cloudflareVideoId if available, otherwise use videoUrl
      const videoKey = step.cloudflareVideoId || step.videoUrl;
      if (!videoKey) {
        res.status(404).json({
          success: false,
          message: "Step video file not found",
        });
        return;
      }

      // Generate signed URL (expires in 1 hour)
      const signedUrl = await r2StorageService.getSignedUrl(
        videoKey,
        3600 // 1 hour
      );

      res.status(200).json({
        success: true,
        data: {
          videoUrl: signedUrl,
          expiresIn: 3600, // seconds
        },
      });
    } catch (error: any) {
      console.error("[Video Step Controller] Error generating video URL:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate video URL",
      });
    }
  }
}

export const videoStepController = new VideoStepController();

