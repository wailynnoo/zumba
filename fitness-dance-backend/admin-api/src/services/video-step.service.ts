// admin-api/src/services/video-step.service.ts
// Video Step service for managing step-by-step videos

import prisma from "../config/database";
import { z } from "zod";
import { r2StorageService } from "./r2-storage.service";

// Validation schemas
export const createVideoStepSchema = z.object({
  videoId: z.string().uuid(),
  stepNumber: z.number().int().positive(),
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional().nullable(),
  cloudflareVideoId: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(), // Changed from .url() to accept R2 keys
  thumbnailUrl: z.string().optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const updateVideoStepSchema = z.object({
  stepNumber: z.number().int().positive().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  cloudflareVideoId: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(), // Changed from .url() to accept R2 keys
  thumbnailUrl: z.string().optional().nullable(),
  durationSeconds: z.number().int().positive().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export class VideoStepService {
  /**
   * Get all steps for a video
   */
  async getVideoSteps(videoId: string) {
    const steps = await prisma.videoStep.findMany({
      where: {
        videoId,
      },
      orderBy: [
        { sortOrder: "asc" },
        { stepNumber: "asc" },
      ],
    });

    return steps;
  }

  /**
   * Get a single video step by ID
   */
  async getVideoStepById(id: string) {
    const step = await prisma.videoStep.findUnique({
      where: { id },
      include: {
        video: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!step) {
      throw new Error("Video step not found");
    }

    return step;
  }

  /**
   * Create a new video step
   */
  async createVideoStep(data: z.infer<typeof createVideoStepSchema>) {
    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: data.videoId },
    });

    if (!video) {
      throw new Error("Video not found");
    }

    // Check if step number already exists for this video
    const existingStep = await prisma.videoStep.findFirst({
      where: {
        videoId: data.videoId,
        stepNumber: data.stepNumber,
      },
    });

    if (existingStep) {
      throw new Error(`Step number ${data.stepNumber} already exists for this video`);
    }

    const step = await prisma.videoStep.create({
      data: {
        videoId: data.videoId,
        stepNumber: data.stepNumber,
        title: data.title,
        description: data.description || null,
        cloudflareVideoId: data.cloudflareVideoId || null,
        videoUrl: data.videoUrl || null,
        thumbnailUrl: data.thumbnailUrl || null,
        durationSeconds: data.durationSeconds || null,
        sortOrder: data.sortOrder,
      },
    });

    return step;
  }

  /**
   * Update a video step
   */
  async updateVideoStep(id: string, data: z.infer<typeof updateVideoStepSchema>) {
    const step = await prisma.videoStep.findUnique({
      where: { id },
    });

    if (!step) {
      throw new Error("Video step not found");
    }

    // If stepNumber is being updated, check for conflicts
    if (data.stepNumber !== undefined && data.stepNumber !== step.stepNumber) {
      const existingStep = await prisma.videoStep.findFirst({
        where: {
          videoId: step.videoId,
          stepNumber: data.stepNumber,
          id: { not: id },
        },
      });

      if (existingStep) {
        throw new Error(`Step number ${data.stepNumber} already exists for this video`);
      }
    }

    const updatedStep = await prisma.videoStep.update({
      where: { id },
      data: {
        stepNumber: data.stepNumber,
        title: data.title,
        description: data.description !== undefined ? data.description : undefined,
        cloudflareVideoId: data.cloudflareVideoId !== undefined ? data.cloudflareVideoId : undefined,
        videoUrl: data.videoUrl !== undefined ? data.videoUrl : undefined,
        thumbnailUrl: data.thumbnailUrl !== undefined ? data.thumbnailUrl : undefined,
        durationSeconds: data.durationSeconds !== undefined ? data.durationSeconds : undefined,
        sortOrder: data.sortOrder,
      },
    });

    return updatedStep;
  }

  /**
   * Delete a video step
   */
  async deleteVideoStep(id: string) {
    const step = await prisma.videoStep.findUnique({
      where: { id },
    });

    if (!step) {
      throw new Error("Video step not found");
    }

    // Delete video file from R2 before deleting database record
    if (step.cloudflareVideoId) {
      try {
        console.log(`[Video Step Service] Deleting tutorial video from R2: ${step.cloudflareVideoId}`);
        await r2StorageService.deleteFile(step.cloudflareVideoId);
        console.log(`[Video Step Service] Successfully deleted tutorial video from R2`);
      } catch (error) {
        console.error(`[Video Step Service] Error deleting tutorial video from R2:`, error);
        // Continue with database deletion even if R2 deletion fails
      }
    }
    
    // Also try videoUrl if it's different from cloudflareVideoId
    if (step.videoUrl && step.videoUrl !== step.cloudflareVideoId) {
      try {
        console.log(`[Video Step Service] Deleting tutorial video URL from R2: ${step.videoUrl}`);
        await r2StorageService.deleteFile(step.videoUrl);
        console.log(`[Video Step Service] Successfully deleted tutorial video URL from R2`);
      } catch (error) {
        console.error(`[Video Step Service] Error deleting tutorial video URL from R2:`, error);
      }
    }

    // Delete database record
    await prisma.videoStep.delete({
      where: { id },
    });

    console.log(`[Video Step Service] Deleted video step from database: ${id}`);
    return { success: true };
  }

  /**
   * Reorder video steps
   */
  async reorderVideoSteps(videoId: string, stepIds: string[]) {
    // Verify all steps belong to the video
    const steps = await prisma.videoStep.findMany({
      where: {
        videoId,
        id: { in: stepIds },
      },
    });

    if (steps.length !== stepIds.length) {
      throw new Error("Some steps not found or don't belong to this video");
    }

    // Update sort order based on the provided order
    const updates = stepIds.map((id, index) =>
      prisma.videoStep.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await Promise.all(updates);

    return { success: true };
  }
}

export const videoStepService = new VideoStepService();

