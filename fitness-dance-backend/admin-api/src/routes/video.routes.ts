// admin-api/src/routes/video.routes.ts
// Video routes for Admin API

import { Router, Request, Response, NextFunction } from "express";
import { videoController } from "../controllers/video.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";
import { validateQuery } from "../middleware/validation.middleware";
import { uploadVideo, uploadThumbnail, uploadAudio, handleUploadError } from "../middleware/upload.middleware";
import { z } from "zod";

const router = Router();

// All video routes require authentication
router.use(authenticate);

// Video CRUD routes with RBAC
// Create video - requires 'create' permission on 'videos' resource
router.post("/", requirePermission("videos", "create"), videoController.createVideo.bind(videoController));

// List videos - requires 'read' permission on 'videos' resource
router.get(
  "/",
  requirePermission("videos", "read"),
  validateQuery(
    z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      categoryId: z.string().uuid().optional(),
      subcategoryId: z.string().uuid().optional(),
      collectionId: z.string().uuid().optional(),
      isPublished: z.coerce.boolean().optional(),
      videoType: z.enum(["premium", "free"]).optional(), // 'premium' = requires subscription, 'free' = no subscription needed
      search: z.string().optional(),
    }).passthrough()
  ),
  videoController.getVideos.bind(videoController)
);

// Get video by ID - requires 'read' permission
router.get(
  "/:id",
  requirePermission("videos", "read"),
  validateQuery(z.object({}).passthrough()),
  videoController.getVideoById.bind(videoController)
);

// Update video - requires 'update' permission on 'videos' resource
router.put("/:id", requirePermission("videos", "update"), videoController.updateVideo.bind(videoController));

// Delete video - requires 'delete' permission on 'videos' resource
router.delete("/:id", requirePermission("videos", "delete"), videoController.deleteVideo.bind(videoController));

// Toggle published status - requires 'update' permission
router.patch("/:id/publish", requirePermission("videos", "update"), videoController.togglePublishedStatus.bind(videoController));

// File upload routes - requires 'update' permission
// Upload video file - POST /api/videos/:id/video
router.post(
  "/:id/video",
  (req: Request, _res: Response, next: NextFunction) => {
    console.log("[Video Route] POST /:id/video - Request received:", {
      method: req.method,
      path: req.path,
      params: req.params,
      hasFile: !!req.file,
      contentType: req.headers["content-type"],
      contentLength: req.headers["content-length"],
    });
    next();
  },
  requirePermission("videos", "update"),
  uploadVideo.single("video"),
  (req: Request, _res: Response, next: NextFunction) => {
    console.log("[Video Route] After multer - File processed:", {
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      mimetype: req.file?.mimetype,
    });
    next();
  },
  handleUploadError,
  videoController.uploadVideo.bind(videoController)
);

// Upload thumbnail - POST /api/videos/:id/thumbnail
router.post(
  "/:id/thumbnail",
  requirePermission("videos", "update"),
  uploadThumbnail.single("thumbnail"),
  handleUploadError,
  videoController.uploadThumbnail.bind(videoController)
);

// Upload audio - POST /api/videos/:id/audio
router.post(
  "/:id/audio",
  requirePermission("videos", "update"),
  uploadAudio.single("audio"),
  handleUploadError,
  videoController.uploadAudio.bind(videoController)
);

// Delete video file - DELETE /api/videos/:id/video
router.delete("/:id/video", requirePermission("videos", "update"), videoController.deleteVideoFile.bind(videoController));

// Delete thumbnail - DELETE /api/videos/:id/thumbnail
router.delete("/:id/thumbnail", requirePermission("videos", "update"), videoController.deleteThumbnail.bind(videoController));

// Delete audio file - DELETE /api/videos/:id/audio
router.delete("/:id/audio", requirePermission("videos", "update"), videoController.deleteAudio.bind(videoController));

// Stream video file - GET /api/videos/:id/stream
// Admin users can stream videos (no subscription check needed)
router.get(
  "/:id/stream",
  requirePermission("videos", "read"),
  videoController.streamVideo.bind(videoController)
);

// Get video watch URL (signed URL) - GET /api/videos/:id/watch-url
// Returns signed URL for direct R2 access (faster than streaming through API)
router.get(
  "/:id/watch-url",
  requirePermission("videos", "read"),
  videoController.getVideoWatchUrl.bind(videoController)
);

// Get batch thumbnail signed URLs - POST /api/videos/thumbnail-urls
// Returns signed URLs for multiple video thumbnails (expires in 1 hour)
router.post(
  "/thumbnail-urls",
  requirePermission("videos", "read"),
  videoController.getBatchThumbnailUrls.bind(videoController)
);

// Get video thumbnail signed URL - GET /api/videos/:id/thumbnail-url
// Returns signed URL for thumbnail image (expires in 1 hour)
router.get(
  "/:id/thumbnail-url",
  requirePermission("videos", "read"),
  videoController.getThumbnailUrl.bind(videoController)
);

// Get video audio signed URL - GET /api/videos/:id/audio-url
// Returns signed URL for audio file (expires in 1 hour)
router.get(
  "/:id/audio-url",
  requirePermission("videos", "read"),
  videoController.getAudioUrl.bind(videoController)
);

export default router;

