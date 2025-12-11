// admin-api/src/services/file-upload.service.ts
// File upload service for handling file operations

import fs from "fs";
import path from "path";
import prisma from "../config/database";

export class FileUploadService {
  /**
   * Get the base URL for serving uploaded files (for response only)
   * In production, this should be a CDN or cloud storage URL
   */
  private getBaseUrl(): string {
    const port = process.env.PORT || 3002;
    let baseUrl = process.env.BASE_URL || process.env.RAILWAY_PUBLIC_DOMAIN || `http://localhost:${port}`;
    
    // Ensure baseUrl has protocol
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      // Default to https in production, http in development
      const protocol = process.env.NODE_ENV === "production" ? "https://" : "http://";
      baseUrl = `${protocol}${baseUrl}`;
    }
    
    return baseUrl;
  }

  /**
   * Get relative path for storing in database
   */
  private getRelativePath(fileName: string): string {
    return `uploads/categories/${fileName}`;
  }

  /**
   * Check if a path is relative or absolute URL
   */
  private isAbsoluteUrl(pathOrUrl: string): boolean {
    return pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://");
  }

  /**
   * Extract relative path from URL or path
   */
  private extractRelativePath(pathOrUrl: string): string {
    if (this.isAbsoluteUrl(pathOrUrl)) {
      // Extract path from URL: http://domain/uploads/categories/file.jpg -> uploads/categories/file.jpg
      try {
        const urlObj = new URL(pathOrUrl);
        let urlPath = urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
        
        // Remove domain if it's in the path (handle malformed URLs)
        // e.g., "admin-api-production-5059.up.railway.app/uploads/..." -> "uploads/..."
        if (urlPath.includes(".up.railway.app/") || urlPath.includes(".railway.app/")) {
          const parts = urlPath.split("/");
          // Find the part that starts with "uploads"
          const uploadsIndex = parts.findIndex(p => p === "uploads");
          if (uploadsIndex >= 0) {
            urlPath = parts.slice(uploadsIndex).join("/");
          }
        }
        
        return urlPath;
      } catch (error) {
        // If URL parsing fails, try to extract path manually
        const match = pathOrUrl.match(/\/(uploads\/.*)$/);
        return match ? match[1] : pathOrUrl;
      }
    }
    // Already relative path - ensure it doesn't contain domain
    if (pathOrUrl.includes(".up.railway.app") || pathOrUrl.includes(".railway.app")) {
      const parts = pathOrUrl.split("/");
      const uploadsIndex = parts.findIndex(p => p === "uploads");
      if (uploadsIndex >= 0) {
        return parts.slice(uploadsIndex).join("/");
      }
    }
    return pathOrUrl;
  }

  /**
   * Upload category image and update category record
   */
  async uploadCategoryImage(file: Express.Multer.File, categoryId: string) {
    // Verify category exists
    const category = await prisma.videoCategory.findFirst({
      where: {
        id: categoryId,
        deletedAt: null,
      },
    });

    if (!category) {
      // Delete uploaded file if category doesn't exist
      if (file.path) {
        this.deleteFile(file.path);
      }
      throw new Error("Category not found");
    }

    // Delete old image if it exists
    if (category.iconUrl) {
      await this.deleteCategoryImageFile(category.iconUrl);
    }

    // Generate relative path for database storage
    const fileName = path.basename(file.path);
    const relativePath = this.getRelativePath(fileName);
    
    // Generate full URL for response (frontend will use this)
    // getBaseUrl() already includes /uploads, so just append the rest
    const baseUrl = this.getBaseUrl();
    const fullImageUrl = `${baseUrl}/categories/${fileName}`;

    // Update category with relative path (not full URL)
    const updatedCategory = await prisma.videoCategory.update({
      where: { id: categoryId },
      data: { iconUrl: relativePath },
    });

    return {
      category: {
        ...updatedCategory,
        iconUrl: fullImageUrl, // Return full URL in response
      },
      imageUrl: fullImageUrl, // Return full URL for convenience
    };
  }

  /**
   * Delete category image
   */
  async deleteCategoryImage(categoryId: string) {
    // Get category
    const category = await prisma.videoCategory.findFirst({
      where: {
        id: categoryId,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    if (!category.iconUrl) {
      throw new Error("Category has no image to delete");
    }

    // Delete file from filesystem
    await this.deleteCategoryImageFile(category.iconUrl);

    // Update category (set iconUrl to null)
    const updatedCategory = await prisma.videoCategory.update({
      where: { id: categoryId },
      data: { iconUrl: null },
    });

    return updatedCategory;
  }

  /**
   * Convert relative path to full URL (for API responses)
   */
  getFullImageUrl(relativePath: string | null): string | null {
    if (!relativePath) return null;
    
    // If already a full URL, return as is
    if (this.isAbsoluteUrl(relativePath)) {
      return relativePath;
    }
    
    // Convert relative path to full URL
    const fileName = path.basename(relativePath);
    return `${this.getBaseUrl()}/categories/${fileName}`;
  }

  /**
   * Delete category image file from filesystem
   */
  private async deleteCategoryImageFile(imageUrlOrPath: string): Promise<void> {
    try {
      // Extract relative path (handles both URLs and relative paths)
      const relativePath = this.extractRelativePath(imageUrlOrPath);
      
      // Extract filename from relative path: uploads/categories/file.jpg -> file.jpg
      const fileName = path.basename(relativePath);
      const filePath = path.join(process.cwd(), "uploads", "categories", fileName);

      // Check if file exists and delete
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      // Log error but don't throw (file might already be deleted)
      console.error("Error deleting category image file:", error);
    }
  }

  /**
   * Delete a file from filesystem
   */
  private deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  /**
   * Get file info (for future use)
   */
  getFileInfo(file: Express.Multer.File) {
    return {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    };
  }
}

export const fileUploadService = new FileUploadService();

