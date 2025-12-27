// admin-api/src/controllers/analytics.controller.ts
// Analytics controller for dashboard statistics

import { Request, Response } from "express";
import { analyticsService } from "../services/analytics.service";

export class AnalyticsController {
  /**
   * Get dashboard statistics
   * GET /api/analytics/dashboard
   */
  async getDashboardStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await analyticsService.getDashboardStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error("[Analytics Controller] Error fetching dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch dashboard statistics",
      });
    }
  }

  /**
   * Get recent activity feed
   * GET /api/analytics/activity
   */
  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await analyticsService.getRecentActivity(limit);

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error: any) {
      console.error("[Analytics Controller] Error fetching recent activity:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch recent activity",
      });
    }
  }
}

export const analyticsController = new AnalyticsController();

