// member-api/src/routes/video.routes.ts
// Video routes for Member API

import { Router } from "express";
import { videoController } from "../controllers/video.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// All video routes require authentication
router.use(authenticate);

// Get list of videos
router.get("/", videoController.getVideos.bind(videoController));

// Get video steps (step-by-step tutorials) - Must be before /:id to avoid conflict
router.get("/steps", videoController.getVideoSteps.bind(videoController));

// Get video step watch URL (tutorial video)
router.get("/steps/:id/watch-url", videoController.getVideoStepWatchUrl.bind(videoController));

// Get video details (metadata)
router.get("/:id", videoController.getVideo.bind(videoController));

// Get video watch URL (signed URL for direct R2 access - faster than streaming)
router.get("/:id/watch-url", videoController.getVideoWatchUrl.bind(videoController));

// Get video audio URL (signed URL for audio-only playback)
router.get("/:id/audio-url", videoController.getVideoAudioUrl.bind(videoController));

// Stream video (with Range header support for seeking) - DEPRECATED: Use watch-url instead
router.get("/:id/stream", videoController.streamVideo.bind(videoController));

export default router;

