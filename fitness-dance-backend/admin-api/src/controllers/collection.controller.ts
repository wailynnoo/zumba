// admin-api/src/controllers/collection.controller.ts
// Collection controller for Admin API

import { Request, Response } from "express";
import { collectionService, createCollectionSchema, updateCollectionSchema } from "../services/collection.service";
import { r2StorageService } from "../services/r2-storage.service";
import { fileUploadService } from "../services/file-upload.service";
import { z } from "zod";

/**
 * Convert relative thumbnail path to full URL for API responses
 * Returns R2 keys as-is (frontend will fetch signed URLs)
 */
function getFullThumbnailUrl(relativePath: string | null): string | null {
  if (!relativePath) return null;
  
  // If already a full URL (signed URL or external URL), return as is
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  
  // If it's an R2 key (starts with collections/, thumbnails/, etc.), return as-is
  // Frontend will detect this and fetch a signed URL
  if (relativePath.startsWith("collections/") || 
      relativePath.startsWith("thumbnails/") || 
      relativePath.startsWith("videos/") || 
      relativePath.startsWith("audio/")) {
    return relativePath;
  }
  
  // Legacy: Handle old local file paths (uploads/collections/...)
  let cleanPath = relativePath;
  
  // Remove domain if present
  if (cleanPath.includes(".up.railway.app") || cleanPath.includes(".railway.app")) {
    const parts = cleanPath.split("/");
    const uploadsIndex = parts.findIndex(p => p === "uploads");
    if (uploadsIndex >= 0) {
      cleanPath = parts.slice(uploadsIndex).join("/");
    } else {
      const match = cleanPath.match(/(uploads\/.*)$/);
      if (match) {
        cleanPath = match[1];
      }
    }
  }
  
  // Ensure cleanPath is in format: uploads/collections/file.jpg
  if (!cleanPath.startsWith("uploads/")) {
    const match = cleanPath.match(/(uploads\/.*)$/);
    if (match) {
      cleanPath = match[1];
    }
  }
  
  // Convert relative path to full URL (for legacy local files)
  const port = process.env.PORT || 3002;
  let baseUrl = process.env.BASE_URL || process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${port}`;
  
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    const protocol = process.env.NODE_ENV === "production" ? "https://" : "http://";
    baseUrl = `${protocol}${baseUrl}`;
  }
  baseUrl = baseUrl.replace(/\/$/, "");
  
  const finalPath = cleanPath.startsWith("/") ? cleanPath.substring(1) : cleanPath;
  
  return `${baseUrl}/${finalPath}`;
}

/**
 * Transform collection to include full thumbnail URL
 */
function transformCollection(collection: any) {
  return {
    ...collection,
    thumbnailUrl: getFullThumbnailUrl(collection.thumbnailUrl),
  };
}

export class CollectionController {
  /**
   * Create a new collection
   * POST /api/collections
   */
  async createCollection(req: Request, res: Response): Promise<void> {
    try {
      const validated = createCollectionSchema.parse(req.body);
      const collection = await collectionService.createCollection(validated);

      res.status(201).json({
        success: true,
        message: "Collection created successfully",
        data: transformCollection(collection),
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
        message: error.message || "Failed to create collection",
      });
    }
  }

  /**
   * Get all collections
   * GET /api/collections
   */
  async getCollections(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = req.validatedQuery || req.query;
      const page = validatedQuery.page as number | undefined;
      const limit = validatedQuery.limit as number | undefined;
      const categoryId = validatedQuery.categoryId as string | undefined;
      const isActive = validatedQuery.isActive as boolean | undefined;
      const isFeatured = validatedQuery.isFeatured as boolean | undefined;
      const search = validatedQuery.search as string | undefined;

      const result = await collectionService.getCollections({
        page,
        limit,
        categoryId,
        isActive,
        isFeatured,
        search,
      });

      // Transform collections to include full thumbnail URLs
      const transformedData = result.data.map(transformCollection);

      res.status(200).json({
        success: true,
        data: transformedData,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch collections",
      });
    }
  }

  /**
   * Get collection by ID
   * GET /api/collections/:id
   */
  async getCollectionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const collection = await collectionService.getCollectionById(id);

      res.status(200).json({
        success: true,
        data: transformCollection(collection),
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Collection not found",
      });
    }
  }

  /**
   * Get collection by slug
   * GET /api/collections/slug/:slug
   */
  async getCollectionBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const collection = await collectionService.getCollectionBySlug(slug);

      res.status(200).json({
        success: true,
        data: transformCollection(collection),
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Collection not found",
      });
    }
  }

  /**
   * Update collection
   * PUT /api/collections/:id
   */
  async updateCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateCollectionSchema.parse(req.body);
      const collection = await collectionService.updateCollection(id, validated);

      res.status(200).json({
        success: true,
        message: "Collection updated successfully",
        data: transformCollection(collection),
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
        message: error.message || "Failed to update collection",
      });
    }
  }

  /**
   * Delete collection (soft delete)
   * DELETE /api/collections/:id
   */
  async deleteCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await collectionService.deleteCollection(id);

      res.status(200).json({
        success: true,
        message: "Collection deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete collection",
      });
    }
  }

  /**
   * Toggle collection active status
   * PATCH /api/collections/:id/toggle-status
   */
  async toggleCollectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const collection = await collectionService.toggleCollectionStatus(id);

      res.status(200).json({
        success: true,
        message: `Collection ${collection.isActive ? "activated" : "deactivated"} successfully`,
        data: transformCollection(collection),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to toggle collection status",
      });
    }
  }

  /**
   * Toggle collection featured status
   * PATCH /api/collections/:id/toggle-featured
   */
  async toggleFeaturedStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const collection = await collectionService.toggleFeaturedStatus(id);

      res.status(200).json({
        success: true,
        message: `Collection ${collection.isFeatured ? "featured" : "unfeatured"} successfully`,
        data: transformCollection(collection),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to toggle featured status",
      });
    }
  }

  /**
   * Get collection thumbnail signed URL
   * GET /api/collections/:id/thumbnail-url
   * Returns a signed URL for the collection thumbnail (expires in 1 hour)
   */
  async getCollectionThumbnailUrl(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const collection = await collectionService.getCollectionById(id);

      if (!collection.thumbnailUrl) {
        res.status(404).json({
          success: false,
          message: "Collection has no thumbnail",
        });
        return;
      }

      // Extract R2 key from thumbnailUrl (handles both R2 keys and old public URLs)
      let r2Key = collection.thumbnailUrl;
      
      // If it's an old R2 public URL, extract the key
      if (collection.thumbnailUrl.includes(".r2.dev/") || collection.thumbnailUrl.includes(".r2.cloudflarestorage.com/")) {
        const match = collection.thumbnailUrl.match(/(collections\/.+)$/);
        if (match) {
          r2Key = match[1];
        } else {
          try {
            const url = new URL(collection.thumbnailUrl);
            const pathParts = url.pathname.split("/").filter(Boolean);
            const collectionsIndex = pathParts.indexOf("collections");
            if (collectionsIndex >= 0) {
              r2Key = pathParts.slice(collectionsIndex).join("/");
            }
          } catch (e) {
            console.error("[Collection Controller] Error parsing old R2 URL:", e);
            r2Key = r2StorageService.extractKey(collection.thumbnailUrl);
          }
        }
      }

      // Generate signed URL (expires in 1 hour)
      const signedUrl = await r2StorageService.getSignedUrl(
        r2Key,
        3600 // 1 hour
      );

      res.status(200).json({
        success: true,
        data: {
          thumbnailUrl: signedUrl,
          expiresIn: 3600,
        },
      });
    } catch (error: any) {
      console.error("[Collection Controller] Error generating thumbnail signed URL:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to generate thumbnail URL",
      });
    }
  }

  /**
   * Upload collection thumbnail
   * POST /api/collections/:id/thumbnail
   */
  async uploadCollectionThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
        return;
      }

      const result = await fileUploadService.uploadCollectionThumbnail(file, id);

      res.status(200).json({
        success: true,
        message: "Thumbnail uploaded successfully",
        data: transformCollection(result.collection),
      });
    } catch (error: any) {
      console.error("[Collection Controller] Error uploading thumbnail:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload thumbnail",
      });
    }
  }

  /**
   * Delete collection thumbnail
   * DELETE /api/collections/:id/thumbnail
   */
  async deleteCollectionThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const collection = await fileUploadService.deleteCollectionThumbnail(id);

      res.status(200).json({
        success: true,
        message: "Thumbnail deleted successfully",
        data: transformCollection(collection),
      });
    } catch (error: any) {
      console.error("[Collection Controller] Error deleting thumbnail:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete thumbnail",
      });
    }
  }
}

export const collectionController = new CollectionController();

