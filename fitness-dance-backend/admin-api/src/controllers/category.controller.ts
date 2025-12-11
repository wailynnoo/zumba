// admin-api/src/controllers/category.controller.ts
// Category controller for Admin API

import { Request, Response } from "express";
import { categoryService, createCategorySchema, updateCategorySchema } from "../services/category.service";
import { fileUploadService } from "../services/file-upload.service";
import { z } from "zod";

/**
 * Convert relative image path to full URL for API responses
 */
function getFullImageUrl(relativePath: string | null): string | null {
  if (!relativePath) return null;
  
  // If already a full URL, return as is (but clean up if it has duplicate domain)
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    // Check for duplicate domain in URL
    try {
      const url = new URL(relativePath);
      // If pathname contains domain, extract just the path part
      if (url.pathname.includes(".up.railway.app") || url.pathname.includes(".railway.app")) {
        const pathMatch = url.pathname.match(/\/(uploads\/.*)$/);
        if (pathMatch) {
          // Reconstruct URL with clean path
          return `${url.protocol}//${url.host}/${pathMatch[1]}`;
        }
      }
      return relativePath;
    } catch {
      return relativePath;
    }
  }
  
  // Clean relative path (remove any domain that might be in it)
  let cleanPath = relativePath;
  
  // Remove domain if present (handles cases like "admin-api-production-5059.up.railway.app/uploads/...")
  if (cleanPath.includes(".up.railway.app") || cleanPath.includes(".railway.app")) {
    const parts = cleanPath.split("/");
    const uploadsIndex = parts.findIndex(p => p === "uploads");
    if (uploadsIndex >= 0) {
      // Extract everything from "uploads" onwards
      cleanPath = parts.slice(uploadsIndex).join("/");
    } else {
      // If no "uploads" found, try to extract using regex
      const match = cleanPath.match(/(uploads\/.*)$/);
      if (match) {
        cleanPath = match[1];
      }
    }
  }
  
  // Ensure cleanPath is in format: uploads/categories/file.jpg
  if (!cleanPath.startsWith("uploads/")) {
    // If it doesn't start with uploads, it might be malformed
    const match = cleanPath.match(/(uploads\/.*)$/);
    if (match) {
      cleanPath = match[1];
    }
  }
  
  // Convert relative path to full URL
  const port = process.env.PORT || 3002;
  let baseUrl = process.env.BASE_URL || process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${port}`;
  
  // Ensure baseUrl has protocol and doesn't have trailing slash
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    const protocol = process.env.NODE_ENV === "production" ? "https://" : "http://";
    baseUrl = `${protocol}${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  
  // Ensure cleanPath doesn't start with /
  const finalPath = cleanPath.startsWith("/") ? cleanPath.substring(1) : cleanPath;
  
  return `${baseUrl}/${finalPath}`;
}

/**
 * Transform category to include full image URL
 */
function transformCategory(category: any) {
  return {
    ...category,
    iconUrl: getFullImageUrl(category.iconUrl),
  };
}

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
        data: transformCategory(category),
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

      // Transform categories to include full image URLs
      const transformedData = result.data.map(transformCategory);

      res.status(200).json({
        success: true,
        data: transformedData,
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
        data: transformCategory(category),
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
        data: transformCategory(category),
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
        data: transformCategory(category),
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
        data: transformCategory(category),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to toggle category status",
      });
    }
  }

  /**
   * Upload category image
   * POST /api/categories/:id/image
   */
  async uploadCategoryImage(req: Request, res: Response): Promise<void> {
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

      const result = await fileUploadService.uploadCategoryImage(file, id);

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          imageUrl: result.imageUrl,
          category: result.category,
        },
      });
    } catch (error: any) {
      // Delete uploaded file if there was an error
      if (req.file?.path) {
        try {
          const fs = require("fs");
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (deleteError) {
          console.error("Error deleting uploaded file:", deleteError);
        }
      }

      res.status(400).json({
        success: false,
        message: error.message || "Failed to upload image",
      });
    }
  }

  /**
   * Delete category image
   * DELETE /api/categories/:id/image
   */
  async deleteCategoryImage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const category = await fileUploadService.deleteCategoryImage(id);

      res.status(200).json({
        success: true,
        message: "Image deleted successfully",
        data: transformCategory(category),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete image",
      });
    }
  }
}

export const categoryController = new CategoryController();

