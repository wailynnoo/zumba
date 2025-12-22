// admin-api/src/controllers/admin.controller.ts
// Admin controller for Admin API

import { Request, Response } from "express";
import {
  adminService,
  createAdminSchema,
  updateAdminSchema,
  changePasswordSchema,
  resetPasswordSchema,
} from "../services/admin.service";
import { z } from "zod";
import { AdminAuthRequest } from "../middleware/auth.middleware";
import { fileUploadService } from "../services/file-upload.service";

export class AdminController {
  /**
   * Create a new admin
   * POST /api/admins
   */
  async createAdmin(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const validated = createAdminSchema.parse(req.body);
      const createdById = req.admin?.adminId || "";
      const admin = await adminService.createAdmin(validated, createdById);

      res.status(201).json({
        success: true,
        message: "Admin created successfully",
        data: admin,
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
        message: error.message || "Failed to create admin",
      });
    }
  }

  /**
   * Get all admins
   * GET /api/admins
   */
  async getAdmins(req: Request, res: Response): Promise<void> {
    try {
      // Query parameters are validated and typed by validation middleware
      const validatedQuery = req.validatedQuery || req.query;
      const page = validatedQuery.page as number | undefined;
      const limit = validatedQuery.limit as number | undefined;
      const isActive = validatedQuery.isActive as boolean | undefined;
      const adminRoleId = validatedQuery.adminRoleId as string | undefined;
      const search = validatedQuery.search as string | undefined;

      const result = await adminService.getAdmins({
        page,
        limit,
        isActive,
        adminRoleId,
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
        message: error.message || "Failed to fetch admins",
      });
    }
  }

  /**
   * Get admin by ID
   * GET /api/admins/:id
   */
  async getAdminById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const admin = await adminService.getAdminById(id);

      res.status(200).json({
        success: true,
        data: admin,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Admin not found",
      });
    }
  }

  /**
   * Update admin
   * PUT /api/admins/:id
   */
  async updateAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateAdminSchema.parse(req.body);
      const admin = await adminService.updateAdmin(id, validated);

      res.status(200).json({
        success: true,
        message: "Admin updated successfully",
        data: admin,
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
        message: error.message || "Failed to update admin",
      });
    }
  }

  /**
   * Delete admin (soft delete)
   * DELETE /api/admins/:id
   */
  async deleteAdmin(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentAdminId = req.admin?.adminId || "";
      await adminService.deleteAdmin(id, currentAdminId);

      res.status(200).json({
        success: true,
        message: "Admin deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete admin",
      });
    }
  }

  /**
   * Toggle admin active status
   * PATCH /api/admins/:id/toggle-status
   */
  async toggleAdminStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const admin = await adminService.toggleAdminStatus(id);

      res.status(200).json({
        success: true,
        message: `Admin ${admin.isActive ? "activated" : "deactivated"} successfully`,
        data: admin,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to toggle admin status",
      });
    }
  }

  /**
   * Change password (for own account)
   * PATCH /api/admins/:id/change-password
   */
  async changePassword(req: AdminAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = changePasswordSchema.parse(req.body);

      // Verify that admin is changing their own password
      if (req.admin?.adminId !== id) {
        res.status(403).json({
          success: false,
          message: "You can only change your own password",
        });
        return;
      }

      await adminService.changePassword(
        id,
        validated.oldPassword,
        validated.newPassword
      );

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
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
        message: error.message || "Failed to change password",
      });
    }
  }

  /**
   * Reset password (admin-initiated, no old password required)
   * PATCH /api/admins/:id/reset-password
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = resetPasswordSchema.parse(req.body);

      await adminService.resetPassword(id, validated.newPassword);

      res.status(200).json({
        success: true,
        message: "Password reset successfully",
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
        message: error.message || "Failed to reset password",
      });
    }
  }

  /**
   * Get all admin roles
   * GET /api/admin-roles
   */
  async getAdminRoles(_req: Request, res: Response): Promise<void> {
    try {
      const roles = await adminService.getAdminRoles();

      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch admin roles",
      });
    }
  }

  /**
   * Upload admin avatar
   * POST /api/admins/:id/avatar
   */
  async uploadAdminAvatar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: "No image file provided",
        });
        return;
      }

      const result = await fileUploadService.uploadAdminAvatar(file, id);

      res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          avatarUrl: result.avatarUrl,
          admin: result.admin,
        },
      });
    } catch (error: any) {
      // Clean up uploaded file on error
      if (req.file?.path) {
        try {
          const fs = require("fs");
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up uploaded file:", cleanupError);
        }
      }

      res.status(400).json({
        success: false,
        message: error.message || "Failed to upload avatar",
      });
    }
  }

  /**
   * Delete admin avatar
   * DELETE /api/admins/:id/avatar
   */
  async deleteAdminAvatar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const admin = await fileUploadService.deleteAdminAvatar(id);

      res.status(200).json({
        success: true,
        message: "Avatar deleted successfully",
        data: admin,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete avatar",
      });
    }
  }
}

export const adminController = new AdminController();

