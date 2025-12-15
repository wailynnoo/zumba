// admin-api/src/routes/video-step.routes.ts
// Video Step routes for Admin API

import { Router } from "express";
import { videoStepController } from "../controllers/video-step.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";
import { uploadVideo, handleUploadError } from "../middleware/upload.middleware";

const router = Router();

// All video step routes require authentication
router.use(authenticate);

// Get all steps for a video - requires 'read' permission on 'videos' resource
router.get("/videos/:videoId/steps", requirePermission("videos", "read"), videoStepController.getVideoSteps.bind(videoStepController));

// Get a single video step by ID - requires 'read' permission
router.get("/video-steps/:id", requirePermission("videos", "read"), videoStepController.getVideoStepById.bind(videoStepController));

// Create a new video step - requires 'update' permission on 'videos' resource
router.post("/videos/:videoId/steps", requirePermission("videos", "update"), videoStepController.createVideoStep.bind(videoStepController));

// Update a video step - requires 'update' permission
router.put("/video-steps/:id", requirePermission("videos", "update"), videoStepController.updateVideoStep.bind(videoStepController));

// Delete a video step - requires 'update' permission
router.delete("/video-steps/:id", requirePermission("videos", "update"), videoStepController.deleteVideoStep.bind(videoStepController));

// Reorder video steps - requires 'update' permission
router.patch("/videos/:videoId/steps/reorder", requirePermission("videos", "update"), videoStepController.reorderVideoSteps.bind(videoStepController));

// Upload video file for a step - requires 'update' permission
router.post(
  "/video-steps/:id/video",
  requirePermission("videos", "update"),
  uploadVideo.single("video"),
  handleUploadError,
  videoStepController.uploadStepVideo.bind(videoStepController)
);

// Get signed URL for a step's video - requires 'read' permission
router.get("/video-steps/:id/video-url", requirePermission("videos", "read"), videoStepController.getStepVideoUrl.bind(videoStepController));

export default router;

