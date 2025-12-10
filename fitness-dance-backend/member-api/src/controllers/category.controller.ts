// member-api/src/controllers/category.controller.ts
// Category controller for Member API - Read-only

import { Request, Response } from "express";
import { categoryService } from "../services/category.service";

export class CategoryController {
  /**
   * Get all active categories
   * GET /api/categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const includeCounts = req.query.includeCounts === "true";
      const categories = await categoryService.getCategories({
        includeCounts,
      });

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch categories",
      });
    }
  }

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Category not found",
      });
    }
  }

  /**
   * Get category by slug
   * GET /api/categories/slug/:slug
   */
  async getCategoryBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const category = await categoryService.getCategoryBySlug(slug);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Category not found",
      });
    }
  }
}

export const categoryController = new CategoryController();

