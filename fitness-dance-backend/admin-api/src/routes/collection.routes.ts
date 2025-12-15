// admin-api/src/routes/collection.routes.ts
// Collection routes for Admin API

import { Router } from "express";
import { collectionController } from "../controllers/collection.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";
import { validateQuery } from "../middleware/validation.middleware";
import { uploadCollectionThumbnail, handleUploadError } from "../middleware/upload.middleware";
import { z } from "zod";

const router = Router();

// All collection routes require authentication
router.use(authenticate);

// Collection list query schema
const collectionListSchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (val > 0 && val <= 1000), {
        message: "Page must be between 1 and 1000",
      }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => val === undefined || (val > 0 && val <= 100), {
        message: "Limit must be between 1 and 100",
      }),
    categoryId: z.string().uuid().optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined) return undefined;
        if (val === "true") return true;
        if (val === "false") return false;
        return val;
      })
      .refine((val) => val === undefined || typeof val === "boolean", {
        message: "isActive must be 'true' or 'false'",
      }),
    isFeatured: z
      .string()
      .optional()
      .transform((val) => {
        if (val === undefined) return undefined;
        if (val === "true") return true;
        if (val === "false") return false;
        return val;
      })
      .refine((val) => val === undefined || typeof val === "boolean", {
        message: "isFeatured must be 'true' or 'false'",
      }),
    search: z.string().optional().refine((val) => !val || val.length <= 200, {
      message: "Search term must be 200 characters or less",
    }),
  })
  .passthrough(); // Allow other query params to pass through

// Collection CRUD routes with RBAC
// Create collection - requires 'create' permission on 'collections' resource
router.post("/", requirePermission("collections", "create"), collectionController.createCollection.bind(collectionController));

// List collections - requires 'read' permission on 'collections' resource
router.get(
  "/",
  requirePermission("collections", "read"),
  validateQuery(collectionListSchema),
  collectionController.getCollections.bind(collectionController)
);

// Get collection by slug - requires 'read' permission
router.get(
  "/slug/:slug",
  requirePermission("collections", "read"),
  validateQuery(z.object({}).passthrough()), // Allow empty query params
  collectionController.getCollectionBySlug.bind(collectionController)
);

// Get collection by ID - requires 'read' permission
router.get(
  "/:id",
  requirePermission("collections", "read"),
  validateQuery(z.object({}).passthrough()), // Allow empty query params
  collectionController.getCollectionById.bind(collectionController)
);

// Update collection - requires 'update' permission on 'collections' resource
router.put("/:id", requirePermission("collections", "update"), collectionController.updateCollection.bind(collectionController));

// Delete collection - requires 'delete' permission on 'collections' resource
router.delete("/:id", requirePermission("collections", "delete"), collectionController.deleteCollection.bind(collectionController));

// Toggle collection status - requires 'update' permission
router.patch("/:id/toggle-status", requirePermission("collections", "update"), collectionController.toggleCollectionStatus.bind(collectionController));

// Toggle collection featured status - requires 'update' permission
router.patch("/:id/toggle-featured", requirePermission("collections", "update"), collectionController.toggleFeaturedStatus.bind(collectionController));

// Get collection thumbnail signed URL - GET /api/collections/:id/thumbnail-url
router.get("/:id/thumbnail-url", requirePermission("collections", "read"), collectionController.getCollectionThumbnailUrl.bind(collectionController));

// Upload collection thumbnail - POST /api/collections/:id/thumbnail
router.post(
  "/:id/thumbnail",
  requirePermission("collections", "update"),
  uploadCollectionThumbnail.single("image"),
  handleUploadError,
  collectionController.uploadCollectionThumbnail.bind(collectionController)
);

// Delete collection thumbnail - DELETE /api/collections/:id/thumbnail
router.delete("/:id/thumbnail", requirePermission("collections", "update"), collectionController.deleteCollectionThumbnail.bind(collectionController));

export default router;

