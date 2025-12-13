// admin-api/src/routes/category.routes.ts
// Category routes for Admin API

import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";
import { validateQuery, querySchemas } from "../middleware/validation.middleware";
import { uploadCategoryImage, handleUploadError } from "../middleware/upload.middleware";
import { z } from "zod";

const router = Router();

// All category routes require authentication
router.use(authenticate);

// Category CRUD routes with RBAC
// Create category - requires 'create' permission on 'categories' resource
router.post("/", requirePermission("categories", "create"), categoryController.createCategory.bind(categoryController));

// List categories - requires 'read' permission on 'categories' resource
// Validates query parameters (page, limit, isActive, search)
router.get(
  "/",
  requirePermission("categories", "read"),
  validateQuery(querySchemas.categoryList),
  categoryController.getCategories.bind(categoryController)
);

// Get category by slug - requires 'read' permission
router.get(
  "/slug/:slug",
  requirePermission("categories", "read"),
  validateQuery(z.object({}).passthrough()), // Allow empty query params
  categoryController.getCategoryBySlug.bind(categoryController)
);

// Get category by ID - requires 'read' permission
router.get(
  "/:id",
  requirePermission("categories", "read"),
  validateQuery(z.object({}).passthrough()), // Allow empty query params
  categoryController.getCategoryById.bind(categoryController)
);

// Update category - requires 'update' permission on 'categories' resource
router.put("/:id", requirePermission("categories", "update"), categoryController.updateCategory.bind(categoryController));

// Delete category - requires 'delete' permission on 'categories' resource
router.delete("/:id", requirePermission("categories", "delete"), categoryController.deleteCategory.bind(categoryController));

// Toggle category status - requires 'update' permission
router.patch("/:id/toggle-status", requirePermission("categories", "update"), categoryController.toggleCategoryStatus.bind(categoryController));

// Image upload routes - requires 'update' permission
// Upload category image - POST /api/categories/:id/image
router.post(
  "/:id/image",
  requirePermission("categories", "update"),
  uploadCategoryImage.single("image"),
  handleUploadError,
  categoryController.uploadCategoryImage.bind(categoryController)
);

// Delete category image - DELETE /api/categories/:id/image
router.delete("/:id/image", requirePermission("categories", "update"), categoryController.deleteCategoryImage.bind(categoryController));

// Get category image signed URL - GET /api/categories/:id/image-url
router.get("/:id/image-url", requirePermission("categories", "read"), categoryController.getCategoryImageUrl.bind(categoryController));

export default router;

