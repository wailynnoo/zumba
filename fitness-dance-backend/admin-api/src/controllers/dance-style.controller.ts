// admin-api/src/controllers/dance-style.controller.ts
// Dance Style controller for Admin API

import { Request, Response } from "express";
import { danceStyleService } from "../services/dance-style.service";

export class DanceStyleController {
  /**
   * Get all dance styles
   * GET /api/dance-styles
   */
  async getDanceStyles(req: Request, res: Response): Promise<void> {
    try {
      const isActive = req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined;
      
      const danceStyles = await danceStyleService.getDanceStyles({ isActive });

      res.status(200).json({
        success: true,
        data: danceStyles,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch dance styles",
      });
    }
  }

  /**
   * Get dance style by ID
   * GET /api/dance-styles/:id
   */
  async getDanceStyleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const danceStyle = await danceStyleService.getDanceStyleById(id);

      res.status(200).json({
        success: true,
        data: danceStyle,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Dance style not found",
      });
    }
  }
}

export const danceStyleController = new DanceStyleController();

