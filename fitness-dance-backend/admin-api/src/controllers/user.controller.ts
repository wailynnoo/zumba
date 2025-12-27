// admin-api/src/controllers/user.controller.ts
// User controller for Admin API

import { Request, Response } from "express";
import { userService, updateUserSchema } from "../services/user.service";

export class UserController {
  /**
   * Get all users with pagination and filters
   * GET /api/users
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        search: req.query.search as string | undefined,
        isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
        isEmailVerified: req.query.isEmailVerified === "true" ? true : req.query.isEmailVerified === "false" ? false : undefined,
        isPhoneVerified: req.query.isPhoneVerified === "true" ? true : req.query.isPhoneVerified === "false" ? false : undefined,
      };

      const result = await userService.getUsers(params);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      console.error("[User Controller] Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch users",
      });
    }
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error("[User Controller] Error fetching user:", error);
      res.status(error.message === "User not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch user",
      });
    }
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateUserSchema.parse(req.body);
      const user = await userService.updateUser(id, validatedData);

      res.status(200).json({
        success: true,
        data: user,
        message: "User updated successfully",
      });
    } catch (error: any) {
      console.error("[User Controller] Error updating user:", error);
      if (error.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
        return;
      }
      res.status(error.message === "User not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update user",
      });
    }
  }

  /**
   * Toggle user active status
   * PATCH /api/users/:id/toggle-status
   */
  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.toggleUserStatus(id);

      res.status(200).json({
        success: true,
        data: user,
        message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error: any) {
      console.error("[User Controller] Error toggling user status:", error);
      res.status(error.message === "User not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to toggle user status",
      });
    }
  }

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  async getUserStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await userService.getUserStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("[User Controller] Error fetching user stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch user statistics",
      });
    }
  }
}

export const userController = new UserController();

