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

// Get video details (metadata)
router.get("/:id", videoController.getVideo.bind(videoController));

// Get video watch URL (signed URL for direct R2 access - faster than streaming)
router.get("/:id/watch-url", videoController.getVideoWatchUrl.bind(videoController));

// Stream video (with Range header support for seeking) - DEPRECATED: Use watch-url instead
router.get("/:id/stream", videoController.streamVideo.bind(videoController));

export default router;

