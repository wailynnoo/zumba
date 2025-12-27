// member-api/src/controllers/user.controller.ts
// User profile controller for Member API

import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class UserController {
  /**
   * Get user profile
   * GET /api/user/profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const profile = await userService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error("[User Controller] Error getting profile:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get profile",
      });
    }
  }

  /**
   * Update user profile
   * PATCH /api/user/profile
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const updateData = req.body;
      const updatedProfile = await userService.updateProfile(userId, updateData, req);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error: any) {
      console.error("[User Controller] Error updating profile:", error);
      
      // Handle validation errors
      if (error.message.includes('Too Long') || 
          error.message.includes('invalid') || 
          error.message.includes('Invalid')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to update profile",
      });
    }
  }
}

export const userController = new UserController();

