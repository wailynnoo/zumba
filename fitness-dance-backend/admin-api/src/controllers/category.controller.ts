// admin-api/src/controllers/category.controller.ts
// Category controller for Admin API

import { Request, Response } from "express";
import { categoryService, createCategorySchema, updateCategorySchema } from "../services/category.service";
import { z } from "zod";

export class CategoryController {
  /**
   * Create a new category
   * POST /api/categories
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const validated = createCategorySchema.parse(req.body);
      const category = await categoryService.createCategory(validated);

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
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
        message: error.message || "Failed to create category",
      });
    }
  }

  /**
   * Get all categories
   * GET /api/categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      // Query parameters are validated and typed by validation middleware
      // Use validatedQuery if available (from validation middleware), otherwise fall back to req.query
      const validatedQuery = req.validatedQuery || req.query;
      const page = validatedQuery.page as number | undefined;
      const limit = validatedQuery.limit as number | undefined;
      const isActive = validatedQuery.isActive as boolean | undefined;
      const search = validatedQuery.search as string | undefined;

      const result = await categoryService.getCategories({
        page,
        limit,
        isActive,
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

  /**
   * Update category
   * PUT /api/categories/:id
   */
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateCategorySchema.parse(req.body);
      const category = await categoryService.updateCategory(id, validated);

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
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
        message: error.message || "Failed to update category",
      });
    }
  }

  /**
   * Delete category (soft delete)
   * DELETE /api/categories/:id
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id);

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete category",
      });
    }
  }

  /**
   * Toggle category active status
   * PATCH /api/categories/:id/toggle-status
   */
  async toggleCategoryStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await categoryService.toggleCategoryStatus(id);

      res.status(200).json({
        success: true,
        message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
        data: category,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to toggle category status",
      });
    }
  }
}

export const categoryController = new CategoryController();

