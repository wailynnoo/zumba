// member-api/src/controllers/collection.controller.ts
// Collection controller for Member API - Read-only

import { Request, Response } from "express";
import { collectionService } from "../services/collection.service";

export class CollectionController {
  /**
   * Get all active collections
   * GET /api/collections
   */
  async getCollections(req: Request, res: Response): Promise<void> {
    try {
      const featured = req.query.featured === "true";
      const categoryId = req.query.categoryId as string | undefined;
      const includeCounts = req.query.includeCounts === "true";
      
      const collections = await collectionService.getCollections({
        featured,
        categoryId,
        includeCounts,
      });

      res.status(200).json({
        success: true,
        data: collections,
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
        data: collection,
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
        data: collection,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Collection not found",
      });
    }
  }
}

export const collectionController = new CollectionController();

