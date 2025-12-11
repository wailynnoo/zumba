// admin-api/src/controllers/intensity-level.controller.ts
// Intensity Level controller for Admin API

import { Request, Response } from "express";
import { intensityLevelService } from "../services/intensity-level.service";

export class IntensityLevelController {
  /**
   * Get all intensity levels
   * GET /api/intensity-levels
   */
  async getIntensityLevels(_req: Request, res: Response): Promise<void> {
    try {
      const intensityLevels = await intensityLevelService.getIntensityLevels();

      res.status(200).json({
        success: true,
        data: intensityLevels,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch intensity levels",
      });
    }
  }

  /**
   * Get intensity level by ID
   * GET /api/intensity-levels/:id
   */
  async getIntensityLevelById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const intensityLevel = await intensityLevelService.getIntensityLevelById(id);

      res.status(200).json({
        success: true,
        data: intensityLevel,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Intensity level not found",
      });
    }
  }
}

export const intensityLevelController = new IntensityLevelController();

