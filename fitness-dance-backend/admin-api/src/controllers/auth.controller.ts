// admin-api/src/controllers/auth.controller.ts
// Authentication controller for Admin API

import { Request, Response } from "express";
import { adminAuthService } from "../services/auth.service";
import { z } from "zod";

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export class AdminAuthController {
  /**
   * Login admin
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await adminAuthService.login(validated, req);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
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

      res.status(401).json({
        success: false,
        message: error.message || "Login failed",
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const validated = refreshTokenSchema.parse(req.body);
      const tokens = await adminAuthService.refreshToken(validated.refreshToken, req);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: tokens,
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

      res.status(401).json({
        success: false,
        message: error.message || "Token refresh failed",
      });
    }
  }

  /**
   * Logout - revoke refresh token
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const validated = refreshTokenSchema.parse(req.body);
      const result = await adminAuthService.logout(validated.refreshToken);

      res.status(200).json({
        success: true,
        message: result.message,
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
        message: error.message || "Logout failed",
      });
    }
  }

  /**
   * Logout from all devices - revoke all refresh tokens
   * POST /api/auth/logout-all
   * Requires authentication
   */
  async logoutAll(req: any, res: Response): Promise<void> {
    try {
      if (!req.admin) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const result = await adminAuthService.logoutAll(req.admin.adminId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Logout failed",
      });
    }
  }
}

export const adminAuthController = new AdminAuthController();

