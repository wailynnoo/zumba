// admin-api/src/routes/admin.routes.ts
// Admin routes for Admin API

import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate, requirePermission } from "../middleware/auth.middleware";
import { validateQuery, validateBody } from "../middleware/validation.middleware";
import { querySchemas } from "../middleware/validation.middleware";
import { createAdminSchema, updateAdminSchema, changePasswordSchema, resetPasswordSchema } from "../services/admin.service";
import { z } from "zod";
import { uploadAdminAvatar, handleUploadError } from "../middleware/upload.middleware";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Admin CRUD routes with RBAC
// Create admin - requires 'create' permission on 'admins' resource
router.post(
  "/",
  requirePermission("admins", "create"),
  validateBody(createAdminSchema),
  adminController.createAdmin.bind(adminController)
);

// List admins - requires 'read' permission on 'admins' resource
router.get(
  "/",
  requirePermission("admins", "read"),
  validateQuery(querySchemas.adminList),
  adminController.getAdmins.bind(adminController)
);

// Get all admin roles - requires 'read' permission on 'admins' resource
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
router.get(
  "/roles",
  requirePermission("admins", "read"),
  validateQuery(z.object({}).passthrough()), // Allow empty query params
  adminController.getAdminRoles.bind(adminController)
);

// Upload admin avatar - requires 'update' permission
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
router.post(
  "/:id/avatar",
  requirePermission("admins", "update"),
  uploadAdminAvatar.single("avatar"),
  handleUploadError,
  adminController.uploadAdminAvatar.bind(adminController)
);

// Delete admin avatar - requires 'update' permission
// IMPORTANT: This route must be defined BEFORE /:id to avoid route conflicts
router.delete(
  "/:id/avatar",
  requirePermission("admins", "update"),
  adminController.deleteAdminAvatar.bind(adminController)
);

// Get admin by ID - requires 'read' permission
router.get(
  "/:id",
  requirePermission("admins", "read"),
  validateQuery(z.object({}).passthrough()), // Allow empty query params
  adminController.getAdminById.bind(adminController)
);

// Update admin - requires 'update' permission on 'admins' resource
router.put(
  "/:id",
  requirePermission("admins", "update"),
  validateBody(updateAdminSchema),
  adminController.updateAdmin.bind(adminController)
);

// Delete admin - requires 'delete' permission on 'admins' resource
router.delete(
  "/:id",
  requirePermission("admins", "delete"),
  adminController.deleteAdmin.bind(adminController)
);

// Toggle admin status - requires 'update' permission
router.patch(
  "/:id/toggle-status",
  requirePermission("admins", "update"),
  adminController.toggleAdminStatus.bind(adminController)
);

// Change password (own account) - requires 'update' permission
router.patch(
  "/:id/change-password",
  requirePermission("admins", "update"),
  validateBody(changePasswordSchema),
  adminController.changePassword.bind(adminController)
);

// Reset password (admin-initiated) - requires 'update' permission
router.patch(
  "/:id/reset-password",
  requirePermission("admins", "update"),
  validateBody(resetPasswordSchema),
  adminController.resetPassword.bind(adminController)
);

export default router;

