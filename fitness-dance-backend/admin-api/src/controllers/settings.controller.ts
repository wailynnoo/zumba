// admin-api/src/controllers/settings.controller.ts
// Settings controller for Admin API

import { Request, Response } from "express";
import { settingsService, createSettingSchema, updateSettingSchema } from "../services/settings.service";

export class SettingsController {
  /**
   * Get all settings
   * GET /api/settings
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const settings = await settingsService.getSettings(category);

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error: any) {
      console.error("[Settings Controller] Error fetching settings:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch settings",
      });
    }
  }

  /**
   * Get setting by key
   * GET /api/settings/:key
   */
  async getSettingByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const setting = await settingsService.getSettingByKey(key);

      res.status(200).json({
        success: true,
        data: setting,
      });
    } catch (error: any) {
      console.error("[Settings Controller] Error fetching setting:", error);
      res.status(error.message === "Setting not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch setting",
      });
    }
  }

  /**
   * Get setting value (parsed)
   * GET /api/settings/:key/value
   */
  async getSettingValue(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const value = await settingsService.getSettingValue(key);

      res.status(200).json({
        success: true,
        data: { key, value },
      });
    } catch (error: any) {
      console.error("[Settings Controller] Error fetching setting value:", error);
      res.status(error.message === "Setting not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to fetch setting value",
      });
    }
  }

  /**
   * Create a new setting
   * POST /api/settings
   */
  async createSetting(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createSettingSchema.parse(req.body);
      const setting = await settingsService.createSetting(validatedData);

      res.status(201).json({
        success: true,
        data: setting,
        message: "Setting created successfully",
      });
    } catch (error: any) {
      console.error("[Settings Controller] Error creating setting:", error);
      if (error.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create setting",
      });
    }
  }

  /**
   * Update setting
   * PUT /api/settings/:key
   */
  async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const validatedData = updateSettingSchema.parse(req.body);
      const setting = await settingsService.updateSetting(key, validatedData);

      res.status(200).json({
        success: true,
        data: setting,
        message: "Setting updated successfully",
      });
    } catch (error: any) {
      console.error("[Settings Controller] Error updating setting:", error);
      if (error.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
        return;
      }
      res.status(error.message === "Setting not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to update setting",
      });
    }
  }

  /**
   * Delete setting
   * DELETE /api/settings/:key
   */
  async deleteSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      await settingsService.deleteSetting(key);

      res.status(200).json({
        success: true,
        message: "Setting deleted successfully",
      });
    } catch (error: any) {
      console.error("[Settings Controller] Error deleting setting:", error);
      res.status(error.message === "Setting not found" ? 404 : 500).json({
        success: false,
        message: error.message || "Failed to delete setting",
      });
    }
  }

  /**
   * Get all categories
   * GET /api/settings/categories
   */
  async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      const categories = await settingsService.getCategories();

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      console.error("[Settings Controller] Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch categories",
      });
    }
  }
}

export const settingsController = new SettingsController();

